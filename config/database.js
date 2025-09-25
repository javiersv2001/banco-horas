/**
 * ===============================================
 * Conexión a PostgreSQL (pg / Pool)
 * - Usa DATABASE_URL (Render → Environment)
 * - Fuerza SSL para Render
 * ===============================================
 */
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,     // ej: postgresql://user:pass@host:5432/db?sslmode=require
  ssl: { rejectUnauthorized: false }              // necesario en Render
});

// Test de conexión
async function conectarBD() {
  // Si falla, lanza error y el server no arranca
  await pool.query('SELECT 1');
}

module.exports = { pool, conectarBD };
