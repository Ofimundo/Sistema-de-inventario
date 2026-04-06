// backend/server.js - VERSIÓN CORREGIDA
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const bodegaRoutes = require('./routes/bodegaRoutes');
const historialRoutes = require('./routes/historialRoutes');
const asignacionRoutes = require('./routes/asignacionRoutes');
const exportRoutes = require('./routes/exportRoutes');
const estadosRoutes = require('./routes/estadosRoutes');
const documentoRoutes = require('./routes/documentoRoutes');
const usuariosRoutes = require('./routes/usuarios');
const colaboradorRoutes = require('./routes/colaboradorRoutes');

const app = express();

// ============ CONFIGURACIÓN DE FILEUPLOAD ============
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
    createParentPath: true,
    useTempFiles: false,
    debug: true
}));

// ============ CONFIGURACIÓN CORS ============
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
    console.log(`\n📌 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        if (req.headers['content-type']?.includes('multipart/form-data')) {
            console.log('📦 Content-Type: multipart/form-data');
            if (req.files) console.log('📎 Archivos recibidos:', Object.keys(req.files));
        } else {
            if (req.body && Object.keys(req.body).length > 0) {
                const logBody = { ...req.body };
                if (logBody.password) logBody.password = '***';
                if (logBody.contraseña) logBody.contraseña = '***';
                console.log('📦 Body:', logBody);
            }
        }
    }
    next();
});

// ============ SERVIDOR DE ARCHIVOS ESTÁTICOS ============
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ RUTAS PÚBLICAS (SIN AUTENTICACIÓN) ============
app.get('/', (req, res) => {
    res.json({ success: true, message: '🚀 Servidor de Bodega-App funcionando', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: '✅ API funcionando correctamente', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' });
});

// ============ RUTAS DE AUTENTICACIÓN (públicas) ============
app.use('/api/auth', authRoutes);

// ============ IMPORTAR MIDDLEWARE DE AUTENTICACIÓN ============
const { authenticateToken } = require('./middleware/auth');

// ============ RUTAS PROTEGIDAS (requieren autenticación) ============
console.log('📌 Configurando rutas protegidas...');

// Rutas de asignaciones (la ruta /descargar será pública por el middleware)
app.use('/api/asignaciones', authenticateToken, asignacionRoutes);

// Las demás rutas protegidas
app.use('/api/productos', authenticateToken, productoRoutes);
app.use('/api/bodegas', authenticateToken, bodegaRoutes);
app.use('/api/historial', authenticateToken, historialRoutes);
app.use('/api/export', authenticateToken, exportRoutes);
app.use('/api/estados', authenticateToken, estadosRoutes);
app.use('/api/documentos', authenticateToken, documentoRoutes);
app.use('/api/usuarios', authenticateToken, usuariosRoutes);
app.use('/api/colaboradores', authenticateToken, colaboradorRoutes);
app.use('/api/export', exportRoutes);

// ============ MANEJO DE ERRORES 404 ============
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada', path: req.originalUrl, method: req.method });
});

// ============ MANEJO DE ERRORES GENERAL ============
app.use((err, req, res, next) => {
    console.error('❌ Error del servidor:', err.stack);
    res.status(500).json({ success: false, message: err.message || 'Error interno del servidor' });
});

// ============ INICIO DEL SERVIDOR ============
const { getConnection } = require('./config/database');
const PORT = process.env.PORT || 5000;

getConnection().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('\n=================================');
        console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
        console.log(`📡 Local: http://localhost:${PORT}`);
        console.log('=================================\n');
    });
}).catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
    process.exit(1);
});