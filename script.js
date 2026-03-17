document.addEventListener('DOMContentLoaded', function() {
    // === 1. QUẢN LÝ CHUYỂN TAB ===
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');

    function showTab(targetId) {
        tabContents.forEach(tab => tab.style.display = 'none');
        const targetTab = document.getElementById(targetId);
        if (targetTab) targetTab.style.display = 'block';
    }

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            showTab(this.getAttribute('data-tab'));
        });
    });

    // === 2. VALIDATE SĐT (Chặn chữ, giới hạn 10 số) ===
    const phoneInput = document.getElementById('cust-info');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
            this.style.borderColor = ""; 
        });
    }

    // === 3. TRỌNG LƯỢNG (Chặn số âm, chặn 'e', tự tính tiền) ===
    const weightInput = document.querySelector('input[type="number"]');
    const priceDisplay = document.querySelector('.total-value strong');
    const unitPrice = 50000; 

    if (weightInput) {
        weightInput.addEventListener('keydown', function(e) {
            if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
        });

        weightInput.addEventListener('input', function() {
            const weight = parseFloat(this.value) || 0;
            const total = weight * unitPrice;
            if (priceDisplay) priceDisplay.innerText = `${total.toLocaleString('vi-VN')}đ`;
        });
    }

    // === 4. ĐỊNH DẠNG TIỀN TỆ KHI GÕ ===
    const priceInputs = document.querySelectorAll('.price-format');
    priceInputs.forEach(input => {
        input.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, "");
            this.value = new Intl.NumberFormat('vi-VN').format(val);
        });
    });

    // === 5. KIỂM TRA FILE 5MB ===
    const fileInp = document.getElementById('fileAttachment');
    const fileErr = document.getElementById('fileError');
    if (fileInp) {
        fileInp.addEventListener('change', function() {
            if (this.files[0] && this.files[0].size > 5 * 1024 * 1024) {
                if (fileErr) {
                    fileErr.innerText = "⚠️ File quá lớn (Tối đa 5MB)";
                    fileErr.style.display = "block";
                }
                this.value = ""; 
            } else {
                if (fileErr) fileErr.style.display = "none";
            }
        });
    }

    // === 6. VALIDATE TỔNG THỂ KHI NHẤN LƯU ===
    const btnSave = document.getElementById('btnSave');
    if (btnSave) {
        btnSave.addEventListener('click', function() {
            const start = document.getElementById('loc-start')?.value;
            const end = document.getElementById('loc-end')?.value;
            const dateInputs = document.querySelectorAll('input[type="date"]');

            // Check SĐT
            if (!phoneInput || phoneInput.value.length < 10) {
                alert("⚠️ Số điện thoại khách hàng phải đủ 10 số!");
                phoneInput?.classList.add('shake');
                phoneInput?.focus();
                setTimeout(() => phoneInput?.classList.remove('shake'), 500);
                return;
            }

            // Check Tuyến đường
            if (start && end && start === end) {
                alert("⚠️ Lỗi: Điểm đi và Điểm đến không được trùng nhau!");
                return;
            }

            // Check Ngày tháng (Từ file app.js cũ)
            if (dateInputs.length >= 2) {
                const ngayLap = new Date(dateInputs[0].value);
                const hanLuc = new Date(dateInputs[1].value);
                if (hanLuc < ngayLap) {
                    alert("⚠️ Hạn hiệu lực không thể trước ngày lập báo giá!");
                    return;
                }
            }

            // Hiệu ứng Loading
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            this.disabled = true;

            setTimeout(() => {
                alert("Chúc mừng! Báo giá đã được lưu thành công.");
                this.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu báo giá';
                this.disabled = false;
            }, 1000);
        });
    }
});