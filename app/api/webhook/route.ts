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

      // 1. LEEMOS LA CONFIGURACIÓN DEL DUEÑO DESDE LA DB
      const configs = await sql`SELECT * FROM config LIMIT 1`;
      const config = configs[0]; // Aquí tenemos horarios, nombre, días libres...

      const ahora = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
      console.log(`📩 MENSAJE PARA ${config.restaurant_name}: ${userText}`);

      // 2. INYECTAMOS LA CONFIG REAL EN EL PROMPT
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { 
            role: "system", 
            content: `Eres el asistente virtual de '${config.restaurant_name}'.
            MOMENTO ACTUAL: ${ahora}.
            
            INFORMACIÓN DEL LOCAL (CONFIGURADA POR EL DUEÑO):
            - Horario: ${config.schedule}
            - Días de cierre: ${config.closed_days}
            - Mesas totales: ${config.total_tables}
            
            OBJETIVO: Gestionar reservas respetando ESTRICTAMENTE el horario anterior.
            
            FORMATO JSON OBLIGATORIO:
            {
              "reply": "Respuesta amable al cliente (usa emojis)",
              "booking": null O { "date": "YYYY-MM-DD", "time": "HH:MM", "pax": 4, "name": "Nombre" }
            }` 
          },
          { role: "user", content: userText },
        ],
      });

      const aiData = JSON.parse(completion.choices[0].message.content || "{}");
      const replyText = aiData.reply || "Perdona, me he perdido.";

      if (aiData.booking) {
        await sql`
          INSERT INTO bookings (client_phone, booking_date, booking_time, pax, client_name)
          VALUES (${userPhone}, ${aiData.booking.date}, ${aiData.booking.time}, ${aiData.booking.pax}, ${aiData.booking.name})
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