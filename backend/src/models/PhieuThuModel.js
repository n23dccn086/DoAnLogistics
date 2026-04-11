const pool = require('../config/database');

class PhieuThuModel {
    static async findAll() {
        const [rows] = await pool.query(`
            SELECT pt.*, GROUP_CONCAT(ptc.ma_van_don) AS van_don_ids
            FROM phieu_thus pt
            LEFT JOIN phieu_thu_chi_tiets ptc ON pt.id = ptc.phieu_thu_id
            GROUP BY pt.id
            ORDER BY pt.ngay_thu DESC
        `);
        return rows;
    }

    static async create(data) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [maxRow] = await connection.query(`SELECT COUNT(*) as count FROM phieu_thus`);
        const count = maxRow[0].count + 1;
        const maPhieuThu = `PT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(count).padStart(4,'0')}`;
        
        const [result] = await connection.query(
            `INSERT INTO phieu_thus (data.ma_phieu_thu, khach_hang, ngay_thu, hinh_thuc, so_tham_chieu, tong_so_tien, ghi_chu)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [maPhieuThu, data.khachHang, data.ngayThu, data.hinhThuc, data.soThamChieu, data.tongSoTien, data.ghiChu]
        );
            const phieuThuId = result.insertId;
            for (const ct of data.chiTiet) {
                await connection.query(
                    `INSERT INTO phieu_thu_chi_tiets (phieu_thu_id, ma_van_don, so_tien) VALUES (?, ?, ?)`,
                    [phieuThuId, ct.maVanDon, ct.soTien]
                );
            }
            await connection.commit();
            return { id: result.insertId, maPhieuThu  };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = PhieuThuModel;