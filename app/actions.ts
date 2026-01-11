'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// --- 1. GUARDAR CONFIGURACIÓN AVANZADA ---
export async function updateConfigAction(formData: FormData) {
  const id = formData.get('id') as string;
  const mode = formData.get('mode') as string;
  const waitTime = formData.get('waitTime') as string;
  const autoSwitch = formData.get('autoSwitch') as string;
  
  // Recibimos el JSON complejo de zonas (Nombre, Tipo, Num Mesas, Pax por Mesa)
  const zonesJson = formData.get('zonesJson') as string;

  await sql`
    UPDATE config 
    SET service_mode = ${mode},
        current_wait_time = ${waitTime},
        auto_switch_time = ${autoSwitch},
        zones = ${zonesJson}
    WHERE id = ${id}
  `;
  
  revalidatePath('/admin');
  revalidatePath('/');
}

// --- 2. WALK-IN (Cliente en puerta) ---
export async function addWalkInAction(formData: FormData) {
  const name = formData.get('name') as string;
  const pax = formData.get('pax') as string;
  const phone = formData.get('phone') as string;
  
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  // Hora local España
  const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
  const notes = "👤 Walk-in (En Puerta)";

  await sql`
    INSERT INTO bookings (client_name, booking_date, booking_time, pax, client_phone, notes)
    VALUES (${name}, ${date}, ${time}, ${pax}, ${phone || ''}, ${notes})
  `;
  revalidatePath('/admin');
}

// --- 3. BORRAR RESERVA (Desde el Admin) ---
export async function deleteBookingAction(id: number) {
  await sql`DELETE FROM bookings WHERE id = ${id}`;
  revalidatePath('/admin');
}