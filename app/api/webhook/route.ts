import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import postgres from 'postgres';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// Función para enviar WhatsApp (reutilizable para errores)
async function sendWhatsApp(to: string, body: string) {
  if (!to) return;
  try {
    await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        text: { body: body },
      }),
    });
  } catch (e) {
    console.error("Error enviando WhatsApp:", e);
  }
}

// Convertir hora HH:MM a minutos
const toMinutes = (timeStr: string) => {
  if (!timeStr || typeof timeStr !== 'string') return -1;
  const parts = timeStr.split(':');
  if (parts.length < 2) return -1;
  return Number(parts[0]) * 60 + Number(parts[1]);
};

export async function POST(request: Request) {
  let userPhone = "";
  try {
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Verificamos que sea un mensaje de texto válido
    if (!message || message.type !== 'text') {
      return NextResponse.json({ success: true }); // Ignoramos estados, fotos, etc.
    }

    const userText = message.text.body;
    userPhone = message.from; // Guardamos el teléfono para reportar errores si hace falta

    // 1. OBTENER CONFIGURACIÓN (Con protección si falla)
    let config: any = {};
    try {
      const configs = await sql`SELECT * FROM config LIMIT 1`;
      if (configs.length > 0) {
        config = configs[0];
      } else {
        // Si no hay config, creamos una "falsa" para que no pete
        config = { restaurant_name: "Bar Manolo", service_mode: "booking" };
      }
    } catch (dbError) {
      console.error("Error DB:", dbError);
      await sendWhatsApp(userPhone, "⚠️ Error: No puedo conectar con la Base de Datos.");
      return NextResponse.json({ success: true });
    }

    // 2. LÓGICA DE HORARIOS (Con try/catch para evitar NaN)
    const now = new Date();
    const madridTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
    const currentDay = madridTime.getDay(); // 0=Domingo
    const currentMinutes = madridTime.getHours() * 60 + madridTime.getMinutes();

    let effectiveMode = config.service_mode || 'booking';
    let reason = "";

    try {
      // Días cerrados
      const closedDays = JSON.parse(config.closed_days || '[]');
      if (Array.isArray(closedDays) && closedDays.includes(currentDay)) {
        effectiveMode = 'closed';
        reason = "Hoy es día de descanso.";
      } else if (effectiveMode !== 'closed') {
        // Horarios automáticos
        const lStart = toMinutes(config.lunch_start);
        const lEnd = toMinutes(config.lunch_end);
        const dStart = toMinutes(config.dinner_start);
        const dEnd = toMinutes(config.dinner_end);

        // Lógica Mediodía
        if (lStart > 0 && currentMinutes >= lStart) {
           if (lEnd > 0 && currentMinutes >= lEnd && currentMinutes < 1080) { // < 18:00
             effectiveMode = 'closed';
             reason = "Cocina mediodía cerrada.";
           } else {
             effectiveMode = 'waitlist';
           }
        }
        // Lógica Noche
        if (dStart > 0 && currentMinutes >= dStart) {
           if (dEnd > 0 && currentMinutes >= dEnd) {
             effectiveMode = 'closed';
             reason = "Cocina noche cerrada.";
           } else {
             effectiveMode = 'waitlist';
           }
        }
      }
    } catch (logicError) {
      console.error("Error Lógica Horarios:", logicError);
      // Si falla la lógica de horas, seguimos en modo manual para no romper
    }

    // 3. TEXTO PARA IA
    let zonasTexto = "";
    try {
      const zones = JSON.parse(config.zones || '[]');
      if (Array.isArray(zones)) {
        zonasTexto = zones
          .filter((z:any) => z.active)
          .map((z:any) => `- ${z.name}: ${z.tablesCount} mesas`)
          .join('\n');
      }
    } catch (e) {}

    let instrucciones = "";
    if (effectiveMode === 'closed') {
      instrucciones = `⛔ EL LOCAL ESTÁ CERRADO. Motivo: ${reason}. Di que no es posible reservar.`;
    } else if (effectiveMode === 'waitlist') {
      instrucciones = `📝 MODO LISTA DE ESPERA (Walk-in). No aceptes reservas a hora fija. Di: "Vente y te apunto, hay ${config.avg_booking_duration || 45} min de espera aprox".`;
    } else {
      instrucciones = `✅ MODO RESERVAS ABIERTAS. Acepta reservas si hay hueco.`;
    }

    // 4. LLAMAR A OPENAI
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `Eres Paco, del bar '${config.restaurant_name || 'Bar Manolo'}'.
            ESTADO: ${instrucciones}
            ZONAS: ${zonasTexto}
            OBJETIVO: Gestionar cliente. Sé breve.
            SI CONFIRMAS RESERVA: Devuelve JSON { "reply": "...", "booking": { "date": "YYYY-MM-DD", "time": "HH:MM", "pax": 4, "name": "Nombre" } }
            SI SOLO HABLAS: Devuelve JSON { "reply": "...", "booking": null }` 
          },
          { role: "user", content: userText },
        ],
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");
      const replyText = aiResponse.reply || "Perdona, no te he entendido bien.";

      // 5. GUARDAR RESERVA (Si aplica)
      if (aiResponse.booking) {
        try {
          await sql`
            INSERT INTO bookings (client_phone, booking_date, booking_time, pax, client_name, notes)
            VALUES (${userPhone}, ${aiResponse.booking.date}, ${aiResponse.booking.time}, ${aiResponse.booking.pax}, ${aiResponse.booking.name}, '🤖 Bot')
          `;
        } catch (insertError) {
          console.error("Error guardando reserva:", insertError);
          await sendWhatsApp(userPhone, "❌ He intentado guardar la reserva pero ha fallado mi base de datos. Por favor, llama al bar.");
          return NextResponse.json({ success: true });
        }
      }

      // 6. RESPONDER
      await sendWhatsApp(userPhone, replyText);

    } catch (aiError) {
      console.error("Error OpenAI:", aiError);
      await sendWhatsApp(userPhone, "🧠 Estoy un poco mareado (Error IA). Inténtalo en un minuto.");
    }

    return NextResponse.json({ success: true });

  } catch (globalError) {
    console.error("Error CRÍTICO:", globalError);
    if (userPhone) {
      await sendWhatsApp(userPhone, "💥 Error crítico del sistema.");
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Verificación del Webhook
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === 'wati123') {
    return new NextResponse(searchParams.get('hub.challenge'));
  }
  return new NextResponse('Error', { status: 403 });
}