const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Conexión a la base de datos
const poolBD = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'banco_horas',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Script de inicialización: crea el esquema y un usuario administrador por defecto
async function configurarBaseDatos() {
    console.log('🔧 Configurando base de datos...');
    
    try {
        // Probar conexión
        const cliente = await poolBD.connect();
        console.log('✅ Conexión a PostgreSQL establecida');
        
        // Leer y ejecutar schema SQL
        const rutaSchema = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(rutaSchema, 'utf8');
        
        await cliente.query(schema);
        console.log('✅ Esquema de base de datos creado');
        
        // Crear usuario administrador por defecto
        const emailAdmin = 'admin@pascualbravo.edu.co';
        const passwordAdmin = 'admin123'; // Cambiar en producción
        const nombreAdmin = 'Administrador Sistema';
        
        const hashAdmin = await bcrypt.hash(passwordAdmin, 12);
        
        try {
            await cliente.query(
                'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)',
                [emailAdmin, hashAdmin, nombreAdmin]
            );
            console.log('✅ Usuario administrador creado');
            console.log(`📧 Email: ${emailAdmin}`);
            console.log(`🔑 Contraseña: ${passwordAdmin}`);
            console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
        } catch (error) {
            if (error.code === '23505') { // Violación de restricción única
                console.log('ℹ️  Usuario administrador ya existe');
            } else {
                throw error;
            }
        }
        
        cliente.release();
        console.log('🎉 Base de datos configurada correctamente');
        
    } catch (error) {
        console.error('❌ Error configurando base de datos:', error);
        process.exit(1);
    } finally {
        await poolBD.end();
    }
}

// Ejecutar si se llama directamente desde la CLI
if (require.main === module) {
    configurarBaseDatos();
}

module.exports = { configurarBaseDatos };
