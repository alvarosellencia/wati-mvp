'use client'; // 👈 ESTO ES LA CLAVE. Permite interactividad.

import { useRouter, useSearchParams } from 'next/navigation';

export default function DateSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Cogemos la fecha de la URL o usamos HOY si no hay ninguna
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  return (
    <div className="relative group">
      <input 
        type="date" 
        defaultValue={date}
        onChange={(e) => {
           // Al cambiar la fecha, recargamos la página con la nueva fecha
           router.push(`/?date=${e.target.value}`);
        }}
        className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 pl-10 text-white scheme-dark cursor-pointer focus:outline-none focus:border-blue-500 transition-colors appearance-none"
      />
      {/* Icono decorativo */}
      <div className="absolute left-3 top-3.5 text-gray-400 pointer-events-none group-hover:text-blue-400 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      </div>
    </div>
  );
}