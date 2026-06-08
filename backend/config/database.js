// backend/config/database.js - VERSIÓN CORREGIDA PARA SQL SERVER
const sql = require("mssql");
require("dotenv").config();

// Configuración para conectar a la máquina virtual
const dbConfig = {
  server: process.env.DB_SERVER || "54.167.124.101",  // ← IP de tu máquina virtual
  port: Number(process.env.DB_PORT) || 1433,          // ← Puerto de SQL Server es 1433, no 5000
  database: process.env.DB_DATABASE || "THE_COOLER_SGCX",
  user: process.env.DB_USER || "user_inventario",     // ← El usuario que creaste
  password: process.env.DB_PASSWORD || "65&Mh54h@W3(", // ← La contraseña que me diste
  options: {
    encrypt: false,                    // Si no usas SSL
    trustServerCertificate: true,      // Confiar en el certificado del servidor
    enableArithAbort: true,
    requestTimeout: 60000,             // 60 segundos
    connectionTimeout: 60000,          // 60 segundos
  },
  pool: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 60000,
  },
};

let pool;

async function getConnection() {
  try {
    if (pool && pool.connected) {
      console.log("♻️ Reutilizando conexión existente");
      return pool;
    }

    console.log("=================================");
    console.log("🔄 Conectando a SQL Server...");
    console.log(`📌 Servidor: ${dbConfig.server}:${dbConfig.port}`);
    console.log(`📌 Base de datos: ${dbConfig.database}`);
    console.log(`📌 Usuario: ${dbConfig.user}`);
    console.log("=================================");

    pool = await sql.connect(dbConfig);
    console.log("✅ Conectado exitosamente a THE_COOLER_SGCX");
    console.log("=================================\n");
    return pool;
  } catch (error) {
    console.error("❌ Error de conexión a la base de datos:");
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Servidor: ${dbConfig.server}:${dbConfig.port}`);
    
    // Errores comunes y sus soluciones
    if (error.code === 'ECONNREFUSED') {
      console.error("\n💡 POSIBLE SOLUCIÓN:");
      console.error("   El servidor no está accesible. Verifica:");
      console.error("   1. Que la máquina virtual esté encendida");
      console.error("   2. Que el puerto 1433 esté abierto en el firewall");
      console.error("   3. Que SQL Server permita conexiones remotas");
    } else if (error.code === 'ELOGIN') {
      console.error("\n💡 POSIBLE SOLUCIÓN:");
      console.error("   Error de autenticación. Verifica:");
      console.error("   1. Usuario y contraseña correctos");
      console.error("   2. Que el usuario tenga permisos de acceso remoto");
    }
    
    throw error;
  }
}

// Función para cerrar la conexión (útil para graceful shutdown)
async function closeConnection() {
  try {
    if (pool && pool.connected) {
      await pool.close();
      console.log("🔒 Conexión a base de datos cerrada");
    }
  } catch (error) {
    console.error("❌ Error cerrando conexión:", error);
  }
}

// Manejar cierre graceful de la aplicación
process.on('SIGINT', async () => {
  console.log('\n⚠️ Recibida señal SIGINT, cerrando conexiones...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Recibida señal SIGTERM, cerrando conexiones...');
  await closeConnection();
  process.exit(0);
});

module.exports = {
  getConnection,
  closeConnection,
  sql,
};