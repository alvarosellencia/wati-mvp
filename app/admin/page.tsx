import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// --- ICONOS SVG ESTILO APPLE (Minimalistas) ---
const Icons = {
  Calendar: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  List: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Sofa: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>,
  Beer: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6"/><path d="M13 12v6"/><path d="M14 5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2h8Z"/><path d="M6 7h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z"/></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
};

export default async function AdminPage() {
  const configs = await sql`SELECT * FROM config LIMIT 1`;
  const config = configs[0];
  
  // Parseo seguro de zonas
  let zones = [];
  try {
    zones = JSON.parse(config.zones);
  } catch (e) {
    // Fallback por si la DB estaba sucia
    zones = [
      { name: 'Sala Principal', capacity: 10, active: true },
      { name: 'Terraza', capacity: 6, active: true },
      { name: 'Barra', capacity: 4, active: false }
    ];
  }

  async function updateConfig(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const mode = formData.get('mode') as string;
    const waitTime = formData.get('waitTime') as string;
    
    // Reconstruimos el array de zonas
    const newZones = zones.map((z: any, index: number) => ({
      name: z.name,
      capacity: Number(formData.get(`cap_${index}`)),
      active: formData.get(`active_${index}`) === 'on'
    }));

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-32 selection:bg-blue-500/30">
      
      {/* HEADER GLASS */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            {config.restaurant_name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${config.service_mode === 'booking' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : config.service_mode === 'waitlist' ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 'bg-red-500'}`}></span>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
              {config.service_mode === 'booking' ? 'Reservas Activas' : config.service_mode === 'waitlist' ? 'Lista de Espera' : 'Cerrado'}
            </p>
          </div>
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold ring-2 ring-white/10">
          M
        </div>
      </div>

      <main className="max-w-md mx-auto p-6 space-y-10 mt-2">
        <form action={updateConfig}>
          <input type="hidden" name="name" value={config.restaurant_name} />

          {/* 1. SEMÁFORO DE SERVICIO (Segmented Control Style) */}
          <section>
            <h2 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4 ml-1">Modo de Operación</h2>
            <div className="grid grid-cols-3 gap-3">
              
              {/* Opción Reservas */}
              <label className="group cursor-pointer relative">
                <input type="radio" name="mode" value="booking" defaultChecked={config.service_mode === 'booking'} className="peer hidden" />
                <div className="h-24 rounded-2xl border border-white/10 bg-[#161616] peer-checked:bg-blue-600 peer-checked:border-blue-500 peer-checked:shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all duration-300 flex flex-col items-center justify-center gap-2">
                  <div className="text-gray-400 peer-checked:text-white transition-colors"><Icons.Calendar /></div>
                  <span className="text-[10px] font-bold text-gray-400 peer-checked:text-white uppercase">Reservas</span>
                </div>
              </label>

              {/* Opción Lista Espera */}
              <label className="group cursor-pointer relative">
                <input type="radio" name="mode" value="waitlist" defaultChecked={config.service_mode === 'waitlist'} className="peer hidden" />
                <div className="h-24 rounded-2xl border border-white/10 bg-[#161616] peer-checked:bg-orange-500 peer-checked:border-orange-400 peer-checked:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-300 flex flex-col items-center justify-center gap-2">
                  <div className="text-gray-400 peer-checked:text-white transition-colors"><Icons.List /></div>
                  <span className="text-[10px] font-bold text-gray-400 peer-checked:text-white uppercase">Espera</span>
                </div>
              </label>

              {/* Opción Cerrado */}
              <label className="group cursor-pointer relative">
                <input type="radio" name="mode" value="closed" defaultChecked={config.service_mode === 'closed'} className="peer hidden" />
                <div className="h-24 rounded-2xl border border-white/10 bg-[#161616] peer-checked:bg-red-600 peer-checked:border-red-500 peer-checked:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all duration-300 flex flex-col items-center justify-center gap-2">
                  <div className="text-gray-400 peer-checked:text-white transition-colors"><Icons.Lock /></div>
                  <span className="text-[10px] font-bold text-gray-400 peer-checked:text-white uppercase">Completo</span>
                </div>
              </label>
            </div>

            {/* Input de Minutos (Solo visual si Lista Espera, pero funcional siempre) */}
            <div className={`mt-4 bg-[#161616] border border-white/5 rounded-xl p-4 flex items-center justify-between transition-all duration-500 ${config.service_mode !== 'waitlist' ? 'opacity-50 grayscale' : 'opacity-100'}`}>
              <span className="text-sm text-gray-300 font-medium">Tiempo de espera actual</span>
              <div className="flex items-center gap-2 bg-black rounded-lg px-3 py-1 border border-white/10">
                <input type="number" name="waitTime" defaultValue={config.current_wait_time} className="w-12 bg-transparent text-right text-white font-mono focus:outline-none" />
                <span className="text-xs text-gray-500 font-medium">min</span>
              </div>
            </div>
          </section>

          {/* 2. ZONAS (Cards estilo iOS Settings) */}
          <section>
            <h2 className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4 ml-1">Capacidad por Zonas</h2>
            <div className="space-y-3">
              {zones.map((zone: any, index: number) => {
                const Icon = index === 0 ? Icons.Sofa : index === 1 ? Icons.Sun : Icons.Beer;
                return (
                  <div key={index} className="bg-[#161616] border border-white/5 rounded-2xl p-4 transition-all hover:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${zone.active ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-gray-600'}`}>
                          <Icon />
                        </div>
                        <span className={`font-medium ${!zone.active && 'text-gray-500'}`}>{zone.name}</span>
                      </div>
                      
                      {/* iOS Toggle Switch */}
                      <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name={`active_${index}`} id={`toggle_${index}`} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked={zone.active}/>
                        <label htmlFor={`toggle_${index}`} className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-800 cursor-pointer border border-white/5"></label>
                      </div>
                    </div>

                    <div className={`transition-all duration-300 ${!zone.active ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-500">Mesas libres</span>
                        <span className="text-white font-mono">{zone.capacity}</span>
                      </div>
                      <input 
                        type="range" 
                        name={`cap_${index}`} 
                        min="0" 
                        max="20" 
                        defaultValue={zone.capacity} 
                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* BOTÓN GUARDAR FLOTANTE */}
          <div className="fixed bottom-24 left-0 right-0 px-6 z-40 flex justify-center">
            <button type="submit" className="w-full max-w-sm bg-white text-black font-bold py-4 rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all duration-300 flex justify-center items-center gap-2">
              <Icons.Save />
              <span>Aplicar Cambios</span>
            </button>
          </div>
        </form>
      </main>

      {/* NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 pb-8 pt-4 px-12 flex justify-between items-center z-50">
        <Link href="/" className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-white transition-colors group">
          <div className="group-hover:-translate-y-1 transition-transform duration-300"><Icons.Calendar /></div>
          <span className="text-[10px] font-bold tracking-widest">RESERVAS</span>
        </Link>
        <Link href="/admin" className="flex flex-col items-center gap-1.5 text-white">
          <div className="shadow-[0_0_15px_rgba(255,255,255,0.3)] rounded-full"><Icons.List /></div>
          <span className="text-[10px] font-bold tracking-widest">CONFIG</span>
        </Link>
      </nav>

      <style>{`
        .toggle-checkbox:checked { right: 0; border-color: #3b82f6; }
        .toggle-checkbox:checked + .toggle-label { background-color: #3b82f6; }
        .toggle-checkbox { right: 0; z-index: 10; border-color: #e5e7eb; transition: all 0.3s; right: 1.25rem; }
        .toggle-label { width: 2.75rem; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); margin-top: -6px; }
        input[type=range]::-moz-range-thumb { height: 16px; width: 16px; border-radius: 50%; background: #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: none; }
      `}</style>
    </div>
  );
}