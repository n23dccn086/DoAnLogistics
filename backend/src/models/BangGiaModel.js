const pool = require('../config/database');

class BangGiaModel {
    static async findAll(filters = {}) {
        let query = 'SELECT * FROM bang_gia_cuocs WHERE 1=1';
        const params = [];
        if (filters.loaiHang) {
            query += ' AND loai_hang = ?';
            params.push(filters.loaiHang);
        }
        query += ' ORDER BY loai_hang, kg_tu';
        const [rows] = await pool.query(query, params);
        return rows.map(row => ({
            id: row.id,
            loaiHang: row.loai_hang,
            kgTu: row.kg_tu,
            kgDen: row.kg_den,
            donGia: row.don_gia
        }));
    }

    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM bang_gia_cuocs WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        const row = rows[0];
        return {
            id: row.id,
            loaiHang: row.loai_hang,
            kgTu: row.kg_tu,
            kgDen: row.kg_den,
            donGia: row.don_gia
        };
    }

    static async create(data) {
        const { loaiHang, kgTu, kgDen, donGia } = data;
        const [result] = await pool.query(
            'INSERT INTO bang_gia_cuocs (loai_hang, kg_tu, kg_den, don_gia, ngay_ap_dung) VALUES (?, ?, ?, ?, CURDATE())',
            [loaiHang, kgTu, kgDen, donGia]
        );
        return result.insertId;
    }

    static async update(id, data) {
        const { loaiHang, kgTu, kgDen, donGia } = data;
        const [result] = await pool.query(
            'UPDATE bang_gia_cuocs SET loai_hang=?, kg_tu=?, kg_den=?, don_gia=? WHERE id=?',
            [loaiHang, kgTu, kgDen, donGia, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM bang_gia_cuocs WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = BangGiaModel;