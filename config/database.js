/**
 * ===============================================
 *  Módulo de Base de Datos (PostgreSQL)
 *  - Crea y administra un pool de conexiones
 *  - Expone utilidades para consultar y transaccionar
 * ===============================================
 */
const { Pool } = require('pg');

// ===============================================
//  Configuración de Base de Datos (PostgreSQL)
//  - Crea y administra un pool de conexiones
//  - Expone utilidades para consultar y transaccionar
// ===============================================

// Pool de conexiones a la base de datos
const poolBD = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'banco_horas',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // Ajustes de rendimiento del pool
    max: 20, // número máximo de conexiones simultáneas
    idleTimeoutMillis: 30000, // tiempo para cerrar conexiones inactivas
    connectionTimeoutMillis: 2000, // tiempo máximo de espera para conectar
});

/**
 * Verifica la conexión a la BD (útil al iniciar el servidor).
 * @returns {Promise<boolean>} true si conecta correctamente
 */
async function conectarBD() {
    try {
        const cliente = await poolBD.connect();
        console.log('✅ Conectado a PostgreSQL');
        cliente.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error);
        throw error;
    }
}

/**
 * Ejecuta una consulta SQL simple usando el pool.
 * Registra duración y número de filas afectadas.
 * @param {string} textoSQL - Texto de la consulta parametrizada
 * @param {any[]} [parametros] - Parámetros de la consulta
 * @returns {Promise<import('pg').QueryResult>} Resultado de la consulta
 */
async function consultarBD(textoSQL, parametros) {
    const inicio = Date.now();
    try {
        const resultado = await poolBD.query(textoSQL, parametros);
        const duracion = Date.now() - inicio;
        console.log('▶️ Consulta ejecutada', { texto: textoSQL, duracion, filas: resultado.rowCount });
        return resultado;
    } catch (error) {
        console.error('❌ Error en consulta a la base de datos:', error);
        throw error;
    }
}

/**
 * Ejecuta una transacción BEGIN/COMMIT/ROLLBACK.
 * El callback recibe un cliente transaccional para ejecutar queries.
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>} Resultado del callback si hace COMMIT
 */
async function transaccionBD(callback) {
    const cliente = await poolBD.connect();
    try {
        await cliente.query('BEGIN');
        const resultado = await callback(cliente);
        await cliente.query('COMMIT');
        return resultado;
    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;
    } finally {
        cliente.release();
    }
}

module.exports = {
    poolBD,
    consultarBD,
    transaccionBD,
    conectarBD
};
