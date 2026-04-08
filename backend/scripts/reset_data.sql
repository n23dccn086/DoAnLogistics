-- TẮT Safe Update Mode và Foreign Key Check
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa dữ liệu tất cả bảng
DELETE FROM phieu_thu_chi_tiets;
DELETE FROM phieu_thus;
DELETE FROM van_don_chi_tiets;
DELETE FROM van_dons;
DELETE FROM bao_gia_chi_tiets;
DELETE FROM bao_gias;
DELETE FROM bang_gia_cuocs;
DELETE FROM loai_hangs;
DELETE FROM khach_hangs;
DELETE FROM nguoi_dungs;

-- BẬT lại các chế độ bảo vệ
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- Thông báo hoàn tất
SELECT '✅ ĐÃ XÓA SẠCH TOÀN BỘ DỮ LIỆU THÀNH CÔNG!' AS `KẾT QUẢ`;