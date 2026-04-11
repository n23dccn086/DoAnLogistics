const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log("🔑 Auth Header nhận được:", authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log("❌ Không có Bearer token");
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token không hợp lệ' } });
        }

        const token = authHeader.split(' ')[1];
        console.log("🔑 Token nhận được (20 ký tự đầu):", token.substring(0, 40) + "...");

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_super_secret_key_123456');
        console.log("✅ Token verify thành công! User ID:", decoded.id);

        req.user = decoded;
        next();
    } catch (error) {
        console.error("💥 JWT Verify lỗi:", error.message);
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token không hợp lệ hoặc hết hạn' } });
    }
};

module.exports = authMiddleware;