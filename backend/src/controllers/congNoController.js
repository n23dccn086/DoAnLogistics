const pool = require('../config/database');

const getCongNo = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT khach_hang AS ten, 
                   COUNT(*) AS soVanDon,
                   SUM(gia_tri - da_thu) AS tongNo,
                   MIN(ngay_tao) AS ngayCuNhat,
                   MAX(DATEDIFF(CURDATE(), ngay_tao) - 30) AS soNgayQuaHanMax
            FROM van_dons
            WHERE trang_thai IN ('Đã xác nhận', 'Đã chốt')
              AND da_thu < gia_tri
            GROUP BY khach_hang
            ORDER BY tongNo DESC
        `);
        // Xử lý số ngày quá hạn
        const data = rows.map(row => ({
            ...row,
            soNgayQuaHanMax: row.soNgayQuaHanMax > 0 ? row.soNgayQuaHanMax : 0
        }));
        res.json({ data });
    } catch (error) {
        console.error('Lỗi lấy công nợ:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

const getChiTietCongNo = async (req, res) => {
    const { tenKhach } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT id AS maVanDon, ngay_tao, gia_tri, da_thu, (gia_tri - da_thu) AS conNo,
                   GREATEST(DATEDIFF(CURDATE(), ngay_tao) - 30, 0) AS soNgayQuaHan
            FROM van_dons
            WHERE khach_hang = ? AND trang_thai IN ('Đã xác nhận', 'Đã chốt') AND da_thu < gia_tri
        `, [tenKhach]);
        res.json({ data: rows });
    } catch (error) {
        console.error('Lỗi lấy chi tiết công nợ:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Lỗi server' } });
    }
};

module.exports = { getCongNo, getChiTietCongNo };