// backend/server.js - VERSIÓN COMPLETA CORREGIDA CON LOGS DE DEPURACIÓN
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
require('dotenv').config();

// Crear app UNA SOLA VEZ
const app = express();

// ============================================
// CONFIGURACIÓN CORS (DEFINIR PRIMERO)
// ============================================
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5500',
        'https://main.d23vw4mszg17gc.amplifyapp.com',
        'https://*.amplifyapp.com',
        'https://sistema-inventario-backend-p3xg.onrender.com'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// APLICAR CORS (UNA SOLA VEZ)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================================
// CONFIGURACIÓN DE FILEUPLOAD
// ============================================
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
    createParentPath: true,
    useTempFiles: false,
    debug: true
}));

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware (para depuración)
app.use((req, res, next) => {
    console.log(`\n📌 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        if (req.headers['content-type']?.includes('multipart/form-data')) {
            if (req.files) console.log('📎 Archivos recibidos:', Object.keys(req.files));
        } else {
            if (req.body && Object.keys(req.body).length > 0) {
                const logBody = { ...req.body };
                if (logBody.password) logBody.password = '***';
                if (logBody.contraseña) logBody.contraseña = '***';
                if (logBody.currentPassword) logBody.currentPassword = '***';
                if (logBody.newPassword) logBody.newPassword = '***';
                console.log('📦 Body:', logBody);
            }
        }
    }
    next();
});

// ============================================
// MIDDLEWARE DE DEPURACIÓN ESPECÍFICO PARA CHANGE-PASSWORD
// ============================================
app.use('/api/auth/change-password', (req, res, next) => {
    console.log('🔥🔥🔥 [DEPURACIÓN] Petición a /api/auth/change-password 🔥🔥🔥');
    console.log('📝 Method:', req.method);
    console.log('📝 Authorization Header:', req.headers.authorization ? 'PRESENTE' : 'AUSENTE');
    if (req.headers.authorization) {
        console.log('📝 Token (primeros 30 chars):', req.headers.authorization.substring(0, 30) + '...');
    }
    console.log('📝 Body:', req.body);
    next();
});

// ============================================
// SERVIDOR DE ARCHIVOS ESTÁTICOS
// ============================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ============================================
app.get('/', (req, res) => {
    res.json({ success: true, message: '🚀 Servidor de Bodega-App funcionando', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
    res.json({ success: true, message: '✅ API funcionando correctamente', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' });
});

// RUTA BASE PARA /api
app.get('/api', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API funcionando correctamente',
        endpoints: {
            productos: '/api/productos',
            bodegas: '/api/bodegas',
            colaboradores: '/api/colaboradores',
            asignaciones: '/api/asignaciones',
            auth: '/api/auth',
            export: '/api/export',
            'change-password': '/api/auth/change-password'
        }
    });
});

// ============================================
// IMPORTAR RUTAS
// ============================================
const authRoutes = require('./routes/authRoutes');
const productosRoutes = require('./routes/productoRoutes');
const bodegaRoutes = require('./routes/bodegaRoutes');
const historialRoutes = require('./routes/historialRoutes');
const asignacionRoutes = require('./routes/asignacionRoutes');
const exportRoutes = require('./routes/exportRoutes');
const estadosRoutes = require('./routes/estadosRoutes');
const documentoRoutes = require('./routes/documentoRoutes');
const usuariosRoutes = require('./routes/usuarios');
const colaboradorRoutes = require('./routes/colaboradorRoutes');
const colaboradorController = require('./controllers/colaboradorController');

// ============================================
// RUTAS DE AUTENTICACIÓN (públicas - SIN authenticateToken)
// ============================================
console.log('🔧 Montando rutas de autenticación en /api/auth');
app.use('/api/auth', authRoutes);
console.log('✅ Rutas de autenticación montadas correctamente');

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN (para rutas protegidas)
// ============================================
const { authenticateToken } = require('./middleware/auth');

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================
console.log('📌 Configurando rutas protegidas...');

app.use('/api/asignaciones', authenticateToken, asignacionRoutes);
app.use('/api/productos', authenticateToken, productosRoutes);
app.use('/api/bodegas', authenticateToken, bodegaRoutes);
app.use('/api/historial', authenticateToken, historialRoutes);
app.use('/api/export', authenticateToken, exportRoutes);
app.use('/api/estados', authenticateToken, estadosRoutes);
app.use('/api/documentos', authenticateToken, documentoRoutes);
app.use('/api/usuarios', authenticateToken, usuariosRoutes);
app.use('/api/colaboradores', authenticateToken, colaboradorRoutes);

// Ruta adicional para empresas
app.get('/api/colaboradores/empresas', authenticateToken, colaboradorController.getEmpresas);

console.log('✅ Todas las rutas protegidas configuradas');

// ============================================
// RUTA DE PRUEBA PARA VERIFICAR QUE EL ENDPOINT EXISTE
// ============================================
app.post('/api/auth/change-password-test', (req, res) => {
    console.log('🔥🔥🔥 [TEST] Endpoint de prueba change-password-test funcionando 🔥🔥🔥');
    console.log('📝 Body:', req.body);
    console.log('📝 Authorization Header:', req.headers.authorization);
    res.json({ 
        success: true, 
        message: 'Endpoint de prueba funciona correctamente',
        recibido: {
            body: req.body,
            authHeader: req.headers.authorization ? 'PRESENTE' : 'AUSENTE'
        }
    });
});

// ============================================
// MANEJO DE ERRORES 404
// ============================================
app.use('*', (req, res) => {
    console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        success: false, 
        message: 'Ruta no encontrada', 
        path: req.originalUrl, 
        method: req.method 
    });
});

// ============================================
// MANEJO DE ERRORES GENERAL
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Error del servidor:', err.stack);
    res.status(500).json({ success: false, message: err.message || 'Error interno del servidor' });
});

// ============================================
// INICIO DEL SERVIDOR
// ============================================
const { getConnection } = require('./config/database');
const PORT = process.env.PORT || 5000;

getConnection().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('\n=================================');
        console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
        console.log(`📡 Local: http://localhost:${PORT}`);
        console.log(`📍 CORS habilitado para múltiples orígenes`);
        console.log(`📌 Endpoints disponibles:`);
        console.log(`   - /api/productos (productos)`);
        console.log(`   - /api/bodegas (bodegas)`);
        console.log(`   - /api/colaboradores (colaboradores)`);
        console.log(`   - /api/asignaciones (asignaciones)`);
        console.log(`   - /api/auth/change-password (cambiar contraseña)`);
        console.log(`   - /api/auth/change-password-test (test)`);
        console.log('=================================\n');
    });
}).catch(err => {
    console.error('❌ Error al conectar a la base de datos:', err);
    process.exit(1);
});