// backend/config/database.js
const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    server: process.env.DB_SERVER || 'PACMAN\\OFIMUNDO_DEV',
    database: process.env.DB_DATABASE || 'THE_COOLER_SGCX',
    user: process.env.DB_USER || 'marrano',
    password: process.env.DB_PASSWORD ||'ma*576394' ,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        requestTimeout: 60000, // 60 segundos
        connectionTimeout: 60000 // 60 segundos
    },
    pool: {
        max: 20,
        min: 5,
        idleTimeoutMillis: 60000
    }
};

let pool;

async function getConnection() {
    try {
        if (pool && pool.connected) {
            return pool;
        }
        
        console.log('🔄 Conectando a SQL Server...');
        console.log(`📌 Servidor: ${dbConfig.server}`);
        console.log(`📌 Base de datos: ${dbConfig.database}`);
        
        pool = await sql.connect(dbConfig);
        console.log('✅ Conectado a THE_COOLER_SGCX');
        return pool;
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        throw error;
    }
}


module.exports = {
    getConnection,
    sql
};