// backend/middleware/auth.js - VERSIÓN CORREGIDA (SIN DUPLICACIÓN)
const jwt = require('jsonwebtoken');

// Usar variable de entorno o valor por defecto
const JWT_SECRET = process.env.JWT_SECRET || 'ofimundo123';

console.log('🔐 [Middleware] JWT_SECRET inicializado:', JWT_SECRET === 'ofimundo123' ? 'Usando valor por defecto' : 'Usando variable de entorno');

// Lista de rutas que no requieren autenticación
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
    console.log('=================================');
    console.log(`🔐 [Middleware] Verificando autenticación para: ${req.method} ${req.path}`);
    
    // Verificar si la ruta es pública
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    
    if (isPublicRoute) {
        console.log(`   🔓 Ruta pública: ${req.method} ${req.path} - ACCESO PERMITIDO`);
        console.log('=================================');
        return next();
    }
    
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    console.log(`   📝 Auth Header presente: ${authHeader ? 'SÍ' : 'NO'}`);
    
    if (authHeader) {
        console.log(`   📝 Auth Header (primeros 30 chars): ${authHeader.substring(0, 30)}...`);
    }
    
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        console.log('   ❌ Token no proporcionado en el header');
        console.log('=================================');
        return res.status(401).json({ 
            success: false, 
            message: 'Token no proporcionado' 
        });
    }
    
    console.log(`   🔑 Token recibido (primeros 30 chars): ${token.substring(0, 30)}...`);
    console.log(`   🔑 Longitud del token: ${token.length} caracteres`);
    
    try {
        // Verificar el token usando el JWT_SECRET
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('   ✅ Token verificado exitosamente');
        console.log('   📦 Payload decodificado:', decoded);
        console.log(`   👤 Usuario ID: ${decoded.id}`);
        console.log(`   👤 Usuario nombre: ${decoded.usuario}`);
        
        // Adjuntar el usuario decodificado a la request
        req.user = decoded;
        console.log('   ✅ Autenticación exitosa - Continuando...');
        console.log('=================================');
        next();
        
    } catch (error) {
        console.log(`   ❌ Error verificando token: ${error.message}`);
        console.log(`   🔑 JWT_SECRET usado para verificar: ${JWT_SECRET}`);
        
        if (error.name === 'TokenExpiredError') {
            console.log('   ⏰ Token expirado');
            console.log('=================================');
            return res.status(401).json({ 
                success: false, 
                message: 'Token expirado. Por favor, inicia sesión nuevamente.' 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            console.log('   🔑 Token inválido (malformado o firma incorrecta)');
            console.log('=================================');
            return res.status(401).json({ 
                success: false, 
                message: 'Token inválido. Por favor, inicia sesión nuevamente.' 
            });
        }
        
        console.log('   ❌ Error desconocido:', error.message);
        console.log('=================================');
        return res.status(401).json({ 
            success: false, 
            message: 'Error de autenticación. Por favor, inicia sesión nuevamente.' 
        });
    }
};

module.exports = { authenticateToken };