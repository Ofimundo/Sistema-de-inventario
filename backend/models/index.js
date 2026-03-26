// backend/models/index.js
const { getConnection, sql } = require('../config/database');

// Modelo Estado
const Estado = {
    // Obtener todos los estados
    findAll: async (options = {}) => {
        try {
            const pool = await getConnection();
            
            let query = `
                SELECT 
                    id, 
                    nombre, 
                    color,
                    permite_asignacion,
                    activo
                FROM INV.estados_equipos
            `;
            
            const conditions = [];
            const request = pool.request();
            
            if (options.where) {
                if (options.where.activo === true) {
                    conditions.push("activo = 1");
                }
                if (options.where.permite_asignacion === true) {
                    conditions.push("permite_asignacion = 1");
                }
            }
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            if (options.order) {
                query += ' ORDER BY nombre ASC';
            }
            
            const result = await request.query(query);
            return result.recordset;
            
        } catch (error) {
            console.error('Error en Estado.findAll:', error);
            throw error;
        }
    },

    // Buscar un estado por criterios
    findOne: async (options) => {
        try {
            const pool = await getConnection();
            const request = pool.request();
            
            let query = `
                SELECT 
                    id, 
                    nombre, 
                    color,
                    permite_asignacion,
                    activo
                FROM INV.estados_equipos 
                WHERE 
            `;
            
            if (options.where) {
                if (options.where.nombre) {
                    query += 'nombre = @nombre';
                    request.input('nombre', sql.NVarChar, options.where.nombre);
                } else if (options.where.id) {
                    query += 'id = @id';
                    request.input('id', sql.Int, options.where.id);
                }
            }
            
            const result = await request.query(query);
            return result.recordset[0] || null;
            
        } catch (error) {
            console.error('Error en Estado.findOne:', error);
            throw error;
        }
    },

    // Buscar por ID
    findByPk: async (id) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        id, 
                        nombre, 
                        color,
                        permite_asignacion,
                        activo
                    FROM INV.estados_equipos 
                    WHERE id = @id
                `);
            
            return result.recordset[0] || null;
            
        } catch (error) {
            console.error('Error en Estado.findByPk:', error);
            throw error;
        }
    },

    // Crear nuevo estado
    create: async (data) => {
        try {
            const pool = await getConnection();
            const request = pool.request();
            
            const query = `
                INSERT INTO INV.estados_equipos 
                    (nombre, color, permite_asignacion, activo, created_at)
                OUTPUT INSERTED.*
                VALUES 
                    (@nombre, @color, @permite_asignacion, @activo, GETDATE())
            `;
            
            request.input('nombre', sql.NVarChar, data.nombre?.toUpperCase());
            request.input('color', sql.NVarChar, data.color || '#cccccc');
            request.input('permite_asignacion', sql.Bit, data.permite_asignacion ? 1 : 0);
            request.input('activo', sql.Bit, data.activo !== undefined ? (data.activo ? 1 : 0) : 1);
            
            const result = await request.query(query);
            return result.recordset[0];
            
        } catch (error) {
            console.error('Error en Estado.create:', error);
            throw error;
        }
    },

    // Actualizar estado
    update: async (data, options) => {
        try {
            const pool = await getConnection();
            const request = pool.request();
            
            const updates = [];
            if (data.nombre) {
                updates.push("nombre = @nombre");
                request.input('nombre', sql.NVarChar, data.nombre?.toUpperCase());
            }
            if (data.color) {
                updates.push("color = @color");
                request.input('color', sql.NVarChar, data.color);
            }
            if (data.permite_asignacion !== undefined) {
                updates.push("permite_asignacion = @permite_asignacion");
                request.input('permite_asignacion', sql.Bit, data.permite_asignacion ? 1 : 0);
            }
            if (data.activo !== undefined) {
                updates.push("activo = @activo");
                request.input('activo', sql.Bit, data.activo ? 1 : 0);
            }
            
            updates.push("updated_at = GETDATE()");
            
            const query = `
                UPDATE INV.estados_equipos 
                SET ${updates.join(', ')}
                OUTPUT INSERTED.*
                WHERE id = @id
            `;
            
            request.input('id', sql.Int, options.where.id);
            
            const result = await request.query(query);
            return [result.rowsAffected[0], result.recordset];
            
        } catch (error) {
            console.error('Error en Estado.update:', error);
            throw error;
        }
    },

    // Eliminar estado
    destroy: async (options) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, options.where.id)
                .query('DELETE FROM INV.estados_equipos WHERE id = @id');
            
            return result.rowsAffected[0];
            
        } catch (error) {
            console.error('Error en Estado.destroy:', error);
            throw error;
        }
    }
};

// Modelo Producto
const Producto = {
    findAll: async (options = {}) => {
        try {
            const pool = await getConnection();
            let query = `
                SELECT 
                    p.*,
                    b.nombre as bodega_nombre,
                    e.nombre as estado_nombre,
                    e.color as estado_color
                FROM INV.productos p
                LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                LEFT JOIN INV.estados_equipos e ON p.estado_id = e.id
            `;
            
            const conditions = [];
            const request = pool.request();
            
            if (options.where) {
                if (options.where.estado_id) {
                    conditions.push("p.estado_id = @estado_id");
                    request.input('estado_id', sql.Int, options.where.estado_id);
                }
                if (options.where.bodega_id) {
                    conditions.push("p.bodega_id = @bodega_id");
                    request.input('bodega_id', sql.Int, options.where.bodega_id);
                }
            }
            
            if (options.search) {
                conditions.push(`(
                    p.nombre LIKE @search OR 
                    p.numero_serie LIKE @search OR 
                    p.codigo_qr LIKE @search OR 
                    p.marca LIKE @search OR 
                    p.modelo LIKE @search
                )`);
                request.input('search', sql.NVarChar, `%${options.search}%`);
            }
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            if (options.order) {
                query += ' ORDER BY ' + options.order;
            } else {
                query += ' ORDER BY p.id DESC';
            }
            
            const result = await request.query(query);
            return result.recordset;
            
        } catch (error) {
            console.error('Error en Producto.findAll:', error);
            throw error;
        }
    },

    findByPk: async (id) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT 
                        p.*,
                        b.nombre as bodega_nombre,
                        e.nombre as estado_nombre,
                        e.color as estado_color
                    FROM INV.productos p
                    LEFT JOIN INV.bodegas b ON p.bodega_id = b.id
                    LEFT JOIN INV.estados_equipos e ON p.estado_id = e.id
                    WHERE p.id = @id
                `);
            
            return result.recordset[0] || null;
            
        } catch (error) {
            console.error('Error en Producto.findByPk:', error);
            throw error;
        }
    },

    create: async (data) => {
        try {
            const pool = await getConnection();
            const request = pool.request();
            
            // Construir query dinámicamente
            const fields = [];
            const values = [];
            const inputs = [];
            
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null && key !== 'id') {
                    fields.push(key);
                    values.push(`@${key}`);
                    let type = sql.NVarChar;
                    
                    if (key === 'stock' || key === 'stock_minimo' || key === 'stock_maximo' || key === 'estado_id' || key === 'bodega_id') {
                        type = sql.Int;
                    } else if (key === 'precio') {
                        type = sql.Decimal(10, 2);
                    }
                    
                    request.input(key, type, data[key]);
                }
            });
            
            fields.push('created_at', 'updated_at');
            values.push('GETDATE()', 'GETDATE()');
            
            const query = `
                INSERT INTO INV.productos (${fields.join(', ')})
                OUTPUT INSERTED.*
                VALUES (${values.join(', ')})
            `;
            
            const result = await request.query(query);
            return result.recordset[0];
            
        } catch (error) {
            console.error('Error en Producto.create:', error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            const pool = await getConnection();
            const request = pool.request();
            
            const updates = [];
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && key !== 'id' && key !== 'created_at') {
                    updates.push(`${key} = @${key}`);
                    let type = sql.NVarChar;
                    
                    if (key === 'stock' || key === 'stock_minimo' || key === 'stock_maximo' || key === 'estado_id' || key === 'bodega_id') {
                        type = sql.Int;
                    } else if (key === 'precio') {
                        type = sql.Decimal(10, 2);
                    }
                    
                    request.input(key, type, data[key]);
                }
            });
            
            updates.push("updated_at = GETDATE()");
            request.input('id', sql.Int, id);
            
            const query = `
                UPDATE INV.productos 
                SET ${updates.join(', ')}
                OUTPUT INSERTED.*
                WHERE id = @id
            `;
            
            const result = await request.query(query);
            return result.recordset[0];
            
        } catch (error) {
            console.error('Error en Producto.update:', error);
            throw error;
        }
    },

    destroy: async (id) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM INV.productos WHERE id = @id');
            
            return result.rowsAffected[0];
            
        } catch (error) {
            console.error('Error en Producto.destroy:', error);
            throw error;
        }
    },

    getStats: async () => {
        try {
            const pool = await getConnection();
            const result = await pool.request().query(`
                SELECT 
                    COUNT(DISTINCT id) as totalProductos,
                    SUM(stock) as totalUnidades,
                    SUM(CASE WHEN estado_id = 1 THEN stock ELSE 0 END) as disponibles,
                    SUM(CASE WHEN estado_id = 2 THEN stock ELSE 0 END) as asignados,
                    SUM(CASE WHEN estado_id = 3 THEN stock ELSE 0 END) as enMantencion,
                    SUM(CASE WHEN estado_id = 4 THEN stock ELSE 0 END) as enReparacion,
                    SUM(CASE WHEN estado_id = 5 THEN stock ELSE 0 END) as noDisponibles,
                    SUM(CASE WHEN stock > 0 AND stock < stock_minimo THEN 1 ELSE 0 END) as bajoStock,
                    SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as agotados,
                    SUM(precio * stock) as valorTotal,
                    AVG(precio) as precioPromedio
                FROM INV.productos
            `);
            
            return result.recordset[0] || {};
            
        } catch (error) {
            console.error('Error en Producto.getStats:', error);
            throw error;
        }
    }
};

// Modelo Bodega
const Bodega = {
    findAll: async () => {
        try {
            const pool = await getConnection();
            const result = await pool.request().query(`
                SELECT * FROM INV.bodegas WHERE activo = 1 ORDER BY nombre
            `);
            return result.recordset;
        } catch (error) {
            console.error('Error en Bodega.findAll:', error);
            throw error;
        }
    },

    findByPk: async (id) => {
        try {
            const pool = await getConnection();
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT * FROM INV.bodegas WHERE id = @id');
            
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error en Bodega.findByPk:', error);
            throw error;
        }
    }
};

// Exportar todos los modelos
module.exports = {
    Estado,
    Producto,
    Bodega,
    sql,
    getConnection
};