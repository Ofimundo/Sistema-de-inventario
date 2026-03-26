// backend/controllers/estadosController.js
const db = require('../models');

const estadosController = {
    // Obtener todos los estados
    getAll: async (req, res) => {
        try {
            console.log('📥 GET /api/estados');
            
            const estados = await db.Estado.findAll({
                order: [['nombre', 'ASC']]
            });
            
            console.log(`✅ ${estados.length} estados encontrados`);
            
            res.json({
                success: true,
                data: estados,
                message: 'Estados obtenidos correctamente'
            });
        } catch (error) {
            console.error('❌ Error en getAll estados:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estados',
                error: error.message
            });
        }
    },

    // Obtener estados activos
    getActivos: async (req, res) => {
        try {
            const estados = await db.Estado.findAll({
                where: { activo: true },
                order: [['nombre', 'ASC']]
            });
            
            res.json({
                success: true,
                data: estados,
                message: 'Estados activos obtenidos correctamente'
            });
        } catch (error) {
            console.error('Error en getActivos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estados activos'
            });
        }
    },

    // Obtener estados que permiten asignación
    getPermitenAsignacion: async (req, res) => {
        try {
            const estados = await db.Estado.findAll({
                where: { permite_asignacion: true, activo: true },
                order: [['nombre', 'ASC']]
            });
            
            res.json({
                success: true,
                data: estados,
                message: 'Estados que permiten asignación obtenidos correctamente'
            });
        } catch (error) {
            console.error('Error en getPermitenAsignacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estados que permiten asignación'
            });
        }
    },

    // Obtener estado por nombre
    getByNombre: async (req, res) => {
        try {
            const { nombre } = req.params;
            
            const estado = await db.Estado.findOne({
                where: { nombre: nombre.toUpperCase() }
            });
            
            if (!estado) {
                return res.status(404).json({
                    success: false,
                    message: 'Estado no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: estado,
                message: 'Estado obtenido correctamente'
            });
        } catch (error) {
            console.error('Error en getByNombre:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estado por nombre'
            });
        }
    },

    // Obtener estado por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const estado = await db.Estado.findByPk(id);
            
            if (!estado) {
                return res.status(404).json({
                    success: false,
                    message: 'Estado no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: estado,
                message: 'Estado obtenido correctamente'
            });
        } catch (error) {
            console.error('Error en getById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estado por ID'
            });
        }
    },

    // Crear nuevo estado
    create: async (req, res) => {
        try {
            const { nombre, color, permite_asignacion, activo } = req.body;
            
            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre es requerido'
                });
            }
            
            const nuevoEstado = await db.Estado.create({
                nombre,
                color: color || '#cccccc',
                permite_asignacion: permite_asignacion || false,
                activo: activo !== undefined ? activo : true
            });
            
            res.status(201).json({
                success: true,
                data: nuevoEstado,
                message: 'Estado creado correctamente'
            });
        } catch (error) {
            console.error('Error en create:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear estado'
            });
        }
    },

    // Actualizar estado
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, color, permite_asignacion, activo } = req.body;
            
            const [affectedCount, affectedRows] = await db.Estado.update(
                { nombre, color, permite_asignacion, activo },
                { where: { id: parseInt(id) } }
            );
            
            if (affectedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estado no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: affectedRows[0],
                message: 'Estado actualizado correctamente'
            });
        } catch (error) {
            console.error('Error en update:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado'
            });
        }
    },

    // Eliminar estado
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            
            const deletedCount = await db.Estado.destroy({
                where: { id: parseInt(id) }
            });
            
            if (deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Estado no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Estado eliminado correctamente'
            });
        } catch (error) {
            console.error('Error en delete:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar estado'
            });
        }
    }
};

module.exports = estadosController;