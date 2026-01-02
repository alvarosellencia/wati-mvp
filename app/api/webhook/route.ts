import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import postgres from 'postgres';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// 1. EL DNI (Esto es lo que faltaba para que Facebook te acepte)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Si la contraseña es 'wati123', le decimos a Facebook que OK
  if (mode === 'subscribe' && token === 'wati123') {
    return new NextResponse(challenge);
  }
  return new NextResponse('Error de validacion', { status: 403 });
}

// 2. EL CEREBRO (Esto es lo que ya tenías para responder)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.object === 'whatsapp_business_account') {
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (message && message.type === 'text') {
        const userText = message.text.body;
        const userPhone = message.from;
        
        const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        console.log(`📩 MENSAJE (${userPhone}): ${userText}`);

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { 
              role: "system", 
              content: `Eres 'Bot Paco', camarero de un bar de barrio. Hoy es: ${hoy}. Tu tono es cercano y usas emojis 🥘.
              TU MISIÓN: Responder y detectar reservas.
              FORMATO JSON OBLIGATORIO:
              {
                "reply": "Respuesta al cliente",
                "booking": null O { "date": "YYYY-MM-DD", "time": "HH:MM", "pax": 4, "name": "Nombre" }
              }` 
            },
            { role: "user", content: userText },
          ],
        });

        const aiData = JSON.parse(completion.choices[0].message.content || "{}");
        const replyText = aiData.reply || "Perdona, no te he entendido bien.";

        if (aiData.booking) {
          try {
            await sql`
              INSERT INTO bookings (client_phone, booking_date, booking_time, pax, client_name)
              VALUES (${userPhone}, ${aiData.booking.date}, ${aiData.booking.time}, ${aiData.booking.pax}, ${aiData.booking.name})
            `;
          } catch (dbError) { console.error(dbError); }
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
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}