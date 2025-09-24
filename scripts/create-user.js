const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// ===============================================
//  Script de utilidad: Crear usuario desde la CLI
//  Uso:
//    node scripts/create-user.js <email> <password> "Nombre Completo"
// ===============================================

/**
 * Crea un usuario con correo institucional y contraseña hasheada.
 * Valida que el correo pertenezca al dominio @pascualbravo.edu.co.
 * @param {string} correo - Correo institucional del usuario
 * @param {string} contraseña - Contraseña en texto plano
 * @param {string} nombre - Nombre completo del usuario
 * @returns {Promise<void>}
 */

// Conexión a la base de datos
const poolBD = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'banco_horas',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Crea un usuario con email institucional, contraseña hasheada y nombre
async function crearUsuario(correo, contraseña, nombre) {
    try {
        // Validar dominio del correo institucional
        if (!correo.endsWith('@pascualbravo.edu.co')) {
            throw new Error('El email debe ser del dominio @pascualbravo.edu.co');
        }

        // Hashear contraseña (12 rondas por defecto)
        const hashContraseña = await bcrypt.hash(contraseña, 12);

        // Insertar usuario en la base de datos
        const cliente = await poolBD.connect();
        const resultado = await cliente.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [correo, hashContraseña, nombre]
        );

        cliente.release();
        
        console.log('✅ Usuario creado exitosamente:');
        console.log(`📧 Email: ${resultado.rows[0].email}`);
        console.log(`👤 Nombre: ${resultado.rows[0].name}`);
        console.log(`🆔 ID: ${resultado.rows[0].id}`);

    } catch (error) {
        if (error.code === '23505') {
            console.error('❌ Error: El email ya está registrado');
        } else {
            console.error('❌ Error creando usuario:', error.message);
        }
    } finally {
        await poolBD.end();
    }
}

// Uso por línea de comandos
/**
 * Permite ejecutar el script directamente desde Node.js
 * Ejemplo:
 *   node scripts/create-user.js estudiante@pascualbravo.edu.co password123 "Juan Pérez"
 */
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
        console.log('Uso: node scripts/create-user.js <email> <password> "Nombre Completo"');
        console.log('Ejemplo: node scripts/create-user.js estudiante@pascualbravo.edu.co password123 "Juan Pérez"');
        process.exit(1);
    }

    const [correo, contraseña, nombre] = args;
    crearUsuario(correo, contraseña, nombre);
}

module.exports = { crearUsuario };
