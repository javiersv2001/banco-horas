const { Pool } = require('pg');
require('dotenv').config();

// ===============================================
//  Script de utilidad: Eliminar usuario por correo
//  Uso:
//    node scripts/delete-user.js <email>
// ===============================================

// Conexión a la base de datos
const poolBD = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'banco_horas',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function eliminarUsuario(correo) {
  if (!correo || !correo.includes('@')) {
    console.error('❌ Debes proporcionar un correo válido');
    process.exit(1);
  }
  try {
    const res = await poolBD.query(
      'DELETE FROM users WHERE LOWER(email) = LOWER($1)',
      [correo]
    );
    console.log(`🗑️  Usuarios eliminados: ${res.rowCount}`);
  } catch (err) {
    console.error('❌ Error eliminando usuario:', err.message);
    process.exit(1);
  } finally {
    await poolBD.end();
  }
}

// Uso por línea de comandos
if (require.main === module) {
  const [correo] = process.argv.slice(2);
  eliminarUsuario(correo);
}

module.exports = { eliminarUsuario };
