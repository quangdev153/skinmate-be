const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const scanController = require('../controllers/scanController');

router.post('/', upload.single('image'), scanController.scanIngredients);

module.exports = router;
