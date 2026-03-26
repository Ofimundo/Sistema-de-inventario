// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

/**
 * @route   GET /api/dashboard/resumen
 * @desc    Obtener resumen general del dashboard
 * @access  Private
 */
router.get('/resumen', dashboardController.getResumen);

/**
 * @route   GET /api/dashboard/graficos/asignaciones
 * @desc    Obtener datos para gráfico de asignaciones
 * @access  Private
 */
router.get('/graficos/asignaciones', dashboardController.getGraficoAsignaciones);

/**
 * @route   GET /api/dashboard/graficos/productos
 * @desc    Obtener datos para gráfico de productos
 * @access  Private
 */
router.get('/graficos/productos', dashboardController.getGraficoProductos);

/**
 * @route   GET /api/dashboard/ultimos-movimientos
 * @desc    Obtener últimos movimientos
 * @access  Private
 */
router.get('/ultimos-movimientos', dashboardController.getUltimosMovimientos);

/**
 * @route   GET /api/dashboard/productos-mas-asignados
 * @desc    Obtener productos más asignados
 * @access  Private
 */
router.get('/productos-mas-asignados', dashboardController.getProductosMasAsignados);

/**
 * @route   GET /api/dashboard/alertas
 * @desc    Obtener alertas (stock bajo, etc.)
 * @access  Private
 */
router.get('/alertas', dashboardController.getAlertas);

module.exports = router;