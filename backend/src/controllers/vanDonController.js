const VanDonModel = require('../models/VanDonModel');

const list = async (req, res) => {
    try {
        const { trangThai, trangThaiThanhToan } = req.query;
        const filters = {};
        if (trangThai) filters.trangThai = trangThai;
        if (trangThaiThanhToan) filters.trangThaiThanhToan = trangThaiThanhToan;
        const vanDons = await VanDonModel.findAll(filters);
        res.json({ data: vanDons });
    } catch (error) {
        console.error('Lỗi lấy danh sách vận đơn:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

const detail = async (req, res) => {
    try {
        const { id } = req.params;
        const vanDon = await VanDonModel.findById(id);
        if (!vanDon) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy vận đơn' } });
        res.json({ data: vanDon });
    } catch (error) {
        console.error('Lỗi lấy chi tiết vận đơn:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

const create = async (req, res) => {
    try {
        const { id, maBaoGia, khachHang, tuyen, giaTri, trangThai, trangThaiThanhToan, ngayTao, daThu, lyDoHuy, tuyenChiTiet } = req.body;
        // Validation
        if (!id || !khachHang || !giaTri) {
            return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Thiếu thông tin bắt buộc' } });
        }
        const newVanDon = await VanDonModel.create({ id, maBaoGia, khachHang, tuyen, giaTri, trangThai, trangThaiThanhToan, ngayTao, daThu, lyDoHuy, tuyenChiTiet });
        res.status(201).json({ data: newVanDon });
    } catch (error) {
        console.error('Lỗi tạo vận đơn:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const success = await VanDonModel.update(id, data);
        if (!success) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vận đơn không tồn tại' } });
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật vận đơn:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

const deleteVanDon = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await VanDonModel.delete(id);
        if (!success) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Vận đơn không tồn tại' } });
        res.json({ message: 'Xóa vận đơn thành công' });
    } catch (error) {
        console.error('Lỗi xóa vận đơn:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

module.exports = { list, detail, create, update, delete: deleteVanDon };