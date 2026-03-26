// backend/routes/documentoRoutes.js
const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');
const { authenticateToken } = require('../middleware/auth');

console.log('🔧 Inicializando documentoRoutes.js...');

router.get('/', authenticateToken, async (req, res) => {
    console.log('📥 GET /api/documentos');
    try {
        await documentoController.getAll(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    console.log(`📥 GET /api/documentos/${req.params.id}`);
    try {
        await documentoController.getById(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    console.log('📥 POST /api/documentos');
    try {
        await documentoController.create(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/upload', authenticateToken, async (req, res) => {
    console.log('📥 POST /api/documentos/upload');
    try {
        await documentoController.upload(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    console.log(`📥 PUT /api/documentos/${req.params.id}`);
    try {
        await documentoController.update(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    console.log(`📥 DELETE /api/documentos/${req.params.id}`);
    try {
        await documentoController.delete(req, res);
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

console.log('✅ documentoRoutes.js configurado correctamente');

module.exports = router;