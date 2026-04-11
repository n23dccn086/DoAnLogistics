// controllers/khachHangController.js
const KhachHangModel = require('../models/KhachHangModel');

const getAllActive = async (req, res) => {
    try {
        console.log("📌 getAllActive được gọi bởi user:", req.user?.hoTen || 'Unknown');
        const customers = await KhachHangModel.findAllActive();
        res.json({ data: customers });
    } catch (error) {
        console.error('Lỗi lấy danh sách khách hàng:', error);
        res.status(500).json({ 
            error: { code: 'INTERNAL_ERROR', message: 'Lỗi server khi lấy danh sách khách hàng' } 
        });
    }
};

// ==================== THÊM HÀM NÀY - RẤT QUAN TRỌNG ====================
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📌 getById được gọi với id = ${id}`);

        const customer = await KhachHangModel.findById(id);
        
        if (!customer) {
            return res.status(404).json({ 
                error: { code: 'NOT_FOUND', message: 'Khách hàng không tồn tại' } 
            });
        }

        res.json({ data: customer });
    } catch (error) {
        console.error('Lỗi lấy chi tiết khách hàng:', error);
        res.status(500).json({ 
            error: { code: 'INTERNAL_ERROR', message: 'Lỗi server khi lấy chi tiết khách hàng' } 
        });
    }
};

const create = async (req, res) => {
    try {
        const { tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi } = req.body;
        
        if (!tenCongTy || !maSoThue || !soDienThoai || !email) {
            return res.status(400).json({ 
                error: { code: 'MISSING_FIELDS', message: 'Thiếu thông tin bắt buộc' } 
            });
        }

        const newId = await KhachHangModel.create({ 
            tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi 
        });

        res.status(201).json({ 
            data: { id: newId, tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi } 
        });
    } catch (error) {
        console.error('Lỗi tạo khách hàng:', error);
        res.status(500).json({ 
            error: { code: 'INTERNAL_ERROR', message: 'Lỗi server khi tạo khách hàng' } 
        });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi } = req.body;

        const success = await KhachHangModel.update(id, { 
            tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi 
        });

        if (!success) {
            return res.status(404).json({ 
                error: { code: 'NOT_FOUND', message: 'Khách hàng không tồn tại' } 
            });
        }

        res.json({ message: 'Cập nhật khách hàng thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật khách hàng:', error);
        res.status(500).json({ 
            error: { code: 'INTERNAL_ERROR', message: 'Lỗi server khi cập nhật khách hàng' } 
        });
    }
};

const deleteKhachHang = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await KhachHangModel.delete(id);   // dùng delete thay vì deleteSoft

        if (!success) {
            return res.status(404).json({ 
                error: { code: 'NOT_FOUND', message: 'Khách hàng không tồn tại' } 
            });
        }

        res.json({ message: 'Đã xóa khách hàng thành công' });
    } catch (error) {
        console.error('Lỗi xóa khách hàng:', error);
        res.status(500).json({ 
            error: { code: 'INTERNAL_ERROR', message: 'Lỗi server khi xóa khách hàng' } 
        });
    }
};

module.exports = { 
    getAllActive, 
    getById,
    create, 
    update, 
    delete: deleteKhachHang 
};