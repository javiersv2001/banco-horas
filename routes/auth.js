/**
 * ===============================================
 *  Rutas de Autenticación (Auth)
 *  - Login con validación de credenciales y envío de PIN
 *  - Verificación de PIN y emisión de token de sesión
 *  - Reenvío de PIN, verificación de sesión y logout
 *  - Recuperación de contraseña por correo
 * ===============================================
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { consultarBD, transaccionBD } = require('../config/database');
const { sendPinEmail, sendPasswordResetEmail } = require('../config/email');
const crypto = require('crypto');

const router = express.Router();

/**
 * Middleware: verifica token de LOGIN (previo a PIN).
 * Usa JWT_LOGIN_SECRET y espera payload con type: 'login'.
 */
const verifyLoginToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token de acceso requerido' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_LOGIN_SECRET);
        if (decoded?.type !== 'login') return res.status(401).json({ message: 'Token inválido' });
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

/**
 * Middleware: verifica token de SESIÓN (posterior a PIN).
 * Usa JWT_SECRET y espera payload con type: 'session'.
 */
const verifySessionToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token de acceso requerido' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.type !== 'session') return res.status(401).json({ message: 'Token inválido' });
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

/**
 * Genera un PIN aleatorio de 6 dígitos en formato string.
 * @returns {string}
 */
function generatePIN() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Genera un token hexadecimal seguro de 32 bytes para recuperación.
 * @returns {string}
 */
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /login
 * Valida credenciales, crea sesión temporal y envía PIN por email.
 * Body: { email, password }
 * Respuesta: { message, token } (token de login temporal)
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail().custom(value => {
        if (!value.endsWith('@pascualbravo.edu.co')) {
            throw new Error('Debe usar un correo del dominio @pascualbravo.edu.co');
        }
        return true;
    }),
    body('password').isLength({ min: 1 }).withMessage('La contraseña es requerida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Datos inválidos', 
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;

        // Buscar usuario por email
        const userResult = await consultarBD(
            'SELECT id, email, password_hash, name, is_active FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
            return res.status(401).json({ message: 'Cuenta desactivada' });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        // Generar PIN y token de login temporal (para verificación)
        const pin = generatePIN();
        const loginToken = jwt.sign(
            { userId: user.id, email: user.email, type: 'login' },
            process.env.JWT_LOGIN_SECRET,
            { expiresIn: '15m' }
        );

        const pinExpiresAt = new Date(Date.now() + (parseInt(process.env.PIN_EXPIRY_MINUTES) || 10) * 60 * 1000);
        const sessionExpiresAt = new Date(Date.now() + (parseInt(process.env.SESSION_EXPIRY_HOURS) || 24) * 60 * 60 * 1000);

        await transaccionBD(async (client) => {
            // Limpia verificaciones PIN anteriores de este usuario
            await client.query(
                'DELETE FROM pin_verifications WHERE user_id = $1',
                [user.id]
            );

            // Limpia sesiones de login anteriores de este usuario
            await client.query(
                'DELETE FROM login_sessions WHERE user_id = $1',
                [user.id]
            );

            // Crea nueva verificación PIN
            await client.query(
                'INSERT INTO pin_verifications (user_id, pin_code, expires_at) VALUES ($1, $2, $3)',
                [user.id, pin, pinExpiresAt]
            );

            // Crea nueva sesión de login temporal
            await client.query(
                'INSERT INTO login_sessions (user_id, login_token, expires_at) VALUES ($1, $2, $3)',
                [user.id, loginToken, sessionExpiresAt]
            );
        });

        // Enviar correo con el PIN
        try {
            await sendPinEmail(email, pin, user.name);
        } catch (emailError) {
            console.error('Error enviando correo de PIN:', emailError);
            return res.status(500).json({ message: 'Error enviando código de verificación' });
        }

        const includePin = (process.env.EMAIL_FAKE_MODE === 'true' || process.env.NODE_ENV === 'development');
        const payload = {
            message: 'PIN enviado al correo electrónico',
            token: loginToken
        };
        if (includePin) {
            payload.devPin = pin;
        }
        res.json(payload);

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * POST /verify-pin
 * Verifica PIN y emite token de sesión JWT.
 * Headers: Authorization: Bearer <loginToken>
 * Body: { email, pin }
 * Respuesta: { message, sessionToken, user }
 */
router.post('/verify-pin', [
    body('email').isEmail().normalizeEmail(),
    body('pin').isLength({ min: 6, max: 6 }).isNumeric()
], verifyLoginToken, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Datos inválidos', 
                errors: errors.array() 
            });
        }

        const { email, pin } = req.body;
        const userId = req.user.userId;

        // Verificar PIN
        const pinResult = await consultarBD(
            `SELECT pv.id, pv.expires_at, u.name 
             FROM pin_verifications pv 
             JOIN users u ON pv.user_id = u.id 
             WHERE pv.user_id = $1 AND pv.pin_code = $2 AND pv.is_used = false`,
            [userId, pin]
        );

        if (pinResult.rows.length === 0) {
            return res.status(401).json({ message: 'Código PIN incorrecto' });
        }

        const pinVerification = pinResult.rows[0];

        if (new Date() > new Date(pinVerification.expires_at)) {
            return res.status(401).json({ message: 'Código PIN expirado' });
        }

        // Generar token de sesión (JWT)
        const sessionToken = jwt.sign(
            { userId, email, type: 'session' },
            process.env.JWT_SECRET,
            { expiresIn: `${process.env.SESSION_EXPIRY_HOURS || 24}h` }
        );

        await transaccionBD(async (client) => {
            // Marcar PIN como usado
            await client.query(
                'UPDATE pin_verifications SET is_used = true, used_at = CURRENT_TIMESTAMP WHERE id = $1',
                [pinVerification.id]
            );

            // Actualizar sesión de login con el token de sesión
            await client.query(
                'UPDATE login_sessions SET session_token = $1, is_pin_verified = true, last_activity = CURRENT_TIMESTAMP WHERE user_id = $2',
                [sessionToken, userId]
            );

            // Actualizar último acceso del usuario
            await client.query(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [userId]
            );
        });

        res.json({
            message: 'Autenticación exitosa',
            sessionToken,
            user: {
                email,
                name: pinVerification.name
            }
        });

    } catch (error) {
        console.error('Error en verificación de PIN:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * POST /resend-pin
 * Genera y envía un nuevo PIN al correo del usuario.
 * Headers: Authorization: Bearer <loginToken>
 * Body: { email }
 */
router.post('/resend-pin', verifyLoginToken, async (req, res) => {
    try {
        const { email } = req.body;
        const userId = req.user.userId;

        // Obtener información del usuario
        const userResult = await consultarBD(
            'SELECT name FROM users WHERE id = $1 AND LOWER(email) = LOWER($2)',
            [userId, email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = userResult.rows[0];

        // Generate new PIN
        const pin = generatePIN();
        const pinExpiresAt = new Date(Date.now() + (parseInt(process.env.PIN_EXPIRY_MINUTES) || 10) * 60 * 1000);

        await transaccionBD(async (client) => {
            // Eliminar verificaciones de PIN antiguas
            await client.query(
                'DELETE FROM pin_verifications WHERE user_id = $1',
                [userId]
            );

            // Crear nueva verificación de PIN
            await client.query(
                'INSERT INTO pin_verifications (user_id, pin_code, expires_at) VALUES ($1, $2, $3)',
                [userId, pin, pinExpiresAt]
            );
        });

        // Send PIN email
        try {
            await sendPinEmail(email, pin, user.name);
        } catch (emailError) {
            console.error('Error sending PIN email:', emailError);
            return res.status(500).json({ message: 'Error enviando código de verificación' });
        }

        res.json({ message: 'Nuevo PIN enviado al correo electrónico' });

    } catch (error) {
        console.error('Error en reenvío de PIN:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * GET /verify-session
 * Valida si el usuario tiene una sesión activa y actualiza la última actividad.
 * Headers: Authorization: Bearer <sessionToken>
 */
router.get('/verify-session', verifySessionToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Validar si existe una sesión y está vigente
        const sessionResult = await consultarBD(
            `SELECT ls.session_token, u.name, u.email 
             FROM login_sessions ls 
             JOIN users u ON ls.user_id = u.id 
             WHERE ls.user_id = $1 AND ls.session_token IS NOT NULL AND ls.is_pin_verified = true AND ls.expires_at > CURRENT_TIMESTAMP`,
            [userId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(401).json({ message: 'Sesión inválida' });
        }

        const session = sessionResult.rows[0];

        // Actualizar última actividad
        await consultarBD(
            'UPDATE login_sessions SET last_activity = CURRENT_TIMESTAMP WHERE user_id = $1',
            [userId]
        );

        res.json({
            message: 'Sesión válida',
            user: {
                email: session.email,
                name: session.name
            }
        });

    } catch (error) {
        console.error('Error en verificación de sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * POST /logout
 * Elimina sesiones del usuario.
 * Headers: Authorization: Bearer <sessionToken>
 */
router.post('/logout', verifySessionToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Eliminar sesiones del usuario
        await consultarBD(
            'DELETE FROM login_sessions WHERE user_id = $1',
            [userId]
        );

        res.json({ message: 'Sesión cerrada exitosamente' });

    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * POST /forgot-password
 * Inicia flujo de recuperación de contraseña enviando un enlace al correo.
 * Body: { email }
 */
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail().custom(value => {
        if (!value.endsWith('@pascualbravo.edu.co')) {
            throw new Error('Debe usar un correo del dominio @pascualbravo.edu.co');
        }
        return true;
    })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                message: 'Datos inválidos', 
                errors: errors.array() 
            });
        }

        const { email } = req.body;

        // Buscar usuario activo por email
        const userResult = await consultarBD(
            'SELECT id, name FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true',
            [email]
        );

        if (userResult.rows.length === 0) {
            // Don't reveal if email exists or not
            return res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación' });
        }

        const user = userResult.rows[0];

        // Generar token de restablecimiento
        const resetToken = generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await transaccionBD(async (client) => {
            // Eliminar tokens de recuperación antiguos
            await client.query(
                'DELETE FROM password_reset_tokens WHERE user_id = $1',
                [user.id]
            );

            // Crear nuevo token de recuperación
            await client.query(
                'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                [user.id, resetToken, expiresAt]
            );
        });

        // Enviar correo con enlace de recuperación
        try {
            await sendPasswordResetEmail(email, resetToken, user.name);
        } catch (emailError) {
            console.error('Error enviando correo de recuperación:', emailError);
            return res.status(500).json({ message: 'Error enviando enlace de recuperación' });
        }

        res.json({ message: 'Si el correo está registrado, recibirás un enlace de recuperación' });

    } catch (error) {
        console.error('Error en recuperación de contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/**
 * POST /register
 * Crea un usuario nuevo con correo institucional.
 * Body: { name, email, password }
 */
router.post('/register', [
    body('name').isLength({ min: 2 }).withMessage('Nombre requerido'),
    body('email').isEmail().normalizeEmail().custom(value => {
        if (!value.endsWith('@pascualbravo.edu.co')) {
            throw new Error('Debe usar un correo del dominio @pascualbravo.edu.co');
        }
        return true;
    }),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Datos inválidos', errors: errors.array() });
        }

        const { name, email, password } = req.body;

        // Verificar si ya existe
        const existing = await consultarBD(
            'SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'El correo ya está registrado' });
        }

        // Hashear contraseña
        const hash = await bcrypt.hash(password, 12);

        // Insertar usuario
        await consultarBD(
            'INSERT INTO users (email, password_hash, name, is_active) VALUES ($1, $2, $3, true)',
            [email, hash, name]
        );

        return res.status(201).json({ message: 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
