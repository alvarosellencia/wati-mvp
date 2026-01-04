import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import postgres from 'postgres';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === 'wati123') {
    return new NextResponse(searchParams.get('hub.challenge'));
  }
  return new NextResponse('Error', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message?.type === 'text') {
      const userText = message.text.body;
      const userPhone = message.from;

      const configs = await sql`SELECT * FROM config LIMIT 1`;
      const config = configs[0];
      
      // Parseamos zonas de forma segura
      let zones = [];
      try { zones = JSON.parse(config.zones); } catch(e) { zones = [] }
      
      const activeZones = zones
        .filter((z:any) => z.active)
        .map((z:any) => `- ${z.name}: ${z.capacity} mesas libres`)
        .join('\n');

      // --- LÓGICA DEL SEMÁFORO INTELIGENTE ---
      let instruccionesModo = "";
      if (config.service_mode === 'closed') {
        instruccionesModo = "⛔️ EL LOCAL ESTÁ COMPLETO O CERRADO. Rechaza amablemente cualquier visita hoy.";
      } else if (config.service_mode === 'waitlist') {
        instruccionesModo = `📝 MODO LISTA DE ESPERA (Vente que te apunto).
        NO aceptes reservas a horas futuras.
        DILE AL CLIENTE: "Ahora mismo funcionamos por orden de llegada. Hay unos ${config.current_wait_time} minutos de espera. ¿Quieres que te apunte en la lista para cuando llegues?".
        SI DICE SÍ: Guarda la reserva con hora actual y dile "Apuntado. ¡Vente ya!".`;
      } else {
        instruccionesModo = "✅ MODO RESERVAS ABIERTAS. Acepta reservas para hoy o futuros días.";
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { 
            role: "system", 
            content: `Eres Paco, del bar '${config.restaurant_name}'.
            
            ESTADO ACTUAL:
            ${instruccionesModo}

            ZONAS DISPONIBLES AHORA:
            ${activeZones}
            
            OBJETIVO:
            Gestionar al cliente según el MODO actual. Sé breve, directo y usa emojis.
            
            FORMATO JSON OBLIGATORIO:
            {
              "reply": "Texto para WhatsApp",
              "booking": null O { "date": "YYYY-MM-DD", "time": "HH:MM", "pax": 4, "name": "Nombre", "notes": "Modo: ${config.service_mode}" }
            }` 
          },
          { role: "user", content: userText },
        ],
      });

      const aiData = JSON.parse(completion.choices[0].message.content || "{}");
      const replyText = aiData.reply || "Perdona, no te he entendido.";

      if (aiData.booking) {
        await sql`
          INSERT INTO bookings (client_phone, booking_date, booking_time, pax, client_name, notes)
          VALUES (${userPhone}, ${aiData.booking.date}, ${aiData.booking.time}, ${aiData.booking.pax}, ${aiData.booking.name}, ${aiData.booking.notes})
        `;
      }

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