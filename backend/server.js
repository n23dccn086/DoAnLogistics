require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes/index');   // sửa đường dẫn

const app = express();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],   // cho phép cả 2
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));   // tăng limit cho PDF/base64 nếu cần

// Routes
app.use('/api/v1', routes);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Lỗi server nội bộ' }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚛 Server HHH Logistics chạy tại http://localhost:${PORT}`);
});