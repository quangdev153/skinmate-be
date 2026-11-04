const multer = require('multer');

const storage = multer.memoryStorage();

const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const isImageMime = file.mimetype && file.mimetype.startsWith('image/');
        const isImageExt =
            file.originalname &&
            file.originalname.match(/\.(jpg|jpeg|png|webp|heic|bmp)$/i);

        if (isImageMime || isImageExt) {
            // Set fallback mimetype if missing
            if (
                !file.mimetype ||
                file.mimetype === 'application/octet-stream'
            ) {
                file.mimetype = 'image/jpeg';
            }
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
});

module.exports = uploadMiddleware;
