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

      // 1. CARGAMOS LA CONFIG PRO
      const configs = await sql`SELECT * FROM config LIMIT 1`;
      const config = configs[0];

      // --- CHEQUEO DE SEGURIDAD: ¿ESTÁ EL BOT ENCENDIDO? ---
      if (!config.is_bot_active) {
        console.log('💤 BOT APAGADO. Ignorando mensaje.');
        return NextResponse.json({ success: true }); // No hacemos nada
      }

      const ahora = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
      console.log(`📩 MENSAJE (${config.restaurant_name}): ${userText}`);

      // 2. PROMPT AVANZADO CON TODAS LAS REGLAS
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { 
            role: "system", 
            content: `Eres el asistente virtual de '${config.restaurant_name}'.
            MOMENTO ACTUAL: ${ahora}.
            
            📋 REGLAS DEL NEGOCIO:
            - Horario: ${config.schedule}
            - Días CERRADO: ${config.closed_days}
            - Zonas disponibles: ${config.zones}
            - Máximo personas por grupo: ${config.max_pax_per_booking} (Si piden más, diles que llamen por tlf).
            - Duración reserva: ${config.avg_booking_duration} minutos.
            
            TU OBJETIVO:
            Gestionar reservas. Si piden mesa para mucha gente o fuera de horario, rechaza amablemente.
            Intenta asignar una zona (Interior/Terraza) si el cliente lo pide.
            
            FORMATO JSON OBLIGATORIO:
            {
              "reply": "Respuesta al cliente",
              "booking": null O { "date": "YYYY-MM-DD", "time": "HH:MM", "pax": 4, "name": "Nombre", "notes": "Zona preferida..." }
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
          VALUES (${userPhone}, ${aiData.booking.date}, ${aiData.booking.time}, ${aiData.booking.pax}, ${aiData.booking.name}, ${aiData.booking.notes || ''})
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