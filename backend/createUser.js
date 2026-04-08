const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createUser() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    const hashedPassword = await bcrypt.hash('123456', 12);
    await pool.query(
        `INSERT INTO nguoi_dungs (ten_dang_nhap, mat_khau_hash, ho_ten, vai_tro) VALUES (?, ?, ?, ?)`,
        ['sale01', hashedPassword, 'Nhân viên Sale', 'SALE']
    );
    console.log('User created');
    process.exit();
}
createUser();