const pool = require('../config/database');

class KhachHangModel {
    static async findAllActive() {
        const [rows] = await pool.query(
            `SELECT id, ten_cong_ty, ma_so_thue, nguoi_lien_he, so_dien_thoai, email, dia_chi
             FROM khach_hangs
             WHERE is_active = TRUE`
        );
        // Chuyển tên cột sang camelCase để frontend dễ dùng (tuỳ frontend)
        return rows.map(row => ({
            id: row.id,
            tenCongTy: row.ten_cong_ty,
            maSoThue: row.ma_so_thue,
            nguoiLienHe: row.nguoi_lien_he,
            soDienThoai: row.so_dien_thoai,
            email: row.email,
            diaChi: row.dia_chi
        }));
    }

    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT id, ten_cong_ty, ma_so_thue, nguoi_lien_he, so_dien_thoai, email, dia_chi
             FROM khach_hangs
             WHERE id = ?`,
            [id]
        );
        if (rows.length === 0) return null;
        const row = rows[0];
        return {
            id: row.id,
            tenCongTy: row.ten_cong_ty,
            maSoThue: row.ma_so_thue,
            nguoiLienHe: row.nguoi_lien_he,
            soDienThoai: row.so_dien_thoai,
            email: row.email,
            diaChi: row.dia_chi
        };
    }

    // models/KhachHangModel.js (thêm)
static async create(data) {
    const { tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi } = data;
    const [result] = await pool.query(
        `INSERT INTO khach_hangs (ten_cong_ty, ma_so_thue, nguoi_lien_he, so_dien_thoai, email, dia_chi)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi]
    );
    return result.insertId;
}

static async update(id, data) {
    const { tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi } = data;
    const [result] = await pool.query(
        `UPDATE khach_hangs SET ten_cong_ty=?, ma_so_thue=?, nguoi_lien_he=?, so_dien_thoai=?, email=?, dia_chi=?
         WHERE id=? AND is_active=TRUE`,
        [tenCongTy, maSoThue, nguoiLienHe, soDienThoai, email, diaChi, id]
    );
    return result.affectedRows > 0;
}

static async deleteSoft(id) {
    const [result] = await pool.query(
        'UPDATE khach_hangs SET is_active=FALSE WHERE id=?',
        [id]
    );
    return result.affectedRows > 0;
}
}

module.exports = KhachHangModel;