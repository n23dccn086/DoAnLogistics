USE hhh_logistics;

-- Tắt Safe Update Mode tạm thời
SET SQL_SAFE_UPDATES = 0;

-- Xóa dữ liệu cũ
DELETE FROM nguoi_dungs;

-- Chèn lại 4 tài khoản mẫu
INSERT INTO nguoi_dungs (ten_dang_nhap, mat_khau_hash, ho_ten, vai_tro) VALUES
('admin', '$2a$12$dummyhash1234567890abcdef', 'Administrator', 'GIAM_DOC'),
('giamdoc', '$2a$12$dummyhash1234567890abcdef', 'Giám Đốc', 'GIAM_DOC'),
('kinhdoanh', '$2a$12$dummyhash1234567890abcdef', 'Nhân viên Kinh Doanh', 'SALE'),
('ketoan', '$2a$12$dummyhash1234567890abcdef', 'Kế Toán', 'KE_TOAN');

-- Bật lại Safe Update Mode
SET SQL_SAFE_UPDATES = 1;

-- Kiểm tra kết quả
SELECT * FROM nguoi_dungs;

SELECT '✅ ĐÃ TẠO LẠI 4 TÀI KHOẢN THÀNH CÔNG - BẠN CÓ THỂ ĐĂNG NHẬP' AS thong_bao;