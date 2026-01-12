'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// --- 1. GUARDAR CONFIGURACIÓN (CON RANGOS Y DÍAS) ---
export async function updateConfigAction(formData: FormData) {
  const id = formData.get('id') as string;
  const mode = formData.get('mode') as string; // El modo manual sigue mandando si se toca
  
  // Rangos Horarios
  const lunchStart = formData.get('lunchStart') as string;
  const lunchEnd = formData.get('lunchEnd') as string;
  const dinnerStart = formData.get('dinnerStart') as string;
  const dinnerEnd = formData.get('dinnerEnd') as string;
  
  // Días Cerrados y Otros
  const closedDays = formData.get('closedDays') as string; // JSON string
  const avgDiningTime = formData.get('avgDiningTime') as string;
  const zonesJson = formData.get('zonesJson') as string;

  const safeAvgTime = avgDiningTime || '45';

  await sql`
    UPDATE config 
    SET service_mode = ${mode},
        lunch_start = ${lunchStart},
        lunch_end = ${lunchEnd},
        dinner_start = ${dinnerStart},
        dinner_end = ${dinnerEnd},
        closed_days = ${closedDays},
        avg_booking_duration = ${safeAvgTime},
        zones = ${zonesJson}
    WHERE id = ${id}
  `;
  
  revalidatePath('/admin');
  revalidatePath('/');
}

// --- 2. CLIENTE DE PASO ---
export async function addWalkInAction(formData: FormData) {
  const name = formData.get('name') as string;
  const pax = formData.get('pax') as string;
  const phone = formData.get('phone') as string;
  
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
  const notes = "📍 Lista de Espera (Presencial)"; 

  await sql`
    INSERT INTO bookings (client_name, booking_date, booking_time, pax, client_phone, notes)
    VALUES (${name}, ${date}, ${time}, ${pax}, ${phone || ''}, ${notes})
  `;
  revalidatePath('/admin');
}

// --- 3. ACTUALIZAR RESERVA ---
export async function updateBookingAction(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const pax = formData.get('pax') as string;
  const time = formData.get('time') as string;
  const phone = formData.get('phone') as string;
  const notes = formData.get('notes') as string;

  await sql`
    UPDATE bookings 
    SET client_name = ${name},
        pax = ${pax},
        booking_time = ${time},
        client_phone = ${phone},
        notes = ${notes}
    WHERE id = ${id}
  `;
  revalidatePath('/admin');
}

// --- 4. BORRAR ---
export async function deleteBookingAction(id: number) {
  await sql`DELETE FROM bookings WHERE id = ${id}`;
  revalidatePath('/admin');
}