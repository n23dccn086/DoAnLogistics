// src/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 15,        // tăng lên nếu traffic cao
    queueLimit: 0,
    timezone: '+07:00',         // quan trọng cho VN
    dateStrings: true           // trả ngày về string thay vì Date object
});

module.exports = pool;