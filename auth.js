// Danh sách nhân viên chuẩn
    const validUsers = [
        { code: 'NV01', pass: '123', name: 'Nguyễn Văn Hào', role: 'MANAGER' },
        { code: 'NV02', pass: '123', name: 'Kế Toán Trưởng', role: 'ACCOUNTANT' }
    ];

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userCodeInput = document.getElementById('userCode').value.trim().toUpperCase();
        const passInput = document.getElementById('password').value.trim();
        const errorDiv = document.getElementById('error-msg');

        // 1. Tìm nhân viên
        const foundUser = validUsers.find(u => u.code === userCodeInput);

        // 2. Kiểm tra mã nhân viên
        if (!foundUser) {
            showError("Mã nhân viên không tồn tại!");
            return; // DỪNG LẠI TẠI ĐÂY, KHÔNG CHO VÀO
        }

        // 3. Kiểm tra mật khẩu
        if (foundUser.pass !== passInput) {
            showError("Sai mật khẩu rồi Hào ơi!");
            return; // DỪNG LẠI TẠI ĐÂY, KHÔNG CHO VÀO
        }

        // 4. Nếu vượt qua tất cả mới cho vào
        const userData = {
            code: foundUser.code,
            name: foundUser.name,
            role: foundUser.role
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        window.location.href = 'index.html';

        function showError(message) {
            errorDiv.innerText = message;
            errorDiv.style.display = 'block';
            setTimeout(() => { errorDiv.style.display = 'none'; }, 3000);
        }
    });