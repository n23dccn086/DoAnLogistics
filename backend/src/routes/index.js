const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');

// Import routes
const authRoutes = require('./authRoutes');
const khachHangRoutes = require('./khachHangRoutes');
const baoGiaRoutes = require('./baoGiaRoutes');
const vanDonRoutes = require('./vanDonRoutes');
const phieuThuRoutes = require('./phieuThuRoutes');
const congNoRoutes = require('./congNoRoutes');
const bangGiaRoutes = require('./bangGiaRoutes');

// ==================== PUBLIC ROUTE ====================
router.use('/auth', authRoutes);        // Login không cần token

// ==================== PROTECTED ROUTES (Cần token) ====================
router.use('/khachhang', authMiddleware, khachHangRoutes);
router.use('/baogia', authMiddleware, baoGiaRoutes);
router.use('/vandon', authMiddleware, vanDonRoutes);
router.use('/phieuthu', authMiddleware, phieuThuRoutes);
router.use('/congno', authMiddleware, congNoRoutes);
router.use('/banggia', authMiddleware, bangGiaRoutes);

module.exports = router;