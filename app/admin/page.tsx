import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// --- ICONOS ---
const Icons = {
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
};

export default async function AdminPage({ searchParams }: { searchParams: { tab?: string } }) {
  const configs = await sql`SELECT * FROM config LIMIT 1`;
  const config = configs[0];
  const tab = searchParams.tab || 'ops'; // 'ops' (Operativa) o 'config' (Configuración)

  // 1. OBTENER DATOS REALES DE HOY
  const hoy = new Date().toISOString().split('T')[0];
  const bookingsHoy = await sql`SELECT * FROM bookings WHERE booking_date = ${hoy}`;

  // 2. CÁLCULOS MATEMÁTICOS (El gráfico de gasolina)
  let zones: any[] = [];
  try { zones = JSON.parse(config.zones); } catch { zones = []; }
  
  // Capacidad Total del Local (Suma de los sliders)
  const totalCapacity = zones.reduce((acc, zone) => zone.active ? acc + zone.capacity : acc, 0);
  
  // Ocupación Actual (Suma de personas en reservas de hoy)
  // NOTA: Para hacerlo perfecto en el futuro sumaríamos solo las de "ahora", pero para el MVP sumamos todo el día o filtramos por hora.
  // Simplificación MVP: Sumamos todos los PAX de hoy.
  const totalPaxReserved = bookingsHoy.reduce((acc, b) => acc + b.pax, 0);
  
  // Porcentaje de llenado
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalPaxReserved / totalCapacity) * 100) : 0;
  const occupancyColor = occupancyPercent > 90 ? 'bg-red-500' : occupancyPercent > 60 ? 'bg-yellow-500' : 'bg-green-500';


  // --- ACTIONS ---

  // A) Guardar Configuración General
  async function updateConfig(formData: FormData) {
    'use server';
    const mode = formData.get('mode') as string;
    const waitTime = formData.get('waitTime') as string;
    const autoSwitch = formData.get('autoSwitch') as string;
    
    const newZones = zones.map((z: any, index: number) => ({
      name: z.name,
      capacity: Number(formData.get(`cap_${index}`)),
      active: formData.get(`active_${index}`) === 'on'
    }));

    await sql`
      UPDATE config 
      SET service_mode = ${mode},
          current_wait_time = ${waitTime},
          auto_switch_time = ${autoSwitch},
          zones = ${JSON.stringify(newZones)}
      WHERE id = ${config.id}
    `;
    revalidatePath('/admin');
  }

  // B) Añadir Walk-in (Cliente manual)
  async function addWalkIn(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const pax = formData.get('pax') as string;
    const phone = formData.get('phone') as string; // Opcional
    const notes = "👤 Walk-in (Manual)";
    
    const timeNow = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    await sql`
      INSERT INTO bookings (client_name, booking_date, booking_time, pax, client_phone, notes)
      VALUES (${name}, ${hoy}, ${timeNow}, ${pax}, ${phone || ''}, ${notes})
    `;
    revalidatePath('/admin');
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-32">
      
      {/* HEADER DE PESTAÑAS */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
            {config.restaurant_name}
          </h1>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${config.service_mode === 'booking' ? 'bg-green-900/50 text-green-400' : config.service_mode === 'waitlist' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>
            {config.service_mode}
          </span>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex px-4 gap-4 text-sm font-medium">
          <Link href="/admin?tab=ops" className={`pb-3 border-b-2 transition-colors ${tab === 'ops' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500'}`}>
            Operativa Diaria
          </Link>
          <Link href="/admin?tab=config" className={`pb-3 border-b-2 transition-colors ${tab === 'config' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500'}`}>
            Configuración
          </Link>
          <span className="text-gray-600 pb-3 ml-auto cursor-not-allowed">Analítica 🔒</span>
        </div>
      </div>

      <main className="max-w-md mx-auto p-5 mt-2 space-y-8">

        {/* ================= PESTAÑA 1: OPERATIVA DIARIA ================= */}
        {tab === 'ops' && (
          <>
            {/* 1. KPI VISUAL (GASOLINA) */}
            <section className="bg-[#161616] border border-white/5 rounded-2xl p-5 shadow-2xl">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h2 className="text-xs text-gray-400 uppercase font-bold tracking-widest">Ocupación Hoy</h2>
                  <p className="text-2xl font-bold text-white mt-1">{totalPaxReserved} <span className="text-gray-500 text-sm font-normal">/ {totalCapacity} pax</span></p>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-bold ${occupancyPercent > 90 ? 'text-red-400' : occupancyPercent > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {occupancyPercent}%
                  </span>
                </div>
              </div>
              
              {/* Barra de Progreso */}
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${occupancyColor} transition-all duration-1000 ease-out`} 
                  style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 text-right">Basado en reservas activas vs capacidad configurada</p>
            </section>

            {/* 2. WALK-IN (AÑADIR MANUAL) */}
            <section>
              <h2 className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-3 ml-1">Llega Cliente (Walk-in)</h2>
              <form action={addWalkIn} className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-3">
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 mb-1 block">Nombre (Para gritarle)</label>
                    <div className="flex items-center bg-black border border-white/10 rounded-xl px-3 py-2">
                      <Icons.User />
                      <input name="name" placeholder="Ej: Juan Camisa Azul" required className="bg-transparent w-full ml-2 text-sm focus:outline-none" />
                    </div>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-gray-400 mb-1 block">Pax</label>
                    <div className="flex items-center bg-black border border-white/10 rounded-xl px-3 py-2">
                      <Icons.Users />
                      <input name="pax" type="number" defaultValue="2" className="bg-transparent w-full ml-2 text-sm focus:outline-none text-center" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 mb-1 block">Teléfono (Opcional - Para avisarle)</label>
                  <input name="phone" type="tel" placeholder="Si quiere WhatsApp..." className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 text-sm">
                  <Icons.Plus />
                  <span>Apuntar en la Mesa/Lista</span>
                </button>
              </form>
            </section>
          </>
        )}

        {/* ================= PESTAÑA 2: CONFIGURACIÓN ================= */}
        {tab === 'config' && (
          <form action={updateConfig} className="space-y-8">
            
            {/* MODO DE SERVICIO */}
            <section>
              <h2 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Modo Actual</h2>
              <div className="grid grid-cols-3 gap-2">
                {['booking', 'waitlist', 'closed'].map((m) => (
                  <label key={m} className={`cursor-pointer border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center gap-1 transition-all ${config.service_mode === m ? 'bg-blue-600 border-blue-500' : 'bg-[#161616]'}`}>
                    <input type="radio" name="mode" value={m} defaultChecked={config.service_mode === m} className="hidden" />
                    <span className="text-xl capitalize">{m === 'booking' ? '📅' : m === 'waitlist' ? '📝' : '🔒'}</span>
                    <span className="text-[9px] font-bold uppercase">{m === 'booking' ? 'Reservas' : m === 'waitlist' ? 'Espera' : 'Cerrado'}</span>
                  </label>
                ))}
              </div>

              {/* AUTOMATIZACIÓN (NUEVO) */}
              <div className="mt-4 bg-[#161616] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2"><Icons.Clock /> Auto-Lista de Espera</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">A esta hora, pasa solo a 'Lista de Espera'.</p>
                </div>
                <input 
                  type="time" 
                  name="autoSwitch" 
                  defaultValue={config.auto_switch_time} 
                  className="bg-black border border-white/20 rounded-lg px-2 py-1 text-white text-sm" 
                />
              </div>

              {/* Tiempo de espera manual */}
              {config.service_mode === 'waitlist' && (
                <div className="mt-2 bg-orange-900/20 p-3 rounded-xl border border-orange-500/30 flex justify-between items-center">
                  <span className="text-xs text-orange-300">Tiempo estimado actual</span>
                  <div className="flex items-center gap-1">
                    <input type="number" name="waitTime" defaultValue={config.current_wait_time} className="w-12 bg-black border border-white/10 rounded text-center text-sm" />
                    <span className="text-xs">min</span>
                  </div>
                </div>
              )}
            </section>

            {/* CAPACIDAD TOTAL (SLIDERS) */}
            <section>
              <h2 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">Inventario Total (Mesas)</h2>
              <div className="space-y-3">
                {zones.map((zone: any, index: number) => (
                  <div key={index} className="bg-[#161616] border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{zone.name}</span>
                      <input type="checkbox" name={`active_${index}`} defaultChecked={zone.active} className="toggle-checkbox" />
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        name={`cap_${index}`} 
                        min="0" max="50" 
                        defaultValue={zone.capacity} 
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white" 
                      />
                      <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded w-16 text-center">{zone.capacity} pax</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="fixed bottom-24 left-0 right-0 px-6 flex justify-center pointer-events-none">
              <button type="submit" className="pointer-events-auto bg-white text-black font-bold py-3 px-8 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm">
                <Icons.Settings />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        )}

      </main>

      {/* NAVBAR UNIFICADO */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 pb-8 pt-4 px-12 flex justify-between items-center z-50">
        <Link href="/" className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <Icons.Clock />
          <span className="text-[10px] font-bold tracking-widest">RESERVAS</span>
        </Link>
        <Link href="/admin" className="flex flex-col items-center gap-1.5 text-white">
          <Icons.Chart />
          <span className="text-[10px] font-bold tracking-widest">GESTIÓN</span>
        </Link>
      </nav>
    </div>
  );
}