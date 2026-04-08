const express = require('express');
const router = express.Router();
const khachHangController = require('../controllers/khachHangController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, khachHangController.getAllActive);
router.post('/', authMiddleware, khachHangController.create);
router.put('/:id', authMiddleware, khachHangController.update);
router.delete('/:id', authMiddleware, khachHangController.delete);

module.exports = router;