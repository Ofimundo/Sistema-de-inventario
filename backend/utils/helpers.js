/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (CLP, USD, EUR)
 * @returns {string} - Monto formateado
 */
const formatCurrency = (amount, currency = 'CLP') => {
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    return formatter.format(amount);
};

/**
 * Formatea una fecha
 * @param {Date|string} date - Fecha a formatear
 * @param {string} format - Formato (short, long, datetime)
 * @returns {string} - Fecha formateada
 */
const formatDate = (date, format = 'short') => {
    if (!date) return '';
    
    const d = new Date(date);
    
    switch(format) {
        case 'short':
            return d.toLocaleDateString('es-CL');
        case 'long':
            return d.toLocaleDateString('es-CL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'datetime':
            return d.toLocaleString('es-CL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        case 'iso':
            return d.toISOString();
        default:
            return d.toLocaleDateString('es-CL');
    }
};

/**
 * Genera un número de serie aleatorio
 * @param {string} prefix - Prefijo para el número de serie
 * @returns {string} - Número de serie generado
 */
const generateSerialNumber = (prefix = 'SN') => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} - true si es válido
 */
const validateRut = (rut) => {
    if (!rut) return false;
    
    // Limpiar RUT
    let rutClean = rut.toString().replace(/[.-]/g, '');
    
    // Validar formato
    if (!/^[0-9]+[0-9kK]{1}$/.test(rutClean)) return false;
    
    // Separar dígito verificador
    const rutDigits = rutClean.slice(0, -1);
    const dv = rutClean.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = rutDigits.length - 1; i >= 0; i--) {
        sum += parseInt(rutDigits.charAt(i)) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const dvCalculated = 11 - (sum % 11);
    const dvChar = dvCalculated === 11 ? '0' : dvCalculated === 10 ? 'K' : dvCalculated.toString();
    
    return dvChar === dv;
};

/**
 * Formatea un RUT chileno
 * @param {string} rut - RUT a formatear
 * @returns {string} - RUT formateado (12.345.678-9)
 */
const formatRut = (rut) => {
    if (!rut) return '';
    
    let rutClean = rut.toString().replace(/[.-]/g, '');
    
    if (rutClean.length < 2) return rutClean;
    
    const dv = rutClean.slice(-1);
    const rutDigits = rutClean.slice(0, -1);
    
    // Formatear con puntos
    let formatted = '';
    for (let i = rutDigits.length; i > 0; i -= 3) {
        if (i > 3) {
            formatted = '.' + rutDigits.slice(i - 3, i) + formatted;
        } else {
            formatted = rutDigits.slice(0, i) + formatted;
        }
    }
    
    return `${formatted}-${dv}`;
};

/**
 * Genera un ID único
 * @returns {string} - ID único
 */
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} length - Longitud máxima
 * @returns {string} - Texto truncado
 */
const truncateText = (text, length = 50) => {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

/**
 * Convierte texto a slug para URLs
 * @param {string} text - Texto a convertir
 * @returns {string} - Slug generado
 */
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Obtiene el estado de un producto en español
 * @param {string} estado - Código del estado
 * @returns {string} - Estado en español
 */
const getEstadoProducto = (estado) => {
    const estados = {
        'nuevo': 'Nuevo',
        'usado': 'Usado',
        'mantencion': 'En Mantención',
        'asignado': 'Asignado',
        'eliminado': 'Eliminado',
        'donado': 'Donado'
    };
    return estados[estado] || estado;
};

/**
 * Obtiene el color del estado para UI
 * @param {string} estado - Código del estado
 * @returns {string} - Color en hex
 */
const getEstadoColor = (estado) => {
    const colores = {
        'nuevo': '#4caf50',
        'usado': '#ff9800',
        'mantencion': '#2196f3',
        'asignado': '#9c27b0',
        'eliminado': '#f44336',
        'donado': '#009688'
    };
    return colores[estado] || '#757575';
};

/**
 * Agrupa un array por una propiedad
 * @param {Array} array - Array a agrupar
 * @param {string} key - Propiedad para agrupar
 * @returns {Object} - Objeto agrupado
 */
const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
};

/**
 * Ordena un array por una propiedad
 * @param {Array} array - Array a ordenar
 * @param {string} key - Propiedad para ordenar
 * @param {string} order - 'asc' o 'desc'
 * @returns {Array} - Array ordenado
 */
const sortBy = (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
        if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
        return 0;
    });
};

module.exports = {
    formatCurrency,
    formatDate,
    generateSerialNumber,
    validateRut,
    formatRut,
    generateId,
    truncateText,
    slugify,
    getEstadoProducto,
    getEstadoColor,
    groupBy,
    sortBy
};