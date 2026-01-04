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
      const zones = JSON.parse(config.zones || '[]');
      const activeZones = zones.filter((z:any) => z.active).map((z:any) => `${z.name} (${z.capacity} mesas)`).join(', ');

      // --- LÓGICA DEL SEMÁFORO ---
      let instruccionesModo = "";
      if (config.service_mode === 'closed') {
        instruccionesModo = "EL RESTAURANTE ESTÁ COMPLETO/CERRADO. Rechaza amablemente cualquier intento de ir hoy.";
      } else if (config.service_mode === 'waitlist') {
        instruccionesModo = `MODO LISTA DE ESPERA ACTIVADO (Estilo tapeo andaluz).
        NO aceptes reservas a horas fijas (ej: "a las 21:00").
        DILE AL CLIENTE: "Ahora mismo no reservamos, funcionamos por orden de llegada. Hay una espera estimada de ${config.current_wait_time} minutos".
        SI EL CLIENTE ACEPTA: Apúntalo en la lista (guarda la reserva con hora actual) y dile "Te he apuntado en la lista, vente ya".`;
      } else {
        instruccionesModo = "MODO RESERVAS CLÁSICO. Acepta reservas a horas concretas si hay hueco.";
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { 
            role: "system", 
            content: `Eres Paco, del bar '${config.restaurant_name}'.
            
            ESTADO ACTUAL DEL LOCAL:
            ${instruccionesModo}

            INFO DEL LOCAL:
            - Zonas abiertas: ${activeZones}
            
            OBJETIVO:
            Gestionar al cliente según el MODO actual (Reserva vs Lista de Espera).
            
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