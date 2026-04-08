INSERT INTO nguoi_dungs (ten_dang_nhap, mat_khau_hash, ho_ten, vai_tro) 
VALUES 
    ('admin', '$2a$12$L6v9vN9vN9vN9vN9vN9vN.u7vN9vN9vN9vN9vN9vN9vN9vN9vN', 'Administrator', 'GIAM_DOC'),
    ('giamdoc', '$2a$12$L6v9vN9vN9vN9vN9vN.u7vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN', 'Giám Đốc', 'GIAM_DOC'),
    ('kinhdoanh', '$2a$12$L6v9vN9vN9vN9vN.u7vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN', 'Nhân viên Kinh Doanh', 'SALE'),
    ('ketoan', '$2a$12$L6v9vN9vN9vN9vN.u7vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN9vN', 'Kế Toán', 'KE_TOAN')
ON DUPLICATE KEY UPDATE 
    ho_ten = VALUES(ho_ten),
    vai_tro = VALUES(vai_tro);

SELECT id, ten_dang_nhap, ho_ten, vai_tro 
FROM nguoi_dungs 
WHERE ten_dang_nhap IN ('admin','giamdoc','kinhdoanh','ketoan');