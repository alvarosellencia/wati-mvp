'use client';

import { useState, useEffect } from 'react';
import { updateConfigAction, addWalkInAction } from '../actions';

// Iconos Minimalistas SVG
const Icons = {
  Grid: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Plus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  User: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
};

export default function AdminClient({ config, bookingsToday }: { config: any, bookingsToday: any[] }) {
  const [activeTab, setActiveTab] = useState('ops'); // 'ops' | 'config'
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Inicializar zonas
  useEffect(() => {
    try {
      setZones(JSON.parse(config.zones));
    } catch {
      setZones([]);
    }
  }, [config.zones]);

  // Cálculos en tiempo real
  const totalCapacity = zones.reduce((acc, z) => z.active ? acc + z.capacity : acc, 0);
  const totalReserved = bookingsToday.reduce((acc, b) => acc + b.pax, 0);
  const percentage = totalCapacity > 0 ? Math.round((totalReserved / totalCapacity) * 100) : 0;
  
  // Color dinámico de la barra
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-[#FF3B30]'; // Apple Red
    if (percentage >= 60) return 'bg-[#FF9500]'; // Apple Orange
    return 'bg-[#34C759]'; // Apple Green
  };

  // Manejar cambios en sliders localmente para que sea instantáneo
  const handleZoneChange = (index: number, field: string, value: any) => {
    const newZones = [...zones];
    newZones[index] = { ...newZones[index], [field]: value };
    setZones(newZones);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-[#1D1D1F] pb-32">
      
      {/* HEADER BLURROSO TIPO IOS */}
      <header className="sticky top-0 z-50 bg-[#F5F5F7]/80 backdrop-blur-xl border-b border-[#E5E5EA] px-6 py-4 flex justify-between items-center transition-all">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">{config.restaurant_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${config.service_mode === 'booking' ? 'bg-[#34C759]' : config.service_mode === 'waitlist' ? 'bg-[#FF9500]' : 'bg-[#FF3B30]'}`}></span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {config.service_mode === 'booking' ? 'Reservas Abiertas' : config.service_mode === 'waitlist' ? 'Lista de Espera' : 'Cerrado'}
            </span>
          </div>
        </div>
      </header>

      {/* NAVEGACIÓN TABS (SEGMENTED CONTROL) */}
      <div className="px-6 mt-6">
        <div className="bg-[#E5E5EA] p-1 rounded-xl flex shadow-inner">
          <button 
            onClick={() => setActiveTab('ops')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${activeTab === 'ops' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Operativa
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${activeTab === 'config' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Configuración
          </button>
        </div>
      </div>

      <main className="px-6 mt-6 space-y-6 max-w-lg mx-auto">
        
        {/* ================= VISTA OPERATIVA ================= */}
        {activeTab === 'ops' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* TARJETA 1: OCUPACIÓN EN TIEMPO REAL */}
            <section className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ocupación Hoy</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">{totalReserved}</span>
                    <span className="text-gray-400 font-medium">/ {totalCapacity} pax</span>
                  </div>
                </div>
                <div className={`text-xl font-bold px-3 py-1 rounded-lg bg-gray-50 ${percentage >= 90 ? 'text-[#FF3B30]' : 'text-black'}`}>
                  {percentage}%
                </div>
              </div>
              
              {/* Barra de Progreso Tesla Style */}
              <div className="w-full h-4 bg-[#F2F2F7] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor()} transition-all duration-1000 ease-out`} 
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
            </section>

            {/* TARJETA 2: WALK-IN (Formulario) */}
            <section className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3]">
                  <Icons.Plus />
                </div>
                <h2 className="text-lg font-bold">Llega Cliente (Sin Reserva)</h2>
              </div>

              <form action={async (formData) => {
                setLoading(true);
                await addWalkInAction(formData);
                setLoading(false);
              }} className="space-y-4">
                
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-gray-500 ml-1">Nombre</label>
                    <input name="name" placeholder="Ej: Mesa 4" required className="w-full bg-[#F5F5F7] border-none rounded-2xl px-4 py-3 text-base focus:ring-2 focus:ring-[#0071E3] transition-all" />
                  </div>
                  <div className="w-24 space-y-1">
                    <label className="text-xs font-semibold text-gray-500 ml-1">Pax</label>
                    <input name="pax" type="number" defaultValue="2" className="w-full bg-[#F5F5F7] border-none rounded-2xl px-4 py-3 text-base text-center focus:ring-2 focus:ring-[#0071E3] transition-all" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Teléfono (Opcional)</label>
                  <input name="phone" type="tel" placeholder="Para avisar por WhatsApp" className="w-full bg-[#F5F5F7] border-none rounded-2xl px-4 py-3 text-base focus:ring-2 focus:ring-[#0071E3] transition-all" />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#000000] text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Apuntando...' : 'Confirmar Mesa'}
                </button>
              </form>
            </section>
          </div>
        )}

        {/* ================= VISTA CONFIGURACIÓN ================= */}
        {activeTab === 'config' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <form action={updateConfigAction} className="space-y-6">
              <input type="hidden" name="id" value={config.id} />
              {/* Truco: Enviamos el estado local de zonas como JSON al server */}
              <input type="hidden" name="zonesJson" value={JSON.stringify(zones)} />

              {/* MODO DE SERVICIO */}
              <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Modo de Operación</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'booking', label: 'Reservas', icon: '📅', color: 'bg-[#34C759]' },
                    { val: 'waitlist', label: 'Espera', icon: '📝', color: 'bg-[#FF9500]' },
                    { val: 'closed', label: 'Cerrado', icon: '🔒', color: 'bg-[#FF3B30]' }
                  ].map((m) => (
                    <label key={m.val} className="cursor-pointer group relative">
                      <input type="radio" name="mode" value={m.val} defaultChecked={config.service_mode === m.val} className="peer hidden" />
                      <div className="h-24 rounded-2xl bg-[#F5F5F7] border-2 border-transparent peer-checked:border-black peer-checked:bg-white transition-all flex flex-col items-center justify-center gap-2">
                        <span className="text-2xl filter grayscale group-hover:grayscale-0 peer-checked:grayscale-0 transition-all">{m.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 peer-checked:text-black">{m.label}</span>
                      </div>
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${m.color} opacity-0 peer-checked:opacity-100 transition-opacity`}></div>
                    </label>
                  ))}
                </div>

                {/* AUTOMATIZACIÓN */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-semibold text-black">Auto-Switch Lista Espera</span>
                    <p className="text-xs text-gray-500">Hora automática de corte</p>
                  </div>
                  <input type="time" name="autoSwitch" defaultValue={config.auto_switch_time} className="bg-[#F5F5F7] rounded-lg px-3 py-2 text-sm font-medium border-none focus:ring-1 focus:ring-black" />
                </div>
              </section>

              {/* SLIDERS DE ZONAS */}
              <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-6">
                 <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inventario de Mesas</h2>
                 
                 {zones.map((zone, index) => (
                   <div key={index} className="group">
                     <div className="flex justify-between items-center mb-3">
                       <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${zone.active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                           <span className="text-lg">{index === 0 ? '🛋️' : index === 1 ? '☀️' : '🍻'}</span>
                         </div>
                         <span className={`font-semibold ${zone.active ? 'text-black' : 'text-gray-400'}`}>{zone.name}</span>
                       </div>
                       
                       {/* TOGGLE SWITCH REAL IOS STYLE */}
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={zone.active}
                            onChange={(e) => handleZoneChange(index, 'active', e.target.checked)}
                          />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                       </label>
                     </div>

                     <div className={`pl-[3.25rem] transition-all ${zone.active ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                          <span>Capacidad</span>
                          <span className="text-black">{zone.capacity} Mesas</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="50" 
                          value={zone.capacity}
                          onChange={(e) => handleZoneChange(index, 'capacity', Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" 
                        />
                     </div>
                   </div>
                 ))}
              </section>

              {/* TIEMPO ESPERA MANUAL */}
              {config.service_mode === 'waitlist' && (
                 <section className="bg-[#FFF8E6] rounded-[2rem] p-6 border border-[#FFE0B2] animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-[#B26500]">⏱️ Tiempo de espera estimado</span>
                      <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-1 shadow-sm">
                        <input name="waitTime" type="number" defaultValue={config.current_wait_time} className="w-10 text-center font-bold text-lg border-none focus:ring-0 p-0" />
                        <span className="text-xs text-gray-500 font-medium">min</span>
                      </div>
                    </div>
                 </section>
              )}

              <div className="sticky bottom-6 pt-4">
                <button type="submit" className="w-full bg-[#0071E3] text-white font-bold py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,113,227,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2">
                  <Icons.Settings />
                  <span>Guardar Cambios</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* NAVBAR INFERIOR (ESTILO APP NATIVA) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-8 pt-4 px-12 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('ops')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'ops' ? 'text-[#0071E3]' : 'text-gray-400'}`}>
          <Icons.Grid />
          <span className="text-[10px] font-bold tracking-widest">GESTIÓN</span>
        </button>
        <button onClick={() => setActiveTab('config')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'config' ? 'text-[#0071E3]' : 'text-gray-400'}`}>
          <Icons.Settings />
          <span className="text-[10px] font-bold tracking-widest">CONFIG</span>
        </button>
      </nav>

    </div>
  );
}