/**
 * ===============================================
 *  Servidor Principal (Express)
 *  - Configura middlewares de seguridad (Helmet, CORS, Rate Limiting)
 *  - Expone endpoints API (/api/*)
 *  - Arranca el servidor tras verificar conexión a BD
 * ===============================================
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { conectarBD } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================================
//  Middlewares de Seguridad
// ===============================================
// Middleware de seguridad
app.use(helmet());

// Limitador de peticiones (Rate limiting)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: 'Demasiados intentos de autenticación, intente nuevamente más tarde.'
});

app.use(limiter);

// ===============================================
//  CORS (orígenes permitidos)
// ===============================================
// Configuración de CORS (orígenes permitidos)
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// ===============================================
//  Parseo de Cuerpo (JSON y Formularios)
// ===============================================
// Parseo de cuerpo de la petición (JSON y formularios)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (si se usan)
app.use(express.static('public'));

// ===============================================
//  Rutas
//  - /api/auth: autenticación y sesión (con rate limit específico)
// ===============================================
// Rutas de autenticación con limitador específico
app.use('/api/auth', authLimiter, authRoutes);

// Endpoint de verificación de salud del servicio
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Banco de Horas API'
    });
});

// ===============================================
//  Manejo de Errores
// ===============================================
/**
 * Middleware final de errores.
 * En producción oculta detalle de error.
 */
// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// ===============================================
//  404 (Ruta no encontrada)
// ===============================================
// Manejador 404 (ruta no encontrada)
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Endpoint no encontrado' });
});

// ===============================================
//  Inicio del Servidor
// ===============================================
/**
 * Inicia el servidor Express tras comprobar la conexión a la BD.
 * @returns {Promise<void>}
 */
// Inicia el servidor
async function startServer() {
    try {
        // Conectar a la base de datos
        await conectarBD();
        console.log('✅ Conexión a la base de datos establecida');
        
        app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
            console.log(`📊 Health check disponible en http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// ===============================================
//  Apagado Elegante (Graceful shutdown)
// ===============================================
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Cerrando servidor...');
    process.exit(0);
});

startServer();
