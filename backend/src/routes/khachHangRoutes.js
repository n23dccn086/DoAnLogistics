const express = require('express');
const router = express.Router();
const khachHangController = require('../controllers/khachHangController');
const authMiddleware = require('../middlewares/authMiddleware');

// Áp dụng auth cho tất cả route
router.use(authMiddleware);

router.get('/', khachHangController.getAllActive);           // Danh sách
router.get('/:id', khachHangController.getById);             // ← THÊM DÒNG NÀY (Chi tiết)
router.post('/', khachHangController.create);                 // Thêm mới
router.put('/:id', khachHangController.update);               // Sửa
router.delete('/:id', khachHangController.delete);            // Xóa

module.exports = router;