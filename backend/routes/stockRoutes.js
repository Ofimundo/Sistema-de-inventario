// backend/routes/stockRoutes.js - VERSIÓN SIN producto_bodega
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Mapa de estados
const ESTADOS = {
    DISPONIBLE: 1,
    ASIGNADO: 2,
    EN_MANTENCION: 3,
    EN_REPARACION: 4,
    NO_DISPONIBLE: 5,
    BAJA: 6
};

const ESTADO_TEXTO = {
    1: 'DISPONIBLE',
    2: 'ASIGNADO',
    3: 'EN MANTENCIÓN',
    4: 'EN REPARACIÓN',
    5: 'NO DISPONIBLE',
    6: 'BAJA'
};

// GET - Obtener resumen de stock por marca y modelo
router.get('/resumen', async (req, res) => {
    try {
        console.log('📥 GET /api/stock/resumen');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT 
                    ISNULL(p.marca, 'SIN MARCA') as marca,
                    ISNULL(p.modelo, 'SIN MODELO') as modelo,
                    ISNULL(p.nombre, 'SIN NOMBRE') as nombre,
                    COUNT(*) as total,
                    SUM(CASE WHEN p.id_estado_equipo = 1 THEN 1 ELSE 0 END) as disponibles,
                    SUM(CASE WHEN p.id_estado_equipo = 2 THEN 1 ELSE 0 END) as asignados,
                    SUM(CASE WHEN p.id_estado_equipo = 3 THEN 1 ELSE 0 END) as en_mantencion,
                    SUM(CASE WHEN p.id_estado_equipo = 4 THEN 1 ELSE 0 END) as en_reparacion,
                    SUM(CASE WHEN p.id_estado_equipo = 5 THEN 1 ELSE 0 END) as no_disponibles
                FROM INV.productos p
                WHERE p.id_estado_equipo != 6
                GROUP BY p.marca, p.modelo, p.nombre
                ORDER BY p.nombre ASC, p.marca ASC, p.modelo ASC
            `);
        
        console.log(`✅ ${result.recordset.length} grupos encontrados`);
        
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error en GET /stock/resumen:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener detalle de productos por marca y modelo
router.get('/detalle', async (req, res) => {
    try {
        console.log('📥 GET /api/stock/detalle');
        
        const { marca, modelo, nombre } = req.query;
        
        const pool = await getConnection();
        
        let query = `
            SELECT 
                p.id,
                p.nombre,
                p.numero_serie,
                p.marca,
                p.modelo,
                p.condicion,
                p.id_estado_equipo,
                p.precio,
                p.cantidad,
                p.fecha_creacion,
                p.bodega_id,
                b.id as bodega_id,
                b.nombre as bodega_nombre,
                a.id as asignacion_id,
                c.id as colaborador_id,
                c.nombre as colaborador_nombre,
                c.rut as colaborador_rut,
                c.email as colaborador_email,
                c.cargo as colaborador_cargo
            FROM INV.productos p
            LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
            LEFT JOIN INV.asignaciones a ON p.id = a.producto_id AND a.fecha_devolucion IS NULL
            LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
            WHERE p.id_estado_equipo != 6
        `;
        
        const request = pool.request();
        
        if (marca && marca !== 'SIN MARCA') {
            query += ` AND p.marca = @marca`;
            request.input('marca', sql.NVarChar, marca);
        } else if (marca === 'SIN MARCA') {
            query += ` AND (p.marca IS NULL OR p.marca = '')`;
        }
        
        if (modelo && modelo !== 'SIN MODELO') {
            query += ` AND p.modelo = @modelo`;
            request.input('modelo', sql.NVarChar, modelo);
        } else if (modelo === 'SIN MODELO') {
            query += ` AND (p.modelo IS NULL OR p.modelo = '')`;
        }
        
        if (nombre && nombre !== 'SIN NOMBRE') {
            query += ` AND p.nombre = @nombre`;
            request.input('nombre', sql.NVarChar, nombre);
        } else if (nombre === 'SIN NOMBRE') {
            query += ` AND (p.nombre IS NULL OR p.nombre = '')`;
        }
        
        query += ` ORDER BY p.numero_serie ASC`;
        
        const result = await request.query(query);
        
        // Procesar resultados para agregar estado texto
        const productos = result.recordset.map(p => ({
            ...p,
            estado_texto: ESTADO_TEXTO[p.id_estado_equipo] || 'DESCONOCIDO'
        }));
        
        console.log(`✅ ${productos.length} productos encontrados`);
        
        res.json({ success: true, data: productos });
        
    } catch (error) {
        console.error('❌ Error en GET /stock/detalle:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener marcas únicas
router.get('/marcas', async (req, res) => {
    try {
        console.log('📥 GET /api/stock/marcas');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT DISTINCT 
                    ISNULL(marca, 'SIN MARCA') as marca
                FROM INV.productos
                WHERE id_estado_equipo != 6
                ORDER BY marca ASC
            `);
        
        res.json({ success: true, data: result.recordset.map(r => r.marca) });
        
    } catch (error) {
        console.error('❌ Error en GET /stock/marcas:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener estadísticas generales de stock
router.get('/estadisticas', async (req, res) => {
    try {
        console.log('📥 GET /api/stock/estadisticas');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT 
                    COUNT(*) as total_productos,
                    COUNT(DISTINCT marca) as total_marcas,
                    COUNT(DISTINCT modelo) as total_modelos,
                    SUM(CASE WHEN id_estado_equipo = 1 THEN 1 ELSE 0 END) as total_disponibles,
                    SUM(CASE WHEN id_estado_equipo = 2 THEN 1 ELSE 0 END) as total_asignados,
                    SUM(CASE WHEN id_estado_equipo = 3 THEN 1 ELSE 0 END) as total_mantencion,
                    SUM(CASE WHEN id_estado_equipo = 4 THEN 1 ELSE 0 END) as total_reparacion,
                    SUM(CASE WHEN id_estado_equipo = 5 THEN 1 ELSE 0 END) as total_no_disponibles,
                    AVG(precio) as precio_promedio,
                    SUM(precio) as valor_total_inventario
                FROM INV.productos
                WHERE id_estado_equipo != 6
            `);
        
        res.json({ success: true, data: result.recordset[0] });
        
    } catch (error) {
        console.error('❌ Error en GET /stock/estadisticas:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener top de marcas más utilizadas
router.get('/top-marcas', async (req, res) => {
    try {
        console.log('📥 GET /api/stock/top-marcas');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT TOP 10
                    ISNULL(marca, 'SIN MARCA') as marca,
                    COUNT(*) as cantidad
                FROM INV.productos
                WHERE id_estado_equipo != 6 AND marca IS NOT NULL AND marca != ''
                GROUP BY marca
                ORDER BY cantidad DESC
            `);
        
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error en GET /stock/top-marcas:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener productos por bodega (nuevo endpoint)
router.get('/por-bodega/:bodegaId', async (req, res) => {
    try {
        const { bodegaId } = req.params;
        console.log(`📥 GET /api/stock/por-bodega/${bodegaId}`);
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('bodegaId', sql.Int, bodegaId)
            .query(`
                SELECT 
                    p.id,
                    p.nombre,
                    p.numero_serie,
                    p.marca,
                    p.modelo,
                    p.condicion,
                    p.id_estado_equipo,
                    p.precio,
                    p.cantidad,
                    CASE 
                        WHEN p.id_estado_equipo = 1 THEN 'DISPONIBLE'
                        WHEN p.id_estado_equipo = 2 THEN 'ASIGNADO'
                        WHEN p.id_estado_equipo = 3 THEN 'EN MANTENCIÓN'
                        WHEN p.id_estado_equipo = 4 THEN 'EN REPARACIÓN'
                        WHEN p.id_estado_equipo = 5 THEN 'NO DISPONIBLE'
                        WHEN p.id_estado_equipo = 6 THEN 'BAJA'
                        ELSE 'DESCONOCIDO'
                    END as estado_texto
                FROM INV.productos p
                WHERE p.bodega_id = @bodegaId
                ORDER BY p.nombre ASC
            `);
        
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error en GET /stock/por-bodega:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener productos disponibles (sin asignar)
router.get('/disponibles', async (req, res) => {
    try {
        console.log('📥 GET /api/stock/disponibles');
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .query(`
                SELECT 
                    p.id,
                    p.nombre,
                    p.numero_serie,
                    p.marca,
                    p.modelo,
                    p.condicion,
                    p.precio,
                    p.cantidad,
                    b.nombre as bodega_nombre
                FROM INV.productos p
                LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                WHERE p.id_estado_equipo = 1
                ORDER BY p.nombre ASC
            `);
        
        res.json({ success: true, data: result.recordset });
        
    } catch (error) {
        console.error('❌ Error en GET /stock/disponibles:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;