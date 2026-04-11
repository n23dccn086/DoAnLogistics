// ==================== js/api.js ====================

async function callAPI(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    // ==================== 1. LOGIN - KHÔNG CẦN TOKEN ====================
    if (endpoint === "auth/login") {
        try {
            const response = await fetch(`http://localhost:5000/api/v1/${endpoint}`, {
                method: options.method || 'POST',
                headers: { "Content-Type": "application/json" },
                body: options.body
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error?.message || "Đăng nhập thất bại");
            }
            return await response.json();
        } catch (error) {
            console.error("❌ Login error:", error.message);
            throw error;
        }
    }

    // ==================== 2. CÁC API CẦN TOKEN ====================
    if (!token) {
        console.warn(`🚫 Không có token khi gọi ${endpoint}`);
        goToLogin();
        return null;
    }

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    try {
        const response = await fetch(`http://localhost:5000/api/v1/${endpoint}`, {
            method: options.method || 'GET',
            headers: headers,
            body: options.body || undefined,
            credentials: 'include'
        });

        // Token hết hạn hoặc không hợp lệ
        if (response.status === 401) {
            console.warn(`🚫 Token không hợp lệ (401) - ${endpoint}`);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            goToLogin();
            return null;
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const message = errData.error?.message || `Lỗi ${response.status}`;
            console.error(`❌ ${endpoint} lỗi:`, message);
            throw new Error(message);
        }

        const data = await response.json();
        console.log(`✅ ${endpoint} thành công`);
        return data;

    } catch (error) {
        console.error(`💥 Lỗi callAPI ${endpoint}:`, error.message);

        // Chỉ hiện toast nếu không phải lỗi token (đã xử lý goToLogin rồi)
        if (!error.message.includes("401") && !error.message.includes("Token")) {
            showToast("Không thể kết nối với server", "error");
        }

        throw error;   // vẫn throw để hàm gọi có thể catch
    }
}

// Hàm chuyển về trang login
function goToLogin() {
    console.log("🔴 goToLogin() ĐƯỢC GỌI - Kiểm tra token ngay lập tức");

    const currentToken = localStorage.getItem("token");
    console.log("Token hiện tại trước khi xóa:", currentToken ? 
        currentToken.substring(0, 40) + "..." : "KHÔNG CÓ TOKEN");

    // Xóa token và user
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Hiển thị login
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("appLayout").style.display = "none";

    console.log("Đã chuyển về trang login");
}