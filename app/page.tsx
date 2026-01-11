import { Suspense } from 'react';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import DateSelector from './DateSelector';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function deleteBooking(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  if (id) {
    await sql`DELETE FROM bookings WHERE id = ${id}`;
    revalidatePath('/');
  }
}

export default async function Home({ searchParams }: { searchParams: { date?: string } }) {
  const hoy = new Date().toISOString().split('T')[0];
  const selectedDate = searchParams.date || hoy;

  const bookings = await sql`
    SELECT * FROM bookings 
    WHERE booking_date = ${selectedDate} 
    ORDER BY booking_time ASC
  `;

  const fechaVisual = new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F] pb-32">
      
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-[#F5F5F7]/90 backdrop-blur-xl border-b border-gray-200 p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Reservas del</p>
            <h1 className="text-2xl font-bold text-black capitalize tracking-tight">{fechaVisual}</h1>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-black">{bookings.length}</span>
            <p className="text-gray-500 text-[10px] uppercase font-bold">Mesas</p>
          </div>
        </div>

        <Suspense fallback={<div className="h-12 w-full bg-gray-200 rounded-2xl animate-pulse"></div>}>
          <DateSelector />
        </Suspense>
      </header>

      {/* LISTA */}
      <main className="p-5 space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-20 opacity-40 flex flex-col items-center gap-4">
            <span className="text-4xl">📅</span>
            <p className="font-medium text-gray-500">No hay reservas para este día.</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="group bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex justify-between items-center transition-all active:scale-[0.98]">
              
              <div className="flex items-center gap-4">
                <div className="bg-[#F5F5F7] text-black font-bold px-4 py-3 rounded-2xl text-lg font-mono tracking-tight">
                  {booking.booking_time.slice(0, 5)}
                </div>
                <div>
                  <h3 className="font-bold text-black text-lg leading-tight">{booking.client_name || 'Cliente'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="bg-gray-100 px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-500 uppercase">👥 {booking.pax}</span>
                     <p className="text-xs text-gray-400 truncate max-w-[120px]">{booking.notes || ''}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a href={`https://wa.me/${booking.client_phone}`} className="w-10 h-10 rounded-full bg-[#34C759]/10 flex items-center justify-center text-[#34C759]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                </a>
                <form action={deleteBooking}>
                  <input type="hidden" name="id" value={booking.id} />
                  <button type="submit" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-8 pt-4 px-12 flex justify-between items-center z-50">
        <a href="/" className="flex flex-col items-center gap-1 text-[#0071E3]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-[10px] font-bold tracking-widest">RESERVAS</span>
        </a>
        <a href="/admin" className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#0071E3] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          <span className="text-[10px] font-bold tracking-widest">ADMIN</span>
        </a>
      </nav>
    </div>
  );
}