// backend/routes/bodegaRoutes.js - VERSIÓN CORREGIDA
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// GET - Obtener todas las bodegas (con conteo de productos)
router.get('/', async (req, res) => {
    try {
        console.log('📥 GET /api/bodegas');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT 
                    b.id, 
                    b.nombre, 
                    b.ubicacion, 
                    b.responsable_id, 
                    b.descripcion, 
                    b.responsable,
                    ISNULL((
                        SELECT SUM(pb.cantidad) 
                        FROM INV.producto_bodega pb 
                        WHERE pb.bodega_id = b.id
                    ), 0) as total_productos
                FROM INV.bodegas b
                ORDER BY b.nombre
            `);
        
        console.log(`📦 Bodegas encontradas: ${result.recordset.length}`);
        result.recordset.forEach(b => {
            console.log(`   - ${b.nombre}: ${b.total_productos} productos`);
        });
        
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error en GET /bodegas:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener bodega por ID con sus productos
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(id);
        
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        console.log(`📥 GET /api/bodegas/${idNum}`);
        
        const pool = await getConnection();
        
        // Obtener datos de la bodega
        const bodegaResult = await pool.request()
            .input('id', sql.Int, idNum)
            .query(`
                SELECT 
                    id, 
                    nombre, 
                    ubicacion, 
                    responsable_id, 
                    descripcion, 
                    responsable,
                    ISNULL((
                        SELECT SUM(pb.cantidad) 
                        FROM INV.producto_bodega pb 
                        WHERE pb.bodega_id = id
                    ), 0) as total_productos
                FROM INV.bodegas 
                WHERE id = @id
            `);
        
        if (bodegaResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Bodega no encontrada' });
        }
        
        // Obtener productos de esta bodega desde producto_bodega
        const productosResult = await pool.request()
            .input('bodega_id', sql.Int, idNum)
            .query(`
                SELECT 
                    p.id,
                    p.nombre,
                    p.numero_serie,
                    p.marca,
                    p.modelo,
                    p.cantidad as stock_total,
                    p.precio,
                    p.estado,
                    p.condicion,
                    pb.cantidad as cantidad_bodega,
                    pb.bodega_id
                FROM INV.productos p
                INNER JOIN INV.producto_bodega pb ON p.id = pb.producto_id
                WHERE pb.bodega_id = @bodega_id
                ORDER BY p.nombre
            `);
        
        console.log(`📦 Productos encontrados en bodega ${idNum}: ${productosResult.recordset.length}`);
        
        if (productosResult.recordset.length > 0) {
            console.log('📋 Productos en esta bodega:');
            productosResult.recordset.forEach(p => {
                console.log(`   - ID: ${p.id}, Nombre: ${p.nombre}, Stock total: ${p.stock_total}, Stock en bodega: ${p.cantidad_bodega}`);
            });
        } else {
            console.log('⚠️ No hay productos en esta bodega');
        }
        
        res.json({
            success: true,
            data: {
                ...bodegaResult.recordset[0],
                productos: productosResult.recordset
            }
        });
        
    } catch (error) {
        console.error('❌ Error en GET /bodegas/:id:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Crear bodega
router.post('/', async (req, res) => {
    try {
        console.log('📥 POST /api/bodegas');
        
        const { nombre, ubicacion, responsable_id, descripcion, responsable } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ success: false, message: 'Nombre requerido' });
        }
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('ubicacion', sql.NVarChar, ubicacion || '')
            .input('responsable_id', sql.Int, responsable_id || null)
            .input('descripcion', sql.NVarChar, descripcion || '')
            .input('responsable', sql.NVarChar, responsable || '')
            .query(`
                INSERT INTO INV.bodegas (nombre, ubicacion, responsable_id, descripcion, responsable)
                VALUES (@nombre, @ubicacion, @responsable_id, @descripcion, @responsable);
                SELECT SCOPE_IDENTITY() as id;
            `);
        
        res.json({ success: true, message: 'Bodega creada', data: { id: result.recordset[0].id } });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Actualizar bodega
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(id);
        
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const { nombre, ubicacion, responsable_id, descripcion, responsable } = req.body;
        
        const pool = await getConnection();
        
        await pool.request()
            .input('id', sql.Int, idNum)
            .input('nombre', sql.NVarChar, nombre)
            .input('ubicacion', sql.NVarChar, ubicacion || '')
            .input('responsable_id', sql.Int, responsable_id || null)
            .input('descripcion', sql.NVarChar, descripcion || '')
            .input('responsable', sql.NVarChar, responsable || '')
            .query(`
                UPDATE INV.bodegas SET
                    nombre = @nombre,
                    ubicacion = @ubicacion,
                    responsable_id = @responsable_id,
                    descripcion = @descripcion,
                    responsable = @responsable
                WHERE id = @id
            `);
        
        res.json({ success: true, message: 'Bodega actualizada' });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Eliminar bodega
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(id);
        
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const pool = await getConnection();
        
        // Verificar si tiene productos asignados
        const productosAsignados = await pool.request()
            .input('bodega_id', sql.Int, idNum)
            .query(`SELECT COUNT(*) as total FROM INV.producto_bodega WHERE bodega_id = @bodega_id`);
        
        if (productosAsignados.recordset[0].total > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `No se puede eliminar la bodega porque tiene ${productosAsignados.recordset[0].total} productos asignados` 
            });
        }
        
        await pool.request()
            .input('id', sql.Int, idNum)
            .query(`DELETE FROM INV.bodegas WHERE id = @id`);
        
        res.json({ success: true, message: 'Bodega eliminada' });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;