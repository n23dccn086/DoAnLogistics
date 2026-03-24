/**
 * Chuyển đổi giữa các trang
 */
async function showPage(pageId) {
    // Bỏ active tất cả nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Active nav item hiện tại
    const activeNav = document.getElementById('nav-' + pageId);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // Đổi tiêu đề trang
    const titles = {
        'dashboard': 'Dashboard',
        'baogia-list': 'Danh sách Báo giá',
        'baogia-create': 'Tạo Báo giá Mới',
        'baogia-detail': 'Chi tiết Báo giá',
        'vandon-list': 'Danh sách Vận đơn',
        'vandon-detail': 'Chi tiết Vận đơn',
        'phieuthu-create': 'Tạo Phiếu Thu',
        'congno': 'Công nợ Khách hàng',
        'khachhang': 'Quản lý Khách hàng',
        'banggia': 'Bảng giá Cước'
    };

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[pageId] || 'VanTai Pro';
    }

    // Load nội dung trang từ thư mục pages/
    const contentArea = document.getElementById('pageContent');
    if (!contentArea) return;

    try {
        const response = await fetch(`pages/${pageId}.html`);
        if (!response.ok) throw new Error('Page not found');
        
        const html = await response.text();
        contentArea.innerHTML = html;
    } catch (error) {
        contentArea.innerHTML = `
            <div style="text-align:center; padding:80px 20px; color:var(--text-muted);">
                <p style="font-size:18px;">Không tìm thấy trang "${pageId}"</p>
                <p style="margin-top:10px;">Vui lòng kiểm tra lại đường dẫn file.</p>
            </div>
        `;
        console.error('Load page error:', error);
    }

    window.scrollTo(0, 0);
}