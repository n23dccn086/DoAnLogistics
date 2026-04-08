const jwt = require('jsonwebtoken');
const NguoiDungModel = require('../models/NguoiDungModel');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' } });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await NguoiDungModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token không hợp lệ' } });
        }
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Phiên đăng nhập hết hạn' } });
        }
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token không hợp lệ' } });
    }
};

module.exports = authMiddleware;