const express = require('express');
const path = require('path');
const app = express();

// Cấu hình để Server đọc được dữ liệu từ Form (JSON)
app.use(express.json());
// Cho phép Server truy cập các file trong thư mục hiện tại
app.use(express.static(__dirname));

// 1. Khi vào trang chủ, hiển thị file index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. API xử lý tính giá cước (Khi bấm nút trên Web sẽ gọi vào đây)
app.post('/tinh-gia', (req, res) => {
    const { weight, route } = req.body; // Nhận số kg và tuyến đường từ Web
    
    let pricePerKg = 0;
    if (route === 'noi-thanh') pricePerKg = 15000;
    if (route === 'lien-tinh') pricePerKg = 30000;

    const total = weight * pricePerKg;

    console.log(`[Hệ thống] Nhận đơn hàng: ${weight}kg - Tuyến: ${route}`);

    // Gửi kết quả về lại cho Web
    res.json({ 
        success: true, 
        result: total.toLocaleString() 
    });
});

app.listen(3000, () => {
    console.log("========================================");
    console.log("SERVER LOGISTICS ĐÃ SẴN SÀNG!");
    console.log("Địa chỉ: http://localhost:3000");
    console.log("========================================");
});