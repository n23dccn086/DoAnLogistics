/**
 * Đăng nhập
 */
function doLogin() {
    const loginPage = document.getElementById('loginPage');
    const appLayout = document.getElementById('appLayout');

    if (loginPage) loginPage.style.display = 'none';
    if (appLayout) appLayout.style.display = 'flex';

    showToast('Đăng nhập thành công! Chào Nguyễn Văn Hùng.');
}

/**
 * Đăng xuất
 */
function doLogout() {
    const loginPage = document.getElementById('loginPage');
    const appLayout = document.getElementById('appLayout');

    if (appLayout) appLayout.style.display = 'none';
    if (loginPage) loginPage.style.display = 'flex';

    showToast('Đã đăng xuất.');
}