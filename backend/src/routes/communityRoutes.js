const express = require('express');
const authenticate = require('../middlewares/authMiddleware');
const controller = require('../controllers/communityController');
const validate = require('../validations/postDto');
const { createMemoryImageUpload } = require('../middlewares/productImageUploadMiddleware');
const uploadCommunityImages = createMemoryImageUpload();
const router = express.Router();
router.use(authenticate);
router.get('/', validate.listQuery, controller.list);
router.post('/image', (req, res, next) => {
  uploadCommunityImages.array('images', 5)(req, res, error => {
    if (error) return res.status(400).json({ error: { message: error.message, code: error.code || 'INVALID_IMAGE' } });
    next();
  });
}, controller.uploadImages);
router.post('/', validate.create, controller.create);
router.get('/:id', validate.id, controller.get);
router.patch('/:id', validate.id, validate.create, controller.update);
router.delete('/:id', validate.id, controller.remove);
router.post('/:id/like', validate.id, controller.toggleLike);
router.post('/:id/copy', validate.id, controller.copyRoutine);
module.exports = router;
