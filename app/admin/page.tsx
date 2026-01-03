import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

export default async function AdminPage() {
  // 1. Leemos la configuración actual
  const configs = await sql`SELECT * FROM config LIMIT 1`;
  const config = configs[0];

  // 2. Esta función se ejecuta en el SERVIDOR cuando le das a Guardar
  async function updateConfig(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const schedule = formData.get('schedule') as string;
    const closed = formData.get('closed') as string;
    const tables = formData.get('tables') as string;

    await sql`
      UPDATE config 
      SET restaurant_name = ${name}, 
          schedule = ${schedule}, 
          closed_days = ${closed},
          total_tables = ${tables}
      WHERE id = ${config.id}
    `;

    revalidatePath('/admin'); // Refresca la página
    revalidatePath('/'); // Refresca la home
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>⚙️ Configuración del Restaurante</h1>
      <p>Aquí mandas tú. Lo que pongas aquí, Paco lo obedecerá.</p>

      <form action={updateConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
        
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Nombre del Local</label>
          <input name="name" defaultValue={config.restaurant_name} style={{ width: '100%', padding: '10px', fontSize: '16px' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Horario (Texto libre)</label>
          <textarea name="schedule" defaultValue={config.schedule} rows={3} style={{ width: '100%', padding: '10px', fontSize: '16px' }} />
          <small>Ej: Martes a Domingo de 13:00 a 23:00</small>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Días Cerrados</label>
          <input name="closed" defaultValue={config.closed_days} style={{ width: '100%', padding: '10px', fontSize: '16px' }} />
          <small>Ej: Lunes</small>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Total de Mesas</label>
          <input type="number" name="tables" defaultValue={config.total_tables} style={{ width: '100%', padding: '10px', fontSize: '16px' }} />
        </div>

        <button type="submit" style={{ padding: '15px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}>
          💾 Guardar Cambios
        </button>
      </form>
    </div>
  );
}