import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export default async function AdminPage() {
  const configs = await sql`SELECT * FROM config LIMIT 1`;
  const config = configs[0];

  async function updateConfig(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const schedule = formData.get('schedule') as string;
    const closed = formData.get('closed') as string;
    const zones = formData.get('zones') as string;
    const maxPax = formData.get('maxPax') as string;
    const duration = formData.get('duration') as string;
    const botActive = formData.get('botActive') === 'on'; // Checkbox handling

    await sql`
      UPDATE config 
      SET restaurant_name = ${name}, 
          schedule = ${schedule}, 
          closed_days = ${closed},
          zones = ${zones},
          max_pax_per_booking = ${maxPax},
          avg_booking_duration = ${duration},
          is_bot_active = ${botActive}
      WHERE id = ${config.id}
    `;
    revalidatePath('/admin');
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24">
      
      {/* HEADER FLOTANTE */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Wati Admin
        </h1>
        <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-400">v2.0 PRO</span>
      </div>

      <main className="max-w-md mx-auto p-5 space-y-8">
        
        <form action={updateConfig} className="space-y-6">

          {/* TARJETA 1: CONTROL PRINCIPAL */}
          <section className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-200">🤖 Estado del Bot</h2>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="botActive" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked={config.is_bot_active}/>
                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"></label>
              </div>
            </div>
            <p className="text-xs text-gray-500">Si lo apagas, Paco dejará de contestar mensajes.</p>
          </section>

          {/* TARJETA 2: IDENTIDAD */}
          <section className="bg-zinc-900 border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-2">Identidad</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nombre del Negocio</label>
              <input name="name" defaultValue={config.restaurant_name} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </section>

          {/* TARJETA 3: REGLAS DE ORO */}
          <section className="bg-zinc-900 border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-2">Logística</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Max Personas/Mesa</label>
                <input type="number" name="maxPax" defaultValue={config.max_pax_per_booking} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-center text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Duración (min)</label>
                <input type="number" name="duration" defaultValue={config.avg_booking_duration} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-center text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Zonas y Mesas</label>
              <textarea name="zones" rows={3} defaultValue={config.zones} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="Ej: Terraza (5 mesas), Interior (10)..." />
            </div>
          </section>

          {/* TARJETA 4: HORARIOS */}
          <section className="bg-zinc-900 border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-2">Agenda</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Horarios de Apertura</label>
              <textarea name="schedule" rows={3} defaultValue={config.schedule} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-red-400 mb-1">Días Cerrado</label>
              <input name="closed" defaultValue={config.closed_days} className="w-full bg-black/50 border border-red-900/30 rounded-xl p-3 text-white focus:ring-red-500" />
            </div>
          </section>

          {/* BOTÓN GUARDAR STICKY (Ajustado para no chocar con el menú) */}
          <div className="fixed bottom-24 left-0 right-0 px-6 z-20">
            <button type="submit" className="w-full max-w-md mx-auto bg-white text-black font-bold py-4 rounded-2xl shadow-lg hover:scale-105 transition transform flex justify-center items-center gap-2">
              <span>💾 Guardar Cambios</span>
            </button>
          </div>

        </form>
      </main>

      {/* MENÚ DE NAVEGACIÓN INFERIOR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-6 pt-3 px-10 flex justify-between items-center z-50">
        <Link href="/" className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className="text-[10px] font-bold tracking-wide">RESERVAS</span>
        </Link>
        
        <div className="w-px h-8 bg-white/10"></div>

        <Link href="/admin" className="flex flex-col items-center gap-1 text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <span className="text-[10px] font-bold tracking-wide">CONFIG</span>
        </Link>
      </nav>

      {/* ESTILOS EXTRA PARA EL TOGGLE */}
      <style>{`
        .toggle-checkbox:checked { right: 0; border-color: #68D391; }
        .toggle-checkbox:checked + .toggle-label { background-color: #68D391; }
        .toggle-checkbox { right: 0; z-index: 10; border-color: #CBD5E0; transition: all 0.3s; right: 1.5rem; }
        .toggle-label { width: 3rem; height: 1.5rem; }
      `}</style>
    </div>
  );
}