// lib/db.ts
import postgres from 'postgres';

// Leemos la URL del archivo .env.local
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('❌ FATAL: No has configurado DATABASE_URL en .env.local');
}

// Creamos la conexión
const sql = postgres(connectionString, {
  ssl: 'require',
});

export default sql;