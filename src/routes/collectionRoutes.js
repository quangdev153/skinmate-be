const express = require('express');
const controller = require('../controllers/collectionController');
const validate = require('../validations/collectionDto');
const authenticate = require('../middlewares/authMiddleware');
const uploadProductImage = require('../middlewares/productImageUploadMiddleware');
const router = express.Router();

router.use(authenticate);
router.get('/', controller.list);
router.post('/image', (req, res, next) => {
  uploadProductImage.single('image')(req, res, error => {
    if (error) return res.status(400).json({ error: { message: error.message, code: error.code || 'INVALID_IMAGE' } });
    next();
  });
}, controller.uploadImage);
router.post('/', validate.create, controller.create);
router.get('/:id', validate.id, controller.get);
router.patch('/:id', validate.id, validate.update, controller.update);
router.delete('/:id', validate.id, controller.remove);
module.exports = router;
