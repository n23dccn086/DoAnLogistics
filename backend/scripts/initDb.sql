-- =============================================
-- 01_create_tables_and_indexes.sql
-- TẠO CẤU TRÚC BẢNG + INDEX (Chạy file này trước)
-- =============================================

CREATE DATABASE IF NOT EXISTS hhh_logistics 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hhh_logistics;

-- ==================== TẠO BẢNG ====================

CREATE TABLE IF NOT EXISTS nguoi_dungs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau_hash VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    so_dien_thoai VARCHAR(20),
    vai_tro ENUM('GIAM_DOC', 'SALE', 'KE_TOAN') NOT NULL,
    trang_thai ENUM('ACTIVE', 'LOCKED') DEFAULT 'ACTIVE',
    so_lan_sai INT DEFAULT 0,
    thoi_gian_khoa DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS khach_hangs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_cong_ty VARCHAR(255) NOT NULL,
    ma_so_thue VARCHAR(20) UNIQUE,
    nguoi_lien_he VARCHAR(100),
    so_dien_thoai VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    dia_chi TEXT,
    ghi_chu TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bang_gia_cuocs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    loai_hang VARCHAR(100) NOT NULL,
    kg_tu DECIMAL(10,2) NOT NULL,
    kg_den DECIMAL(10,2) NOT NULL,
    don_gia DECIMAL(12,2) NOT NULL,
    ngay_ap_dung DATE NOT NULL,
    ngay_het_han DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bao_gias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    khach_hang_id BIGINT NOT NULL,
    nguoi_tao_id BIGINT NOT NULL,
    ngay_lap DATE NOT NULL,
    han_hieu_luc DATE NOT NULL,
    tong_gia_tri DECIMAL(15,2) DEFAULT 0,
    trang_thai ENUM('Chưa duyệt', 'Đã gửi', 'Chấp nhận', 'Từ chối') DEFAULT 'Chưa duyệt',
    ghi_chu TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (khach_hang_id) REFERENCES khach_hangs(id),
    FOREIGN KEY (nguoi_tao_id) REFERENCES nguoi_dungs(id)
);

CREATE TABLE IF NOT EXISTS bao_gia_chi_tiets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bao_gia_id BIGINT NOT NULL,
    diem_di VARCHAR(500) NOT NULL,
    diem_den VARCHAR(500) NOT NULL,
    khoang_cach DECIMAL(10,2),
    loai_hang VARCHAR(100),
    trong_luong DECIMAL(10,2),
    don_gia DECIMAL(12,2),
    thanh_tien DECIMAL(15,2),
    FOREIGN KEY (bao_gia_id) REFERENCES bao_gias(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS van_dons (
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_bao_gia) REFERENCES bao_gias(id)
);

CREATE TABLE IF NOT EXISTS van_don_chi_tiets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    van_don_id VARCHAR(30) NOT NULL,
    diem_di VARCHAR(500),
    diem_den VARCHAR(500),
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
    FOREIGN KEY (van_don_id) REFERENCES van_dons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS phieu_thus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_phieu_thu VARCHAR(50) UNIQUE NOT NULL,
    khach_hang VARCHAR(255) NOT NULL,
    ngay_thu DATE NOT NULL,
    hinh_thuc ENUM('TIEN_MAT', 'CHUYEN_KHOAN') NOT NULL,
    so_tham_chieu VARCHAR(100),
    tong_so_tien DECIMAL(15,2) NOT NULL,
    ghi_chu TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phieu_thu_chi_tiets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phieu_thu_id BIGINT NOT NULL,
    ma_van_don VARCHAR(30) NOT NULL,
    so_tien DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (phieu_thu_id) REFERENCES phieu_thus(id),
    FOREIGN KEY (ma_van_don) REFERENCES van_dons(id)
);

-- ==================== TẠO INDEX ====================
CREATE INDEX IF NOT EXISTS idx_khach_hangs_ten ON khach_hangs(ten_cong_ty);
CREATE INDEX IF NOT EXISTS idx_bao_gias_trang_thai ON bao_gias(trang_thai);
CREATE INDEX IF NOT EXISTS idx_van_dons_ngay_tao ON van_dons(ngay_tao DESC);
CREATE INDEX IF NOT EXISTS idx_van_dons_khach_hang ON van_dons(khach_hang);
CREATE INDEX IF NOT EXISTS idx_phieu_thus_ngay_thu ON phieu_thus(ngay_thu DESC);

SELECT '✅ File 1: Đã tạo xong tất cả bảng và index' AS thong_bao;