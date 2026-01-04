import { Suspense } from 'react'; // 👈 IMPORTANTE: Añadimos esta importación
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import DateSelector from './DateSelector';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// --- ICONOS UNIFICADOS ---
const Icons = {
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  List: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>,
};

// --- LOGICA BACKEND ---
async function deleteBooking(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  if (id) {
    await sql`DELETE FROM bookings WHERE id = ${id}`;
    revalidatePath('/');
  }
}

export default async function Home({ searchParams }: { searchParams: { date?: string } }) {
  // 1. Gestionamos la fecha (Por defecto: HOY)
  const hoy = new Date().toISOString().split('T')[0];
  const selectedDate = searchParams.date || hoy;

  // 2. Filtramos reservas SOLO de esa fecha
  const bookings = await sql`
    SELECT * FROM bookings 
    WHERE booking_date = ${selectedDate} 
    ORDER BY booking_time ASC
  `;

  // Formato bonito de fecha para el título
  const fechaVisual = new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-32">
      
      {/* HEADER CON FECHA */}
      <header className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5 p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">Reservas del</p>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent capitalize">
              {fechaVisual}
            </h1>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-white">{bookings.length}</span>
            <p className="text-gray-500 text-[10px] uppercase">Mesas</p>
          </div>
        </div>

        {/* 👇 AQUÍ ESTÁ EL CAMBIO: Envolvemos DateSelector en Suspense */}
        <Suspense fallback={<div className="h-12 w-full bg-[#161616] rounded-xl animate-pulse"></div>}>
          <DateSelector />
        </Suspense>

      </header>

      {/* LISTA DE RESERVAS */}
      <main className="p-5 space-y-3">
        {bookings.length === 0 ? (
          <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
            <Icons.Calendar />
            <p>No hay reservas para este día.</p>
            <p className="text-xs text-gray-500">Cambia la fecha arriba para ver otros días.</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="group relative bg-[#161616] border border-white/5 rounded-2xl p-4 shadow-lg active:scale-[0.98] transition-all">
              
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 text-blue-400 font-bold px-3 py-1.5 rounded-lg text-lg font-mono">
                    {booking.booking_time.slice(0, 5)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{booking.client_name || 'Cliente'}</h3>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 uppercase tracking-wide">
                      {booking.notes || 'Sin zona'}
                    </p>
                  </div>
                </div>
                
                {/* BORRAR */}
                <form action={deleteBooking}>
                  <input type="hidden" name="id" value={booking.id} />
                  <button type="submit" className="text-gray-600 hover:text-red-500 transition p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </form>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                <span className="bg-[#222] px-2 py-1 rounded text-xs text-gray-300 font-medium">👥 {booking.pax} pax</span>
                <a href={`https://wa.me/${booking.client_phone}`} target="_blank" className="text-[10px] font-bold text-green-400 hover:text-green-300 flex items-center gap-1 bg-green-900/20 px-3 py-1 rounded-full border border-green-500/20">
                  WHATSAPP ›
                </a>
              </div>
            </div>
          ))
        )}
      </main>

      {/* NAVBAR UNIFICADO */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 pb-8 pt-4 px-12 flex justify-between items-center z-50">
        <Link href="/" className="flex flex-col items-center gap-1.5 text-white transition-colors group">
          <div className="shadow-[0_0_15px_rgba(255,255,255,0.3)] rounded-full"><Icons.Calendar /></div>
          <span className="text-[10px] font-bold tracking-widest">RESERVAS</span>
        </Link>
        <Link href="/admin" className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-white transition-colors group">
          <div className="group-hover:-translate-y-1 transition-transform duration-300"><Icons.List /></div>
          <span className="text-[10px] font-bold tracking-widest">CONFIG</span>
        </Link>
      </nav>
    </div>
  );
}