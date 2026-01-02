import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import postgres from 'postgres'; // El conector a tu base de datos Neon

// 1. Configuramos las conexiones
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verificación de seguridad de WhatsApp
    if (body.object === 'whatsapp_business_account') {
      const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (message && message.type === 'text') {
        const userText = message.text.body;
        const userPhone = message.from;
        
        // Obtenemos la fecha de hoy para que el bot sepa qué es "mañana" o "el sábado"
        const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        console.log(`📩 MENSAJE (${userPhone}): ${userText}`);

        // 2. CEREBRO: Le pedimos a GPT que nos devuelva un JSON (Datos estructurados)
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" }, // <--- LA CLAVE: Forzamos modo JSON
          messages: [
            { 
              role: "system", 
              content: `Eres 'Bot Paco', camarero de un bar de barrio. Hoy es: ${hoy}.
              Tu tono es cercano y usas emojis 🥘.
              
              TU MISIÓN:
              1. Responder al cliente.
              2. Detectar si quiere reservar.
              
              FORMATO DE RESPUESTA OBLIGATORIO (JSON):
              {
                "reply": "Tu respuesta textual al cliente aquí",
                "booking": null  <-- Si NO hay reserva completa pon null.
                                 <-- Si HAY reserva completa (tenemos fecha, hora y pax), rellena este objeto:
                                 { "date": "YYYY-MM-DD", "time": "HH:MM", "pax": 4, "name": "Nombre (o Amigo)" }
              }
              
              REGLAS:
              - Si faltan datos (hora, personas...), pregunta por ellos y pon "booking": null.
              - Si tienes todos los datos, confirma la reserva en 'reply' y rellena 'booking'.` 
            },
            { role: "user", content: userText },
          ],
        });

        // 3. PROCESAR LA RESPUESTA DE LA IA
        const aiData = JSON.parse(completion.choices[0].message.content || "{}");
        const replyText = aiData.reply || "Perdona, me he liado. ¿Puedes repetir?";
        
        console.log('🤖 PACO DICE:', replyText);

        // 4. MEMORIA: Si hay reserva, guardamos en NEON
        if (aiData.booking) {
          console.log('📝 GUARDANDO RESERVA...', aiData.booking);
          try {
            await sql`
              INSERT INTO bookings (client_phone, booking_date, booking_time, pax, client_name)
              VALUES (${userPhone}, ${aiData.booking.date}, ${aiData.booking.time}, ${aiData.booking.pax}, ${aiData.booking.name})
            `;
            console.log('✅ ¡RESERVA GUARDADA EN BASE DE DATOS!');
          } catch (dbError) {
            console.error('❌ Error guardando en DB:', dbError);
          }
        }

        // 5. HABLAR: Enviar respuesta a WhatsApp
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
    console.error('❌ Error general:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}