import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export default async function AdminPage() {
  const configs = await sql`SELECT * FROM config LIMIT 1`;
  const config = configs[0];
  
  // Parseamos las zonas (si es texto antiguo, ponemos default)
  let zones = [];
  try {
    zones = JSON.parse(config.zones);
  } catch (e) {
    zones = [
      { name: 'Interior', capacity: 10, active: true },
      { name: 'Terraza', capacity: 6, active: true },
      { name: 'Barra', capacity: 4, active: false }
    ];
  }

  // Server Action para guardar todo
  async function updateConfig(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const mode = formData.get('mode') as string; // booking, waitlist, closed
    const waitTime = formData.get('waitTime') as string;
    
    // Reconstruimos el JSON de zonas desde el form
    const newZones = [
      { 
        name: 'Interior', 
        capacity: Number(formData.get('cap_Interior')), 
        active: formData.get('active_Interior') === 'on' 
      },
      { 
        name: 'Terraza', 
        capacity: Number(formData.get('cap_Terraza')), 
        active: formData.get('active_Terraza') === 'on' 
      },
      { 
        name: 'Barra', 
        capacity: Number(formData.get('cap_Barra')), 
        active: formData.get('active_Barra') === 'on' 
      }
    ];

    await sql`
      UPDATE config 
      SET restaurant_name = ${name}, 
          service_mode = ${mode},
          current_wait_time = ${waitTime},
          zones = ${JSON.stringify(newZones)}
      WHERE id = ${config.id}
    `;
    revalidatePath('/admin');
  }

  // Helpers visuales
  const getModeColor = (m: string) => {
    if (m === 'booking') return 'bg-green-500 shadow-green-500/50';
    if (m === 'waitlist') return 'bg-yellow-500 shadow-yellow-500/50';
    return 'bg-red-500 shadow-red-500/50';
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-32">
      
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {config.restaurant_name}
          </h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Panel de Control</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${getModeColor(config.service_mode)} animate-pulse`}></div>
      </div>

      <main className="max-w-md mx-auto p-5 space-y-8">
        <form action={updateConfig}>
          <input type="hidden" name="name" value={config.restaurant_name} />

          {/* 1. SEMÁFORO DE SERVICIO (Lo que pediste de Andalucía) */}
          <section className="space-y-4 mb-8">
            <h2 className="text-xs text-gray-500 uppercase font-bold tracking-widest ml-1">Modo de Servicio</h2>
            <div className="grid grid-cols-3 gap-2">
              
              <label className={`cursor-pointer border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${config.service_mode === 'booking' ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-zinc-900 text-gray-500 hover:bg-zinc-800'}`}>
                <input type="radio" name="mode" value="booking" defaultChecked={config.service_mode === 'booking'} className="hidden" />
                <span className="text-2xl">📅</span>
                <span className="text-[10px] font-bold uppercase">Reservas</span>
              </label>

              <label className={`cursor-pointer border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${config.service_mode === 'waitlist' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-400' : 'bg-zinc-900 text-gray-500 hover:bg-zinc-800'}`}>
                <input type="radio" name="mode" value="waitlist" defaultChecked={config.service_mode === 'waitlist'} className="hidden" />
                <span className="text-2xl">📝</span>
                <span className="text-[10px] font-bold uppercase">Lista Espera</span>
              </label>

              <label className={`cursor-pointer border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${config.service_mode === 'closed' ? 'bg-red-900/30 border-red-500 text-red-400' : 'bg-zinc-900 text-gray-500 hover:bg-zinc-800'}`}>
                <input type="radio" name="mode" value="closed" defaultChecked={config.service_mode === 'closed'} className="hidden" />
                <span className="text-2xl">🔒</span>
                <span className="text-[10px] font-bold uppercase">Completo</span>
              </label>
            </div>

            {/* Selector de Tiempo de Espera (Solo visible si es Waitlist, pero lo dejamos siempre para simplicidad de código) */}
            <div className="bg-zinc-900 border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-gray-300">⏱️ Tiempo espera estimado</span>
              <div className="flex items-center gap-2">
                <input type="number" name="waitTime" defaultValue={config.current_wait_time} className="w-16 bg-black border border-white/20 rounded-lg p-2 text-center text-white font-mono" />
                <span className="text-xs text-gray-500">min</span>
              </div>
            </div>
          </section>

          {/* 2. GESTIÓN VISUAL DE ESPACIOS (Sliders) */}
          <section className="space-y-4">
            <h2 className="text-xs text-gray-500 uppercase font-bold tracking-widest ml-1">Configuración de Zonas</h2>
            
            {zones.map((zone: any) => (
              <div key={zone.name} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 relative overflow-hidden group">
                {/* Fondo decorativo */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${zone.active ? 'from-blue-500/10' : 'from-gray-500/5'} to-transparent rounded-bl-full`}></div>

                <div className="flex justify-between items-center mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${zone.active ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-600'}`}>
                      {zone.name === 'Interior' ? '🛋️' : zone.name === 'Terraza' ? '☀️' : '🍻'}
                    </div>
                    <span className={`font-bold ${!zone.active && 'text-gray-500'}`}>{zone.name}</span>
                  </div>
                  
                  {/* Toggle On/Off */}
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input type="checkbox" name={`active_${zone.name}`} id={`toggle_${zone.name}`} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked={zone.active}/>
                    <label htmlFor={`toggle_${zone.name}`} className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-700 cursor-pointer"></label>
                  </div>
                </div>

                {/* Slider de Capacidad */}
                <div className={`${!zone.active ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Mesas Disponibles</span>
                    <span className="font-mono text-white bg-white/10 px-2 rounded">{zone.capacity} mesas</span>
                  </div>
                  <input type="range" name={`cap_${zone.name}`} min="0" max="30" defaultValue={zone.capacity} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
              </div>
            ))}
          </section>

          {/* BOTÓN GUARDAR FLOTANTE */}
          <div className="fixed bottom-24 left-0 right-0 px-6 z-30">
            <button type="submit" className="w-full max-w-md mx-auto bg-white text-black font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition transform flex justify-center items-center gap-2">
              <span>🚀 Actualizar Estado</span>
            </button>
          </div>
        </form>
      </main>

      {/* NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-6 pt-3 px-10 flex justify-between items-center z-50">
        <Link href="/" className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition">
          <span className="text-2xl">📅</span>
          <span className="text-[10px] font-bold tracking-wide">RESERVAS</span>
        </Link>
        <Link href="/admin" className="flex flex-col items-center gap-1 text-blue-400">
          <span className="text-2xl">⚙️</span>
          <span className="text-[10px] font-bold tracking-wide">CONFIG</span>
        </Link>
      </nav>

      <style>{`
        .toggle-checkbox:checked { right: 0; border-color: #68D391; }
        .toggle-checkbox:checked + .toggle-label { background-color: #68D391; }
        .toggle-checkbox { right: 0; z-index: 10; border-color: #CBD5E0; transition: all 0.3s; right: 1.25rem; }
        .toggle-label { width: 2.5rem; height: 1.25rem; }
      `}</style>
    </div>
  );
}