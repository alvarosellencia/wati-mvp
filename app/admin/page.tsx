import postgres from 'postgres';
import AdminClient from './AdminClient';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export default async function AdminPage() {
  const configs = await sql`SELECT * FROM config LIMIT 1`;
  
  const hoy = new Date().toISOString().split('T')[0];
  
  const bookingsHoy = await sql`SELECT * FROM bookings WHERE booking_date = ${hoy} ORDER BY booking_time ASC`;
  const allBookings = await sql`SELECT * FROM bookings ORDER BY booking_date DESC, booking_time ASC LIMIT 100`;

  return (
    <AdminClient 
      config={configs[0]} 
      bookingsToday={bookingsHoy} 
      bookings={allBookings} 
    />
  );
}