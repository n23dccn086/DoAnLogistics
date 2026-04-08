const AuthService = require('../services/authService');

const login = async (req, res) => {
    try {
        const { tenDangNhap, matKhau } = req.body;

        if (!tenDangNhap || !matKhau) {
            return res.status(400).json({ 
                error: { code: 'MISSING_FIELDS', message: 'Vui lòng nhập tên đăng nhập và mật khẩu' } 
            });
        }

        const result = await AuthService.login(tenDangNhap, matKhau);

        // Trả về đúng cấu trúc frontend đang mong đợi
        res.json({
            accessToken: result.accessToken,
            nguoiDung: result.nguoiDung
        });

    } catch (error) {
        console.error("❌ Login Controller Error:", error.message);

        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({ 
                error: { code: 'INVALID_CREDENTIALS', message: 'Sai tên đăng nhập hoặc mật khẩu' } 
            });
        }
        if (error.message === 'ACCOUNT_LOCKED') {
            return res.status(423).json({ 
                error: { code: 'ACCOUNT_LOCKED', message: 'Tài khoản bị khóa. Thử lại sau 30 giây.' } 
            });
        }

        res.status(500).json({ 
            error: { code: 'INTERNAL_ERROR', message: 'Lỗi server. Vui lòng thử lại sau.' } 
        });
    }
};

module.exports = { login };