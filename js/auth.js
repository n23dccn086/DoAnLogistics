async function doLogin() {
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value.trim();

    if (!username || !password) {
        showToast("Vui lòng nhập tên đăng nhập và mật khẩu", "error");
        return;
    }

    try {
        const data = await callAPI("auth/login", {
            method: "POST",
            body: JSON.stringify({ 
                tenDangNhap: username, 
                matKhau: password 
            }),
        });

        if (data && data.accessToken) {
            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("user", JSON.stringify(data.nguoiDung || {}));

            showToast("Đăng nhập thành công!", "success");

            // Ẩn trang login và hiển thị app layout
            document.getElementById("loginPage").style.display = "none";
            document.getElementById("appLayout").style.display = "flex";

            // Chuyển sang Dashboard
            setTimeout(() => {
                showPage("dashboard");
            }, 300);

        } else {
            throw new Error("Server không trả về token");
        }
    } catch (error) {
        console.error("Login failed:", error);
        showToast(error.message || "Đăng nhập thất bại", "error");
    }
}

function doLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  showToast("Đã đăng xuất");
  showPage("login");
}
