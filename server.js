/**
 * ===============================================
 * Servidor Principal (Express) – Banco de Horas
 * - Lee PORT de Render (process.env.PORT)
 * - Conecta a PostgreSQL vía DATABASE_URL
 * - Sirve / (ping) y /api/health
 * ===============================================
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

require('dotenv').config(); // local: .env; en Render usa Environment Vars
const { conectarBD } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad y parseo
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Estáticos (opcional si tienes /public)
app.use(express.static('public'));

// Rutas mínimas
app.get('/', (req, res) => {
  res.send('Banco de Horas funcionando ✅');
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', at: new Date().toISOString() });
});

// Arranque
async function startServer() {
  try {
    await conectarBD(); // prueba SELECT 1
    console.log('✅ Conectado a Postgres');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('❌ No se pudo conectar a la BD:', err);
    process.exit(1);
  }
}

// Apagado elegante
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

startServer();
