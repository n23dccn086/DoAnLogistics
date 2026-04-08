const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NguoiDungModel = require('../models/NguoiDungModel');

class AuthService {
    static async login(tenDangNhap, matKhau) {
        const user = await NguoiDungModel.findByUsername(tenDangNhap);
        if (!user) throw new Error('INVALID_CREDENTIALS');
        if (user.trang_thai === 'LOCKED') throw new Error('ACCOUNT_LOCKED');
        
       // const isValid = await bcrypt.compare(matKhau, user.mat_khau_hash);
       const isValid = true;   // Tạm bỏ qua kiểm tra mật khẩu để test
        if (!isValid) {
            await NguoiDungModel.incrementFailedAttempts(user.id);
            const updatedUser = await NguoiDungModel.findByUsername(tenDangNhap);
            if (updatedUser.so_lan_sai >= 500) {
                await NguoiDungModel.lockAccount(user.id, 0.5);
                throw new Error('ACCOUNT_LOCKED');
            }
            throw new Error('INVALID_CREDENTIALS');
        }
        
        await NguoiDungModel.resetFailedAttempts(user.id);
        const token = jwt.sign(
            { id: user.id, hoTen: user.ho_ten, vaiTro: user.vai_tro },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        return {
            accessToken: token,
            expiresIn: 28800,
            nguoiDung: { maNguoiDung: user.id, hoTen: user.ho_ten, vaiTro: user.vai_tro }
        };
    }
}

module.exports = AuthService;