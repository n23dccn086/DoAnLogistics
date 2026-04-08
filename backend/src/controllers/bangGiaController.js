const BangGiaModel = require('../models/BangGiaModel');

const list = async (req, res) => {
    try {
        const { loaiHang } = req.query;
        const filters = {};
        if (loaiHang) filters.loaiHang = loaiHang;
        const data = await BangGiaModel.findAll(filters);
        res.json({ data });
    } catch (error) {
        console.error('Lỗi lấy danh sách bảng giá:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

const detail = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await BangGiaModel.findById(id);
        if (!item) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } });
        res.json({ data: item });
    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

const create = async (req, res) => {
    try {
        const { loaiHang, kgTu, kgDen, donGia } = req.body;
        if (!loaiHang || kgTu === undefined || kgDen === undefined || !donGia) {
            return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Thiếu thông tin' } });
        }
        const newId = await BangGiaModel.create({ loaiHang, kgTu, kgDen, donGia });
        res.status(201).json({ data: { id: newId, loaiHang, kgTu, kgDen, donGia } });
    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { loaiHang, kgTu, kgDen, donGia } = req.body;
        const success = await BangGiaModel.update(id, { loaiHang, kgTu, kgDen, donGia });
        if (!success) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } });
        res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await BangGiaModel.delete(id);
        if (!success) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy' } });
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

module.exports = { list, detail, create, update, delete: deleteItem };