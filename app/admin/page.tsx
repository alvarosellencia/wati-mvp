import postgres from 'postgres';
import AdminClient from './AdminClient';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export default async function AdminPage() {
  // 1. OBTENER CONFIGURACIÓN
  const configs = await sql`SELECT * FROM config LIMIT 1`;
  const config = configs[0];

  // 2. OBTENER RESERVAS DE HOY (Para la barra de ocupación)
  const hoy = new Date().toISOString().split('T')[0];
  const bookingsHoy = await sql`SELECT * FROM bookings WHERE booking_date = ${hoy}`;

  // 3. RENDERIZAR EL COMPONENTE CLIENTE
  return (
    <AdminClient config={config} bookingsToday={bookingsHoy} />
  );
}