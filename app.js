document.addEventListener('DOMContentLoaded', function() {
    // --- 1. QUẢN LÝ CHUYỂN TAB ---
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');

    // Hàm ẩn tất cả các tab
    function hideAllTabs() {
        tabContents.forEach(tab => {
            tab.style.display = 'none';
        });
    }

    // Gán sự kiện click cho từng menu bên trái
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            // Xóa trạng thái active ở các menu cũ
            menuItems.forEach(i => i.classList.remove('active'));
            // Thêm active cho menu vừa nhấn
            this.classList.add('active');

            // Lấy ID tab từ thuộc tính data-tab
            const targetTabId = this.getAttribute('data-tab');
            
            hideAllTabs();
            const targetTab = document.getElementById(targetTabId);
            if (targetTab) {
                targetTab.style.display = 'block';
            }
        });
    });

    // Mặc định ẩn hết và chỉ hiện tab đang active lúc đầu
    hideAllTabs();
    const defaultTab = document.querySelector('.menu-item.active').getAttribute('data-tab');
    document.getElementById(defaultTab).style.display = 'block';


    // --- 2. LOGIC TÍNH TOÁN BÁO GIÁ (MÔ PHỎNG) ---
    const weightInput = document.querySelector('input[type="number"]');
    const priceDisplay = document.querySelector('.calc-result');
    const unitPrice = 50000; // Giá giả định 50k/kg

    if (weightInput) {
        weightInput.addEventListener('input', function() {
            const weight = this.value;
            const total = weight * unitPrice;
            // Định dạng tiền tệ Việt Nam
            priceDisplay.innerText = `= ${total.toLocaleString('vi-VN')}đ`;
            
            // Cập nhật luôn bảng tổng kết bên phải
            document.querySelector('.summary-line strong').innerText = `${total.toLocaleString('vi-VN')}đ`;
            document.querySelector('.total-value strong').innerText = `${total.toLocaleString('vi-VN')}đ`;
        });
    }

    // --- 3. HIỆU ỨNG KHI NHẤN LƯU ---
    const btnSave = document.getElementById('btnSave');
    if (btnSave) {
        btnSave.addEventListener('click', function() {
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            this.style.opacity = '0.7';
            
            setTimeout(() => {
                alert('Chúc mừng! Báo giá đã được lưu thành công.');
                this.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu báo giá';
                this.style.opacity = '1';
            }, 1500);
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    // 1. Kiểm tra Số điện thoại (Chỉ cho phép nhập số)
    const phoneInput = document.querySelector('input[placeholder*="SĐT"]');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Loại bỏ tất cả kí tự không phải là số
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Hiển thị cảnh báo nếu quá 10 số
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
        });
    }

    // 2. Kiểm tra Trọng lượng (Số dương)
    const weightInput = document.querySelector('input[type="number"]');
    if (weightInput) {
        weightInput.addEventListener('keydown', function(e) {
            // Ngăn chặn nhập dấu trừ (-) và chữ 'e'
            if (e.key === '-' || e.key === 'e' || e.key === '+') {
                e.preventDefault();
            }
        });
        
        weightInput.addEventListener('blur', function() {
            if (this.value < 0) this.value = 0;
        });
    }

    // 3. Hàm Validate tổng thể trước khi Lưu
    const btnSave = document.getElementById('btnSave');
    if (btnSave) {
        btnSave.addEventListener('click', function() {
            const phone = phoneInput ? phoneInput.value : "";
            const weight = weightInput ? weightInput.value : 0;
            const dateInput = document.querySelectorAll('input[type="date"]');
            
            // Kiểm tra SĐT
            if (phone.length < 10) {
                alert("⚠️ Số điện thoại phải có đúng 10 chữ số!");
                phoneInput.focus();
                phoneInput.style.borderColor = "#ef4444"; // Đổi viền đỏ khi lỗi
                return;
            }

            // Kiểm tra ngày tháng
            const ngayLap = new Date(dateInput[0].value);
            const hanLuc = new Date(dateInput[1].value);
            if (hanLuc < ngayLap) {
                alert("⚠️ Hạn hiệu lực không thể trước ngày lập báo giá!");
                dateInput[1].focus();
                return;
            }

            // Nếu mọi thứ OK
            this.innerHTML = '<i class="fa-solid fa-check"></i> Đang lưu...';
            // Gọi API lưu ở đây...
        });
    }
});