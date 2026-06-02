// backend/controllers/productoController.js - VERSIÓN CORREGIDA CON LABORATORIO
const { getConnection, sql } = require('../config/database');

// Función auxiliar para obtener texto de estado
function getEstadoTexto(idEstado) {
    const map = {
        1: 'DISPONIBLE',
        2: 'ASIGNADO',
        3: 'EN MANTENCIÓN',
        4: 'EN REPARACIÓN',
        5: 'NO DISPONIBLE',
        6: 'BAJA'
    };
    return map[idEstado] || 'DESCONOCIDO';
}

const productoController = {
    // ============================================
    // MÉTODOS PRINCIPALES
    // ============================================
    
    getProductos: async (req, res) => {
        try {
            console.log('📥 GET /api/productos - Solicitando productos');
            console.log('📥 Query params recibidos:', req.query);
            
            const { search, marca, estado, condicion, bodega_id } = req.query;
            
            const pool = await getConnection();
            
            const estadoMap = {
                'DISPONIBLE': 1,
                'ASIGNADO': 2,
                'EN MANTENCIÓN': 3,
                'EN REPARACIÓN': 4,
                'NO DISPONIBLE': 5,
                'BAJA': 6
            };
            
            let query = `
                SELECT 
                    p.id,
                    p.nombre,
                    p.marca,
                    p.modelo,
                    p.numero_serie,
                    p.codigo_qr,
                    p.precio,
                    p.moneda,
                    p.descripcion,
                    p.oc_numero,
                    p.factura_numero,
                    p.id_estado_equipo,
                    p.condicion,
                    p.imagen_path,
                    p.fecha_creacion,
                    p.bodega_id,
                    b.nombre as bodega_nombre
                FROM [INV].[productos] p WITH (NOLOCK)
                LEFT JOIN [INV].[bodegas] b WITH (NOLOCK) ON p.bodega_id = b.id
                WHERE 1=1
                    AND p.id_estado_equipo != 6
            `;
            
            const request = pool.request();
            
            if (search && search.trim()) {
                query += ` AND (p.nombre LIKE @search OR p.marca LIKE @search OR p.modelo LIKE @search OR p.numero_serie LIKE @search)`;
                request.input('search', sql.NVarChar, `%${search.trim()}%`);
            }
            
            if (marca && marca.trim()) {
                query += ` AND p.marca = @marca`;
                request.input('marca', sql.NVarChar, marca);
            }
            
            if (estado && estado.trim()) {
                const estadoId = estadoMap[estado];
                if (estadoId) {
                    query += ` AND p.id_estado_equipo = @estadoId`;
                    request.input('estadoId', sql.Int, estadoId);
                }
            }
            
            if (condicion && condicion.trim()) {
                query += ` AND p.condicion = @condicion`;
                request.input('condicion', sql.NVarChar, condicion);
            }
            
            if (bodega_id && !isNaN(parseInt(bodega_id))) {
                query += ` AND p.bodega_id = @bodegaId`;
                request.input('bodegaId', sql.Int, parseInt(bodega_id));
            }
            
            query += ` ORDER BY p.fecha_creacion DESC`;
            
            const result = await request.query(query);
            
            const productos = result.recordset.map(producto => ({
                ...producto,
                estado: getEstadoTexto(producto.id_estado_equipo)
            }));
            
            res.json({
                success: true,
                data: productos
            });
            
        } catch (error) {
            console.error('❌ Error en getProductos:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    getProductoById: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            
            const productoResult = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        p.id,
                        p.nombre,
                        p.marca,
                        p.modelo,
                        p.numero_serie,
                        p.codigo_qr,
                        p.precio,
                        p.moneda,
                        p.descripcion,
                        p.oc_numero,
                        p.factura_numero,
                        p.id_estado_equipo,
                        p.condicion,
                        p.imagen_path,
                        p.fecha_creacion,
                        p.bodega_id,
                        b.nombre as bodega_nombre,
                        b.ubicacion as bodega_ubicacion
                    FROM [INV].[productos] p WITH (NOLOCK)
                    LEFT JOIN [INV].[bodegas] b WITH (NOLOCK) ON p.bodega_id = b.id
                    WHERE p.id = @id
                `);

            if (productoResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const producto = productoResult.recordset[0];
            producto.estado = getEstadoTexto(producto.id_estado_equipo);

            const mantencionesResult = await pool.request()
                .input('producto_id', sql.Int, id)
                .query(`
                    SELECT id, producto_id, tipo, fecha_inicio, fecha_fin, responsable, descripcion, costo
                    FROM [INV].[mantenciones] WITH (NOLOCK)
                    WHERE producto_id = @producto_id
                    ORDER BY fecha_inicio DESC
                `);

            const historialResult = await pool.request()
                .input('producto_id', sql.Int, id)
                .query(`
                    SELECT id, producto_id, nombre_usuario, fecha_asignacion, fecha_devolucion,
                           comentario, motivo, estado, email, rut_usuario, cargo, departamento
                    FROM [INV].[producto_uso] WITH (NOLOCK)
                    WHERE producto_id = @producto_id
                    ORDER BY fecha_asignacion DESC
                `);

            res.json({
                success: true,
                data: {
                    ...producto,
                    historial_mantenciones: mantencionesResult.recordset,
                    historial_uso: historialResult.recordset,
                    tiene_mantencion_activa: mantencionesResult.recordset.some(m => !m.fecha_fin)
                }
            });

        } catch (error) {
            console.error('❌ Error en getProductoById:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    createProducto: async (req, res) => {
        try {
            console.log('📥 POST /api/productos - Creando producto');
            
            const { 
                nombre, precio, oc_numero, factura_numero,
                descripcion, marca, codigo_qr, modelo, numero_serie, 
                condicion, bodega_id, id_estado_equipo
            } = req.body;

            if (!nombre) {
                return res.status(400).json({ success: false, message: 'El nombre del producto es requerido' });
            }

            const pool = await getConnection();

            const productoResult = await pool.request()
                .input('nombre', sql.NVarChar, nombre)
                .input('precio', sql.Decimal(18,2), precio || 0)
                .input('oc_numero', sql.NVarChar, oc_numero || null)
                .input('factura_numero', sql.NVarChar, factura_numero || null)
                .input('descripcion', sql.NVarChar, descripcion || null)
                .input('marca', sql.NVarChar, marca || null)
                .input('codigo_qr', sql.NVarChar, codigo_qr || null)
                .input('modelo', sql.NVarChar, modelo || null)
                .input('numero_serie', sql.NVarChar, numero_serie || null)
                .input('condicion', sql.NVarChar, condicion || 'NUEVO')
                .input('id_estado_equipo', sql.Int, id_estado_equipo || 1)
                .input('bodega_id', sql.Int, bodega_id || null)
                .query(`
                    INSERT INTO [INV].[productos] (
                        nombre, precio, oc_numero, factura_numero, descripcion, 
                        marca, codigo_qr, modelo, numero_serie, condicion, 
                        id_estado_equipo, bodega_id, fecha_creacion
                    )
                    OUTPUT INSERTED.*
                    VALUES (
                        @nombre, @precio, @oc_numero, @factura_numero, @descripcion,
                        @marca, @codigo_qr, @modelo, @numero_serie, @condicion,
                        @id_estado_equipo, @bodega_id, GETDATE()
                    )
                `);

            const nuevoProducto = productoResult.recordset[0];
            nuevoProducto.estado = getEstadoTexto(nuevoProducto.id_estado_equipo);

            res.json({ success: true, message: 'Producto creado exitosamente', data: nuevoProducto });

        } catch (error) {
            console.error('❌ Error en createProducto:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    updateProducto: async (req, res) => {
        try {
            const { id } = req.params;
            
            const { 
                nombre, precio, oc_numero, factura_numero,
                descripcion, marca, codigo_qr, modelo, numero_serie, 
                condicion, bodega_id, id_estado_equipo
            } = req.body;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();

            const existeProducto = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT id FROM [INV].[productos] WHERE id = @id');
            
            if (existeProducto.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('nombre', sql.NVarChar, nombre)
                .input('precio', sql.Decimal(18,2), precio || 0)
                .input('oc_numero', sql.NVarChar, oc_numero || null)
                .input('factura_numero', sql.NVarChar, factura_numero || null)
                .input('descripcion', sql.NVarChar, descripcion || null)
                .input('marca', sql.NVarChar, marca || null)
                .input('codigo_qr', sql.NVarChar, codigo_qr || null)
                .input('modelo', sql.NVarChar, modelo || null)
                .input('numero_serie', sql.NVarChar, numero_serie || null)
                .input('condicion', sql.NVarChar, condicion || 'NUEVO')
                .input('id_estado_equipo', sql.Int, id_estado_equipo || 1)
                .input('bodega_id', sql.Int, bodega_id || null)
                .query(`
                    UPDATE [INV].[productos] SET
                        nombre = @nombre,
                        precio = @precio,
                        oc_numero = @oc_numero,
                        factura_numero = @factura_numero,
                        descripcion = @descripcion,
                        marca = @marca,
                        codigo_qr = @codigo_qr,
                        modelo = @modelo,
                        numero_serie = @numero_serie,
                        condicion = @condicion,
                        id_estado_equipo = @id_estado_equipo,
                        bodega_id = @bodega_id
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);

            const productoActualizado = result.recordset[0];
            productoActualizado.estado = getEstadoTexto(productoActualizado.id_estado_equipo);

            res.json({ success: true, message: 'Producto actualizado exitosamente', data: productoActualizado });

        } catch (error) {
            console.error('❌ Error en updateProducto:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    deleteProducto: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                await transaction.request()
                    .input('producto_id', sql.Int, id)
                    .query('DELETE FROM [INV].[producto_uso] WHERE producto_id = @producto_id');

                await transaction.request()
                    .input('producto_id', sql.Int, id)
                    .query('DELETE FROM [INV].[mantenciones] WHERE producto_id = @producto_id');

                await transaction.request()
                    .input('id', sql.Int, id)
                    .query('DELETE FROM [INV].[productos] WHERE id = @id');

                await transaction.commit();

                res.json({ success: true, message: 'Producto eliminado exitosamente' });

            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } catch (error) {
            console.error('❌ Error en deleteProducto:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ============================================
    // MÉTODOS PARA ESTADÍSTICAS
    // ============================================
    
    getStats: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request().query(`
                SELECT 
                    COUNT(*) as totalProductos,
                    ISNULL(SUM(CASE WHEN id_estado_equipo = 1 THEN 1 ELSE 0 END), 0) as disponibles,
                    ISNULL(SUM(CASE WHEN id_estado_equipo = 2 THEN 1 ELSE 0 END), 0) as asignados,
                    ISNULL(SUM(CASE WHEN id_estado_equipo = 3 THEN 1 ELSE 0 END), 0) as enMantencion,
                    ISNULL(SUM(CASE WHEN id_estado_equipo = 4 THEN 1 ELSE 0 END), 0) as enReparacion,
                    ISNULL(SUM(CASE WHEN id_estado_equipo = 5 THEN 1 ELSE 0 END), 0) as noDisponibles,
                    ISNULL(SUM(precio), 0) as valorTotal,
                    ISNULL(AVG(precio), 0) as precioPromedio
                FROM [INV].[productos] WITH (NOLOCK)
                WHERE id_estado_equipo != 6
            `);

            const bajasCount = await pool.request()
                .query('SELECT COUNT(*) as total FROM INV.disposicion_baja');
            
            const donacionesCount = await pool.request()
                .query('SELECT COUNT(*) as total FROM INV.disposicion_donacion');
            
            const laboratoriosCount = await pool.request()
                .query('SELECT COUNT(*) as total FROM INV.disposicion_laboratorio');

            const stats = result.recordset[0] || {};
            
            res.json({
                success: true,
                data: {
                    totalProductos: stats.totalProductos || 0,
                    valorTotal: stats.valorTotal || 0,
                    precioPromedio: stats.precioPromedio || 0,
                    disponibles: stats.disponibles || 0,
                    asignados: stats.asignados || 0,
                    enMantencion: stats.enMantencion || 0,
                    enReparacion: stats.enReparacion || 0,
                    noDisponibles: stats.noDisponibles || 0,
                    dadosDeBaja: bajasCount.recordset[0]?.total || 0,
                    donados: donacionesCount.recordset[0]?.total || 0,
                    enviadosLaboratorio: laboratoriosCount.recordset[0]?.total || 0
                }
            });

        } catch (error) {
            console.error('❌ Error en getStats:', error);
            res.status(500).json({ success: false, message: error.message, data: {} });
        }
    },

    getProductoEstado: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT id, nombre, marca, modelo, numero_serie, id_estado_equipo, 
                           condicion, precio, codigo_qr, bodega_id
                    FROM [INV].[productos] WITH (NOLOCK)
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const producto = result.recordset[0];
            producto.estado = getEstadoTexto(producto.id_estado_equipo);

            res.json({ success: true, data: producto });

        } catch (error) {
            console.error('❌ Error en getProductoEstado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ============================================
    // MÉTODOS PARA MANTENCIONES
    // ============================================
    
    iniciarMantencion: async (req, res) => {
        try {
            const { producto_id, tipo, fecha_inicio, responsable, descripcion, costo } = req.body;

            if (!producto_id || !tipo || !responsable || !descripcion) {
                return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
            }

            const pool = await getConnection();
            
            const nuevoEstado = tipo === 'REPARACION' ? 4 : 3;
            
            await pool.request()
                .input('producto_id', sql.Int, producto_id)
                .input('id_estado_equipo', sql.Int, nuevoEstado)
                .query(`
                    UPDATE [INV].[productos] 
                    SET id_estado_equipo = @id_estado_equipo
                    WHERE id = @producto_id
                `);

            const result = await pool.request()
                .input('producto_id', sql.Int, producto_id)
                .input('tipo', sql.NVarChar, tipo)
                .input('fecha_inicio', sql.DateTime, fecha_inicio ? new Date(fecha_inicio) : new Date())
                .input('responsable', sql.NVarChar, responsable)
                .input('descripcion', sql.NVarChar, descripcion)
                .input('costo', sql.Decimal(18,2), costo || 0)
                .query(`
                    INSERT INTO [INV].[mantenciones] (producto_id, tipo, fecha_inicio, responsable, descripcion, costo)
                    OUTPUT INSERTED.*
                    VALUES (@producto_id, @tipo, @fecha_inicio, @responsable, @descripcion, @costo)
                `);

            res.json({ success: true, message: 'Mantención iniciada', data: result.recordset[0] });

        } catch (error) {
            console.error('❌ Error iniciando mantención:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    finalizarMantencion: async (req, res) => {
        try {
            const { id } = req.params;
            const { fecha_fin } = req.body;

            if (!id || !fecha_fin) {
                return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
            }

            const pool = await getConnection();
            
            const mantencionResult = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT producto_id FROM [INV].[mantenciones] WHERE id = @id');
            
            if (mantencionResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Mantención no encontrada' });
            }
            
            const producto_id = mantencionResult.recordset[0].producto_id;
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('fecha_fin', sql.DateTime, new Date(fecha_fin))
                .query(`
                    UPDATE [INV].[mantenciones]
                    SET fecha_fin = @fecha_fin, updated_at = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);
            
            await pool.request()
                .input('producto_id', sql.Int, producto_id)
                .input('id_estado_equipo', sql.Int, 1)
                .query(`
                    UPDATE [INV].[productos] 
                    SET id_estado_equipo = @id_estado_equipo
                    WHERE id = @producto_id
                `);

            res.json({ success: true, message: 'Mantención finalizada', data: result.recordset[0] });

        } catch (error) {
            console.error('❌ Error finalizando mantención:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getHistorialMantenciones: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, id)
                .query(`
                    SELECT * FROM [INV].[mantenciones] WITH (NOLOCK)
                    WHERE producto_id = @producto_id
                    ORDER BY fecha_inicio DESC
                `);

            res.json({ success: true, data: result.recordset });

        } catch (error) {
            console.error('❌ Error en getHistorialMantenciones:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getHistorialDisposiciones: async (req, res) => {
        try {
            console.log('📥 GET /api/productos/disposiciones');
            
            const pool = await getConnection();
            
            const bajasResult = await pool.request()
                .query(`
                    SELECT 
                        db.id,
                        db.producto_id,
                        p.nombre as producto_nombre,
                        p.numero_serie,
                        db.motivo_baja as motivo,
                        db.fecha_baja as fecha,
                        db.autorizado_por,
                        db.observaciones,
                        'BAJA' as tipo
                    FROM INV.disposicion_baja db
                    INNER JOIN INV.productos p ON db.producto_id = p.id
                    ORDER BY db.fecha_baja DESC
                `);
            
            const donacionesResult = await pool.request()
                .query(`
                    SELECT 
                        dd.id,
                        dd.producto_id,
                        p.nombre as producto_nombre,
                        p.numero_serie,
                        dd.beneficiario,
                        dd.direccion,
                        dd.fecha_entrega as fecha,
                        dd.observaciones,
                        'DONACION' as tipo
                    FROM INV.disposicion_donacion dd
                    INNER JOIN INV.productos p ON dd.producto_id = p.id
                    ORDER BY dd.fecha_entrega DESC
                `);
            
            const laboratorioResult = await pool.request()
                .query(`
                    SELECT 
                        dl.id,
                        dl.producto_id,
                        p.nombre as producto_nombre,
                        p.numero_serie,
                        dl.laboratorio_nombre,
                        dl.autorizado_por,
                        dl.motivo,
                        dl.observaciones,
                        dl.fecha_envio as fecha,
                        'LABORATORIO' as tipo
                    FROM INV.disposicion_laboratorio dl
                    INNER JOIN INV.productos p ON dl.producto_id = p.id
                    ORDER BY dl.fecha_envio DESC
                `);
            
            res.json({
                success: true,
                data: {
                    bajas: bajasResult.recordset,
                    donaciones: donacionesResult.recordset,
                    laboratorio: laboratorioResult.recordset
                }
            });

        } catch (error) {
            console.error('❌ Error en getHistorialDisposiciones:', error);
            res.status(500).json({
                success: false,
                message: error.message,
                data: { bajas: [], donaciones: [], laboratorio: [] }
            });
        }
    },

    registrarBaja: async (req, res) => {
        try {
            const { producto_id, motivo_baja, autorizado_por, observaciones } = req.body;

            if (!producto_id) {
                return res.status(400).json({ success: false, message: 'El ID del producto es requerido' });
            }

            const pool = await getConnection();
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('motivo_baja', sql.NVarChar, motivo_baja || 'No especificado')
                    .input('fecha_baja', sql.DateTime, new Date())
                    .input('autorizado_por', sql.NVarChar, autorizado_por || 'Sistema')
                    .input('observaciones', sql.NVarChar, observaciones || '')
                    .query(`
                        INSERT INTO INV.disposicion_baja (producto_id, motivo_baja, fecha_baja, autorizado_por, observaciones)
                        VALUES (@producto_id, @motivo_baja, @fecha_baja, @autorizado_por, @observaciones)
                    `);

                await transaction.request()
                    .input('id', sql.Int, producto_id)
                    .input('id_estado_equipo', sql.Int, 6)
                    .query(`
                        UPDATE [INV].[productos] 
                        SET id_estado_equipo = @id_estado_equipo,
                            bodega_id = NULL
                        WHERE id = @id
                    `);

                await transaction.commit();

                res.json({ success: true, message: 'Baja registrada exitosamente' });

            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } catch (error) {
            console.error('❌ Error en registrarBaja:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    registrarDonacion: async (req, res) => {
        try {
            const { producto_id, beneficiario, direccion, observaciones } = req.body;

            if (!producto_id) {
                return res.status(400).json({ success: false, message: 'El ID del producto es requerido' });
            }

            const pool = await getConnection();
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('beneficiario', sql.NVarChar, beneficiario || 'No especificado')
                    .input('direccion', sql.NVarChar, direccion || '')
                    .input('fecha_entrega', sql.DateTime, new Date())
                    .input('observaciones', sql.NVarChar, observaciones || '')
                    .query(`
                        INSERT INTO INV.disposicion_donacion (producto_id, beneficiario, direccion, fecha_entrega, observaciones)
                        VALUES (@producto_id, @beneficiario, @direccion, @fecha_entrega, @observaciones)
                    `);

                await transaction.request()
                    .input('id', sql.Int, producto_id)
                    .input('id_estado_equipo', sql.Int, 6)
                    .query(`
                        UPDATE [INV].[productos] 
                        SET id_estado_equipo = @id_estado_equipo,
                            bodega_id = NULL
                        WHERE id = @id
                    `);

                await transaction.commit();

                res.json({ success: true, message: 'Donación registrada exitosamente' });

            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } catch (error) {
            console.error('❌ Error en registrarDonacion:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ============================================
    // MÉTODO CORREGIDO - REGISTRAR ENVÍO A LABORATORIO
    // ============================================
    registrarLaboratorio: async (req, res) => {
        try {
            console.log('📥 POST /api/productos/disposicion/laboratorio');
            console.log('Body:', req.body);
            
            const { 
                producto_id, 
                laboratorio_nombre, 
                autorizado_por, 
                motivo, 
                observaciones 
            } = req.body;
            
            if (!producto_id || !laboratorio_nombre || !autorizado_por) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Faltan campos requeridos: producto_id, laboratorio_nombre y autorizado_por' 
                });
            }
            
            const pool = await getConnection();
            const transaction = pool.transaction();
            await transaction.begin();
            
            try {
                // Verificar producto
                const productoInfo = await transaction.request()
                    .input('id', sql.Int, producto_id)
                    .query(`
                        SELECT id, nombre, numero_serie, precio, marca, modelo, condicion, id_estado_equipo
                        FROM INV.productos WHERE id = @id
                    `);
                
                if (productoInfo.recordset.length === 0) {
                    await transaction.rollback();
                    return res.status(404).json({ success: false, message: 'Producto no encontrado' });
                }
                
                const producto = productoInfo.recordset[0];
                
                // Crear tabla si no existe (sin campo contacto ni descripcion)
                try {
                    await transaction.request().query(`
                        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='disposicion_laboratorio' AND xtype='U')
                        CREATE TABLE INV.disposicion_laboratorio (
                            id INT IDENTITY(1,1) PRIMARY KEY,
                            producto_id INT NOT NULL,
                            laboratorio_nombre NVARCHAR(255) NOT NULL,
                            autorizado_por NVARCHAR(255) NOT NULL,
                            motivo NVARCHAR(500) NULL,
                            observaciones NVARCHAR(MAX) NULL,
                            documento_respaldo NVARCHAR(500) NULL,
                            fecha_envio DATETIME DEFAULT GETDATE(),
                            FOREIGN KEY (producto_id) REFERENCES INV.productos(id)
                        )
                    `);
                } catch (tableError) {
                    console.log('⚠️ Tabla ya existe o error:', tableError.message);
                }
                
                // Insertar en disposicion_laboratorio (sin contacto ni descripcion)
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('laboratorio_nombre', sql.NVarChar, laboratorio_nombre)
                    .input('autorizado_por', sql.NVarChar, autorizado_por)
                    .input('motivo', sql.NVarChar, motivo || 'Envío a laboratorio para análisis')
                    .input('observaciones', sql.NVarChar, observaciones || null)
                    .query(`
                        INSERT INTO INV.disposicion_laboratorio (
                            producto_id, laboratorio_nombre, autorizado_por, 
                            motivo, observaciones, fecha_envio
                        ) VALUES (
                            @producto_id, @laboratorio_nombre, @autorizado_por,
                            @motivo, @observaciones, GETDATE()
                        )
                    `);
                
                // Cambiar estado a NO DISPONIBLE (5) - SIN tocar bodega_id
                await transaction.request()
                    .input('id', sql.Int, producto_id)
                    .input('id_estado_equipo', sql.Int, 5)
                    .query(`
                        UPDATE INV.productos 
                        SET id_estado_equipo = @id_estado_equipo
                        WHERE id = @id
                    `);
                
                // Registrar en historial
                await transaction.request()
                    .input('producto_id', sql.Int, producto_id)
                    .input('accion', sql.NVarChar, 'LABORATORIO')
                    .input('detalles', sql.NVarChar, `Producto enviado a laboratorio: ${laboratorio_nombre}. Autorizado por: ${autorizado_por}`)
                    .input('fecha_hora', sql.DateTime, new Date())
                    .query(`
                        INSERT INTO INV.historial (producto_id, accion, detalles, fecha_hora)
                        VALUES (@producto_id, @accion, @detalles, @fecha_hora)
                    `);
                
                await transaction.commit();
                
                console.log(`✅ Producto ${producto_id} enviado a laboratorio exitosamente`);
                
                res.json({ 
                    success: true, 
                    message: `Producto enviado a laboratorio: ${laboratorio_nombre}`,
                    data: producto 
                });
                
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
            
        } catch (error) {
            console.error('❌ Error en registrarLaboratorio:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // ============================================
    // MÉTODOS AUXILIARES
    // ============================================
    
    getMarcas: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT DISTINCT marca FROM [INV].[productos] WITH (NOLOCK)
                    WHERE marca IS NOT NULL AND marca != '' AND id_estado_equipo != 6
                    ORDER BY marca
                `);

            res.json({ success: true, data: result.recordset.map(r => r.marca) });

        } catch (error) {
            console.error('❌ Error en getMarcas:', error);
            res.json({ success: true, data: [] });
        }
    },

    getProductosDisponibles: async (req, res) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .query(`
                    SELECT 
                        p.id,
                        p.nombre,
                        p.marca,
                        p.modelo,
                        p.numero_serie,
                        p.precio,
                        p.condicion,
                        p.bodega_id,
                        b.nombre as bodega_nombre
                    FROM [INV].[productos] p
                    LEFT JOIN [INV].[bodegas] b ON p.bodega_id = b.id
                    WHERE p.id_estado_equipo = 1
                    ORDER BY p.nombre
                `);

            res.json({ success: true, data: result.recordset });

        } catch (error) {
            console.error('❌ Error en getProductosDisponibles:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getProductosPorBodega: async (req, res) => {
        try {
            const { bodegaId } = req.params;
            
            if (!bodegaId || isNaN(parseInt(bodegaId))) {
                return res.status(400).json({ success: false, message: 'ID de bodega inválido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('bodega_id', sql.Int, bodegaId)
                .query(`
                    SELECT 
                        p.id,
                        p.nombre,
                        p.marca,
                        p.modelo,
                        p.numero_serie,
                        p.precio,
                        p.condicion,
                        p.id_estado_equipo,
                        p.bodega_id,
                        b.nombre as bodega_nombre
                    FROM [INV].[productos] p
                    INNER JOIN [INV].[bodegas] b ON p.bodega_id = b.id
                    WHERE p.bodega_id = @bodega_id AND p.id_estado_equipo != 6
                    ORDER BY p.nombre
                `);

            res.json({ success: true, data: result.recordset });

        } catch (error) {
            console.error('❌ Error en getProductosPorBodega:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getHistorialUso: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('producto_id', sql.Int, id)
                .query(`
                    SELECT * FROM [INV].[producto_uso] WITH (NOLOCK)
                    WHERE producto_id = @producto_id
                    ORDER BY fecha_asignacion DESC
                `);

            res.json({ success: true, data: result.recordset });

        } catch (error) {
            console.error('❌ Error en getHistorialUso:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    verificarQR: async (req, res) => {
        try {
            const { id } = req.params;
            const { qr } = req.query;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ success: false, message: 'ID de producto inválido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT id, nombre, codigo_qr FROM [INV].[productos] WITH (NOLOCK)
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const producto = result.recordset[0];

            res.json({
                success: true,
                data: {
                    producto_id: producto.id,
                    nombre: producto.nombre,
                    qr_actual: producto.codigo_qr,
                    qr_recibido: qr,
                    coincide: producto.codigo_qr === qr
                }
            });

        } catch (error) {
            console.error('❌ Error verificando QR:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    actualizarEstado: async (req, res) => {
        try {
            const { id } = req.params;
            const { id_estado_equipo } = req.body;

            if (id_estado_equipo === undefined) {
                return res.status(400).json({ success: false, message: 'El estado es requerido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('id_estado_equipo', sql.Int, id_estado_equipo)
                .query(`
                    UPDATE [INV].[productos] SET id_estado_equipo = @id_estado_equipo
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const producto = result.recordset[0];
            producto.estado = getEstadoTexto(producto.id_estado_equipo);

            res.json({ success: true, message: 'Estado actualizado', data: producto });

        } catch (error) {
            console.error('❌ Error actualizando estado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    finalizarMantencionPorId: async (req, res) => {
        try {
            const { id } = req.params;
            const { fecha_fin } = req.body;

            if (!id || !fecha_fin) {
                return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
            }

            const pool = await getConnection();
            
            const result = await pool.request()
                .input('producto_id', sql.Int, id)
                .input('fecha_fin', sql.DateTime, new Date(fecha_fin))
                .query(`
                    UPDATE [INV].[mantenciones]
                    SET fecha_fin = @fecha_fin, updated_at = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE producto_id = @producto_id AND fecha_fin IS NULL
                `);
            
            await pool.request()
                .input('producto_id', sql.Int, id)
                .input('id_estado_equipo', sql.Int, 1)
                .query(`
                    UPDATE [INV].[productos] 
                    SET id_estado_equipo = @id_estado_equipo
                    WHERE id = @producto_id
                `);

            res.json({ success: true, message: 'Mantención finalizada', data: result.recordset[0] });

        } catch (error) {
            console.error('❌ Error finalizando mantención:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = productoController;