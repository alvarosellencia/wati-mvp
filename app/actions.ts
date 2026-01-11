'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// --- 1. GUARDAR CONFIGURACIÓN (Con nuevos campos de automatización) ---
export async function updateConfigAction(formData: FormData) {
  const id = formData.get('id') as string;
  const mode = formData.get('mode') as string;
  const autoSwitch = formData.get('autoSwitch') as string; // Hora de corte (ej: 14:30)
  const avgDiningTime = formData.get('avgDiningTime') as string; // Nuevo: Tiempo medio comer
  const zonesJson = formData.get('zonesJson') as string;

  // Si no se define tiempo medio, ponemos 45 min por defecto
  const safeAvgTime = avgDiningTime || '45';

  await sql`
    UPDATE config 
    SET service_mode = ${mode},
        auto_switch_time = ${autoSwitch},
        avg_booking_duration = ${safeAvgTime},
        zones = ${zonesJson}
    WHERE id = ${id}
  `;
  
  revalidatePath('/admin');
  revalidatePath('/');
}

// --- 2. CLIENTE DE PASO (Idioma corregido) ---
export async function addWalkInAction(formData: FormData) {
  const name = formData.get('name') as string;
  const pax = formData.get('pax') as string;
  const phone = formData.get('phone') as string;
  
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
  const notes = "🚶 Cliente de paso"; // Español de barrio

  await sql`
    INSERT INTO bookings (client_name, booking_date, booking_time, pax, client_phone, notes)
    VALUES (${name}, ${date}, ${time}, ${pax}, ${phone || ''}, ${notes})
  `;
  revalidatePath('/admin');
}

// --- 3. EDITAR RESERVA (Nuevo) ---
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

// --- 4. BORRAR RESERVA ---
export async function deleteBookingAction(id: number) {
  await sql`DELETE FROM bookings WHERE id = ${id}`;
  revalidatePath('/admin');
}