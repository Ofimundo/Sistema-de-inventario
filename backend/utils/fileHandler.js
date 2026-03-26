const fs = require('fs');
const path = require('path');
const { FILE_LIMITS } = require('./constants');

/**
 * Guarda un archivo en el servidor
 * @param {Object} file - Archivo a guardar (de multer)
 * @param {string} folder - Carpeta destino
 * @returns {Promise<string>} - Ruta del archivo guardado
 */
const saveFile = async (file, folder = 'uploads') => {
    return new Promise((resolve, reject) => {
        try {
            // Crear carpeta si no existe
            const uploadDir = path.join(__dirname, '../../', folder);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Generar nombre único
            const extension = path.extname(file.originalname);
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${extension}`;
            const filePath = path.join(uploadDir, fileName);

            // Guardar archivo
            fs.writeFile(filePath, file.buffer, (err) => {
                if (err) reject(err);
                else resolve(path.join(folder, fileName));
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Elimina un archivo del servidor
 * @param {string} filePath - Ruta del archivo a eliminar
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const deleteFile = async (filePath) => {
    return new Promise((resolve, reject) => {
        if (!filePath) {
            resolve(false);
            return;
        }

        const fullPath = path.join(__dirname, '../../', filePath);
        
        fs.unlink(fullPath, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // Archivo no existe, considerar como eliminado
                    resolve(false);
                } else {
                    reject(err);
                }
            } else {
                resolve(true);
            }
        });
    });
};

/**
 * Valida un archivo según su tipo y tamaño
 * @param {Object} file - Archivo a validar
 * @param {string} type - Tipo de archivo ('image' o 'document')
 * @returns {Object} - Resultado de la validación
 */
const validateFile = (file, type = 'image') => {
    if (!file) {
        return { valid: false, message: 'No se proporcionó archivo' };
    }

    // Validar tamaño
    const maxSize = type === 'image' ? FILE_LIMITS.IMAGE_MAX_SIZE : FILE_LIMITS.DOCUMENT_MAX_SIZE;
    if (file.size > maxSize) {
        const sizeMB = maxSize / (1024 * 1024);
        return {
            valid: false,
            message: `El archivo no puede ser mayor a ${sizeMB}MB`
        };
    }

    // Validar tipo
    const allowedTypes = type === 'image' ? FILE_LIMITS.ALLOWED_IMAGE_TYPES : FILE_LIMITS.ALLOWED_DOCUMENT_TYPES;
    if (!allowedTypes.includes(file.mimetype)) {
        return {
            valid: false,
            message: `Tipo de archivo no permitido. Formatos aceptados: ${allowedTypes.join(', ')}`
        };
    }

    return { valid: true };
};

/**
 * Obtiene la URL pública de un archivo
 * @param {string} filePath - Ruta del archivo
 * @param {string} baseUrl - URL base del servidor
 * @returns {string} - URL completa del archivo
 */
const getFileUrl = (filePath, baseUrl = '') => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    
    // Limpiar la ruta
    const cleanPath = filePath.replace(/^[\/\\]/, '').replace(/\\/g, '/');
    return `${baseUrl}/${cleanPath}`;
};

/**
 * Lista los archivos en una carpeta
 * @param {string} folder - Carpeta a listar
 * @returns {Promise<Array>} - Lista de archivos
 */
const listFiles = async (folder = 'uploads') => {
    return new Promise((resolve, reject) => {
        const uploadDir = path.join(__dirname, '../../', folder);
        
        if (!fs.existsSync(uploadDir)) {
            resolve([]);
            return;
        }

        fs.readdir(uploadDir, (err, files) => {
            if (err) reject(err);
            else {
                const filesInfo = files.map(file => {
                    const filePath = path.join(uploadDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: path.join(folder, file),
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                });
                resolve(filesInfo);
            }
        });
    });
};

module.exports = {
    saveFile,
    deleteFile,
    validateFile,
    getFileUrl,
    listFiles
};