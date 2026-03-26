// backend/routes/estadosRoutes.js
const express = require('express');
const router = express.Router();

// GET - Obtener todos los estados posibles
router.get('/', async (req, res) => {
    try {
        console.log('📥 GET /api/estados');
        
        const estados = [
            { id: 1, nombre: 'DISPONIBLE' },
            { id: 2, nombre: 'ASIGNADO' },
            { id: 3, nombre: 'EN MANTENCIÓN' },
            { id: 4, nombre: 'EN REPARACIÓN' },
            { id: 5, nombre: 'NO DISPONIBLE' }
        ];
        
        res.json({
            success: true,
            data: estados
        });
        
    } catch (error) {
        console.error('❌ Error en GET /estados:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;