const nodemailer = require('nodemailer');

// ===============================================
//  Servicio de Correo (Nodemailer)
//  - Envía correos de verificación de PIN
//  - Envía correos de recuperación de contraseña
//  Nota: Se usa configuración SMTP desde variables de entorno
// ===============================================

/**
 * Crea un transportador SMTP usando variables de entorno.
 * @returns {import('nodemailer').Transporter}
 */
// Crear transportador de correo (SMTP)
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

/**
 * Envía un correo con el PIN de verificación al usuario.
 * En modo desarrollo (EMAIL_FAKE_MODE=true o NODE_ENV=development),
 * no envía correo: registra el PIN en consola y devuelve true.
 * @param {string} email - Correo del destinatario
 * @param {string} pin - Código PIN de 6 dígitos
 * @param {string} [userName] - Nombre del usuario para personalizar el saludo
 * @returns {Promise<boolean>} true si el correo se envió correctamente
 */
// Enviar correo de verificación de PIN
async function sendPinEmail(email, pin, userName = '') {
    if (process.env.EMAIL_FAKE_MODE === 'true' || process.env.NODE_ENV === 'development') {
        console.log(`[FAKE_EMAIL] PIN para ${email}: ${pin}`);
        return true;
    }
    const transporter = createTransporter();
    
    const mailOptions = {
        from: `"Banco de Horas" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Código de Verificación - Banco de Horas',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a202c; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #0b2b5c 0%, #114b8a 100%); color: #ffffff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .pin-code { background: #114b8a; color: #ffffff; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; margin: 20px 0; letter-spacing: 5px; }
                    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Banco de Horas</h1>
                        <p>Institución Universitaria Pascual Bravo</p>
                    </div>
                    <div class="content">
                        <h2>Código de Verificación</h2>
                        <p>Hola${userName ? ` ${userName}` : ''},</p>
                        <p>Has solicitado acceso al sistema Banco de Horas. Para completar tu inicio de sesión, utiliza el siguiente código de verificación:</p>
                        
                        <div class="pin-code">${pin}</div>
                        
                        <div class="warning">
                            <strong>⚠️ Importante:</strong>
                            <ul>
                                <li>Este código expira en 10 minutos</li>
                                <li>No compartas este código con nadie</li>
                                <li>Si no solicitaste este código, ignora este mensaje</li>
                            </ul>
                        </div>
                        
                        <p>Si tienes problemas para acceder, contacta al administrador del sistema.</p>
                    </div>
                    <div class="footer">
                        <p>Este es un mensaje automático, no responder a este correo.</p>
                        <p>&copy; ${new Date().getFullYear()} Institución Universitaria Pascual Bravo</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo de PIN enviado a ${email}`);
        return true;
    } catch (error) {
        console.error('Error enviando correo de PIN:', error);
        throw error;
    }
}

/**
 * Envía un correo con enlace de recuperación de contraseña.
 * En modo desarrollo (EMAIL_FAKE_MODE=true o NODE_ENV=development),
 * no envía correo: registra la URL de restablecimiento y devuelve true.
 * @param {string} email - Correo del destinatario
 * @param {string} resetToken - Token de recuperación para construir la URL
 * @param {string} [userName] - Nombre del usuario para personalizar el saludo
 * @returns {Promise<boolean>} true si el correo se envió correctamente
 */
// Enviar correo de recuperación de contraseña
async function sendPasswordResetEmail(email, resetToken, userName = '') {
    const resetUrl = `http://localhost:3000/reset-password.html?token=${resetToken}`;
    if (process.env.EMAIL_FAKE_MODE === 'true' || process.env.NODE_ENV === 'development') {
        console.log(`[FAKE_EMAIL] URL de restablecimiento para ${email}: ${resetUrl}`);
        return true;
    }
    const transporter = createTransporter();
    
    const mailOptions = {
        from: `"Banco de Horas" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Recuperación de Contraseña - Banco de Horas',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1a202c; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #0b2b5c 0%, #114b8a 100%); color: #ffffff; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #114b8a; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Banco de Horas</h1>
                        <p>Institución Universitaria Pascual Bravo</p>
                    </div>
                    <div class="content">
                        <h2>Recuperación de Contraseña</h2>
                        <p>Hola${userName ? ` ${userName}` : ''},</p>
                        <p>Has solicitado recuperar tu contraseña para el sistema Banco de Horas. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
                        
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                        </div>
                        
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
                        
                        <div class="warning">
                            <strong>⚠️ Importante:</strong>
                            <ul>
                                <li>Este enlace expira en 1 hora</li>
                                <li>Solo puedes usar este enlace una vez</li>
                                <li>Si no solicitaste este cambio, ignora este mensaje</li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Este es un mensaje automático, no responder a este correo.</p>
                        <p>&copy; ${new Date().getFullYear()} Institución Universitaria Pascual Bravo</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo de recuperación enviado a ${email}`);
        return true;
    } catch (error) {
        console.error('Error enviando correo de recuperación:', error);
        throw error;
    }
}

module.exports = {
    sendPinEmail,
    sendPasswordResetEmail
};
