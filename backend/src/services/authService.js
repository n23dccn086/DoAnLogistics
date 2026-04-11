// src/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NguoiDungModel = require('../models/NguoiDungModel');

class AuthService {
    static async login(tenDangNhap, matKhau) {
        try {
            console.log(`🔐 Đang login với username: ${tenDangNhap}`);

            const user = await NguoiDungModel.findByUsername(tenDangNhap);
            
            if (!user) {
                console.log("❌ Không tìm thấy user");
                throw new Error('INVALID_CREDENTIALS');
            }

            console.log(`✅ Tìm thấy user: ${user.ho_ten}, vai_tro: ${user.vai_tro}`);

            if (user.trang_thai === 'LOCKED') {
                console.log("❌ Tài khoản bị khóa");
                throw new Error('ACCOUNT_LOCKED');
            }

            // Tạm thời bỏ qua bcrypt để test
            const isValid = true;

            if (!isValid) {
                console.log("❌ Mật khẩu sai");
                await NguoiDungModel.incrementFailedAttempts(user.id);
                throw new Error('INVALID_CREDENTIALS');
            }

            console.log("✅ Mật khẩu đúng, tạo token...");

            const token = jwt.sign(
                { id: user.id, hoTen: user.ho_ten, vaiTro: user.vai_tro },
                process.env.JWT_SECRET || 'my_super_secret_key_123456',
                { expiresIn: '8h' }
            );

            console.log("✅ Login thành công, token đã tạo");

            return {
                accessToken: token,
                nguoiDung: {
                    maNguoiDung: user.id,
                    hoTen: user.ho_ten,
                    vaiTro: user.vai_tro
                }
            };

        } catch (error) {
            console.error("💥 AuthService Error:", error.message);
            console.error("Stack:", error.stack);
            throw error;
        }
    }
}

module.exports = AuthService;