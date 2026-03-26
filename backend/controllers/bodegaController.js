// backend/controllers/bodegaController.js
const { getConnection, sql } = require('../config/database');

const bodegaController = {
    // Obtener todas las bodegas
    getAll: async (req, res) => {
        try {
            console.log('📥 Obteniendo bodegas...');
            const pool = await getConnection();
            
            // Verificar columnas de la tabla bodegas
            const columnasBodegas = await pool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'INV' AND TABLE_NAME = 'bodegas'
            `);
            
            const columnas = columnasBodegas.recordset.map(c => c.COLUMN_NAME);
            console.log('📋 Columnas en bodegas:', columnas);
            
            // Verificar columnas de la tabla producto_bodega
            try {
                const columnasPB = await pool.request().query(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = 'INV' AND TABLE_NAME = 'producto_bodega'
                `);
                console.log('📋 Columnas en producto_bodega:', columnasPB.recordset.map(c => c.COLUMN_NAME));
            } catch (error) {
                console.log('Nota: No se pudo verificar columnas de producto_bodega');
            }
            
            // Consulta básica de bodegas
            const result = await pool.request().query(`
                SELECT 
                    id,
                    nombre,
                    ubicacion,
                    responsable_id,
                    responsable,
                    descripcion
                FROM INV.bodegas
                ORDER BY nombre
            `);
            
            console.log('📦 Bodegas encontradas:', result.recordset.length);
            
            // Para cada bodega, obtener total de productos desde producto_bodega
            const bodegasConInfo = await Promise.all(
                result.recordset.map(async (bodega) => {
                    let totalProductos = 0;
                    let totalStock = 0;
                    
                    // Obtener total de productos y stock desde producto_bodega
                    try {
                        const productResult = await pool.request()
                            .input('bodegaId', sql.Int, bodega.id)
                            .query(`
                                SELECT 
                                    COUNT(DISTINCT producto_id) as total_productos,
                                    ISNULL(SUM(cantidad), 0) as total_stock
                                FROM INV.producto_bodega 
                                WHERE bodega_id = @bodegaId
                            `);
                        
                        if (productResult.recordset[0]) {
                            totalProductos = productResult.recordset[0].total_productos || 0;
                            totalStock = productResult.recordset[0].total_stock || 0;
                        }
                    } catch (error) {
                        console.log(`Error obteniendo productos para bodega ${bodega.id}:`, error.message);
                    }
                    
                    return {
                        id: bodega.id,
                        nombre: bodega.nombre,
                        ubicacion: bodega.ubicacion,
                        responsable_id: bodega.responsable_id,
                        responsable: bodega.responsable,
                        descripcion: bodega.descripcion,
                        total_productos: totalProductos,
                        total_stock: totalStock
                    };
                })
            );

            res.json({
                success: true,
                data: bodegasConInfo
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
                        id,
                        nombre,
                        ubicacion,
                        responsable_id,
                        responsable,
                        descripcion
                    FROM INV.bodegas 
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bodega no encontrada'
                });
            }

            const bodega = result.recordset[0];

            // Obtener total de productos desde producto_bodega
            try {
                const productResult = await pool.request()
                    .input('bodegaId', sql.Int, id)
                    .query(`
                        SELECT 
                            COUNT(DISTINCT producto_id) as total_productos,
                            ISNULL(SUM(cantidad), 0) as total_stock
                        FROM INV.producto_bodega 
                        WHERE bodega_id = @bodegaId
                    `);
                
                bodega.total_productos = productResult.recordset[0]?.total_productos || 0;
                bodega.total_stock = productResult.recordset[0]?.total_stock || 0;
            } catch (error) {
                console.log('Error obteniendo productos:', error.message);
                bodega.total_productos = 0;
                bodega.total_stock = 0;
            }

            res.json({
                success: true,
                data: bodega
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
            const pool = await getConnection();
            
            // Obtener productos de la bodega desde producto_bodega
            const result = await pool.request()
                .input('bodegaId', sql.Int, id)
                .query(`
                    SELECT 
                        p.*,
                        pb.cantidad as cantidad_en_bodega
                    FROM INV.productos p
                    INNER JOIN INV.producto_bodega pb ON p.id = pb.producto_id
                    WHERE pb.bodega_id = @bodegaId
                    ORDER BY p.nombre
                `);

            console.log(`📦 Productos encontrados en bodega ${id}:`, result.recordset.length);
            
            res.json({
                success: true,
                data: result.recordset
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
            nuevaBodega.total_stock = 0;

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

            // Verificar si la bodega existe
            const checkResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`SELECT id FROM INV.bodegas WHERE id = @id`);
            
            if (checkResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bodega no encontrada'
                });
            }

            // Actualizar la bodega
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

            // Obtener la bodega actualizada
            const bodegaResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        id,
                        nombre,
                        ubicacion,
                        responsable,
                        descripcion
                    FROM INV.bodegas 
                    WHERE id = @id
                `);

            const bodegaActualizada = bodegaResult.recordset[0];

            // Obtener total de productos desde producto_bodega
            try {
                const productResult = await pool.request()
                    .input('bodegaId', sql.Int, id)
                    .query(`
                        SELECT 
                            COUNT(DISTINCT producto_id) as total_productos,
                            ISNULL(SUM(cantidad), 0) as total_stock
                        FROM INV.producto_bodega 
                        WHERE bodega_id = @bodegaId
                    `);
                
                bodegaActualizada.total_productos = productResult.recordset[0]?.total_productos || 0;
                bodegaActualizada.total_stock = productResult.recordset[0]?.total_stock || 0;
            } catch (error) {
                bodegaActualizada.total_productos = 0;
                bodegaActualizada.total_stock = 0;
            }

            console.log('✅ Bodega actualizada:', bodegaActualizada);

            res.json({
                success: true,
                message: 'Bodega actualizada exitosamente',
                data: bodegaActualizada
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

            // Verificar si la bodega existe
            const checkResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`SELECT id FROM INV.bodegas WHERE id = @id`);
            
            if (checkResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bodega no encontrada'
                });
            }

            // Verificar si tiene productos en producto_bodega
            try {
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
                        message: 'No se puede eliminar la bodega porque tiene productos asignados en producto_bodega'
                    });
                }
            } catch (error) {
                console.log('Error verificando productos:', error.message);
            }

            // Eliminar la bodega
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