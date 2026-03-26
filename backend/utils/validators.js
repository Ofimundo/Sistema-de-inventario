/**
 * Valida que un campo no esté vacío
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
const required = (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
        return {
            valid: false,
            message: `El campo ${fieldName} es requerido`
        };
    }
    return { valid: true };
};

/**
 * Valida la longitud mínima de un texto
 * @param {string} value - Texto a validar
 * @param {number} min - Longitud mínima
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
const minLength = (value, min, fieldName) => {
    if (value && value.length < min) {
        return {
            valid: false,
            message: `El campo ${fieldName} debe tener al menos ${min} caracteres`
        };
    }
    return { valid: true };
};

/**
 * Valida la longitud máxima de un texto
 * @param {string} value - Texto a validar
 * @param {number} max - Longitud máxima
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
const maxLength = (value, max, fieldName) => {
    if (value && value.length > max) {
        return {
            valid: false,
            message: `El campo ${fieldName} no puede tener más de ${max} caracteres`
        };
    }
    return { valid: true };
};

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {Object} - Resultado de la validación
 */
const email = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !regex.test(email)) {
        return {
            valid: false,
            message: 'El email no es válido'
        };
    }
    return { valid: true };
};

/**
 * Valida un número de teléfono chileno
 * @param {string} phone - Teléfono a validar
 * @returns {Object} - Resultado de la validación
 */
const phone = (phone) => {
    if (!phone) return { valid: true };
    
    const regex = /^(\+?56)?(\s?)(0?9)(\s?)[98765432]\d{7}$/;
    if (!regex.test(phone.replace(/\s/g, ''))) {
        return {
            valid: false,
            message: 'El teléfono no es válido (formato: +56912345678)'
        };
    }
    return { valid: true };
};

/**
 * Valida un número entero positivo
 * @param {number} value - Número a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
const positiveInteger = (value, fieldName) => {
    if (value === undefined || value === null) return { valid: true };
    
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < 0) {
        return {
            valid: false,
            message: `El campo ${fieldName} debe ser un número entero positivo`
        };
    }
    return { valid: true };
};

/**
 * Valida un precio
 * @param {number} value - Precio a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
const price = (value, fieldName) => {
    if (value === undefined || value === null) return { valid: true };
    
    const num = Number(value);
    if (isNaN(num) || num < 0) {
        return {
            valid: false,
            message: `El campo ${fieldName} debe ser un número positivo`
        };
    }
    return { valid: true };
};

/**
 * Valida una fecha
 * @param {string|Date} date - Fecha a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
const date = (date, fieldName) => {
    if (!date) return { valid: true };
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return {
            valid: false,
            message: `El campo ${fieldName} no es una fecha válida`
        };
    }
    return { valid: true };
};

/**
 * Valida que una fecha no sea futura
 * @param {string|Date} date - Fecha a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
const notFuture = (date, fieldName) => {
    if (!date) return { valid: true };
    
    const d = new Date(date);
    const now = new Date();
    
    if (d > now) {
        return {
            valid: false,
            message: `El campo ${fieldName} no puede ser una fecha futura`
        };
    }
    return { valid: true };
};

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {Object} - Resultado de la validación
 */
const rut = (rut) => {
    if (!rut) return { valid: true };
    
    // Limpiar RUT
    let rutClean = rut.toString().replace(/[.-]/g, '');
    
    // Validar formato
    if (!/^[0-9]+[0-9kK]{1}$/.test(rutClean)) {
        return {
            valid: false,
            message: 'El RUT no tiene un formato válido'
        };
    }
    
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
    
    if (dvChar !== dv) {
        return {
            valid: false,
            message: 'El RUT no es válido'
        };
    }
    
    return { valid: true };
};

/**
 * Valida múltiples campos a la vez
 * @param {Object} data - Objeto con los datos a validar
 * @param {Array} rules - Array de reglas de validación
 * @returns {Object} - Resultado de la validación
 */
const validate = (data, rules) => {
    const errors = {};
    
    for (const rule of rules) {
        const { field, validations } = rule;
        const value = data[field];
        
        for (const validation of validations) {
            const result = validation.validate(value, validation.fieldName || field);
            if (!result.valid) {
                if (!errors[field]) {
                    errors[field] = [];
                }
                errors[field].push(result.message);
            }
        }
    }
    
    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};

module.exports = {
    required,
    minLength,
    maxLength,
    email,
    phone,
    positiveInteger,
    price,
    date,
    notFuture,
    rut,
    validate
};