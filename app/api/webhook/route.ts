import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import postgres from 'postgres';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// Helper para convertir hora "HH:MM" a minutos del día (ej: 15:00 = 900)
const toMinutes = (timeStr: string) => {
  if (!timeStr) return -1;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message?.type === 'text') {
      const userText = message.text.body;
      const userPhone = message.from;

      // 1. LEER CONFIGURACIÓN
      const configs = await sql`SELECT * FROM config LIMIT 1`;
      const config = configs[0];
      
      // 2. DETERMINAR ESTADO ACTUAL (Lógica Temporal)
      const now = new Date();
      // Forzamos zona horaria Madrid para cálculos correctos
      const madridTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
      const currentDay = madridTime.getDay(); // 0=Domingo, 1=Lunes...
      const currentMinutes = madridTime.getHours() * 60 + madridTime.getMinutes();

      let effectiveMode = config.service_mode; // Empezamos con el manual
      let reason = "";

      // A) ¿Es día de descanso?
      const closedDays = JSON.parse(config.closed_days || '[]');
      if (closedDays.includes(currentDay)) {
        effectiveMode = 'closed';
        reason = "Hoy es nuestro día de descanso.";
      } else {
        // B) Comprobar Horarios Automáticos (Solo si no está cerrado manualmente)
        if (effectiveMode !== 'closed') {
          const lStart = toMinutes(config.lunch_start);
          const lEnd = toMinutes(config.lunch_end);
          const dStart = toMinutes(config.dinner_start);
          const dEnd = toMinutes(config.dinner_end);

          // Lógica de Lista de Espera vs Cocina Cerrada
          // Turno Mediodía
          if (lStart > 0 && currentMinutes >= lStart) {
             if (lEnd > 0 && currentMinutes >= lEnd && currentMinutes < 1080) { // < 18:00
               effectiveMode = 'closed'; // Cocina cerrada tarde
               reason = "La cocina de mediodía ya ha cerrado.";
             } else {
               effectiveMode = 'waitlist'; // Pasamos a espera
             }
          }
          
          // Turno Noche
          // Nota: La noche puede cruzar medianoche, simplificamos para MVP (hasta 23:59)
          if (dStart > 0 && currentMinutes >= dStart) {
             if (dEnd > 0 && currentMinutes >= dEnd) {
               effectiveMode = 'closed';
               reason = "La cocina de noche ya ha cerrado.";
             } else {
               effectiveMode = 'waitlist';
             }
          }
        }
      }

      // 3. PREPARAR CONTEXTO PARA IA
      let zonasTexto = "Sin información de zonas.";
      try {
        const zones = JSON.parse(config.zones || '[]');
        zonasTexto = zones
          .filter((z:any) => z.active)
          .map((z:any) => `- ${z.name}: ${z.tablesCount} mesas`)
          .join('\n');
      } catch (e) {}

      let instrucciones = "";
      if (effectiveMode === 'closed') {
        instrucciones = `⛔ EL LOCAL ESTÁ CERRADO O COMPLETO AHORA MISMO.
        Motivo: ${reason || "Horario de cierre o aforo completo."}
        Rechaza amablemente la petición diciendo que no es posible ahora.
        NO ofrezcas horas alternativas hoy.`;
      } else if (effectiveMode === 'waitlist') {
        instrucciones = `📝 MODO LISTA DE ESPERA ACTIVADO (Sin reserva previa).
        Ya no aceptamos reservas a hora fija para este turno.
        Dile al cliente: "Para ahora ya funcionamos con Lista de Espera. Vente y te apuntamos por orden de llegada".
        Tiempo estimado: ${config.avg_booking_duration || 45} min aprox (depende de la cola).
        Si el cliente insiste en que lo apuntes YA, dile que vale, pero que corre el tiempo desde que llegue al local.`;
      } else {
        instrucciones = `✅ MODO RESERVAS ABIERTAS.
        Puedes dar mesa si hay hueco.
        Horarios habituales: Comidas y Cenas.`;
      }

      // 4. LLAMAR A LA IA
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `Eres Paco, del bar '${config.restaurant_name}'.
            
            ESTADO ACTUAL DEL SERVICIO:
            ${instrucciones}

            ZONAS DEL LOCAL:
            ${zonasTexto}
            
            OBJETIVO:
            Gestionar al cliente según el estado actual (Cerrado/Espera/Reservas).
            Sé breve, amable y usa emojis. Habla español de España ("vosotros", "vale", "venga").
            
            IMPORTANTE: Si confirmas una reserva, devuelve un JSON. Si es solo charla, JSON con booking: null.
            ` 
          },
          { role: "user", content: userText },
        ],
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
      const replyText = aiResponse.reply || "Perdona, ¿me lo repites?";

      // 5. GUARDAR RESERVA SI LA HAY
      if (aiResponse.booking) {
        await sql`
          INSERT INTO bookings (client_phone, booking_date, booking_time, pax, client_name, notes)
          VALUES (${userPhone}, ${aiResponse.booking.date}, ${aiResponse.booking.time}, ${aiResponse.booking.pax}, ${aiResponse.booking.name}, '🤖 Bot Reserva')
        `;
      }

      // 6. ENVIAR WHATSAPP
      await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: userPhone,
          text: { body: replyText },
        }),
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === 'wati123') {
    return new NextResponse(searchParams.get('hub.challenge'));
  }
  return new NextResponse('Error', { status: 403 });
}