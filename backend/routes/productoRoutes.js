// backend/routes/productoRoutes.js - VERSIÓN CORREGIDA PARA BAJAS Y DONACIONES
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Mapa de estados (id_estado_equipo)
const ESTADOS = {
    DISPONIBLE: 1,
    ASIGNADO: 2,
    EN_MANTENCION: 3,
    EN_REPARACION: 4,
    NO_DISPONIBLE: 5
};

// Mapa inverso para convertir texto a ID
const ESTADO_TEXTO_A_ID = {
    'DISPONIBLE': 1,
    'ASIGNADO': 2,
    'EN MANTENCIÓN': 3,
    'EN REPARACIÓN': 4,
    'NO DISPONIBLE': 5
};

// Función para convertir id_estado_equipo a texto
function getEstadoTexto(idEstado) {
    const map = {
        1: 'DISPONIBLE',
        2: 'ASIGNADO',
        3: 'EN MANTENCIÓN',
        4: 'EN REPARACIÓN',
        5: 'NO DISPONIBLE'
    };
    return map[idEstado] || 'DISPONIBLE';
}

// ============================================
// RUTAS ESPECÍFICAS
// ============================================

// GET - Obtener marcas
router.get('/marcas', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`SELECT DISTINCT marca FROM INV.productos WHERE marca IS NOT NULL AND marca != '' AND id_estado_equipo != 5 ORDER BY marca`);
        res.json({ success: true, data: result.recordset.map(r => r.marca) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener estadísticas
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 GET /api/productos/stats');
        
        const pool = await getConnection();
        
        const statsResult = await pool.request()
            .query(`
                SELECT 
                    COUNT(*) as totalProductos,
                    ISNULL(SUM(precio), 0) as valorTotal,
                    ISNULL(AVG(precio), 0) as precioPromedio,
                    COUNT(CASE WHEN id_estado_equipo = 1 THEN 1 END) as disponibles,
                    COUNT(CASE WHEN id_estado_equipo = 2 THEN 1 END) as asignados,
                    COUNT(CASE WHEN id_estado_equipo = 3 THEN 1 END) as enMantencion,
                    COUNT(CASE WHEN id_estado_equipo = 4 THEN 1 END) as enReparacion,
                    COUNT(CASE WHEN id_estado_equipo = 5 THEN 1 END) as noDisponibles
                FROM INV.productos
                WHERE id_estado_equipo != 5
            `);
        
        const bajasCount = await pool.request()
            .query(`SELECT COUNT(*) as total FROM INV.disposicion_baja`);
        
        const donacionesCount = await pool.request()
            .query(`SELECT COUNT(*) as total FROM INV.disposicion_donacion`);
        
        const stats = statsResult.recordset[0] || {};
        stats.totalProductos = stats.totalProductos || 0;
        stats.valorTotal = stats.valorTotal || 0;
        stats.precioPromedio = stats.precioPromedio || 0;
        stats.disponibles = stats.disponibles || 0;
        stats.asignados = stats.asignados || 0;
        stats.enMantencion = stats.enMantencion || 0;
        stats.enReparacion = stats.enReparacion || 0;
        stats.noDisponibles = stats.noDisponibles || 0;
        stats.dadosDeBaja = bajasCount.recordset[0]?.total || 0;
        stats.donados = donacionesCount.recordset[0]?.total || 0;
        
        res.json({ success: true, data: stats });
        
    } catch (error) {
        console.error('❌ Error en stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener productos por bodega
router.get('/bodega/:bodegaId', async (req, res) => {
    try {
        const { bodegaId } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('bodega_id', sql.Int, bodegaId)
            .query(`
                SELECT 
                    p.id, p.nombre, p.numero_serie, p.marca, p.modelo,
                    p.precio, p.id_estado_equipo, p.condicion,
                    b.id as bodega_id, b.nombre as bodega_nombre
                FROM INV.productos p
                INNER JOIN INV.producto_bodega pb ON p.id = pb.producto_id
                INNER JOIN INV.bodegas b ON pb.bodega_id = b.id
                WHERE pb.bodega_id = @bodega_id AND p.id_estado_equipo != 5
                ORDER BY p.nombre
            `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener historial de disposiciones
router.get('/disposiciones', async (req, res) => {
    try {
        const pool = await getConnection();
        
        const bajasResult = await pool.request()
            .query(`
                SELECT 
                    db.id, db.producto_id, p.nombre as producto_nombre,
                    p.numero_serie, db.motivo_baja, db.fecha_baja,
                    db.autorizado_por, db.observaciones, 'BAJA' as tipo
                FROM INV.disposicion_baja db
                INNER JOIN INV.productos p ON db.producto_id = p.id
                ORDER BY db.fecha_baja DESC
            `);
        
        const donacionesResult = await pool.request()
            .query(`
                SELECT 
                    dd.id, dd.producto_id, p.nombre as producto_nombre,
                    p.numero_serie, dd.beneficiario, dd.direccion,
                    dd.fecha_entrega as fecha_donacion, dd.observaciones, 'DONACION' as tipo
                FROM INV.disposicion_donacion dd
                INNER JOIN INV.productos p ON dd.producto_id = p.id
                ORDER BY dd.fecha_entrega DESC
            `);
        
        res.json({ success: true, data: { bajas: bajasResult.recordset, donaciones: donacionesResult.recordset } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// POST - REGISTRAR BAJA (CORREGIDO - usa estado 5)
// ============================================
router.post('/baja', async (req, res) => {
    try {
        console.log('📥 POST /api/productos/baja');
        console.log('Body:', req.body);
        
        const { producto_id, motivo_baja, autorizado_por, observaciones } = req.body;
        
        if (!producto_id || !motivo_baja) {
            return res.status(400).json({ 
                success: false, 
                message: 'Faltan campos requeridos: producto_id y motivo_baja' 
            });
        }
        
        const pool = await getConnection();
        
        // Verificar producto
        const productoInfo = await pool.request()
            .input('id', sql.Int, producto_id)
            .query(`
                SELECT id, nombre, numero_serie, precio, marca, modelo, condicion, id_estado_equipo
                FROM INV.productos WHERE id = @id
            `);
        
        if (productoInfo.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        const producto = productoInfo.recordset[0];
        
        // Verificar si el producto ya está dado de baja (estado 5)
        if (producto.id_estado_equipo === ESTADOS.NO_DISPONIBLE) {
            return res.status(400).json({ success: false, message: 'El producto ya está dado de baja' });
        }
        
        // Insertar en disposicion_baja
        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('motivo_baja', sql.NVarChar, motivo_baja)
            .input('fecha_baja', sql.DateTime, new Date())
            .input('autorizado_por', sql.NVarChar, autorizado_por || 'Sistema')
            .input('observaciones', sql.NVarChar, observaciones || '')
            .query(`
                INSERT INTO INV.disposicion_baja (
                    producto_id, motivo_baja, fecha_baja, autorizado_por, observaciones
                ) VALUES (
                    @producto_id, @motivo_baja, @fecha_baja, @autorizado_por, @observaciones
                )
            `);
        
        // Actualizar estado del producto a NO_DISPONIBLE (5)
        await pool.request()
            .input('id', sql.Int, producto_id)
            .input('id_estado_equipo', sql.Int, ESTADOS.NO_DISPONIBLE)
            .query(`
                UPDATE INV.productos 
                SET id_estado_equipo = @id_estado_equipo
                WHERE id = @id
            `);
        
        // Eliminar relación con bodega
        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .query(`DELETE FROM INV.producto_bodega WHERE producto_id = @producto_id`);
        
        // Registrar en historial
        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('accion', sql.NVarChar, 'BAJA')
            .input('detalles', sql.NVarChar, `Producto dado de baja. Motivo: ${motivo_baja}`)
            .input('fecha_hora', sql.DateTime, new Date())
            .query(`
                INSERT INTO INV.historial (producto_id, accion, detalles, fecha_hora)
                VALUES (@producto_id, @accion, @detalles, @fecha_hora)
            `);
        
        console.log(`✅ Producto ${producto_id} dado de baja exitosamente`);
        
        res.json({ 
            success: true, 
            message: 'Producto dado de baja exitosamente', 
            data: producto 
        });
        
    } catch (error) {
        console.error('❌ Error en /baja:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// POST - REGISTRAR DONACIÓN (CORREGIDO)
// ============================================
router.post('/donar', async (req, res) => {
    try {
        console.log('📥 POST /api/productos/donar');
        console.log('Body:', req.body);
        
        const { producto_id, beneficiario, direccion, observaciones } = req.body;
        
        if (!producto_id || !beneficiario) {
            return res.status(400).json({ 
                success: false, 
                message: 'Faltan campos requeridos: producto_id y beneficiario' 
            });
        }
        
        const pool = await getConnection();
        
        // Verificar producto
        const productoInfo = await pool.request()
            .input('id', sql.Int, producto_id)
            .query(`
                SELECT id, nombre, numero_serie, precio, marca, modelo, condicion, id_estado_equipo
                FROM INV.productos WHERE id = @id
            `);
        
        if (productoInfo.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        const producto = productoInfo.recordset[0];
        
        // Verificar si el producto ya está dado de baja (estado 5)
        if (producto.id_estado_equipo === ESTADOS.NO_DISPONIBLE) {
            return res.status(400).json({ success: false, message: 'El producto ya está dado de baja' });
        }
        
        // Insertar en disposicion_donacion
        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('beneficiario', sql.NVarChar, beneficiario)
            .input('direccion', sql.NVarChar, direccion || '')
            .input('fecha_entrega', sql.DateTime, new Date())
            .input('observaciones', sql.NVarChar, observaciones || '')
            .query(`
                INSERT INTO INV.disposicion_donacion (
                    producto_id, beneficiario, direccion, fecha_entrega, observaciones
                ) VALUES (
                    @producto_id, @beneficiario, @direccion, @fecha_entrega, @observaciones
                )
            `);
        
        // Actualizar estado del producto a NO_DISPONIBLE (5)
        await pool.request()
            .input('id', sql.Int, producto_id)
            .input('id_estado_equipo', sql.Int, ESTADOS.NO_DISPONIBLE)
            .query(`
                UPDATE INV.productos 
                SET id_estado_equipo = @id_estado_equipo
                WHERE id = @id
            `);
        
        // Eliminar relación con bodega
        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .query(`DELETE FROM INV.producto_bodega WHERE producto_id = @producto_id`);
        
        // Registrar en historial
        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('accion', sql.NVarChar, 'DONACION')
            .input('detalles', sql.NVarChar, `Producto donado a: ${beneficiario}`)
            .input('fecha_hora', sql.DateTime, new Date())
            .query(`
                INSERT INTO INV.historial (producto_id, accion, detalles, fecha_hora)
                VALUES (@producto_id, @accion, @detalles, @fecha_hora)
            `);
        
        console.log(`✅ Producto ${producto_id} donado exitosamente`);
        
        res.json({ 
            success: true, 
            message: 'Producto donado exitosamente', 
            data: producto 
        });
        
    } catch (error) {
        console.error('❌ Error en /donar:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// MÉTODOS DE MANTENCIÓN
// ============================================

// POST - Iniciar mantención
router.post('/mantencion/iniciar', async (req, res) => {
    try {
        const { producto_id, tipo, fecha_inicio, responsable, descripcion, costo } = req.body;
        
        console.log('📥 POST /api/productos/mantencion/iniciar');
        
        if (!producto_id || !responsable || !descripcion) {
            return res.status(400).json({ 
                success: false, 
                message: 'Faltan datos requeridos' 
            });
        }
        
        const pool = await getConnection();
        
        const productoCheck = await pool.request()
            .input('id', sql.Int, producto_id)
            .query(`SELECT id, nombre, id_estado_equipo FROM INV.productos WHERE id = @id`);
        
        if (productoCheck.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        const mantencionActiva = await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .query(`
                SELECT id FROM INV.mantenciones 
                WHERE producto_id = @producto_id AND fecha_fin IS NULL
            `);
        
        if (mantencionActiva.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'El producto ya tiene una mantención activa' });
        }
        
        await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .input('tipo', sql.NVarChar, tipo || 'RUTINA')
            .input('fecha_inicio', sql.DateTime, fecha_inicio || new Date())
            .input('responsable', sql.NVarChar, responsable)
            .input('descripcion', sql.NVarChar, descripcion)
            .input('costo', sql.Decimal(18,2), costo || 0)
            .query(`
                INSERT INTO INV.mantenciones (producto_id, tipo, fecha_inicio, responsable, descripcion, costo)
                VALUES (@producto_id, @tipo, @fecha_inicio, @responsable, @descripcion, @costo)
            `);
        
        const nuevoEstado = tipo === 'REPARACION' ? 4 : 3;
        await pool.request()
            .input('id', sql.Int, producto_id)
            .input('id_estado_equipo', sql.Int, nuevoEstado)
            .query(`UPDATE INV.productos SET id_estado_equipo = @id_estado_equipo WHERE id = @id`);
        
        res.json({ success: true, message: 'Mantención iniciada correctamente' });
        
    } catch (error) {
        console.error('Error en /mantencion/iniciar:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Finalizar mantención
router.post('/mantencion/finalizar', async (req, res) => {
    try {
        const { producto_id, fecha_fin, observaciones } = req.body;
        
        console.log('📥 POST /api/productos/mantencion/finalizar');
        
        if (!producto_id || !fecha_fin) {
            return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
        }
        
        const pool = await getConnection();
        
        const mantencionActiva = await pool.request()
            .input('producto_id', sql.Int, producto_id)
            .query(`
                SELECT TOP 1 id, descripcion as descripcion_actual
                FROM INV.mantenciones 
                WHERE producto_id = @producto_id AND fecha_fin IS NULL
                ORDER BY fecha_inicio DESC
            `);
        
        if (mantencionActiva.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay una mantención activa para este producto' });
        }
        
        const mantencionId = mantencionActiva.recordset[0].id;
        const descripcionActual = mantencionActiva.recordset[0].descripcion_actual || '';
        
        let nuevaDescripcion = descripcionActual;
        if (observaciones && observaciones.trim() !== '') {
            nuevaDescripcion = descripcionActual + ' [FINALIZACIÓN: ' + observaciones.trim() + ']';
        }
        
        await pool.request()
            .input('id', sql.Int, mantencionId)
            .input('fecha_fin', sql.DateTime, fecha_fin)
            .input('descripcion', sql.NVarChar, nuevaDescripcion)
            .query(`
                UPDATE INV.mantenciones 
                SET fecha_fin = @fecha_fin, descripcion = @descripcion
                WHERE id = @id
            `);
        
        // Cambiar estado a DISPONIBLE (1)
        await pool.request()
            .input('id', sql.Int, producto_id)
            .query(`UPDATE INV.productos SET id_estado_equipo = 1 WHERE id = @id`);
        
        res.json({ success: true, message: 'Mantención finalizada correctamente' });
        
    } catch (error) {
        console.error('Error en /mantencion/finalizar:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener historial de mantenciones
router.get('/:productoId/mantenciones', async (req, res) => {
    try {
        const { productoId } = req.params;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('producto_id', sql.Int, productoId)
            .query(`
                SELECT id, tipo, fecha_inicio, fecha_fin, responsable, descripcion, costo
                FROM INV.mantenciones
                WHERE producto_id = @producto_id
                ORDER BY fecha_inicio DESC
            `);
        
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================
// RUTAS PRINCIPALES
// ============================================

// GET - Listar todos los productos (CON FILTROS)
router.get('/', async (req, res) => {
    try {
        console.log('📥 GET /api/productos');
        console.log('📥 Query params:', req.query);
        
        const { search, marca, estado, condicion, bodega_id } = req.query;
        
        const pool = await getConnection();
        
        let query = `
            SELECT 
                p.id, p.nombre, p.numero_serie, p.marca, p.modelo,
                p.precio, p.oc_numero, p.factura_numero, p.descripcion,
                p.id_estado_equipo, p.imagen_path, p.fecha_creacion,
                ISNULL(p.condicion, 'NUEVO') as condicion,
                pb.bodega_id,
                b.nombre as bodega_nombre
            FROM INV.productos p
            LEFT JOIN INV.producto_bodega pb ON p.id = pb.producto_id
            LEFT JOIN INV.bodegas b ON pb.bodega_id = b.id
            WHERE 1=1
                AND p.id_estado_equipo != 5
        `;
        
        const request = pool.request();
        
        // Búsqueda por texto
        if (search && search.trim() !== '') {
            query += ` AND (p.nombre LIKE @search OR p.marca LIKE @search OR p.modelo LIKE @search OR p.numero_serie LIKE @search)`;
            request.input('search', sql.NVarChar, `%${search.trim()}%`);
        }
        
        // Filtro por marca
        if (marca && marca !== 'todos' && marca !== '') {
            query += ` AND p.marca = @marca`;
            request.input('marca', sql.NVarChar, marca);
        }
        
        // Filtro por estado - convertir texto a ID
        if (estado && estado !== 'todos' && estado !== '') {
            const estadoId = ESTADO_TEXTO_A_ID[estado];
            if (estadoId) {
                query += ` AND p.id_estado_equipo = @estadoId`;
                request.input('estadoId', sql.Int, estadoId);
                console.log(`📌 Filtro estado: ${estado} -> ID: ${estadoId}`);
            } else {
                console.log(`⚠️ Estado no reconocido: ${estado}`);
            }
        }
        
        // Filtro por condición
        if (condicion && condicion !== 'todos' && condicion !== '') {
            query += ` AND p.condicion = @condicion`;
            request.input('condicion', sql.NVarChar, condicion);
        }
        
        // Filtro por bodega
        if (bodega_id && bodega_id !== 'todos' && bodega_id !== '' && !isNaN(parseInt(bodega_id))) {
            query += ` AND pb.bodega_id = @bodegaId`;
            request.input('bodegaId', sql.Int, parseInt(bodega_id));
        }
        
        query += ` ORDER BY p.id DESC`;
        
        const result = await request.query(query);
        console.log(`✅ ${result.recordset.length} productos encontrados`);
        
        const productosCompletos = [];
        for (const producto of result.recordset) {
            producto.estado = getEstadoTexto(producto.id_estado_equipo);
            
            // Obtener asignación activa si existe
            const asignacionResult = await pool.request()
                .input('producto_id', sql.Int, producto.id)
                .query(`
                    SELECT TOP 1 
                        a.id as asignacion_id,
                        a.colaborador_id,
                        c.nombre as colaborador_nombre,
                        c.email as colaborador_email,
                        a.fecha_asignacion,
                        a.motivo
                    FROM INV.asignaciones a
                    LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                    WHERE a.producto_id = @producto_id 
                      AND a.fecha_devolucion IS NULL
                    ORDER BY a.fecha_asignacion DESC
                `);
            
            producto.colaborador_asignado = asignacionResult.recordset[0] || null;
            productosCompletos.push(producto);
        }
        
        res.json({ success: true, data: productosCompletos });
        
    } catch (error) {
        console.error('❌ Error en GET /productos:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET - Obtener producto por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(id);
        
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.Int, idNum)
            .query(`
                SELECT 
                    p.id, p.nombre, p.numero_serie, p.marca, p.modelo,
                    p.precio, p.oc_numero, p.factura_numero,
                    p.descripcion, p.id_estado_equipo, p.imagen_path, 
                    p.fecha_creacion, p.condicion
                FROM INV.productos p
                WHERE p.id = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        
        const producto = result.recordset[0];
        producto.estado = getEstadoTexto(producto.id_estado_equipo);
        
        const bodegaResult = await pool.request()
            .input('producto_id', sql.Int, idNum)
            .query(`
                SELECT TOP 1 b.id as bodega_id, b.nombre as bodega_nombre
                FROM INV.producto_bodega pb
                INNER JOIN INV.bodegas b ON pb.bodega_id = b.id
                WHERE pb.producto_id = @producto_id
            `);
        
        producto.bodega_id = bodegaResult.recordset[0]?.bodega_id || null;
        producto.bodega_nombre = bodegaResult.recordset[0]?.bodega_nombre || 'Sin bodega';
        
        const asignacionResult = await pool.request()
            .input('producto_id', sql.Int, idNum)
            .query(`
                SELECT TOP 1 
                    a.id as asignacion_id,
                    a.colaborador_id,
                    c.nombre as colaborador_nombre,
                    c.email as colaborador_email,
                    a.fecha_asignacion,
                    a.motivo
                FROM INV.asignaciones a
                LEFT JOIN INV.colaboradores c ON a.colaborador_id = c.id
                WHERE a.producto_id = @producto_id 
                  AND a.fecha_devolucion IS NULL
                ORDER BY a.fecha_asignacion DESC
            `);
        
        producto.colaborador_asignado = asignacionResult.recordset[0] || null;
        
        res.json({ success: true, data: producto });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST - Crear producto
router.post('/', async (req, res) => {
    try {
        console.log('📥 POST /api/productos');
        console.log('📥 Body:', req.body);
        
        const { nombre, precio, oc_numero, factura_numero, descripcion,
                marca, estado, modelo, numero_serie, condicion, bodega_id } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ success: false, message: 'Nombre requerido' });
        }
        
        if (!numero_serie) {
            return res.status(400).json({ success: false, message: 'Número de serie requerido' });
        }
        
        const pool = await getConnection();
        
        const existeSerie = await pool.request()
            .input('numero_serie', sql.NVarChar, numero_serie)
            .query('SELECT id FROM INV.productos WHERE numero_serie = @numero_serie');
        
        if (existeSerie.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'El número de serie ya existe' });
        }
        
        const estadoId = ESTADO_TEXTO_A_ID[estado] || 1;
        
        const result = await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('precio', sql.Decimal(18,2), parseFloat(precio) || 0)
            .input('oc_numero', sql.NVarChar, oc_numero || '')
            .input('factura_numero', sql.NVarChar, factura_numero || '')
            .input('descripcion', sql.NVarChar, descripcion || '')
            .input('marca', sql.NVarChar, marca || '')
            .input('id_estado_equipo', sql.Int, estadoId)
            .input('modelo', sql.NVarChar, modelo || '')
            .input('numero_serie', sql.NVarChar, numero_serie)
            .input('condicion', sql.NVarChar, condicion || 'NUEVO')
            .query(`
                INSERT INTO INV.productos (
                    nombre, precio, oc_numero, factura_numero, 
                    descripcion, marca, id_estado_equipo, modelo, 
                    numero_serie, condicion, fecha_creacion
                )
                VALUES (
                    @nombre, @precio, @oc_numero, @factura_numero,
                    @descripcion, @marca, @id_estado_equipo, @modelo, 
                    @numero_serie, @condicion, GETDATE()
                );
                SELECT SCOPE_IDENTITY() as id;
            `);
        
        const nuevoId = result.recordset[0].id;
        
        if (bodega_id) {
            const bodegaIdNum = parseInt(bodega_id);
            await pool.request()
                .input('producto_id', sql.Int, nuevoId)
                .input('bodega_id', sql.Int, bodegaIdNum)
                .query(`
                    INSERT INTO INV.producto_bodega (producto_id, bodega_id)
                    VALUES (@producto_id, @bodega_id)
                `);
        }
        
        const productoResult = await pool.request()
            .input('id', sql.Int, nuevoId)
            .query(`
                SELECT id, nombre, precio, oc_numero, factura_numero,
                       descripcion, marca, id_estado_equipo, modelo, 
                       numero_serie, condicion
                FROM INV.productos WHERE id = @id
            `);
        
        const nuevoProducto = productoResult.recordset[0];
        nuevoProducto.estado = getEstadoTexto(nuevoProducto.id_estado_equipo);
        
        res.json({ success: true, message: 'Producto creado', data: nuevoProducto });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT - Actualizar producto
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(id);
        
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const { nombre, precio, oc_numero, factura_numero, descripcion,
                marca, estado, modelo, numero_serie, condicion, bodega_id } = req.body;
        
        const estadoId = ESTADO_TEXTO_A_ID[estado] || 1;
        
        const pool = await getConnection();
        
        if (numero_serie) {
            const existeSerie = await pool.request()
                .input('numero_serie', sql.NVarChar, numero_serie)
                .input('id', sql.Int, idNum)
                .query('SELECT id FROM INV.productos WHERE numero_serie = @numero_serie AND id != @id');
            
            if (existeSerie.recordset.length > 0) {
                return res.status(400).json({ success: false, message: 'El número de serie ya existe' });
            }
        }
        
        await pool.request()
            .input('id', sql.Int, idNum)
            .input('nombre', sql.NVarChar, nombre)
            .input('precio', sql.Decimal(18,2), parseFloat(precio) || 0)
            .input('oc_numero', sql.NVarChar, oc_numero || '')
            .input('factura_numero', sql.NVarChar, factura_numero || '')
            .input('descripcion', sql.NVarChar, descripcion || '')
            .input('marca', sql.NVarChar, marca || '')
            .input('id_estado_equipo', sql.Int, estadoId)
            .input('modelo', sql.NVarChar, modelo || '')
            .input('numero_serie', sql.NVarChar, numero_serie || '')
            .input('condicion', sql.NVarChar, condicion || 'NUEVO')
            .query(`
                UPDATE INV.productos SET
                    nombre = @nombre,
                    precio = @precio,
                    oc_numero = @oc_numero,
                    factura_numero = @factura_numero,
                    descripcion = @descripcion,
                    marca = @marca,
                    id_estado_equipo = @id_estado_equipo,
                    modelo = @modelo,
                    numero_serie = @numero_serie,
                    condicion = @condicion
                WHERE id = @id
            `);
        
        if (bodega_id !== undefined) {
            const bodegaIdNum = bodega_id ? parseInt(bodega_id) : null;
            
            await pool.request()
                .input('producto_id', sql.Int, idNum)
                .query(`DELETE FROM INV.producto_bodega WHERE producto_id = @producto_id`);
            
            if (bodegaIdNum) {
                await pool.request()
                    .input('producto_id', sql.Int, idNum)
                    .input('bodega_id', sql.Int, bodegaIdNum)
                    .query(`
                        INSERT INTO INV.producto_bodega (producto_id, bodega_id)
                        VALUES (@producto_id, @bodega_id)
                    `);
            }
        }
        
        const productoResult = await pool.request()
            .input('id', sql.Int, idNum)
            .query(`
                SELECT id, nombre, precio, oc_numero, factura_numero,
                       descripcion, marca, id_estado_equipo, modelo, 
                       numero_serie, condicion
                FROM INV.productos WHERE id = @id
            `);
        
        const productoActualizado = productoResult.recordset[0];
        productoActualizado.estado = getEstadoTexto(productoActualizado.id_estado_equipo);
        
        res.json({ success: true, message: 'Producto actualizado', data: productoActualizado });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE - Eliminar producto
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const idNum = parseInt(id);
        
        if (isNaN(idNum)) {
            return res.status(400).json({ success: false, message: 'ID inválido' });
        }
        
        const pool = await getConnection();
        
        const asignaciones = await pool.request()
            .input('producto_id', sql.Int, idNum)
            .query(`SELECT COUNT(*) as total FROM INV.asignaciones WHERE producto_id = @producto_id`);
        
        if (asignaciones.recordset[0].total > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No se puede eliminar el producto porque tiene asignaciones registradas' 
            });
        }
        
        await pool.request()
            .input('producto_id', sql.Int, idNum)
            .query(`DELETE FROM INV.producto_bodega WHERE producto_id = @producto_id`);
        
        await pool.request()
            .input('id', sql.Int, idNum)
            .query(`DELETE FROM INV.productos WHERE id = @id`);
        
        res.json({ success: true, message: 'Producto eliminado' });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;