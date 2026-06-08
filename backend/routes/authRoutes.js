// backend/routes/authRoutes.js - VERSIÓN CON LOGS DE DEPURACIÓN
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

console.log('🔧 Inicializando authRoutes.js...');

// Middleware de depuración para todas las rutas auth
router.use((req, res, next) => {
    console.log(`   🔐 [authRoutes] ${req.method} ${req.path}`);
    next();
});

router.post('/register', async (req, res) => {
    console.log('📥 POST /api/auth/register');
    try {
        await AuthController.register(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/login', async (req, res) => {
    console.log('📥 POST /api/auth/login');
    try {
        await AuthController.login(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    console.log('📥 GET /api/auth/me');
    try {
        await AuthController.verifyToken(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/logout', authenticateToken, async (req, res) => {
    console.log('📥 POST /api/auth/logout');
    try {
        await AuthController.logout(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/profile', authenticateToken, async (req, res) => {
    console.log('📥 PUT /api/auth/profile');
    try {
        await AuthController.updateProfile(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/change-password', authenticateToken, async (req, res) => {
    console.log('🔥🔥🔥 POST /api/auth/change-password - EJECUTANDO CONTROLADOR 🔥🔥🔥');
    console.log('📝 req.user:', req.user);
    try {
        await AuthController.changePassword(req, res);
    } catch (error) {
        console.error('❌ Error en change-password:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

console.log('✅ authRoutes.js configurado correctamente');

module.exports = router;