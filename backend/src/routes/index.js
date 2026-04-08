const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const khachHangRoutes = require('./khachHangRoutes');
const baoGiaRoutes = require('./baoGiaRoutes');
const vanDonRoutes = require('./vanDonRoutes');
const phieuThuRoutes = require('./phieuThuRoutes');
const congNoRoutes = require('./congNoRoutes');
const bangGiaRoutes = require('./bangGiaRoutes'); 

router.use('/auth', authRoutes);
router.use('/khachhang', khachHangRoutes);
router.use('/baogia', baoGiaRoutes);
router.use('/vandon', vanDonRoutes);
router.use('/phieuthu', phieuThuRoutes);
router.use('/congno', congNoRoutes);
router.use('/banggia', bangGiaRoutes);

module.exports = router;