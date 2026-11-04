const multer = require('multer');

const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const imageFilter = (req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
        const error = new Error('Only JPG, PNG, or WebP images are allowed');
        error.code = 'INVALID_IMAGE';
        return callback(error);
    }
    callback(null, true);
};

const createMemoryImageUpload = () => multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    fileFilter: imageFilter,
});

const uploadProductImage = createMemoryImageUpload();

module.exports = uploadProductImage;
module.exports.createMemoryImageUpload = createMemoryImageUpload;
