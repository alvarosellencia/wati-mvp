'use client';

import { useState, useEffect } from 'react';
import { updateConfigAction, addWalkInAction, deleteBookingAction, updateBookingAction } from '../actions';

// --- ICONOS ULTRA-MINIMALISTAS 2026 ---
const Icons = {
  Live: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, // Reloj simple para operativa
  Calendar: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  Chart: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  Settings: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Trash: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>, // Papelera limpia
  Plus: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Edit: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Close: () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6 18 18"/></svg>,
  Clock: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
};

export default function AdminClient({ config, bookings, bookingsToday }: { config: any, bookings: any[], bookingsToday: any[] }) {
  const [activeTab, setActiveTab] = useState('ops');
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [localMode, setLocalMode] = useState(config.service_mode);
  
  // Modals de Edición
  const [isZoneEditorOpen, setIsZoneEditorOpen] = useState(false);
  const [isBookingEditorOpen, setIsBookingEditorOpen] = useState(false);
  
  // Datos para editores
  const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);
  const [zoneData, setZoneData] = useState({ name: '', tablesCount: 5, paxPerTable: 4, active: true });
  const [bookingData, setBookingData] = useState<any>(null); // Reserva siendo editada

  useEffect(() => {
    try {
      const parsed = JSON.parse(config.zones);
      setZones(parsed);
    } catch {
      setZones([]);
    }
  }, [config.zones]);

  // --- CÁLCULOS INTELIGENTES ---
  const totalCapacityPax = zones.reduce((acc, z) => z.active ? acc + (z.tablesCount * z.paxPerTable) : acc, 0);
  const totalReservedPax = bookingsToday.reduce((acc, b) => acc + b.pax, 0);
  const percentage = totalCapacityPax > 0 ? Math.round((totalReservedPax / totalCapacityPax) * 100) : 0;
  
  // Cálculo de espera estimado: (Grupos en espera * tiempo medio) / Mesas totales (Simplificado)
  // Asumimos que cada reserva ocupa 1 mesa
  const totalTables = zones.reduce((acc, z) => z.active ? acc + z.tablesCount : acc, 0);
  const activeBookingsCount = bookingsToday.length;
  // Si estamos llenos, el siguiente tarda aprox: (Tiempo medio comer / Mesas totales)
  const estimatedWaitPerTable = totalTables > 0 ? Math.round(Number(config.avg_booking_duration || 45) / totalTables) : 15;
  // Si hay cola, sumamos. Esto es una estimación para el dueño.
  const currentQueueWait = percentage >= 100 ? estimatedWaitPerTable * (activeBookingsCount - totalTables + 1) : 0;

  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // --- HANDLERS ZONAS ---
  const openZoneEditor = (index: number | null) => {
    if (index !== null) {
      setEditingZoneIndex(index);
      setZoneData(zones[index]);
    } else {
      setEditingZoneIndex(null);
      setZoneData({ name: '', tablesCount: 5, paxPerTable: 4, active: true });
    }
    setIsZoneEditorOpen(true);
  };

  const saveZone = () => {
    const newZones = [...zones];
    if (editingZoneIndex !== null) {
      newZones[editingZoneIndex] = zoneData;
    } else {
      newZones.push(zoneData);
    }
    setZones(newZones);
    setIsZoneEditorOpen(false);
  };

  const removeZone = (index: number) => {
    if (confirm('¿Eliminar espacio?')) {
      const newZones = zones.filter((_, i) => i !== index);
      setZones(newZones);
    }
  };

  // --- HANDLERS RESERVAS ---
  const openBookingEditor = (booking: any) => {
    setBookingData(booking);
    setIsBookingEditorOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900 pb-28">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">{config.restaurant_name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`w-2 h-2 rounded-full animate-pulse ${localMode === 'booking' ? 'bg-emerald-500' : localMode === 'waitlist' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
               {localMode === 'booking' ? 'Reservas ON' : localMode === 'waitlist' ? 'Lista Espera' : 'Cerrado'}
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
          BM
        </div>
      </header>

      <main className="px-5 mt-6 space-y-6 max-w-xl mx-auto">
        
        {/* ================= 1. OPERATIVA ================= */}
        {activeTab === 'ops' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* KPI OCUPACIÓN */}
            <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="flex justify-between items-end mb-4 relative z-10">
                <div>
                  <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">OCUPACIÓN</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tighter text-gray-900">{totalReservedPax}</span>
                    <span className="text-sm font-medium text-gray-400">/ {totalCapacityPax} pax</span>
                  </div>
                </div>
                <div className="text-right">
                   <div className="text-xl font-bold text-gray-900">{percentage}%</div>
                   {percentage >= 90 && <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full">Completo</div>}
                </div>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative z-10">
                <div className={`h-full ${getProgressColor()} transition-all duration-1000 ease-out rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
              </div>
            </section>

            {/* AÑADIR CLIENTE DE PASO */}
            <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Icons.Plus /></span>
                Cliente de paso
              </h2>
              <form action={async (formData) => { setLoading(true); await addWalkInAction(formData); setLoading(false); }} className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Nombre</label>
                    <input name="name" placeholder="Ej: Mesa 5" required className="w-full bg-transparent outline-none font-semibold text-gray-900 placeholder-gray-300 text-sm" />
                  </div>
                  <div className="w-24 bg-gray-50 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Pax</label>
                    <input name="pax" type="number" defaultValue="2" className="w-full bg-transparent outline-none font-bold text-gray-900 text-center text-sm" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] hover:bg-black transition-all flex justify-center items-center gap-2 text-sm">
                  {loading ? '...' : 'Apuntar en Mesa'}
                </button>
              </form>
            </section>

            {/* LISTA RESERVAS HOY (EDITABLE) */}
            <section>
              <div className="flex justify-between items-center px-2 mb-3">
                 <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">En Sala / Espera</h3>
                 <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md">{bookingsToday.length}</span>
              </div>
              
              <div className="space-y-3">
                {bookingsToday.map(b => (
                  <div key={b.id} onClick={() => openBookingEditor(b)} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center bg-gray-50 w-12 h-12 rounded-xl border border-gray-100 group-hover:border-blue-200 transition-colors">
                         <span className="text-xs font-bold text-gray-900">{b.booking_time.slice(0,5)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{b.client_name}</p>
                        <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                          👥 {b.pax} <span className="text-gray-300">|</span> {b.notes || 'Web'}
                        </p>
                      </div>
                    </div>
                    {/* Icono Lápiz sutil */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300">
                      <Icons.Edit />
                    </div>
                  </div>
                ))}
                {bookingsToday.length === 0 && <p className="text-center text-gray-300 text-xs py-4">Sala vacía</p>}
              </div>
            </section>
          </div>
        )}

        {/* ================= 2. CONFIGURACIÓN ================= */}
        {activeTab === 'config' && (
          <form action={updateConfigAction} className="space-y-6 pb-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <input type="hidden" name="id" value={config.id} />
            <input type="hidden" name="mode" value={localMode} />
            <input type="hidden" name="zonesJson" value={JSON.stringify(zones)} />

            {/* AUTOMATIZACIÓN (NUEVO DISEÑO) */}
            <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Automatización de Cola</h2>
              
              <div className="space-y-4">
                {/* Switch automático */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm"><Icons.Clock /></div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Activar Lista de Espera a las...</p>
                        <p className="text-[10px] text-gray-400">Antes de esta hora, se aceptan reservas.</p>
                      </div>
                   </div>
                   <input type="time" name="autoSwitch" defaultValue={config.auto_switch_time} className="bg-transparent text-right font-bold text-gray-900 border-none focus:ring-0" />
                </div>

                {/* Tiempo medio */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">⏳</div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Tiempo Medio Estancia</p>
                        <p className="text-[10px] text-gray-400">Para calcular tiempo de espera.</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <input type="number" name="avgDiningTime" defaultValue={config.avg_booking_duration || 45} className="w-12 bg-transparent text-right font-bold text-gray-900 border-none focus:ring-0 p-0" />
                     <span className="text-xs font-bold text-gray-400">min</span>
                   </div>
                </div>
              </div>
            </section>

            {/* MODO MANUAL (OVERRIDE) */}
            <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
               <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Control Manual (Forzar)</h2>
               <div className="grid grid-cols-3 gap-2">
                 {[
                    { id: 'booking', label: 'Reservas' },
                    { id: 'waitlist', label: 'Espera' },
                    { id: 'closed', label: 'Cerrado' }
                 ].map((m) => (
                    <button 
                      key={m.id}
                      type="button" 
                      onClick={() => setLocalMode(m.id)}
                      className={`py-3 rounded-xl text-xs font-bold uppercase transition-all ${localMode === m.id ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                       {m.label}
                    </button>
                 ))}
              </div>
            </section>

            {/* ESPACIOS */}
            <section className="space-y-4">
              <div className="flex justify-between items-center px-2">
                 <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mis Espacios</h2>
                 <button type="button" onClick={() => openZoneEditor(null)} className="text-blue-600 text-[10px] font-bold bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                   + CREAR
                 </button>
              </div>
              {zones.map((zone, idx) => (
                <div key={idx} onClick={() => openZoneEditor(idx)} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer active:scale-[0.99] transition-transform">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${zone.active ? 'bg-gray-900 text-white' : 'bg-gray-50 grayscale opacity-50'}`}>
                        {idx === 0 ? '🛋️' : '🔭'}
                      </div>
                      <div>
                         <h3 className="font-bold text-sm text-gray-900">{zone.name}</h3>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">{zone.tablesCount} Mesas x {zone.paxPerTable} Pax</p>
                      </div>
                   </div>
                   <div className="text-gray-300"><Icons.Edit /></div>
                </div>
              ))}
            </section>
            
            <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-xl sticky bottom-24 z-10">Guardar Cambios</button>
          </form>
        )}
      </main>

      {/* NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-8 pt-2 px-8 flex justify-between items-center z-50">
        {[
          { id: 'ops', icon: <Icons.Live />, label: 'Operativa' },
          { id: 'reservas', icon: <Icons.Calendar />, label: 'Reservas' },
          { id: 'analytics', icon: <Icons.Chart />, label: 'Data' },
          { id: 'config', icon: <Icons.Settings />, label: 'Config' }
        ].map(item => (
           <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center gap-1 w-14 transition-colors ${activeTab === item.id ? 'text-black' : 'text-gray-300'}`}>
             {item.icon}
             <span className="text-[9px] font-bold tracking-widest uppercase">{item.label}</span>
           </button>
        ))}
      </nav>

      {/* ================= MODAL: EDITAR RESERVA ================= */}
      {isBookingEditorOpen && bookingData && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsBookingEditorOpen(false)}></div>
           <div className="relative bg-white w-full max-w-md p-6 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6"></div>
              
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-gray-900">Editar Reserva</h2>
                 <button onClick={() => { deleteBookingAction(bookingData.id); setIsBookingEditorOpen(false); }} className="p-2 bg-red-50 rounded-full text-red-500 hover:bg-red-100">
                    <Icons.Trash />
                 </button>
              </div>

              <form action={async (formData) => { await updateBookingAction(formData); setIsBookingEditorOpen(false); }} className="space-y-4">
                 <input type="hidden" name="id" value={bookingData.id} />
                 
                 <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3 bg-gray-50 rounded-2xl px-4 py-3">
                       <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Nombre</label>
                       <input name="name" defaultValue={bookingData.client_name} className="w-full bg-transparent font-bold text-gray-900 outline-none" />
                    </div>
                    <div className="bg-gray-50 rounded-2xl px-2 py-3">
                       <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1 text-center">Pax</label>
                       <input name="pax" type="number" defaultValue={bookingData.pax} className="w-full bg-transparent font-bold text-gray-900 outline-none text-center" />
                    </div>
                 </div>

                 <div className="bg-gray-50 rounded-2xl px-4 py-3">
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Hora</label>
                    <input name="time" type="time" defaultValue={bookingData.booking_time} className="w-full bg-transparent font-bold text-gray-900 outline-none" />
                 </div>
                 
                 <div className="bg-gray-50 rounded-2xl px-4 py-3">
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Notas</label>
                    <input name="notes" defaultValue={bookingData.notes} className="w-full bg-transparent font-medium text-gray-600 outline-none text-sm" />
                 </div>

                 <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-2xl mt-2">Guardar Cambios</button>
              </form>
           </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR ZONA (Reutilizado pero mejorado) ================= */}
      {isZoneEditorOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsZoneEditorOpen(false)}></div>
           <div className="relative bg-white w-full max-w-md p-6 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6"></div>
              <h2 className="text-lg font-bold text-gray-900 mb-6">{editingZoneIndex !== null ? 'Editar Espacio' : 'Nuevo Espacio'}</h2>
              
              <div className="space-y-4">
                 <div className="bg-gray-50 rounded-2xl px-4 py-3">
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Nombre</label>
                    <input value={zoneData.name} onChange={(e) => setZoneData({...zoneData, name: e.target.value})} placeholder="Ej: Terraza" className="w-full bg-transparent font-bold text-lg outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-2xl px-4 py-3">
                       <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Mesas</label>
                       <input type="number" value={zoneData.tablesCount} onChange={(e) => setZoneData({...zoneData, tablesCount: Number(e.target.value)})} className="w-full bg-transparent font-bold text-xl outline-none" />
                    </div>
                    <div className="bg-gray-50 rounded-2xl px-4 py-3">
                       <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Pax/Mesa</label>
                       <input type="number" value={zoneData.paxPerTable} onChange={(e) => setZoneData({...zoneData, paxPerTable: Number(e.target.value)})} className="w-full bg-transparent font-bold text-xl outline-none" />
                    </div>
                 </div>
                 
                 <div className="flex gap-3 pt-4">
                   {editingZoneIndex !== null && <button onClick={() => { removeZone(editingZoneIndex); setIsZoneEditorOpen(false); }} className="p-4 rounded-2xl bg-red-50 text-red-500 font-bold"><Icons.Trash /></button>}
                   <button onClick={saveZone} className="flex-1 bg-black text-white font-bold py-4 rounded-2xl">Guardar</button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}