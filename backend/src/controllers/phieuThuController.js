const PhieuThuModel = require('../models/PhieuThuModel');

const list = async (req, res) => {
    try {
        const list = await PhieuThuModel.findAll();
        res.json({ data: list });
    } catch (error) {
        console.error('Lỗi lấy danh sách phiếu thu:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

const create = async (req, res) => {
    try {
        const { maPhieuThu, khachHang, ngayThu, hinhThuc, soThamChieu, tongSoTien, ghiChu, chiTiet } = req.body;
        if (!maPhieuThu || !khachHang || !ngayThu || !hinhThuc || !tongSoTien || !chiTiet || !chiTiet.length) {
            return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Thiếu thông tin bắt buộc' } });
        }
        const result = await PhieuThuModel.create({ maPhieuThu, khachHang, ngayThu, hinhThuc, soThamChieu, tongSoTien, ghiChu, chiTiet });
        res.status(201).json({ data: result });
    } catch (error) {
        console.error('Lỗi tạo phiếu thu:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

module.exports = { list, create };