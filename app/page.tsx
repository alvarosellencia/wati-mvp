import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// --- ACCIONES DE SERVIDOR (Lógica Backend) ---
async function getBookings() {
  return await sql`SELECT * FROM bookings ORDER BY booking_date ASC, booking_time ASC`;
}

async function deleteBooking(formData: FormData) {
  'use server';
  // 🔽 AQUÍ ESTABA EL ERROR: Añadimos "as string" para calmar a TypeScript
  const id = formData.get('id') as string; 
  
  if (id) {
    await sql`DELETE FROM bookings WHERE id = ${id}`;
    revalidatePath('/');
  }
}

// --- COMPONENTE VISUAL (Frontend) ---
export default async function Home() {
  const bookings = await getBookings();
  
  // Calculamos reservas de HOY para el resumen
  const hoy = new Date().toISOString().split('T')[0];
  const bookingsHoy = bookings.filter(b => new Date(b.booking_date).toISOString().split('T')[0] === hoy);

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      
      {/* HEADER CON RESUMEN */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10 p-5">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Bienvenido</p>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Bar Manolo
            </h1>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-white">{bookingsHoy.length}</span>
            <p className="text-gray-500 text-[10px] uppercase">Reservas Hoy</p>
          </div>
        </div>
      </header>

      {/* LISTA DE RESERVAS */}
      <main className="p-5 space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <p className="text-6xl mb-4">📭</p>
            <p>No hay reservas pendientes.</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="group relative bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-lg hover:border-white/20 transition-all">
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 text-blue-400 font-bold px-3 py-1 rounded-lg text-lg">
                    {booking.booking_time.slice(0, 5)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{booking.client_name || 'Amigo'}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      📅 {new Date(booking.booking_date).toLocaleDateString()} 
                      <span className="text-gray-700">•</span> 
                      📍 {booking.notes || 'Sin zona asignada'}
                    </p>
                  </div>
                </div>
                
                {/* BOTÓN BORRAR (Papelera) */}
                <form action={deleteBooking}>
                  <input type="hidden" name="id" value={booking.id} />
                  <button type="submit" className="text-gray-600 hover:text-red-500 transition p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </form>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">👤 {booking.pax} pax</span>
                  <span className="text-gray-600 text-xs">{booking.client_phone}</span>
                </div>
                
                {/* Botón WhatsApp Directo */}
                <a href={`https://wa.me/${booking.client_phone}`} target="_blank" className="text-xs font-bold text-green-400 hover:text-green-300 flex items-center gap-1">
                  CHAT <span className="text-lg">›</span>
                </a>
              </div>
            </div>
          ))
        )}
      </main>

      {/* MENÚ DE NAVEGACIÓN INFERIOR (Estilo App) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-6 pt-3 px-10 flex justify-between items-center z-50">
        <Link href="/" className="flex flex-col items-center gap-1 text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className="text-[10px] font-bold tracking-wide">RESERVAS</span>
        </Link>
        
        <div className="w-px h-8 bg-white/10"></div>

        <Link href="/admin" className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <span className="text-[10px] font-bold tracking-wide">CONFIG</span>
        </Link>
      </nav>

    </div>
  );
}