// src/models/NguoiDungModel.js
const pool = require('../config/database');

class NguoiDungModel {
    static async findByUsername(username) {
        try {
            console.log(`🔍 Tìm user với username: ${username}`);
            
            const [rows] = await pool.query(`
                SELECT id, ten_dang_nhap, mat_khau_hash, ho_ten, vai_tro, trang_thai 
                FROM nguoi_dungs 
                WHERE ten_dang_nhap = ?
            `, [username]);

            console.log(`📊 Kết quả query: ${rows.length} rows`);

            if (rows.length === 0) {
                console.log("❌ Không tìm thấy user");
                return null;
            }

            const user = rows[0];
            console.log(`✅ Tìm thấy user: ${user.ho_ten} | Vai trò: ${user.vai_tro}`);

            return user;
        } catch (error) {
            console.error("💥 Lỗi trong findByUsername:", error.message);
            throw error;
        }
    }

    // Tạm thời comment 2 hàm này vì bảng không còn cột so_lan_sai
    // static async incrementFailedAttempts(id) { ... }
    // static async resetFailedAttempts(id) { ... }
}

module.exports = NguoiDungModel;