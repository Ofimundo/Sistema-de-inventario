// backend/controllers/bodegaController.js - VERSIÓN CORREGIDA
const { getConnection, sql } = require('../config/database');

const bodegaController = {
    // Obtener todas las bodegas
    getAll: async (req, res) => {
        try {
            console.log('📥 Obteniendo bodegas...');
            const pool = await getConnection();
            
            const result = await pool.request().query(`
                SELECT 
                    b.id,
                    b.nombre,
                    b.ubicacion,
                    b.responsable_id,
                    b.responsable,
                    b.descripcion,
                    ISNULL((
                        SELECT COUNT(DISTINCT pb.producto_id)
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
            
            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            console.error('❌ Error obteniendo bodegas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener bodegas',
                error: error.message
            });
        }
    },

    // Obtener bodega por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const pool = await getConnection();
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        b.id,
                        b.nombre,
                        b.ubicacion,
                        b.responsable_id,
                        b.responsable,
                        b.descripcion,
                        ISNULL((
                            SELECT COUNT(DISTINCT pb.producto_id)
                            FROM INV.producto_bodega pb
                            WHERE pb.bodega_id = b.id
                        ), 0) as total_productos
                    FROM INV.bodegas b
                    WHERE b.id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bodega no encontrada'
                });
            }

            res.json({
                success: true,
                data: result.recordset[0]
            });
        } catch (error) {
            console.error('❌ Error obteniendo bodega:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener bodega',
                error: error.message
            });
        }
    },

    // Obtener productos por bodega
    getProductosByBodega: async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`📥 Obteniendo productos para bodega ${id}...`);
            
            const pool = await getConnection();
            
            // Verificar si la bodega existe
            const bodegaCheck = await pool.request()
                .input('bodegaId', sql.Int, id)
                .query(`SELECT id, nombre FROM INV.bodegas WHERE id = @bodegaId`);
            
            if (bodegaCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bodega no encontrada'
                });
            }
            
            // Obtener productos a través de producto_bodega
            const result = await pool.request()
                .input('bodegaId', sql.Int, id)
                .query(`
                    SELECT 
                        p.id,
                        p.nombre,
                        p.numero_serie,
                        p.marca,
                        p.modelo,
                        p.precio,
                        p.condicion,
                        p.id_estado_equipo,
                        pb.cantidad,
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
                    INNER JOIN INV.producto_bodega pb ON p.id = pb.producto_id
                    WHERE pb.bodega_id = @bodegaId
                    ORDER BY p.nombre
                `);

            console.log(`📦 Productos encontrados en bodega ${id}: ${result.recordset.length}`);
            
            res.json({
                success: true,
                data: result.recordset,
                bodega: bodegaCheck.recordset[0]
            });
        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos',
                error: error.message
            });
        }
    },

    // Obtener lista de usuarios
    getUsuarios: async (req, res) => {
        try {
            console.log('📥 Obteniendo usuarios...');
            const pool = await getConnection();
            
            const result = await pool.request().query(`
                SELECT id, usuario as nombre 
                FROM INV.usuarios 
                WHERE activo = 1 OR activo IS NULL
                ORDER BY usuario
            `);

            console.log('📦 Usuarios encontrados:', result.recordset.length);

            res.json({
                success: true,
                data: result.recordset
            });
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios',
                error: error.message
            });
        }
    },

    // Crear nueva bodega
    create: async (req, res) => {
        try {
            const { nombre, ubicacion, responsable, descripcion } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre es requerido'
                });
            }

            console.log('📤 Creando bodega:', { nombre, ubicacion, responsable, descripcion });
            
            const pool = await getConnection();

            const result = await pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('ubicacion', sql.NVarChar, ubicacion || null)
                .input('responsable', sql.NVarChar, responsable || null)
                .input('descripcion', sql.NVarChar, descripcion || null)
                .query(`
                    INSERT INTO INV.bodegas (nombre, ubicacion, responsable, descripcion)
                    OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.ubicacion, 
                           INSERTED.responsable, INSERTED.descripcion
                    VALUES (@nombre, @ubicacion, @responsable, @descripcion)
                `);

            const nuevaBodega = result.recordset[0];
            nuevaBodega.total_productos = 0;

            console.log('✅ Bodega creada:', nuevaBodega);

            res.json({
                success: true,
                message: 'Bodega creada exitosamente',
                data: nuevaBodega
            });
        } catch (error) {
            console.error('❌ Error creando bodega:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear bodega',
                error: error.message
            });
        }
    },

    // Actualizar bodega
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, ubicacion, responsable, descripcion } = req.body;

            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre es requerido'
                });
            }

            console.log(`📤 Actualizando bodega ${id}:`, { nombre, ubicacion, responsable, descripcion });
            
            const pool = await getConnection();

            const checkResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`SELECT id FROM INV.bodegas WHERE id = @id`);
            
            if (checkResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bodega no encontrada'
                });
            }

            await pool.request()
                .input('id', sql.Int, id)
                .input('nombre', sql.NVarChar, nombre)
                .input('ubicacion', sql.NVarChar, ubicacion || null)
                .input('responsable', sql.NVarChar, responsable || null)
                .input('descripcion', sql.NVarChar, descripcion || null)
                .query(`
                    UPDATE INV.bodegas 
                    SET nombre = @nombre, 
                        ubicacion = @ubicacion, 
                        responsable = @responsable, 
                        descripcion = @descripcion
                    WHERE id = @id
                `);

            const bodegaResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        b.id,
                        b.nombre,
                        b.ubicacion,
                        b.responsable,
                        b.descripcion,
                        ISNULL((
                            SELECT COUNT(DISTINCT pb.producto_id)
                            FROM INV.producto_bodega pb
                            WHERE pb.bodega_id = b.id
                        ), 0) as total_productos
                    FROM INV.bodegas b
                    WHERE b.id = @id
                `);

            console.log('✅ Bodega actualizada:', bodegaResult.recordset[0]);

            res.json({
                success: true,
                message: 'Bodega actualizada exitosamente',
                data: bodegaResult.recordset[0]
            });
        } catch (error) {
            console.error('❌ Error actualizando bodega:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar bodega',
                error: error.message
            });
        }
    },

    // Eliminar bodega
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            console.log(`📤 Eliminando bodega ${id}...`);
            
            const pool = await getConnection();

            const checkResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`SELECT id FROM INV.bodegas WHERE id = @id`);
            
            if (checkResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bodega no encontrada'
                });
            }

            // Verificar si tiene productos asociados
            const productResult = await pool.request()
                .input('bodegaId', sql.Int, id)
                .query(`
                    SELECT COUNT(*) as total 
                    FROM INV.producto_bodega 
                    WHERE bodega_id = @bodegaId
                `);

            if (productResult.recordset[0]?.total > 0) {
                return res.status(400).json({
                    success: false,
                    message: `No se puede eliminar la bodega porque tiene ${productResult.recordset[0].total} productos asociados.`
                });
            }

            await pool.request()
                .input('id', sql.Int, id)
                .query(`DELETE FROM INV.bodegas WHERE id = @id`);

            console.log('✅ Bodega eliminada');

            res.json({
                success: true,
                message: 'Bodega eliminada exitosamente'
            });
        } catch (error) {
            console.error('❌ Error eliminando bodega:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar bodega',
                error: error.message
            });
        }
    }
};

module.exports = bodegaController;