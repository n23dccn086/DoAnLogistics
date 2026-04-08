const pool = require('../config/database');

class BaoGiaModel {
    static async findAll(filters = {}) {
        let query = `
            SELECT bg.id, bg.ngay_lap, bg.han_hieu_luc, bg.tong_gia_tri, bg.trang_thai,
                   kh.ten_cong_ty AS tenCongTy,
                   (SELECT COUNT(*) FROM bao_gia_chi_tiets WHERE bao_gia_id = bg.id) AS soChiTiet
            FROM bao_gias bg
            JOIN khach_hangs kh ON bg.khach_hang_id = kh.id
            WHERE 1=1
        `;
        const params = [];
        if (filters.trangThai) {
            query += ' AND bg.trang_thai = ?';
            params.push(filters.trangThai);
        }
        query += ' ORDER BY bg.created_at DESC';
        const [rows] = await pool.query(query, params);
        return rows.map(row => ({
            id: row.id,
            ngayLap: row.ngay_lap,
            ngayHetHan: row.han_hieu_luc,
            tongGiaTri: row.tong_gia_tri,
            trangThai: row.trang_thai,
            tenCongTy: row.tenCongTy,
            soChiTiet: row.soChiTiet
        }));
    }

    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT bg.id, bg.ngay_lap AS ngayLap, bg.han_hieu_luc AS hanHieuLuc,
                    bg.tong_gia_tri AS tongGiaTri, bg.trang_thai AS trangThai,
                    bg.ghi_chu AS ghiChuRieng,
                    kh.id AS khachHangId, kh.ten_cong_ty AS tenCongTy,
                    kh.ma_so_thue AS maSoThue, kh.nguoi_lien_he AS nguoiLienHe,
                    kh.so_dien_thoai AS soDienThoai, kh.email, kh.dia_chi
             FROM bao_gias bg
             JOIN khach_hangs kh ON bg.khach_hang_id = kh.id
             WHERE bg.id = ?`,
            [id]
        );
        if (rows.length === 0) return null;

        const baoGia = rows[0];
        // Tạo chuỗi khachHangInfo như frontend mong đợi
        baoGia.khachHangInfo = `Tên công ty: ${baoGia.tenCongTy}\nMST: ${baoGia.maSoThue}\nNgười liên hệ: ${baoGia.nguoiLienHe || '—'}\nSĐT: ${baoGia.soDienThoai}\nEmail: ${baoGia.email}\nĐịa chỉ: ${baoGia.diaChi || '—'}`;
        // Xóa các trường không cần thiết
        delete baoGia.tenCongTy;
        delete baoGia.maSoThue;
        delete baoGia.nguoiLienHe;
        delete baoGia.soDienThoai;
        delete baoGia.email;
        delete baoGia.diaChi;

        // Lấy danh sách tuyến
        const [details] = await pool.query(
            `SELECT diem_di AS diemDi, diem_den AS diemDen,
                    khoang_cach AS khoangCach, loai_hang AS loaiHang,
                    trong_luong AS trongLuong, don_gia AS donGia,
                    thanh_tien AS thanhTien
             FROM bao_gia_chi_tiets
             WHERE bao_gia_id = ?`,
            [id]
        );
        baoGia.tuyen = details;
        return baoGia;
    }

    static async create(data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO bao_gias (khach_hang_id, nguoi_tao_id, ngay_lap, han_hieu_luc, ghi_chu, tong_gia_tri, trang_thai)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [data.khach_hang_id, data.nguoi_tao_id, data.ngay_lap, data.ngay_het_han, data.ghi_chu, data.tong_gia_tri, data.trang_thai]
            );
            const baoGiaId = result.insertId;

            for (const tuyen of data.tuyen) {
                await connection.query(
                    `INSERT INTO bao_gia_chi_tiets (bao_gia_id, diem_di, diem_den, khoang_cach, loai_hang, trong_luong, don_gia, thanh_tien)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [baoGiaId, tuyen.diemDi, tuyen.diemDen, tuyen.khoangCach, tuyen.loaiHang, tuyen.trongLuong, tuyen.donGia, tuyen.thanhTien]
                );
            }

            await connection.commit();
            return { id: baoGiaId, ...data };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async updateStatus(id, status) {
        const [result] = await pool.query(
            'UPDATE bao_gias SET trang_thai = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM bao_gias WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = BaoGiaModel;