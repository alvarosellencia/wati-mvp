'use client';

import { useState, useEffect } from 'react';
import { updateConfigAction, addWalkInAction, deleteBookingAction } from '../actions';

// --- ICONOS UI/UX 2026 (Minimalistas & Tech) ---
const Icons = {
  Live: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M22 12h-2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></svg>,
  Calendar: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>,
  Chart: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  Settings: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Trash: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  PlusCircle: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
};

export default function AdminClient({ config, bookings, bookingsToday }: { config: any, bookings: any[], bookingsToday: any[] }) {
  const [activeTab, setActiveTab] = useState('ops'); // 'ops' | 'reservas' | 'analytics' | 'config'
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Inicializar zonas (con estructura nueva si no existe)
  useEffect(() => {
    try {
      const parsed = JSON.parse(config.zones);
      // Aseguramos que tengan los campos nuevos
      const modernized = parsed.map((z: any) => ({
        ...z,
        tablesCount: z.tablesCount || 1, 
        paxPerTable: z.paxPerTable || z.capacity || 4 // Default a lo que hubiera o 4
      }));
      setZones(modernized);
    } catch {
      setZones([]);
    }
  }, [config.zones]);

  // CÁLCULOS REALES (Ahora basados en Pax Totales = Mesas * Sillas)
  const totalCapacityPax = zones.reduce((acc, z) => z.active ? acc + (z.tablesCount * z.paxPerTable) : acc, 0);
  const totalReservedPax = bookingsToday.reduce((acc, b) => acc + b.pax, 0);
  const percentage = totalCapacityPax > 0 ? Math.round((totalReservedPax / totalCapacityPax) * 100) : 0;
  
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // --- GESTIÓN DE ZONAS (Añadir/Quitar/Editar) ---
  const handleZoneChange = (index: number, field: string, value: any) => {
    const newZones = [...zones];
    newZones[index] = { ...newZones[index], [field]: value };
    setZones(newZones);
  };

  const addZone = () => {
    setZones([...zones, { name: 'Nueva Zona', active: true, tablesCount: 5, paxPerTable: 4, type: 'indoor' }]);
  };

  const removeZone = (index: number) => {
    const newZones = zones.filter((_, i) => i !== index);
    setZones(newZones);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans text-gray-900 pb-24">
      
      {/* HEADER SIMPLE */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{config.restaurant_name}</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${config.service_mode === 'booking' ? 'bg-emerald-500' : config.service_mode === 'waitlist' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
            <span className="text-xs font-medium text-gray-500 uppercase">{config.service_mode}</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs">A</div>
      </header>

      <main className="px-5 mt-6 space-y-6 max-w-xl mx-auto">
        
        {/* ================= 1. OPERATIVA (LIVE) ================= */}
        {activeTab === 'ops' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
            
            {/* KPI OCUPACIÓN */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ocupación Real</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">{totalReservedPax}</span>
                    <span className="text-gray-400 font-medium">/ {totalCapacityPax} usuarios</span>
                  </div>
                </div>
                <div className="text-xl font-bold">{percentage}%</div>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${getProgressColor()} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
              </div>
            </section>

            {/* WALK-IN */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Icons.PlusCircle /></span>
                Llegada sin Reserva
              </h2>
              <form action={async (formData) => { setLoading(true); await addWalkInAction(formData); setLoading(false); }} className="space-y-4">
                <div className="flex gap-3">
                  <input name="name" placeholder="Nombre cliente" required className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" />
                  <input name="pax" type="number" defaultValue="2" className="w-20 bg-gray-50 border-none rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all">
                  {loading ? '...' : 'Asignar Mesa'}
                </button>
              </form>
            </section>

            {/* LISTA RESERVAS HOY (LO QUE PEDÍAS) */}
            <section>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 ml-2">Reservas Hoy</h3>
              <div className="space-y-2">
                {bookingsToday.length === 0 ? <p className="text-center text-gray-400 py-4">Sin reservas activas</p> : 
                  bookingsToday.map(b => (
                    <div key={b.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="font-mono font-bold bg-gray-100 px-2 py-1 rounded text-sm">{b.booking_time.slice(0,5)}</div>
                        <div>
                          <p className="font-bold text-sm">{b.client_name}</p>
                          <p className="text-xs text-gray-500">👥 {b.pax} pax • {b.notes || 'Web'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         {b.client_phone && <a href={`https://wa.me/${b.client_phone}`} target="_blank" className="bg-green-100 text-green-600 p-2 rounded-full text-xs font-bold">WA</a>}
                         <button onClick={() => deleteBookingAction(b.id)} className="bg-red-50 text-red-500 p-2 rounded-full"><Icons.Trash /></button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </section>
          </div>
        )}

        {/* ================= 2. RESERVAS (HISTÓRICO) ================= */}
        {activeTab === 'reservas' && (
           <div className="space-y-4">
             <h2 className="text-2xl font-bold px-2">Listado Global</h2>
             {bookings.map(b => (
                <div key={b.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex justify-between">
                   <div>
                      <div className="text-xs font-bold text-blue-600 uppercase mb-1">{new Date(b.booking_date).toLocaleDateString()}</div>
                      <div className="font-bold text-lg">{b.client_name}</div>
                      <div className="text-sm text-gray-500">Hora: {b.booking_time} • {b.pax} Personas</div>
                   </div>
                   <div className="flex flex-col justify-center gap-2">
                      <button onClick={() => deleteBookingAction(b.id)} className="text-red-500 bg-red-50 px-3 py-1 rounded-lg text-xs font-bold">Cancelar</button>
                   </div>
                </div>
             ))}
             {bookings.length === 0 && <div className="text-center py-20 text-gray-400">No hay historial disponible</div>}
           </div>
        )}

        {/* ================= 3. ANALÍTICA ================= */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 col-span-2">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Total Reservas (Histórico)</h3>
                <p className="text-4xl font-extrabold">{bookings.length}</p>
             </div>
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Pax Promedio</h3>
                <p className="text-2xl font-bold">
                  {bookings.length > 0 ? (bookings.reduce((a,b)=>a+b.pax,0)/bookings.length).toFixed(1) : 0}
                </p>
             </div>
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Hora Punta</h3>
                <p className="text-2xl font-bold">21:00</p>
             </div>
          </div>
        )}

        {/* ================= 4. CONFIGURACIÓN (ESPACIOS) ================= */}
        {activeTab === 'config' && (
          <form action={updateConfigAction} className="space-y-8 pb-10">
            <input type="hidden" name="id" value={config.id} />
            <input type="hidden" name="zonesJson" value={JSON.stringify(zones)} />

            {/* MODO */}
            <section className="bg-white rounded-3xl p-5 shadow-sm">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Modo Servicio</h2>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                 {['booking','waitlist','closed'].map(m => (
                    <label key={m} className={`flex-1 text-center py-3 rounded-lg text-sm font-bold cursor-pointer transition-all ${config.service_mode === m ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>
                       <input type="radio" name="mode" value={m} defaultChecked={config.service_mode===m} className="hidden"/>
                       {m === 'booking' ? 'Reservas' : m === 'waitlist' ? 'Lista Espera' : 'Cerrado'}
                    </label>
                 ))}
              </div>
            </section>

            {/* CONSTRUCTOR DE ESPACIOS */}
            <section className="space-y-4">
              <div className="flex justify-between items-center px-2">
                 <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Espacios y Mesas</h2>
                 <button type="button" onClick={addZone} className="text-blue-600 text-xs font-bold flex items-center gap-1">+ AÑADIR ESPACIO</button>
              </div>

              {zones.map((zone, idx) => (
                <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative group">
                  <div className="flex justify-between items-start mb-4">
                     <input 
                        value={zone.name} 
                        onChange={(e) => handleZoneChange(idx, 'name', e.target.value)}
                        className="font-bold text-lg bg-transparent border-b border-transparent focus:border-gray-200 outline-none w-2/3"
                     />
                     <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={zone.active} onChange={(e) => handleZoneChange(idx, 'active', e.target.checked)} />
                          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        </label>
                        <button type="button" onClick={() => removeZone(idx)} className="text-red-400 hover:text-red-600"><Icons.Trash /></button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-gray-50 p-3 rounded-2xl">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Número de Mesas</label>
                        <div className="flex items-center gap-2">
                           <input type="number" value={zone.tablesCount} onChange={(e) => handleZoneChange(idx, 'tablesCount', Number(e.target.value))} className="w-full bg-transparent font-bold text-xl outline-none" />
                           <span className="text-xs text-gray-400">unid.</span>
                        </div>
                     </div>
                     <div className="bg-gray-50 p-3 rounded-2xl">
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Capacidad Mesa</label>
                        <div className="flex items-center gap-2">
                           <input type="number" value={zone.paxPerTable} onChange={(e) => handleZoneChange(idx, 'paxPerTable', Number(e.target.value))} className="w-full bg-transparent font-bold text-xl outline-none" />
                           <span className="text-xs text-gray-400">pax</span>
                        </div>
                     </div>
                  </div>
                  <div className="mt-2 text-right">
                     <span className="text-xs font-bold text-gray-400">Total Zona: {zone.tablesCount * zone.paxPerTable} pax</span>
                  </div>
                </div>
              ))}
            </section>
            
            <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-lg sticky bottom-24 z-10">Guardar Cambios</button>
          </form>
        )}
      </main>

      {/* NAVBAR NATIVO 4 PESTAÑAS */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-8 pt-3 px-6 flex justify-between items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
        {[
          { id: 'ops', icon: <Icons.Live />, label: 'Operativa' },
          { id: 'reservas', icon: <Icons.Calendar />, label: 'Reservas' },
          { id: 'analytics', icon: <Icons.Chart />, label: 'Analítica' },
          { id: 'config', icon: <Icons.Settings />, label: 'Config' }
        ].map(item => (
           <button 
             key={item.id} 
             onClick={() => setActiveTab(item.id)}
             className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === item.id ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
           >
             {item.icon}
             <span className="text-[9px] font-bold tracking-widest uppercase">{item.label}</span>
           </button>
        ))}
      </nav>
    </div>
  );
}