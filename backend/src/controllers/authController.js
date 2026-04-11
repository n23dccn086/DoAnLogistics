// controllers/authController.js
const AuthService = require('../services/authService');

const login = async (req, res) => {
    try {
        const { tenDangNhap, matKhau } = req.body;

        console.log(`\n📥 [LOGIN REQUEST] tenDangNhap = ${tenDangNhap}`);

        if (!tenDangNhap || !matKhau) {
            console.log("❌ Thiếu thông tin đăng nhập");
            return res.status(400).json({ 
                error: { code: 'MISSING_FIELDS', message: 'Vui lòng nhập tên đăng nhập và mật khẩu' } 
            });
        }

        const result = await AuthService.login(tenDangNhap, matKhau);

        console.log("✅ Login thành công!");

        res.json({
            accessToken: result.accessToken,
            nguoiDung: result.nguoiDung
        });

    } catch (error) {
        console.error("💥 [LOGIN ERROR] Message:", error.message);
        console.error("Stack trace:", error.stack);

        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({ 
                error: { code: 'INVALID_CREDENTIALS', message: 'Sai tên đăng nhập hoặc mật khẩu' } 
            });
        }
        if (error.message === 'ACCOUNT_LOCKED') {
            return res.status(423).json({ 
                error: { code: 'ACCOUNT_LOCKED', message: 'Tài khoản bị khóa. Thử lại sau.' } 
            });
        }

        // Lỗi không xác định → 500
        res.status(500).json({ 
            error: { code: 'INTERNAL_ERROR', message: 'Lỗi server. Vui lòng thử lại sau.' } 
        });
    }
};

module.exports = { login };