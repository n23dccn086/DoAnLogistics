async function callAPI(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/v1/${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'   // thêm dòng này
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showToast("Phiên đăng nhập hết hạn", "error");
        setTimeout(() => location.reload(), 1000);
        return;
      }
      throw new Error(data.error?.message || "Lỗi server");
    }

    return data;

  } catch (error) {
    console.error("API Error:", error);
    showToast("Không kết nối được với server. Kiểm tra backend đang chạy chưa?", "error");
    throw error;
  }
}