// controllers/baoGiaController.js
const BaoGiaModel = require('../models/BaoGiaModel');
const KhachHangModel = require('../models/KhachHangModel');
const VanDonModel = require('../models/VanDonModel');
const { generateVanDonId } = require('../utils/helpers');

// Danh sách báo giá
const list = async (req, res) => {
    try {
        const { trangThai } = req.query;
        const filters = {};
        if (trangThai) filters.trangThai = trangThai;
        const list = await BaoGiaModel.findAll(filters);
        res.json({ data: list });
    } catch (error) {
        console.error('Lỗi lấy danh sách báo giá:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

// Chi tiết báo giá
const detail = async (req, res) => {
    try {
        const { id } = req.params;
        const baoGia = await BaoGiaModel.findById(id);
        if (!baoGia) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Báo giá không tồn tại' } });
        }
        res.json({ data: baoGia });
    } catch (error) {
        console.error('Lỗi lấy chi tiết báo giá:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

// Tạo báo giá mới
const create = async (req, res) => {
    try {
        const { khachHangId, ngayLap, hanHieuLuc, ghiChu, tuyen, tongGiaTri } = req.body;

        if (!khachHangId || !ngayLap || !hanHieuLuc || !tuyen || !tuyen.length) {
            return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Thiếu thông tin báo giá' } });
        }

        const khachHang = await KhachHangModel.findById(khachHangId);
        if (!khachHang) {
            return res.status(400).json({ error: { code: 'INVALID_CUSTOMER', message: 'Khách hàng không tồn tại' } });
        }

        // Lấy id người tạo từ token
        const nguoiTaoId = req.user.id;

        const baoGiaData = {
            khach_hang_id: khachHangId,
            nguoi_tao_id: nguoiTaoId,
            ngay_lap: ngayLap,
            ngay_het_han: hanHieuLuc,
            ghi_chu: ghiChu || '',
            tong_gia_tri: tongGiaTri,
            trang_thai: 'Chưa duyệt',
            tuyen: tuyen.map(t => ({
                diemDi: t.diemDi,
                diemDen: t.diemDen,
                khoangCach: t.khoangCach,
                loaiHang: t.loaiHang,
                trongLuong: t.trongLuong,
                donGia: t.donGia,
                thanhTien: t.thanhTien || (t.khoangCach * t.donGia * t.trongLuong)
            }))
        };

        const result = await BaoGiaModel.create(baoGiaData);
        res.status(201).json({ data: result });
    } catch (error) {
        console.error('Lỗi tạo báo giá:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server khi tạo báo giá' } });
    }
};

// Cập nhật trạng thái báo giá (và tự động tạo vận đơn nếu được chấp nhận)
const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThai } = req.body;
        const allowed = ['Chưa duyệt', 'Đã gửi', 'Chấp nhận', 'Từ chối'];
        if (!allowed.includes(trangThai)) {
            return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Trạng thái không hợp lệ' } });
        }

        const success = await BaoGiaModel.updateStatus(id, trangThai);
        if (!success) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Báo giá không tồn tại' } });
        }

        // Nếu trạng thái mới là "Chấp nhận", tự động tạo vận đơn
        if (trangThai === 'Chấp nhận') {
            const baoGia = await BaoGiaModel.findById(id);
            if (baoGia) {
                // Kiểm tra xem vận đơn cho báo giá này đã tồn tại chưa
                const existingVanDons = await VanDonModel.findAll();
                const alreadyExists = existingVanDons.some(v => v.ma_bao_gia === id);
                if (!alreadyExists) {
                    const existingIds = existingVanDons.map(v => v.id);
                    const newVanDonId = generateVanDonId(existingIds);
                    
                    // Tạo chuỗi tóm tắt các tuyến
                    const tuyenText = baoGia.tuyen.map(t => `${t.diemDi} → ${t.diemDen}`).join('; ');
                    
                    const vanDonData = {
                        id: newVanDonId,
                        maBaoGia: id,
                        khachHang: baoGia.tenCongTy,
                        tuyen: tuyenText,
                        giaTri: baoGia.tongGiaTri,
                        trangThai: 'Đã xác nhận',
                        trangThaiThanhToan: 'Chưa thanh toán',
                        ngayTao: new Date().toISOString().split('T')[0],
                        daThu: 0,
                        lyDoHuy: null,
                        tuyenChiTiet: baoGia.tuyen.map(t => ({
                            diemDi: t.diemDi,
                            diemDen: t.diemDen,
                            khoangCach: t.khoangCach,
                            loaiHang: t.loaiHang,
                            trongLuong: t.trongLuong,
                            donGia: t.donGia,
                            thanhTien: t.thanhTien,
                            diaChiLayHang: '',
                            diaChiGiaoHang: '',
                            nguoiLienHeLay_Ten: '',
                            nguoiLienHeLay_SDT: '',
                            nguoiLienHeGiao_Ten: '',
                            nguoiLienHeGiao_SDT: '',
                            ghiChu: ''
                        }))
                    };
                    await VanDonModel.create(vanDonData);
                }
            }
        }

        res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái báo giá:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

// Xóa báo giá
const deleteBaoGia = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await BaoGiaModel.delete(id);
        if (!success) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Báo giá không tồn tại' } });
        }
        res.json({ message: 'Xóa báo giá thành công' });
    } catch (error) {
        console.error('Lỗi xóa báo giá:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

module.exports = { list, detail, create, updateStatus, delete: deleteBaoGia };