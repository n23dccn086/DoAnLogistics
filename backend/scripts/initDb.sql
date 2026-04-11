-- =============================================
-- initDb_final_v3.sql - SỬA LỖI 1071 KEY TOO LONG
-- =============================================

DROP DATABASE IF EXISTS hhh_logistics;

CREATE DATABASE hhh_logistics 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE hhh_logistics;

-- ==================== BẢNG CHÍNH ====================

CREATE TABLE nguoi_dungs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau_hash VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    vai_tro ENUM('GIAM_DOC', 'SALE', 'KE_TOAN') NOT NULL,
    trang_thai ENUM('ACTIVE', 'LOCKED') DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE khach_hangs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_cong_ty VARCHAR(255) NOT NULL,
    ma_so_thue VARCHAR(20) UNIQUE,
    nguoi_lien_he VARCHAR(100),
    so_dien_thoai VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    dia_chi TEXT,
    ghi_chu TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bang_gia_cuocs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loai_hang VARCHAR(100) NOT NULL,
    kg_tu DECIMAL(10,2) NOT NULL,
    kg_den DECIMAL(10,2) NOT NULL,
    don_gia DECIMAL(12,2) NOT NULL,
    ngay_ap_dung DATE NOT NULL
);

CREATE TABLE bao_gias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    khach_hang_id BIGINT NOT NULL,
    ngay_lap DATE NOT NULL,
    han_hieu_luc DATE NOT NULL,
    tong_gia_tri DECIMAL(15,2) DEFAULT 0,
    trang_thai ENUM('Chưa duyệt', 'Đã gửi', 'Chấp nhận', 'Từ chối') DEFAULT 'Chưa duyệt',
    ghi_chu TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (khach_hang_id) REFERENCES khach_hangs(id)
);

-- SỬA Ở ĐÂY: Giảm độ dài VARCHAR và PRIMARY KEY hợp lý hơn
CREATE TABLE bao_gia_chi_tiets (
    bao_gia_id BIGINT NOT NULL,
    diem_di VARCHAR(255) NOT NULL,      -- giảm từ 500 xuống 255
    diem_den VARCHAR(255) NOT NULL,     -- giảm từ 500 xuống 255
    khoang_cach DECIMAL(10,2),
    loai_hang VARCHAR(100),
    trong_luong DECIMAL(10,2),
    don_gia DECIMAL(12,2),
    thanh_tien DECIMAL(15,2),
    PRIMARY KEY (bao_gia_id, diem_di(100), diem_den(100)),   -- prefix index
    FOREIGN KEY (bao_gia_id) REFERENCES bao_gias(id) ON DELETE CASCADE
);

CREATE TABLE van_dons (
    id VARCHAR(30) PRIMARY KEY,
    ma_bao_gia BIGINT NULL,
    khach_hang VARCHAR(255) NOT NULL,
    tuyen TEXT,
    gia_tri DECIMAL(15,2) NOT NULL,
    trang_thai ENUM('Đã xác nhận', 'Đã hủy', 'Đã chốt') DEFAULT 'Đã xác nhận',
    trang_thai_thanh_toan ENUM('Chưa thanh toán', 'Một phần', 'Đã thanh toán') DEFAULT 'Chưa thanh toán',
    ngay_tao DATE DEFAULT (CURRENT_DATE),
    da_thu DECIMAL(15,2) DEFAULT 0,
    ly_do_huy TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_bao_gia) REFERENCES bao_gias(id)
);

CREATE TABLE van_don_chi_tiets (
    van_don_id VARCHAR(30) NOT NULL,
    diem_di VARCHAR(255),
    diem_den VARCHAR(255),
    khoang_cach DECIMAL(10,2),
    loai_hang VARCHAR(100),
    trong_luong DECIMAL(10,2),
    don_gia DECIMAL(12,2),
    thanh_tien DECIMAL(15,2),
    dia_chi_lay_hang TEXT,
    dia_chi_giao_hang TEXT,
    nguoi_lien_he_lay_ten VARCHAR(100),
    nguoi_lien_he_lay_sdt VARCHAR(20),
    nguoi_lien_he_giao_ten VARCHAR(100),
    nguoi_lien_he_giao_sdt VARCHAR(20),
    ghi_chu TEXT,
    PRIMARY KEY (van_don_id, diem_di(100), diem_den(100)),
    FOREIGN KEY (van_don_id) REFERENCES van_dons(id) ON DELETE CASCADE
);

CREATE TABLE phieu_thus (
    ma_phieu_thu VARCHAR(50) PRIMARY KEY,
    khach_hang VARCHAR(255) NOT NULL,
    ngay_thu DATE NOT NULL,
    hinh_thuc ENUM('TIEN_MAT', 'CHUYEN_KHOAN') NOT NULL,
    so_tham_chieu VARCHAR(100),
    tong_so_tien DECIMAL(15,2) NOT NULL,
    ghi_chu TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE phieu_thu_chi_tiets (
    phieu_thu_id VARCHAR(50) NOT NULL,
    ma_van_don VARCHAR(30) NOT NULL,
    so_tien DECIMAL(15,2) NOT NULL,
    PRIMARY KEY (phieu_thu_id, ma_van_don),
    FOREIGN KEY (phieu_thu_id) REFERENCES phieu_thus(ma_phieu_thu),
    FOREIGN KEY (ma_van_don) REFERENCES van_dons(id)
);

-- ==================== INDEX ====================

CREATE INDEX idx_khach_hangs_ten ON khach_hangs(ten_cong_ty);
CREATE INDEX idx_bao_gias_trang_thai ON bao_gias(trang_thai);
CREATE INDEX idx_van_dons_ngay_tao ON van_dons(ngay_tao DESC);
CREATE INDEX idx_van_dons_khach_hang ON van_dons(khach_hang);
CREATE INDEX idx_phieu_thus_ngay_thu ON phieu_thus(ngay_thu DESC);

SELECT '✅ ĐÃ TẠO LẠI DATABASE THÀNH CÔNG - ĐÃ SỬA LỖI 1071' AS thong_bao;