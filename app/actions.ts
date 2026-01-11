'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// --- ACCIÓN 1: GUARDAR CONFIGURACIÓN ---
export async function updateConfigAction(formData: FormData) {
  // 👇 AQUÍ ESTABA EL ERROR: Añadimos "as string"
  const id = formData.get('id') as string; 
  
  const mode = formData.get('mode') as string;
  const waitTime = formData.get('waitTime') as string;
  const autoSwitch = formData.get('autoSwitch') as string;
  
  // Reconstruir zonas desde los inputs del formulario
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

// --- ACCIÓN 2: AÑADIR WALK-IN (CLIENTE EN PUERTA) ---
export async function addWalkInAction(formData: FormData) {
  const name = formData.get('name') as string;
  const pax = formData.get('pax') as string;
  const phone = formData.get('phone') as string;
  
  // Obtenemos la fecha y hora del servidor para asegurar precisión
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
  
  const notes = "👤 Walk-in (Manual)";

  await sql`
    INSERT INTO bookings (client_name, booking_date, booking_time, pax, client_phone, notes)
    VALUES (${name}, ${date}, ${time}, ${pax}, ${phone || ''}, ${notes})
  `;
  
  revalidatePath('/admin');
  revalidatePath('/');
}