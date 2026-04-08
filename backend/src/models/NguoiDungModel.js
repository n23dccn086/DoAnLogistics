const pool = require('../config/database');

class NguoiDungModel {
    static async findByUsername(username) {
        const [rows] = await pool.query(
            'SELECT id, ten_dang_nhap, mat_khau_hash, ho_ten, vai_tro, trang_thai, so_lan_sai, thoi_gian_khoa FROM nguoi_dungs WHERE ten_dang_nhap = ?',
            [username]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.query(
            'SELECT id, ho_ten, email, vai_tro FROM nguoi_dungs WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async incrementFailedAttempts(id) {
        await pool.query('UPDATE nguoi_dungs SET so_lan_sai = so_lan_sai + 1 WHERE id = ?', [id]);
    }

    static async lockAccount(id, minutes) {
        const lockTime = new Date(Date.now() + minutes * 60000);
        await pool.query(
            'UPDATE nguoi_dungs SET trang_thai = "LOCKED", thoi_gian_khoa = ? WHERE id = ?',
            [lockTime, id]
        );
    }

    static async resetFailedAttempts(id) {
        await pool.query('UPDATE nguoi_dungs SET so_lan_sai = 0 WHERE id = ?', [id]);
    }
}

module.exports = NguoiDungModel;