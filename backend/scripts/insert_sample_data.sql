USE hhh_logistics;

-- 1. Chèn tài khoản đăng nhập
INSERT INTO nguoi_dungs (ten_dang_nhap, mat_khau_hash, ho_ten, vai_tro) VALUES
('admin', '$2a$12$L6v9vN9vN9vN9vN9vN.u7vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN', 'Administrator', 'GIAM_DOC'),
('giamdoc', '$2a$12$L6v9vN9vN9vN9vN.u7vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN', 'Giám Đốc', 'GIAM_DOC'),
('kinhdoanh', '$2a$12$L6v9vN9vN9vN9vN.u7vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN', 'Nhân viên Kinh Doanh', 'SALE'),
('ketoan', '$2a$12$L6v9vN9vN9vN9vN.u7vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN', 'Kế Toán', 'KE_TOAN')
ON DUPLICATE KEY UPDATE ho_ten = VALUES(ho_ten), vai_tro = VALUES(vai_tro);

-- 2. Chèn khách hàng mẫu
INSERT INTO khach_hangs (ten_cong_ty, ma_so_thue, nguoi_lien_he, so_dien_thoai, email, dia_chi) VALUES
('Công ty TNHH ABC', '0123456789', 'Nguyễn Văn A', '0912345678', 'abc@company.com', '123 Nguyễn Văn Linh, Q7, HCM'),
('Công ty CP XYZ', '9876543210', 'Trần Thị B', '0987654321', 'xyz@company.com', '456 Trần Hưng Đạo, Cần Thơ'),
('Doanh nghiệp tư nhân Minh Phát', '1122334455', 'Lê Thị C', '0933445566', 'minhphat@company.com', '789 Lê Duẩn, Đà Nẵng')
ON DUPLICATE KEY UPDATE ten_cong_ty = VALUES(ten_cong_ty);

-- 3. Chèn bảng giá cước mẫu
INSERT INTO bang_gia_cuocs (loai_hang, kg_tu, kg_den, don_gia, ngay_ap_dung) VALUES
('Hàng thường', 0, 5000, 500, CURDATE()),
('Hàng cồng kềnh', 0, 5000, 700, CURDATE()),
('Hàng dễ vỡ', 0, 3000, 800, CURDATE()),
('Hàng lạnh', 0, 5000, 1200, CURDATE())
ON DUPLICATE KEY UPDATE don_gia = VALUES(don_gia);

SELECT '✅ ĐÃ CHÈN DỮ LIỆU MẪU THÀNH CÔNG!' AS thong_bao;