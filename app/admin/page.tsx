import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// --- ICONOS ---
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
  
  // Parseo seguro
  let zones: any[] = [];
  try { zones = JSON.parse(config.zones); } catch (e) { zones = []; }

  async function updateConfig(formData: FormData) {
    'use server';
    const mode = formData.get('mode') as string;
    const waitTime = formData.get('waitTime') as string;
    
    // Reconstruimos el JSON de zonas
    const newZones = zones.map((z: any, index: number) => ({
      name: z.name,
      capacity: Number(formData.get(`cap_${index}`)),
      active: formData.get(`active_${index}`) === 'on'
    }));

    await sql`
      UPDATE config 
      SET service_mode = ${mode},
          current_wait_time = ${waitTime},
          zones = ${JSON.stringify(newZones)}
      WHERE id = ${config.id}
    `;
    revalidatePath('/admin');
  }

  // Texto explicativo del modo
  const getModeDescription = (mode: string) => {
    if (mode === 'booking') return "El bot aceptará reservas para cualquier día.";
    if (mode === 'waitlist') return "El bot NO reserva. Solo apunta en lista de espera para HOY.";
    return "El bot rechazará a todos amablemente.";
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-32">
      
      {/* HEADER SIMPLE */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5 px-6 py-5">
        <h1 className="text-lg font-bold">Configuración</h1>
        <p className="text-gray-400 text-xs mt-1">Controla el cerebro de Paco</p>
      </div>

      <main className="max-w-md mx-auto p-6 space-y-8 mt-2">
        <form action={updateConfig}>

          {/* 1. MODO DE OPERACIÓN */}
          <section>
            <div className="flex justify-between items-end mb-4 ml-1">
              <h2 className="text-xs text-gray-500 font-bold uppercase tracking-widest">Estado del Servicio</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <label className="group cursor-pointer">
                <input type="radio" name="mode" value="booking" defaultChecked={config.service_mode === 'booking'} className="peer hidden" />
                <div className="h-24 rounded-2xl bg-[#161616] border border-white/10 peer-checked:bg-blue-600 peer-checked:border-blue-500 transition-all flex flex-col items-center justify-center gap-2">
                  <Icons.Calendar />
                  <span className="text-[10px] font-bold uppercase">Reservas</span>
                </div>
              </label>

              <label className="group cursor-pointer">
                <input type="radio" name="mode" value="waitlist" defaultChecked={config.service_mode === 'waitlist'} className="peer hidden" />
                <div className="h-24 rounded-2xl bg-[#161616] border border-white/10 peer-checked:bg-orange-500 peer-checked:border-orange-400 transition-all flex flex-col items-center justify-center gap-2">
                  <Icons.List />
                  <span className="text-[10px] font-bold uppercase">Lista Espera</span>
                </div>
              </label>

              <label className="group cursor-pointer">
                <input type="radio" name="mode" value="closed" defaultChecked={config.service_mode === 'closed'} className="peer hidden" />
                <div className="h-24 rounded-2xl bg-[#161616] border border-white/10 peer-checked:bg-red-600 peer-checked:border-red-500 transition-all flex flex-col items-center justify-center gap-2">
                  <Icons.Lock />
                  <span className="text-[10px] font-bold uppercase">Cerrado</span>
                </div>
              </label>
            </div>

            {/* Explicación Dinámica */}
            <div className="mt-3 bg-white/5 rounded-lg p-3 border border-white/5">
              <p className="text-xs text-gray-400 flex gap-2">
                💡 <span className="text-gray-300">{getModeDescription(config.service_mode)}</span>
              </p>
            </div>

            {/* Input Minutos (visible solo si espera) */}
            {config.service_mode === 'waitlist' && (
              <div className="mt-4 flex items-center justify-between bg-[#161616] p-4 rounded-xl border border-orange-500/30 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm font-medium text-orange-400">Tiempo de espera estimado</span>
                <div className="flex items-center gap-2 bg-black px-3 py-1 rounded border border-white/10">
                  <input type="number" name="waitTime" defaultValue={config.current_wait_time} className="w-10 bg-transparent text-right text-white font-mono focus:outline-none" />
                  <span className="text-xs text-gray-500">min</span>
                </div>
              </div>
            )}
          </section>

          {/* 2. ZONAS (Sliders Gordos) */}
          <section>
            <h2 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4 ml-1 mt-8">Capacidad (Mesas Totales)</h2>
            <div className="space-y-4">
              {zones.map((zone: any, index: number) => {
                const Icon = index === 0 ? Icons.Sofa : index === 1 ? Icons.Sun : Icons.Beer;
                return (
                  <div key={index} className="bg-[#161616] border border-white/5 rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-white/5 text-gray-400`}>
                          <Icon />
                        </div>
                        <span className="font-medium text-white">{zone.name}</span>
                      </div>
                      
                      <div className="relative inline-block w-11 h-6">
                        <input type="checkbox" name={`active_${index}`} id={`toggle_${index}`} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked={zone.active}/>
                        <label htmlFor={`toggle_${index}`} className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-800 cursor-pointer border border-white/5"></label>
                      </div>
                    </div>

                    <div className={!zone.active ? 'opacity-20 pointer-events-none' : ''}>
                      <div className="flex justify-between text-xs mb-3 text-gray-400">
                        <span>Límite para el Bot</span>
                        <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{zone.capacity} mesas</span>
                      </div>
                      <input 
                        type="range" 
                        name={`cap_${index}`} 
                        min="0" 
                        max="20" 
                        defaultValue={zone.capacity} 
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white touch-none" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* BOTÓN FLOTANTE */}
          <div className="fixed bottom-24 left-0 right-0 px-6 z-40 flex justify-center">
            <button type="submit" className="w-full max-w-sm bg-white text-black font-bold py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex justify-center items-center gap-2">
              <Icons.Save />
              <span>Aplicar y Guardar</span>
            </button>
          </div>
        </form>
      </main>

      {/* NAVBAR UNIFICADO */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 pb-8 pt-4 px-12 flex justify-between items-center z-50">
        <Link href="/" className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-white transition-colors group">
          <div className="group-hover:-translate-y-1 transition-transform duration-300"><Icons.Calendar /></div>
          <span className="text-[10px] font-bold tracking-widest">RESERVAS</span>
        </Link>
        <Link href="/admin" className="flex flex-col items-center gap-1.5 text-white transition-colors group">
          <div className="shadow-[0_0_15px_rgba(255,255,255,0.3)] rounded-full"><Icons.List /></div>
          <span className="text-[10px] font-bold tracking-widest">CONFIG</span>
        </Link>
      </nav>

      <style>{`
        .toggle-checkbox:checked { right: 0; border-color: #3b82f6; }
        .toggle-checkbox:checked + .toggle-label { background-color: #3b82f6; }
        .toggle-checkbox { right: 0; z-index: 10; border-color: #e5e7eb; transition: all 0.3s; right: 1.25rem; }
        .toggle-label { width: 2.75rem; }
        /* SLIDER GORDO PARA DEDOS */
        input[type=range]::-webkit-slider-thumb { 
          -webkit-appearance: none; 
          height: 28px; 
          width: 28px; 
          border-radius: 50%; 
          background: #ffffff; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.5); 
          margin-top: -12px; 
        }
        input[type=range]::-moz-range-thumb { 
          height: 28px; 
          width: 28px; 
          border-radius: 50%; 
          background: #ffffff; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.5); 
          border: none; 
        }
        input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; }
      `}</style>
    </div>
  );
}