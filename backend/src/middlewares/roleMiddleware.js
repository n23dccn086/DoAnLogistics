const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.vai_tro)) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này' } });
        }
        next();
    };
};

module.exports = roleMiddleware;