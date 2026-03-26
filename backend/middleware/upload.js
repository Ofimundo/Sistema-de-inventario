const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Asegurar que la carpeta uploads existe
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `producto-${uniqueSuffix}${ext}`);
    }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
};

// Middleware de subida
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

// Middleware para optimizar imágenes
const optimizeImage = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const filePath = req.file.path;
        const optimizedPath = filePath.replace(/(\.[\w\d_-]+)$/i, '-optimized$1');
        
        // Optimizar imagen con sharp
        await sharp(filePath)
            .resize(800, 800, { // Redimensionar a máximo 800x800
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 }) // Convertir a JPEG con calidad 80%
            .toFile(optimizedPath);

        // Reemplazar archivo original con el optimizado
        await fs.promises.unlink(filePath);
        await fs.promises.rename(optimizedPath, filePath);

        console.log('✅ Imagen optimizada:', filePath);
        next();
    } catch (error) {
        console.error('Error optimizando imagen:', error);
        next(error);
    }
};

// Middleware para eliminar imagen
const deleteImage = async (imagePath) => {
    try {
        const fullPath = path.join(__dirname, '../../uploads', path.basename(imagePath));
        await fs.promises.unlink(fullPath);
        return true;
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        return false;
    }
};

module.exports = {
    upload,
    optimizeImage,
    deleteImage
};