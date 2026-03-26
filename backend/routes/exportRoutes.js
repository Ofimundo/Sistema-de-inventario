// backend/routes/exportRoutes.js
const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');

console.log('🔧 Inicializando exportRoutes.js...');

router.get('/productos', authenticateToken, async (req, res) => {
    console.log('📥 GET /api/export/productos');
    try {
        await exportController.exportProductos(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/colaboradores', authenticateToken, async (req, res) => {
    console.log('📥 GET /api/export/colaboradores');
    try {
        await exportController.exportColaboradores(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/asignaciones', authenticateToken, async (req, res) => {
    console.log('📥 GET /api/export/asignaciones');
    try {
        await exportController.exportAsignaciones(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/inventario', authenticateToken, async (req, res) => {
    console.log('📥 GET /api/export/inventario');
    try {
        await exportController.exportInventarioCompleto(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

console.log('✅ exportRoutes.js configurado correctamente');

module.exports = router;