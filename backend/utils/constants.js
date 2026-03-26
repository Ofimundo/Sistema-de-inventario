// Estados posibles de un producto
const ESTADOS_PRODUCTO = {
    NUEVO: 'nuevo',
    USADO: 'usado',
    MANTENCION: 'mantencion',
    ASIGNADO: 'asignado',
    ELIMINADO: 'eliminado',
    DONADO: 'donado'
};

// Tipos de disposición final
const TIPOS_DISPOSICION = {
    DONACION: 'donacion',
    BAJA: 'baja'
};

// Monedas soportadas
const MONEDAS = {
    CLP: 'CLP',
    USD: 'USD',
    EUR: 'EUR'
};

// Roles de usuario
const ROLES = {
    ADMIN: 'admin',
    USUARIO: 'usuario',
    SUPERVISOR: 'supervisor'
};

// Acciones del historial
const ACCIONES_HISTORIAL = {
    CREADO: 'creado',
    MODIFICADO: 'modificado',
    ELIMINADO: 'eliminado',
    ASIGNADO: 'asignado',
    DEVUELTO: 'devuelto',
    DONADO: 'donado',
    BAJA: 'baja'
};

// Mensajes de error comunes
const ERROR_MESSAGES = {
    REQUIRED: 'El campo {field} es requerido',
    INVALID_EMAIL: 'El email no es válido',
    INVALID_RUT: 'El RUT no es válido',
    INVALID_PHONE: 'El teléfono no es válido',
    PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 6 caracteres',
    PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
    PRODUCT_NOT_FOUND: 'Producto no encontrado',
    USER_NOT_FOUND: 'Usuario no encontrado',
    UNAUTHORIZED: 'No autorizado',
    FORBIDDEN: 'Acceso denegado',
    SERVER_ERROR: 'Error en el servidor'
};

// Configuración de paginación
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

// Formatos de fecha
const DATE_FORMATS = {
    SHORT: 'DD/MM/YYYY',
    LONG: 'DD de MMMM de YYYY',
    DATETIME: 'DD/MM/YYYY HH:mm:ss',
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

// Colores para UI
const COLORS = {
    PRIMARY: '#1976d2',
    SECONDARY: '#dc004e',
    SUCCESS: '#4caf50',
    ERROR: '#f44336',
    WARNING: '#ff9800',
    INFO: '#2196f3',
    BACKGROUND: '#f5f5f5',
    PAPER: '#ffffff',
    TEXT_PRIMARY: '#212121',
    TEXT_SECONDARY: '#757575'
};

// Tamaños de archivos
const FILE_LIMITS = {
    IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png']
};

module.exports = {
    ESTADOS_PRODUCTO,
    TIPOS_DISPOSICION,
    MONEDAS,
    ROLES,
    ACCIONES_HISTORIAL,
    ERROR_MESSAGES,
    PAGINATION,
    DATE_FORMATS,
    COLORS,
    FILE_LIMITS
};