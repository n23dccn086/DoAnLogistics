document.addEventListener('DOMContentLoaded', function() {
    // 1. CHUYỂN TAB
    const menuItems = document.querySelectorAll('.menu-item');
    const tabs = document.querySelectorAll('.tab-content');

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-tab');
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            tabs.forEach(t => t.classList.remove('active'));
            const targetTab = document.getElementById(target);
            if(targetTab) targetTab.classList.add('active');
        });
    });

    // 2. VALIDATE SĐT (Chặn chữ, giới hạn 10 số)
    const phoneInput = document.getElementById('cust-info');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }

    // 3. ĐỊNH DẠNG TIỀN TỆ
    const priceInputs = document.querySelectorAll('.price-format');
    priceInputs.forEach(input => {
        input.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, "");
            this.value = new Intl.NumberFormat('vi-VN').format(val);
        });
    });

    // 4. CHECK FILE 5MB
    const fileInp = document.getElementById('fileAttachment');
    const fileErr = document.getElementById('fileError');
    if (fileInp) {
        fileInp.addEventListener('change', function() {
            if (this.files[0] && this.files[0].size > 5 * 1024 * 1024) {
                fileErr.innerText = "⚠️ File quá lớn (Tối đa 5MB)";
                fileErr.style.display = "block";
                this.value = "";
            } else {
                fileErr.style.display = "none";
            }
        });
    }

    // 5. VALIDATE LƯU
    const btnSave = document.getElementById('btnSave');
    if (btnSave) {
        btnSave.addEventListener('click', function() {
            const start = document.getElementById('loc-start').value;
            const end = document.getElementById('loc-end').value;

            if (phoneInput.value.length < 10) {
                phoneInput.classList.add('shake');
                alert("Số điện thoại khách hàng phải đủ 10 số!");
                setTimeout(() => phoneInput.classList.remove('shake'), 500);
                return;
            }

            if (start === end && start !== "") {
                alert("⚠️ Lỗi: Điểm đi và Điểm đến trùng nhau!");
                return;
            }

            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            setTimeout(() => {
                alert("Báo giá đã được lưu thành công!");
                this.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu báo giá';
            }, 1000);
        });
    }
});