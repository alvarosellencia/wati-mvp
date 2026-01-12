'use client';

import { useState, useEffect } from 'react';
import { updateConfigAction, addWalkInAction, deleteBookingAction, updateBookingAction } from '../actions';

// --- ICONOS ---
const Icons: any = {
  Live: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Calendar: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  Chart: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  Settings: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Trash: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Plus: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Edit: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  ArrowRight: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  
  // Iconos de Espacios
  'room': (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M5 20v-8"/><path d="M19 20v-8"/><path d="M10 16v4"/><path d="M14 16v4"/></svg>,
  'sun': (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  'beer': (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6"/><path d="M13 12v6"/><path d="M14 5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2h8Z"/><path d="M6 7h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z"/></svg>,
  'sofa': (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/></svg>,
  'tree': (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19v3"/><path d="M12 19c-3 0-5.5-2-5.5-5.5S12 5 12 5s5.5 5 5.5 8.5c0 3.5-2.5 5.5-5.5 5.5Z"/></svg>,
};

const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = Icons[name] || Icons['room'];
  return <IconComponent className={className} />;
};

const DAYS_OF_WEEK = [
  { id: 1, label: 'L' }, // Lunes
  { id: 2, label: 'M' },
  { id: 3, label: 'X' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 0, label: 'D' }, // Domingo
];

export default function AdminClient({ config, bookings, bookingsToday }: { config: any, bookings: any[], bookingsToday: any[] }) {
  const [activeTab, setActiveTab] = useState('ops');
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [localMode, setLocalMode] = useState(config.service_mode);
  
  // Estado para días cerrados (Array de números 0-6)
  const [closedDays, setClosedDays] = useState<number[]>([]);

  // Modals
  const [isZoneEditorOpen, setIsZoneEditorOpen] = useState(false);
  const [isBookingEditorOpen, setIsBookingEditorOpen] = useState(false);
  
  const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);
  const [zoneData, setZoneData] = useState({ name: '', tablesCount: 5, paxPerTable: 4, active: true, icon: 'room' });
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    try {
      // Parsear zonas
      const parsedZones = JSON.parse(config.zones);
      setZones(parsedZones.map((z: any) => ({ ...z, icon: z.icon || 'room' })));
      
      // Parsear días cerrados
      const parsedDays = JSON.parse(config.closed_days || '[]');
      setClosedDays(parsedDays);
    } catch {
      setZones([]);
      setClosedDays([]);
    }
  }, [config.zones, config.closed_days]);

  // KPIs y Lógica
  const totalCapacityPax = zones.reduce((acc, z) => z.active ? acc + (z.tablesCount * z.paxPerTable) : acc, 0);
  const totalReservedPax = bookingsToday.reduce((acc, b) => acc + b.pax, 0);
  const percentage = totalCapacityPax > 0 ? Math.round((totalReservedPax / totalCapacityPax) * 100) : 0;
  
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
    if (percentage >= 60) return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]';
    return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]';
  };

  // --- HANDLERS ---
  const toggleClosedDay = (dayId: number) => {
    if (closedDays.includes(dayId)) {
      setClosedDays(closedDays.filter(d => d !== dayId));
    } else {
      setClosedDays([...closedDays, dayId]);
    }
  };

  const openZoneEditor = (index: number | null) => {
    if (index !== null) {
      setEditingZoneIndex(index);
      setZoneData(zones[index]);
    } else {
      setEditingZoneIndex(null);
      setZoneData({ name: '', tablesCount: 5, paxPerTable: 4, active: true, icon: 'room' });
    }
    setIsZoneEditorOpen(true);
  };

  const saveZone = () => {
    const newZones = [...zones];
    if (editingZoneIndex !== null) newZones[editingZoneIndex] = zoneData;
    else newZones.push(zoneData);
    setZones(newZones);
    setIsZoneEditorOpen(false);
  };

  const removeZone = (index: number) => {
    if (confirm('¿Eliminar espacio?')) {
      const newZones = zones.filter((_, i) => i !== index);
      setZones(newZones);
    }
  };

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
                  <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">OCUPACIÓN REAL</h2>
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

            {/* AÑADIR PRESENCIAL */}
            <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Icons.Plus className="w-5 h-5"/></span>
                Cliente de Paso (Presencial)
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
                <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] hover:bg-gray-800 transition-all flex justify-center items-center gap-2 text-sm">
                  {loading ? 'Guardando...' : 'Apuntar en Lista'}
                </button>
              </form>
            </section>

            {/* LISTA HOY */}
            <section>
              <div className="flex justify-between items-center px-2 mb-3">
                 <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">En Curso</h3>
                 <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-md">{bookingsToday.length}</span>
              </div>
              
              <div className="space-y-3">
                {bookingsToday.length === 0 ? (
                  <div className="text-center py-10 opacity-50 border-2 border-dashed border-gray-200 rounded-3xl">
                    <p className="text-sm font-medium text-gray-400">Sala vacía</p>
                  </div>
                ) : (
                  bookingsToday.map(b => (
                    <div key={b.id} onClick={() => openBookingEditor(b)} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-[0_2px_8px_rgb(0,0,0,0.02)] border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center bg-gray-50 w-12 h-12 rounded-xl border border-gray-100">
                           <span className="text-xs font-bold text-gray-900">{b.booking_time.slice(0,5)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{b.client_name}</p>
                          <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                            👥 {b.pax} <span className="text-gray-300">|</span> {b.notes || 'Web'}
                          </p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300">
                        <Icons.Edit className="w-4 h-4"/>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* ================= 2. RESERVAS (HISTÓRICO) ================= */}
        {activeTab === 'reservas' && (
           <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="flex justify-between items-center px-2 mb-2">
                <h2 className="text-xl font-bold">Histórico</h2>
                <div className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-500">Total: {bookings.length}</div>
             </div>
             
             {bookings.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No hay historial disponible aún.</div>
             ) : (
               bookings.map(b => (
                  <div key={b.id} onClick={() => openBookingEditor(b)} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start cursor-pointer active:scale-[0.99] transition-transform">
                     <div>
                        <div className="inline-block bg-blue-50 text-blue-600 text-[10px] font-bold uppercase px-2 py-1 rounded-md mb-2">
                          {new Date(b.booking_date).toLocaleDateString()}
                        </div>
                        <div className="font-bold text-lg text-gray-900">{b.client_name}</div>
                        <div className="text-sm text-gray-500 mt-1">Hora: {b.booking_time} • {b.pax} Pax</div>
                     </div>
                     <div className="text-gray-300 pt-2"><Icons.Edit className="w-4 h-4" /></div>
                  </div>
               ))
             )}
           </div>
        )}

        {/* ================= 3. ANALÍTICA ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <h2 className="text-xl font-bold px-2">Datos Clave</h2>
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Pax Totales</h3>
                <p className="text-4xl font-extrabold">{bookings.reduce((a,b)=>a+b.pax,0)}</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Reservas</h3>
                  <p className="text-2xl font-bold">{bookings.length}</p>
               </div>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-gray-500 text-xs font-bold uppercase mb-2">Promedio</h3>
                  <p className="text-2xl font-bold">{bookings.length > 0 ? Math.round(bookings.reduce((a,b)=>a+b.pax,0)/bookings.length) : 0} pax</p>
               </div>
             </div>
          </div>
        )}

        {/* ================= 4. CONFIGURACIÓN ================= */}
        {activeTab === 'config' && (
          <form action={updateConfigAction} className="space-y-6 pb-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <input type="hidden" name="id" value={config.id} />
            <input type="hidden" name="mode" value={localMode} />
            <input type="hidden" name="zonesJson" value={JSON.stringify(zones)} />
            <input type="hidden" name="closedDays" value={JSON.stringify(closedDays)} />

            {/* DÍAS DE CIERRE */}
            <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Días de Descanso (Cerrado)</h2>
              <div className="flex justify-between items-center gap-1">
                 {DAYS_OF_WEEK.map(day => (
                    <button
                       key={day.id}
                       type="button"
                       onClick={() => toggleClosedDay(day.id)}
                       className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${closedDays.includes(day.id) ? 'bg-gray-900 text-white shadow-lg scale-110' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                    >
                       {day.label}
                    </button>
                 ))}
              </div>
            </section>

            {/* AUTOMATIZACIÓN DOBLE TURNO (RANGOS) */}
            <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Automatización de Flujo</h2>
              
              <div className="space-y-6">
                {/* Turno Mediodía */}
                <div className="space-y-2">
                   <div className="flex items-center gap-2 mb-1">
                      <Icons.Live className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-gray-900">Turno Mediodía</span>
                   </div>
                   <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Inicio Espera</label>
                        <input type="time" name="lunchStart" defaultValue={config.lunch_start} className="w-full bg-transparent font-bold text-gray-900 border-none p-0 focus:ring-0" />
                      </div>
                      <Icons.ArrowRight className="w-4 h-4 text-gray-300" />
                      <div className="flex-1 text-right">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Cierre Cocina</label>
                        <input type="time" name="lunchEnd" defaultValue={config.lunch_end} className="w-full bg-transparent font-bold text-gray-900 border-none p-0 focus:ring-0 text-right" />
                      </div>
                   </div>
                </div>

                {/* Turno Noche */}
                <div className="space-y-2">
                   <div className="flex items-center gap-2 mb-1">
                      <Icons.Live className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-gray-900">Turno Noche</span>
                   </div>
                   <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Inicio Espera</label>
                        <input type="time" name="dinnerStart" defaultValue={config.dinner_start} className="w-full bg-transparent font-bold text-gray-900 border-none p-0 focus:ring-0" />
                      </div>
                      <Icons.ArrowRight className="w-4 h-4 text-gray-300" />
                      <div className="flex-1 text-right">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Cierre Cocina</label>
                        <input type="time" name="dinnerEnd" defaultValue={config.dinner_end} className="w-full bg-transparent font-bold text-gray-900 border-none p-0 focus:ring-0 text-right" />
                      </div>
                   </div>
                </div>

                {/* Tiempo medio */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl mt-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm">⏳</div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">Tiempo Medio Estancia</p>
                        <p className="text-[10px] text-gray-400">Para calcular esperas</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <input type="number" name="avgDiningTime" defaultValue={config.avg_booking_duration || 45} className="w-12 bg-transparent text-right font-bold text-gray-900 border-none focus:ring-0 p-0" />
                     <span className="text-xs font-bold text-gray-400">min</span>
                   </div>
                </div>
              </div>
            </section>

            {/* CONTROL MANUAL */}
            <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
               <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Override Manual</h2>
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
                      className={`py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${localMode === m.id ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
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
                <div key={idx} onClick={() => openZoneEditor(idx)} className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer active:scale-[0.99] transition-transform">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-gray-900 bg-gray-50`}>
                        <DynamicIcon name={zone.icon} className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="font-bold text-sm text-gray-900">{zone.name}</h3>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">{zone.tablesCount} Mesas x {zone.paxPerTable} Pax</p>
                      </div>
                   </div>
                   <div className="text-gray-300 pr-2"><Icons.Edit className="w-4 h-4"/></div>
                </div>
              ))}
            </section>
            
            <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-xl sticky bottom-24 z-10 flex justify-center gap-2 items-center hover:scale-[1.01] transition-transform">
               <span>Guardar Configuración</span>
            </button>
          </form>
        )}
      </main>

      {/* NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-8 pt-2 px-6 flex justify-between items-center z-50">
        {[
          { id: 'ops', IconComponent: Icons.Live, label: 'Operativa' },
          { id: 'reservas', IconComponent: Icons.Calendar, label: 'Reservas' },
          { id: 'analytics', IconComponent: Icons.Chart, label: 'Data' },
          { id: 'config', IconComponent: Icons.Settings, label: 'Config' }
        ].map(item => (
           <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl transition-all ${activeTab === item.id ? 'text-black' : 'text-gray-300 hover:text-gray-500'}`}>
             <item.IconComponent className="w-6 h-6" />
             <span className="text-[9px] font-bold tracking-widest uppercase scale-90">{item.label}</span>
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
                 <button onClick={() => { deleteBookingAction(bookingData.id); setIsBookingEditorOpen(false); }} className="p-3 bg-red-50 rounded-full text-red-500 hover:bg-red-100">
                    <Icons.Trash className="w-5 h-5" />
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

      {/* ================= MODAL: EDITAR ZONA (Con Selector Iconos) ================= */}
      {isZoneEditorOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsZoneEditorOpen(false)}></div>
           <div className="relative bg-white w-full max-w-md p-6 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6"></div>
              <h2 className="text-lg font-bold text-gray-900 mb-6">{editingZoneIndex !== null ? 'Editar Espacio' : 'Nuevo Espacio'}</h2>
              
              <div className="space-y-4">
                 <div className="bg-gray-50 rounded-2xl px-4 py-3">
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Nombre</label>
                    <input value={zoneData.name} onChange={(e) => setZoneData({...zoneData, name: e.target.value})} placeholder="Ej: Terraza" className="w-full bg-transparent font-bold text-lg outline-none" />
                 </div>

                 {/* SELECTOR DE ICONOS */}
                 <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase block mb-2 ml-1">Icono</label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                       {['room', 'sun', 'beer', 'sofa', 'tree'].map(iconName => (
                          <button 
                            key={iconName} 
                            onClick={() => setZoneData({...zoneData, icon: iconName})}
                            className={`p-3 rounded-2xl border-2 transition-all ${zoneData.icon === iconName ? 'border-black bg-gray-900 text-white' : 'border-transparent bg-gray-50 text-gray-400'}`}
                          >
                             <DynamicIcon name={iconName} className="w-6 h-6" />
                          </button>
                       ))}
                    </div>
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
                 
                 <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
                   {editingZoneIndex !== null && <button onClick={() => { removeZone(editingZoneIndex); setIsZoneEditorOpen(false); }} className="p-4 rounded-2xl bg-red-50 text-red-500 font-bold"><Icons.Trash className="w-5 h-5"/></button>}
                   <button onClick={saveZone} className="flex-1 bg-black text-white font-bold py-4 rounded-2xl hover:scale-[1.02] transition-transform">Guardar</button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}