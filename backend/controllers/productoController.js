// backend/controllers/productoController.js - VERSIÓN COMPLETA Y CORREGIDA
const { getConnection, sql } = require('../config/database');

const productoController = {
    // ============================================
    // MÉTODOS PRINCIPALES
    // ============================================
    
    /**
     * Obtener todos los productos
     */
    // backend/controllers/productoController.js - MÉTODO getProductos CORREGIDO

getProductos: async (req, res) => {
    try {
        console.log('📥 GET /api/productos - Solicitando productos');
        console.log('📥 Query params recibidos:', req.query);
        
        const { search, marca, estado, condicion, bodega_id } = req.query;
        
        const pool = await getConnection();
        
        // Mapa de estados para convertir texto a ID
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
                p.fecha_creacion
            FROM [INV].[productos] p WITH (NOLOCK)
            WHERE 1=1
                AND p.id_estado_equipo != 6
        `;
        
        const request = pool.request();
        
        // Filtro por búsqueda
        if (search && search.trim()) {
            query += ` AND (p.nombre LIKE @search OR p.marca LIKE @search OR p.modelo LIKE @search OR p.numero_serie LIKE @search)`;
            request.input('search', sql.NVarChar, `%${search.trim()}%`);
            console.log('🔍 Filtro search:', search);
        }
        
        // Filtro por marca
        if (marca && marca.trim()) {
            query += ` AND p.marca = @marca`;
            request.input('marca', sql.NVarChar, marca);
            console.log('🏷️ Filtro marca:', marca);
        }
        
        // Filtro por estado - CONVERTIR TEXTO A ID
        if (estado && estado.trim()) {
            const estadoId = estadoMap[estado];
            if (estadoId) {
                query += ` AND p.id_estado_equipo = @estadoId`;
                request.input('estadoId', sql.Int, estadoId);
                console.log('📊 Filtro estado:', estado, '-> ID:', estadoId);
            } else {
                console.log('⚠️ Estado no reconocido:', estado);
            }
        }
        
        // Filtro por condición
        if (condicion && condicion.trim()) {
            query += ` AND p.condicion = @condicion`;
            request.input('condicion', sql.NVarChar, condicion);
            console.log('🔧 Filtro condición:', condicion);
        }
        
        // Filtro por bodega
        if (bodega_id && !isNaN(parseInt(bodega_id))) {
            query += ` AND EXISTS (SELECT 1 FROM INV.producto_bodega pb WHERE pb.producto_id = p.id AND pb.bodega_id = @bodegaId)`;
            request.input('bodegaId', sql.Int, parseInt(bodega_id));
            console.log('📦 Filtro bodega_id:', bodega_id);
        }
        
        query += ` ORDER BY p.fecha_creacion DESC`;
        
        console.log('📝 Query SQL:', query);
        
        const result = await request.query(query);
        console.log(`✅ ${result.recordset.length} productos encontrados`);
        
        // Agregar estado en texto a cada producto
        const productos = result.recordset.map(producto => ({
            ...producto,
            estado: getEstadoTexto(producto.id_estado_equipo)
        }));
        
        // Para cada producto, obtener bodega principal
        const productosConBodega = await Promise.all(productos.map(async (producto) => {
            try {
                const bodegaResult = await pool.request()
                    .input('producto_id', sql.Int, producto.id)
                    .query(`
                        SELECT TOP 1 
                            b.id,
                            b.nombre
                        FROM [INV].[producto_bodega] pb WITH (NOLOCK)
                        INNER JOIN [INV].[bodegas] b WITH (NOLOCK) ON pb.bodega_id = b.id
                        WHERE pb.producto_id = @producto_id
                    `);
                
                return {
                    ...producto,
                    bodega_id: bodegaResult.recordset[0]?.id || null,
                    bodega_nombre: bodegaResult.recordset[0]?.nombre || 'Sin bodega'
                };
            } catch (err) {
                console.error(`Error obteniendo bodega para producto ${producto.id}:`, err.message);
                return {
                    ...producto,
                    bodega_id: null,
                    bodega_nombre: 'Sin bodega'
                };
            }
        }));

        res.json({
            success: true,
            data: productosConBodega
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
    /**
     * Obtener producto por ID
     */
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
    
                    FROM [INV].[productos] p WITH (NOLOCK)
                    WHERE p.id = @id
                `);

            if (productoResult.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const producto = productoResult.recordset[0];

            const bodegasResult = await pool.request()
                .input('producto_id', sql.Int, id)
                .query(`
                    SELECT b.id, b.nombre, b.ubicacion, b.responsable, pb.cantidad as stock_en_bodega
                    FROM [INV].[producto_bodega] pb WITH (NOLOCK)
                    INNER JOIN [INV].[bodegas] b WITH (NOLOCK) ON pb.bodega_id = b.id
                    WHERE pb.producto_id = @producto_id
                `);

            const mantencionesResult = await pool.request()
                .input('producto_id', sql.Int, id)
                .query(`
                    SELECT id, producto_id, tipo, fecha_inicio, fecha_fin, responsable, descripcion, costo
                    FROM [INV].[mantenciones] WITH (NOLOCK)
                    WHERE producto_id = @producto_id
                    ORDER BY fecha_inicio DESC
                `);

            res.json({
                success: true,
                data: {
                    ...producto,
                    bodegas: bodegasResult.recordset,
                    historial_mantenciones: mantencionesResult.recordset,
                    tiene_mantencion_activa: mantencionesResult.recordset.some(m => !m.fecha_fin)
                }
            });

        } catch (error) {
            console.error('❌ Error en getProductoById:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Crear nuevo producto
     */
    createProducto: async (req, res) => {
        try {
            console.log('📥 POST /api/productos - Creando producto');
            console.log('📥 Body recibido:', req.body);
            
            const { 
                nombre, precio, oc_numero, factura_numero,
                descripcion, marca, codigo_qr, modelo, numero_serie, 
                condicion, bodega_id
            } = req.body;

            if (!nombre) {
                return res.status(400).json({ success: false, message: 'El nombre del producto es requerido' });
            }

            const pool = await getConnection();
            const transaction = pool.transaction();
            await transaction.begin();

            try {
                const productoResult = await transaction.request()
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
                    .input('estado', sql.NVarChar, 'DISPONIBLE')
                    .input('cantidad', sql.Int, cantidad || 0)
                    .query(`
                        INSERT INTO [INV].[productos] (
                            nombre, precio, oc_numero, factura_numero, descripcion, 
                            marca, codigo_qr, modelo, numero_serie, condicion, estado,  fecha_creacion
                        )
                        OUTPUT INSERTED.*
                        VALUES (
                            @nombre, @precio, @oc_numero, @factura_numero, @descripcion,
                            @marca, @codigo_qr, @modelo, @numero_serie, @condicion, @estado, GETDATE()
                        )
                    `);

                const nuevoProducto = productoResult.recordset[0];

                if (bodega_id && cantidad > 0) {
                    await transaction.request()
                        .input('producto_id', sql.Int, nuevoProducto.id)
                        .input('bodega_id', sql.Int, bodega_id)
                        .input('cantidad', sql.Int, cantidad)
                        .query(`
                            INSERT INTO [INV].[producto_bodega] (producto_id, bodega_id, cantidad)
                            VALUES (@producto_id, @bodega_id, @cantidad)
                        `);
                }

                await transaction.commit();
                console.log('✅ Producto creado:', nuevoProducto);

                res.json({ success: true, message: 'Producto creado exitosamente', data: nuevoProducto });

            } catch (error) {
                await transaction.rollback();
                throw error;
            }

        } catch (error) {
            console.error('❌ Error en createProducto:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

// src/services/productos.js - Versión corregida

// Listar productos con búsqueda opcional
getProductos: async (search = '', filters = {}) => {
    try {
        const params = { search };
        
        if (filters.marca) params.marca = filters.marca;
        if (filters.estado) params.estado = filters.estado;
        if (filters.condicion) params.condicion = filters.condicion;
        if (filters.bodega_id) params.bodega_id = filters.bodega_id;
        
        console.log('📤 Enviando filtros:', params);
        
        const response = await api.get('/productos', { params });
        
        if (response.data && response.data.success) {
            return response.data.data.map(producto => ({
                id: producto.id,
                nombre: producto.nombre || '',
                cantidad: producto.cantidad || 0,  // ✅ Cambiado: usar cantidad
                precio: producto.precio || 0,
                oc_numero: producto.oc_numero || '',
                factura_numero: producto.factura_numero || '',
                descripcion: producto.descripcion || '',
                marca: producto.marca || '',
                estado: producto.estado || 'DISPONIBLE',
                modelo: producto.modelo || '',
                numero_serie: producto.numero_serie || '',
                condicion: producto.condicion || 'NUEVO',
                fecha_adquisicion: producto.fecha_adquisicion || '',
                fecha_creacion: producto.fecha_creacion || null,
                bodega_id: producto.bodega_id || null,
                bodega_nombre: producto.bodega_nombre || 'Sin bodega',
                bodegas: producto.bodegas || [],
                imagen_path: producto.imagen_path || null,
                historial_uso: producto.historial_uso || [],
                historial_mantenciones: producto.historial_mantenciones || [],
                tiene_mantencion_activa: producto.tiene_mantencion_activa || false,
                colaborador_asignado: producto.colaborador_asignado || null,
                fecha_baja: producto.fecha_baja || null,
                motivo_baja: producto.motivo_baja || null,
                fecha_donacion: producto.fecha_donacion || null,
                beneficiario: producto.beneficiario || null,
                tipo_disposicion: producto.tipo_disposicion || null
            }));
        }
        
        if (Array.isArray(response.data)) {
            return response.data.map(producto => ({
                id: producto.id,
                nombre: producto.nombre || '',
                cantidad: producto.cantidad || 0,  // ✅ Cambiado: usar cantidad
                precio: producto.precio || 0,
                oc_numero: producto.oc_numero || '',
                factura_numero: producto.factura_numero || '',
                descripcion: producto.descripcion || '',
                marca: producto.marca || '',
                estado: producto.estado || 'DISPONIBLE',
                modelo: producto.modelo || '',
                numero_serie: producto.numero_serie || '',
                condicion: producto.condicion || 'NUEVO',
                fecha_adquisicion: producto.fecha_adquisicion || '',
                fecha_creacion: producto.fecha_creacion || null,
                bodega_id: producto.bodega_id || null,
                bodega_nombre: producto.bodega_nombre || 'Sin bodega',
                bodegas: producto.bodegas || [],
                imagen_path: producto.imagen_path || null,
                historial_uso: producto.historial_uso || [],
                historial_mantenciones: producto.historial_mantenciones || [],
                tiene_mantencion_activa: producto.tiene_mantencion_activa || false,
                colaborador_asignado: producto.colaborador_asignado || null,
                fecha_baja: producto.fecha_baja || null,
                motivo_baja: producto.motivo_baja || null,
                fecha_donacion: producto.fecha_donacion || null,
                beneficiario: producto.beneficiario || null,
                tipo_disposicion: producto.tipo_disposicion || null
            }));
        }
        
        return [];
    } catch (error) {
        console.error('Error en getProductos:', error);
        throw error;
    }
},

// Obtener producto por ID
getProductoById: async (id) => {
    try {
        const response = await api.get(`/productos/${id}`);
        
        if (response.data && response.data.success) {
            const producto = response.data.data;
            return {
                id: producto.id,
                nombre: producto.nombre || '',
                cantidad: producto.cantidad || 0,  // ✅ Cambiado: usar cantidad
                precio: producto.precio || 0,
                oc_numero: producto.oc_numero || '',
                factura_numero: producto.factura_numero || '',
                descripcion: producto.descripcion || '',
                marca: producto.marca || '',
                estado: producto.estado || 'DISPONIBLE',
                modelo: producto.modelo || '',
                numero_serie: producto.numero_serie || '',
                condicion: producto.condicion || 'NUEVO',
                fecha_adquisicion: producto.fecha_adquisicion || '',
                fecha_creacion: producto.fecha_creacion || null,
                bodega_id: producto.bodega_id || null,
                bodega_nombre: producto.bodega_nombre || 'Sin bodega',
                bodegas: producto.bodegas || [],
                imagen_path: producto.imagen_path || null,
                historial_uso: producto.historial_uso || [],
                historial_mantenciones: producto.historial_mantenciones || [],
                tiene_mantencion_activa: producto.tiene_mantencion_activa || false,
                colaborador_asignado: producto.colaborador_asignado || null,
                fecha_baja: producto.fecha_baja || null,
                motivo_baja: producto.motivo_baja || null,
                fecha_donacion: producto.fecha_donacion || null,
                beneficiario: producto.beneficiario || null,
                tipo_disposicion: producto.tipo_disposicion || null
            };
        }
        return null;
    } catch (error) {
        console.error('Error en getProductoById:', error);
        throw error;
    }
},

// Crear nuevo producto
createProducto: async (productoData) => {
    try {
        console.log('📤 Creando producto:', productoData);
        
        const dataToSend = {
            nombre: productoData.nombre,
            cantidad: parseInt(productoData.cantidad) || 0,  // ✅ Cambiado: usar cantidad
            precio: parseFloat(productoData.precio) || 0,
            oc_numero: productoData.oc_numero || '',
            factura_numero: productoData.factura_numero || '',
            descripcion: productoData.descripcion || '',
            marca: productoData.marca || '',
            estado: productoData.estado || 'DISPONIBLE',
            modelo: productoData.modelo || '',
            numero_serie: productoData.numero_serie || '',
            condicion: productoData.condicion || 'NUEVO',
            bodega_id: productoData.bodega_id ? parseInt(productoData.bodega_id) : null
        };

        console.log('📤 Enviando datos al backend:', dataToSend);
        
        const response = await api.post('/productos', dataToSend, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ Respuesta create:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error en createProducto:', error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
},

// Actualizar producto
updateProducto: async (id, productoData) => {
    try {
        console.log(`📤 Actualizando producto ${id}:`, productoData);
        
        const dataToSend = {
            nombre: productoData.nombre,
            cantidad: parseInt(productoData.cantidad) || 0,  // ✅ Usar cantidad
            precio: parseFloat(productoData.precio) || 0,
            oc_numero: productoData.oc_numero || '',
            factura_numero: productoData.factura_numero || '',
            descripcion: productoData.descripcion || '',
            marca: productoData.marca || '',
            estado: productoData.estado || 'DISPONIBLE',
            modelo: productoData.modelo || '',
            numero_serie: productoData.numero_serie || '',
            condicion: productoData.condicion || 'NUEVO',
            bodega_id: productoData.bodega_id ? parseInt(productoData.bodega_id) : null
        };

        console.log('📤 Datos a enviar al backend:', JSON.stringify(dataToSend, null, 2));
        
        const response = await api.put(`/productos/${id}`, dataToSend);
        
        console.log('✅ Respuesta update:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error en updateProducto:', error);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
},

    /**
     * Eliminar producto
     */
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
                    .query('DELETE FROM [INV].[producto_bodega] WHERE producto_id = @producto_id');

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
                    COUNT(DISTINCT id) as totalProductos,
                    ISNULL(SUM(cantidad), 0) as totalUnidades,
                    ISNULL(SUM(precio * cantidad), 0) as valorTotal,
                    ISNULL(AVG(precio), 0) as precioPromedio,
                    SUM(CASE WHEN estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
                    SUM(CASE WHEN estado = 'ASIGNADO' THEN 1 ELSE 0 END) as asignados,
                    SUM(CASE WHEN estado LIKE '%MANTEN%' THEN 1 ELSE 0 END) as enMantencion,
                    SUM(CASE WHEN estado LIKE '%REPAR%' THEN 1 ELSE 0 END) as enReparacion,
                    SUM(CASE WHEN estado = 'DONADO' THEN 1 ELSE 0 END) as donados,
                    SUM(CASE WHEN estado = 'BAJA' THEN 1 ELSE 0 END) as baja
                FROM [INV].[productos] WITH (NOLOCK)
            `);

            const stats = result.recordset[0] || {};
            res.json({
                success: true,
                data: {
                    totalProductos: stats.totalProductos || 0,
                    totalUnidades: stats.totalUnidades || 0,
                    valorTotal: stats.valorTotal || 0,
                    precioPromedio: stats.precioPromedio || 0,
                    disponibles: stats.disponibles || 0,
                    asignados: stats.asignados || 0,
                    enMantencion: stats.enMantencion || 0,
                    enReparacion: stats.enReparacion || 0,
                    donados: stats.donados || 0,
                    baja: stats.baja || 0,
                    noDisponibles: (stats.donados || 0) + (stats.baja || 0),
                    bajoStock: 0,
                    agotados: 0
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
                    SELECT id, nombre, marca, modelo, numero_serie, estado, condicion, cantidad as stock, precio, codigo_qr
                    FROM [INV].[productos] WITH (NOLOCK)
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            res.json({ success: true, data: result.recordset[0] });

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
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('fecha_fin', sql.DateTime, new Date(fecha_fin))
                .query(`
                    UPDATE [INV].[mantenciones]
                    SET fecha_fin = @fecha_fin, updated_at = GETDATE()
                    OUTPUT INSERTED.*
                    WHERE id = @id
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

   // Reemplaza el método getHistorialDisposiciones con este código

getHistorialDisposiciones: async (req, res) => {
    try {
        console.log('📥 GET /api/productos/disposiciones');
        
        const pool = await getConnection();
        
        // Obtener bajas - usando fecha_baja como fecha, sin created_at
        const bajasResult = await pool.request()
            .query(`
                SELECT 
                    id,
                    producto_id,
                    motivo_baja as motivo,
                    fecha_baja as fecha,
                    autorizado_por,
                    observaciones
                FROM INV.disposicion_baja
                ORDER BY fecha_baja DESC
            `);
        
        // Obtener donaciones - usando fecha_entrega como fecha, sin created_at
        const donacionesResult = await pool.request()
            .query(`
                SELECT 
                    id,
                    producto_id,
                    beneficiario,
                    direccion,
                    fecha_entrega as fecha,
                    observaciones
                FROM INV.disposicion_donacion
                ORDER BY fecha_entrega DESC
            `);
        
        res.json({
            success: true,
            data: {
                bajas: bajasResult.recordset,
                donaciones: donacionesResult.recordset
            }
        });

    } catch (error) {
        console.error('❌ Error en getHistorialDisposiciones:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: { bajas: [], donaciones: [] }
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

            await pool.request()
                .input('id', sql.Int, producto_id)
                .input('estado', sql.NVarChar, 'BAJA')
                .query('UPDATE [INV].[productos] SET estado = @estado WHERE id = @id');

            await pool.request()
                .input('producto_id', sql.Int, producto_id)
                .query('DELETE FROM [INV].[producto_bodega] WHERE producto_id = @producto_id');

            res.json({ success: true, message: 'Baja registrada exitosamente' });

        } catch (error) {
            console.error('❌ Error en registrarBaja:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    registrarDonacion: async (req, res) => {
        try {
            const { producto_id, beneficiario, observaciones } = req.body;

            if (!producto_id) {
                return res.status(400).json({ success: false, message: 'El ID del producto es requerido' });
            }

            const pool = await getConnection();

            await pool.request()
                .input('id', sql.Int, producto_id)
                .input('estado', sql.NVarChar, 'DONADO')
                .query('UPDATE [INV].[productos] SET estado = @estado WHERE id = @id');

            await pool.request()
                .input('producto_id', sql.Int, producto_id)
                .query('DELETE FROM [INV].[producto_bodega] WHERE producto_id = @producto_id');

            res.json({ success: true, message: 'Donación registrada exitosamente' });

        } catch (error) {
            console.error('❌ Error en registrarDonacion:', error);
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
                    WHERE marca IS NOT NULL AND marca != ''
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
                    SELECT p.* FROM [INV].[productos] p WITH (NOLOCK)
                    WHERE p.estado = 'DISPONIBLE' AND p.cantidad > 0
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
                    SELECT p.* FROM [INV].[productos] p WITH (NOLOCK)
                    INNER JOIN [INV].[producto_bodega] pb WITH (NOLOCK) ON p.id = pb.producto_id
                    WHERE pb.bodega_id = @bodega_id AND pb.cantidad > 0
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
            const { estado } = req.body;

            if (!estado) {
                return res.status(400).json({ success: false, message: 'El estado es requerido' });
            }

            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('estado', sql.NVarChar, estado)
                .query(`
                    UPDATE [INV].[productos] SET estado = @estado
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);

            if (result.recordset.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            res.json({ success: true, message: 'Estado actualizado', data: result.recordset[0] });

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

            res.json({ success: true, message: 'Mantención finalizada', data: result.recordset[0] });

        } catch (error) {
            console.error('❌ Error finalizando mantención:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = productoController;