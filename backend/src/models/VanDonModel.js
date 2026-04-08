const pool = require('../config/database');

class VanDonModel {
    static async findAll(filters = {}) {
        let query = `
            SELECT vd.id, vd.khach_hang, vd.tuyen, vd.gia_tri, vd.trang_thai, vd.trang_thai_thanh_toan,
                   vd.ngay_tao, vd.da_thu, vd.ly_do_huy, vd.ma_bao_gia,
                   kh.id AS khach_hang_id, kh.ten_cong_ty AS tenCongTy
            FROM van_dons vd
            LEFT JOIN khach_hangs kh ON vd.khach_hang = kh.ten_cong_ty
            WHERE 1=1
        `;
        const params = [];
        if (filters.trangThai) {
            query += ' AND vd.trang_thai = ?';
            params.push(filters.trangThai);
        }
        if (filters.trangThaiThanhToan) {
            query += ' AND vd.trang_thai_thanh_toan = ?';
            params.push(filters.trangThaiThanhToan);
        }
        query += ' ORDER BY vd.ngay_tao DESC';
        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT vd.*, kh.ten_cong_ty AS tenCongTy
             FROM van_dons vd
             LEFT JOIN khach_hangs kh ON vd.khach_hang = kh.ten_cong_ty
             WHERE vd.id = ?`,
            [id]
        );
        if (rows.length === 0) return null;
        const vanDon = rows[0];
        // Lấy chi tiết tuyến (nếu có bảng van_don_chi_tiets)
        const [details] = await pool.query(
            `SELECT * FROM van_don_chi_tiets WHERE van_don_id = ?`,
            [id]
        );
        vanDon.tuyenChiTiet = details;
        return vanDon;
    }

    static async create(data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.query(
                `INSERT INTO van_dons (id, ma_bao_gia, khach_hang, tuyen, gia_tri, trang_thai, trang_thai_thanh_toan, ngay_tao, da_thu, ly_do_huy)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [data.id, data.maBaoGia, data.khachHang, data.tuyen, data.giaTri, data.trangThai, data.trangThaiThanhToan, data.ngayTao, data.daThu, data.lyDoHuy]
            );
            // Lưu chi tiết tuyến nếu có
            if (data.tuyenChiTiet && data.tuyenChiTiet.length) {
                for (const tuyen of data.tuyenChiTiet) {
                    await connection.query(
                        `INSERT INTO van_don_chi_tiets (van_don_id, diem_di, diem_den, khoang_cach, loai_hang, trong_luong, don_gia, thanh_tien,
                                                       dia_chi_lay_hang, dia_chi_giao_hang, nguoi_lien_he_lay_ten, nguoi_lien_he_lay_sdt,
                                                       nguoi_lien_he_giao_ten, nguoi_lien_he_giao_sdt, ghi_chu)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [data.id, tuyen.diemDi, tuyen.diemDen, tuyen.khoangCach, tuyen.loaiHang, tuyen.trongLuong, tuyen.donGia, tuyen.thanhTien,
                         tuyen.diaChiLayHang, tuyen.diaChiGiaoHang, tuyen.nguoiLienHeLay_Ten, tuyen.nguoiLienHeLay_SDT,
                         tuyen.nguoiLienHeGiao_Ten, tuyen.nguoiLienHeGiao_SDT, tuyen.ghiChu]
                    );
                }
            }
            await connection.commit();
            return { id: data.id };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(id, data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.query(
                `UPDATE van_dons SET khach_hang=?, tuyen=?, gia_tri=?, trang_thai=?, trang_thai_thanh_toan=?,
                                      da_thu=?, ly_do_huy=?
                 WHERE id=?`,
                [data.khachHang, data.tuyen, data.giaTri, data.trangThai, data.trangThaiThanhToan, data.daThu, data.lyDoHuy, id]
            );
            // Cập nhật chi tiết tuyến (xóa cũ, insert mới)
            if (data.tuyenChiTiet) {
                await connection.query(`DELETE FROM van_don_chi_tiets WHERE van_don_id=?`, [id]);
                for (const tuyen of data.tuyenChiTiet) {
                    await connection.query(
                        `INSERT INTO van_don_chi_tiets (van_don_id, diem_di, diem_den, khoang_cach, loai_hang, trong_luong, don_gia, thanh_tien,
                                                       dia_chi_lay_hang, dia_chi_giao_hang, nguoi_lien_he_lay_ten, nguoi_lien_he_lay_sdt,
                                                       nguoi_lien_he_giao_ten, nguoi_lien_he_giao_sdt, ghi_chu)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [id, tuyen.diemDi, tuyen.diemDen, tuyen.khoangCach, tuyen.loaiHang, tuyen.trongLuong, tuyen.donGia, tuyen.thanhTien,
                         tuyen.diaChiLayHang, tuyen.diaChiGiaoHang, tuyen.nguoiLienHeLay_Ten, tuyen.nguoiLienHeLay_SDT,
                         tuyen.nguoiLienHeGiao_Ten, tuyen.nguoiLienHeGiao_SDT, tuyen.ghiChu]
                    );
                }
            }
            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM van_dons WHERE id=?', [id]);
        return result.affectedRows > 0;
    }

    // Các phương thức cho công nợ (lấy tất cả vận đơn chưa thanh toán đủ)
    static async findAllForCongNo() {
        const [rows] = await pool.query(
            `SELECT id, khach_hang, gia_tri, da_thu, trang_thai, trang_thai_thanh_toan, ngay_tao
             FROM van_dons
             WHERE trang_thai IN ('Đã xác nhận', 'Đã chốt')
               AND (da_thu < gia_tri)`
        );
        return rows;
    }
}

module.exports = VanDonModel;