INSERT INTO khach_hangs (ten_cong_ty, ma_so_thue, nguoi_lien_he, so_dien_thoai, email, dia_chi)
VALUES 
('Công ty TNHH ABC', '0123456789', 'Nguyễn Văn A', '0912345678', 'abc@example.com', '123 Đường Lê Lợi, Quận 1, TP.HCM'),
('Công ty CP XYZ', '9876543210', 'Trần Thị B', '0987654321', 'xyz@example.com', '456 Đường Nguyễn Huệ, Quận 1, TP.HCM'),
('Doanh nghiệp tư nhân MNP', '1122334455', 'Lê Văn C', '0933222111', 'mnp@example.com', '789 Đường Cách Mạng Tháng 8, Quận 3, TP.HCM');

INSERT INTO loai_hangs (ten, mo_ta) VALUES
('Hàng thường', 'Hàng hóa thông thường'),
('Hàng cồng kềnh', 'Hàng có kích thước lớn'),
('Hàng dễ vỡ', 'Hàng thủy tinh, gốm sứ, đồ điện tử'),
('Hàng lạnh', 'Hàng yêu cầu bảo quản lạnh');

INSERT INTO bang_gia_cuocs (loai_hang_id, kg_tu, kg_den, don_gia, ngay_ap_dung) VALUES
(1, 0, 5000, 500, CURDATE()),   -- Hàng thường
(1, 5001, 10000, 450, CURDATE()),
(2, 0, 5000, 700, CURDATE()),   -- Hàng cồng kềnh
(3, 0, 3000, 800, CURDATE()),   -- Hàng dễ vỡ
(4, 0, 5000, 1200, CURDATE());  -- Hàng lạnh

INSERT INTO nguoi_dungs (ten_dang_nhap, mat_khau_hash, ho_ten, vai_tro) VALUES
('sale01', '$2a$12$hashed_password_here', 'Nhân viên Sale', 'SALE');
-- Lưu ý: mật khẩu hash bạn có thể tạo bằng bcrypt hoặc dùng tạm giá trị đã biết.
-- Nếu chưa có, bạn có thể tạo bằng cách chạy file createUser.js trong backend.

-- Báo giá 1
INSERT INTO bao_gias (khach_hang_id, nguoi_tao_id, ngay_lap, han_hieu_luc, tong_gia_tri, trang_thai, ghi_chu)
VALUES (1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 1500000, 'Chưa duyệt', 'Báo giá cho đơn hàng tháng 3');

-- Lấy id vừa insert (giả sử = 1)
INSERT INTO bao_gia_chi_tiets (bao_gia_id, diem_di, diem_den, khoang_cach, loai_hang, trong_luong, don_gia, thanh_tien)
VALUES 
(1, '123 Nguyễn Văn Linh, Q7, HCM', '456 Trần Hưng Đạo, Cần Thơ', 160, 'Hàng thường', 1000, 500, 160*500*1000),
(1, '789 Lê Duẩn, Đà Nẵng', '321 Nguyễn Tất Thành, Hà Nội', 780, 'Hàng thường', 500, 500, 780*500*500);

-- Báo giá 2
INSERT INTO bao_gias (khach_hang_id, nguoi_tao_id, ngay_lap, han_hieu_luc, tong_gia_tri, trang_thai, ghi_chu)
VALUES (2, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 2800000, 'Đã gửi', 'Gửi qua email ngày 1/4');

INSERT INTO bao_gia_chi_tiets (bao_gia_id, diem_di, diem_den, khoang_cach, loai_hang, trong_luong, don_gia, thanh_tien)
VALUES 
(2, '10 Trần Phú, Nha Trang', '20 Lê Hồng Phong, Quy Nhơn', 210, 'Hàng dễ vỡ', 800, 800, 210*800*800);

-- Giả sử báo giá id=2 được chấp nhận, tạo vận đơn
INSERT INTO van_dons (id, ma_bao_gia, khach_hang, tuyen, gia_tri, trang_thai, trang_thai_thanh_toan, ngay_tao, da_thu)
VALUES ('VD-20250401-0001', 2, 'Công ty CP XYZ', '10 Trần Phú, Nha Trang → 20 Lê Hồng Phong, Quy Nhơn', 2800000, 'Đã xác nhận', 'Chưa thanh toán', CURDATE(), 0);