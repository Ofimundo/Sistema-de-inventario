// backend/middleware/auth.js - VERSIÓN CORREGIDA (SIN DEPENDENCIA CIRCULAR)
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ofimundo123';

// Lista de rutas que no requieren autenticación (SOLO LAS RUTAS, no imports)
const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/recover-password',
    '/api/auth/reset-password',
    '/api/auth/verify-token',
    '/api/asignaciones/descargar',
    '/api/health',
    '/api/test',
    '/'
];

const authenticateToken = (req, res, next) => {
    // Verificar si la ruta es pública
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    
    if (isPublicRoute) {
        console.log(`🔓 Ruta pública: ${req.method} ${req.path}`);
        return next();
    }
    
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        console.log('❌ Token no proporcionado');
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log(`✅ Token válido para usuario: ${decoded.usuario || decoded.id}`);
        next();
    } catch (error) {
        console.log('❌ Token inválido:', error.message);
        return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
    }
};

module.exports = { authenticateToken };