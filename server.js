// server.js — sirve tus HTML desde la raíz del repo y conecta a Postgres en Render
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { conectarBD } = require('./config/database'); // tu archivo de conexión

const app = express();
const PORT = process.env.PORT || 3000;

// seguridad y parsers
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1) Servir estáticos DESDE LA RAÍZ DEL REPO (porque tus html/css/js están ahí)
app.use(express.static(__dirname)); // <-- clave para que carguen /css y /js

// 2) Que "/" abra tu login (index.html en la raíz)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// (opcional) si tienes rutas como /register o /dashboard, sirve los html correspondientes:
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'forgot-password.html'));
});
app.get('/pin-verification', (req, res) => {
  res.sendFile(path.join(__dirname, 'pin-verification.html'));
});

// healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', at: new Date().toISOString() });
});

// arrancar después de conectar a BD
async function startServer() {
  try {
    await conectarBD(); // SELECT 1
    console.log('✅ Conectado a Postgres');
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
  } catch (err) {
    console.error('❌ No se pudo conectar a la BD:', err);
    process.exit(1);
  }
}
startServer();
