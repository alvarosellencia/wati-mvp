import postgres from 'postgres';

// 1. Conectamos a la base de datos (igual que en el bot)
const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// 2. Esta función va a buscar las reservas a Neon
async function getBookings() {
  // Pedimos las reservas ordenadas por fecha y hora (las más próximas primero)
  const bookings = await sql`
    SELECT * FROM bookings 
    ORDER BY booking_date ASC, booking_time ASC
  `;
  return bookings;
}

export default async function Home() {
  const bookings = await getBookings();

  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* CABECERA */}
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>🥘 Bar Manolo</h1>
        <p style={{ color: '#666' }}>Libreta de Reservas Digital</p>
      </header>

      {/* LISTA DE RESERVAS */}
      <section>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>📅 Próximas Reservas</h2>

        {bookings.length === 0 ? (
          <p style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
            📭 Aún no hay reservas. ¡Dile a Paco que espabile!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {bookings.map((booking) => (
              <div key={booking.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '12px', 
                padding: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                backgroundColor: '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                    {/* Formateamos la hora para que se vea bien (14:00) */}
                    {booking.booking_time.slice(0, 5)}
                  </span>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                    {booking.pax} pax
                  </span>
                </div>
                
                <div style={{ color: '#444' }}>
                  <strong>Cliente:</strong> {booking.client_name || 'Amigo'} <br/>
                  <span style={{ color: '#888', fontSize: '14px' }}>📞 {booking.client_phone}</span>
                </div>

                <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                  📅 {new Date(booking.booking_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}