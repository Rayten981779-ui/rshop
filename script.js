const MASTER_DEV_PASS = "1234";
let isDevAuthenticated = false;
let loggedInUser = null;
let countdownInterval = null;
let currentFilter = 'ALL';
let activeCheckoutItem = null;
let activeDevTab = 'products'; // แท็บหน้าระบบผู้พัฒนา: 'products', 'users', หรือ 'finance'
let currentDevUsers = [];

const translations = {
    en: {
        signIn: 'SIGN_IN',
        register: 'REGISTER',
        cartButton: 'CART',
        ordersButton: 'ORDERS',
        devPortal: 'DEV_PORTAL',
        heroTag: 'SECURE ASSET DEPOT v5.0',
        heroHeadline: 'PREMIUM 3D <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">CYBER STRUCTURES</span>',
        heroSub: 'Download premium assets with secure QR payment and admin approval.',
        allAssets: 'ALL_ASSETS',
        architecture: 'ARCHITECTURE',
        vehicles: 'VEHICLES',
        others: 'OTHERS',
        createAccount: 'CREATE_ACCOUNT',
        createAccountDesc: 'Create a username and password to access the secure marketplace.',
        userName: 'USER_NAME',
        passwordLabel: 'ACCESS_PASSWORD',
        initializeAccount: 'INITIALIZE ACCOUNT',
        userAuth: 'USER_AUTH',
        forgotPassword: '[ FORGOT_PASSWORD? ]',
        establishConnection: 'ESTABLISH CONNECTION',
        logInWithGoogle: 'LOG_IN WITH GOOGLE',
        recoveryMode: 'RECOVERY_MODE',
        registeredUsername: 'REGISTERED_USERNAME',
        sendRecoveryLink: 'SEND RECOVERY LINK',
        resetPassword: 'RESET PASSWORD',
        enterMasterKey: 'ENTER MASTER KEY (DEFAULT: 1234)',
        accessMainframe: 'ACCESS MAINFRAME',
        manageAssets: 'MANAGE_ASSETS',
        userSecurity: 'USER_SECURITY_MATRIX',
        financialLedger: 'FINANCIAL_LEDGER',
        checkoutTitle: 'PAYMENT PROCESS',
        checkoutVerify: 'Scan the QR code to complete the order, then upload payment slip.',
        cartEmpty: 'Your cart is empty.',
        checkoutButton: 'PROCEED TO PAYMENT',
        abort: 'ABORT',
        forcePayment: 'FORCE_PAYMENT_SUCCESS',
        uploadSlip: 'UPLOAD PAYMENT SLIP',
        chooseFile: 'Choose file',
        submitSlip: 'SUBMIT_SLIP',
        statusAwaiting: 'AWAITING SLIP UPLOAD',
        statusUploaded: 'SLIP UPLOADED',
        statusApproved: 'APPROVED',
        statusRejected: 'REJECTED',
        orderEmpty: 'No orders found.',
        downloadAsset: 'DOWNLOAD_ASSET_PACKAGE',
        returnToShowcase: 'RETURN_TO_SHOWCASE',
        adminApprove: 'APPROVE',
        adminReject: 'REJECT',
        adminOrderPanel: 'ORDER APPROVAL PANEL',
        productNotFound: 'No products found.',
        googleConfigMissing: 'The Google OAuth configuration is missing on the server.'
    },
    th: {
        signIn: 'เข้าสู่ระบบ',
        register: 'สมัครสมาชิก',
        cartButton: 'ตะกร้า',
        ordersButton: 'คำสั่งซื้อ',
        devPortal: 'DEV_PORTAL',
        heroTag: 'คลังสินค้าปลอดภัย v5.0',
        heroHeadline: 'โมเดล 3D <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">พรีเมียม</span>',
        heroSub: 'ดาวน์โหลดสินค้าคุณภาพ พร้อมระบบ QR ชำระเงินและอัปโหลดสลิปจริง',
        allAssets: 'สินค้าทั้งหมด',
        architecture: 'อาคาร',
        vehicles: 'ยานยนต์',
        others: 'อื่นๆ',
        createAccount: 'สร้างบัญชี',
        createAccountDesc: 'สร้างบัญชีสมาชิกเพื่อเข้าถึงร้านค้าออนไลน์',
        userName: 'ชื่อผู้ใช้',
        passwordLabel: 'รหัสผ่าน',
        initializeAccount: 'สร้างบัญชี',
        userAuth: 'เข้าสู่ระบบลูกค้า',
        forgotPassword: '[ ลืมรหัสผ่าน? ]',
        establishConnection: 'เข้าสู่ระบบ',
        logInWithGoogle: 'เข้าสู่ระบบด้วย Google',
        recoveryMode: 'กู้คืนบัญชี',
        registeredUsername: 'ชื่อผู้ใช้ที่ลงทะเบียน',
        sendRecoveryLink: 'ส่งลิงก์กู้คืน',
        resetPassword: 'รีเซ็ตรหัสผ่าน',
        enterMasterKey: 'ใส่ Master Key (ค่าเริ่มต้น: 1234)',
        accessMainframe: 'เข้าสู่ระบบแอดมิน',
        manageAssets: 'จัดการสินค้า',
        userSecurity: 'จัดการผู้ใช้',
        financialLedger: 'จัดการคำสั่งซื้อ',
        checkoutTitle: 'ขั้นตอนชำระเงิน',
        checkoutVerify: 'สแกน QR Code เพื่อชำระ จากนั้นอัปโหลดสลิป',
        cartEmpty: 'ตะกร้าของคุณว่างเปล่า',
        checkoutButton: 'ไปหน้าชำระเงิน',
        abort: 'ยกเลิก',
        forcePayment: 'ตรวจสอบการชำระเงิน',
        uploadSlip: 'อัปโหลดสลิป',
        chooseFile: 'เลือกไฟล์',
        submitSlip: 'ส่งสลิป',
        statusAwaiting: 'รออัปโหลดสลิป',
        statusUploaded: 'อัปโหลดสลิปแล้ว',
        statusApproved: 'อนุมัติแล้ว',
        statusRejected: 'ปฏิเสธแล้ว',
        orderEmpty: 'ยังไม่มีคำสั่งซื้อ',
        downloadAsset: 'ดาวน์โหลดไฟล์',
        returnToShowcase: 'กลับหน้าหลัก',
        adminApprove: 'อนุมัติ',
        adminReject: 'ปฏิเสธ',
        adminOrderPanel: 'แผงอนุมัติคำสั่งซื้อ',
        productNotFound: 'ไม่พบสินค้า',
        googleConfigMissing: 'กรุณาตั้งค่า GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET ในไฟล์ .env'
    }
};

let currentLang = localStorage.getItem('rshop_lang') || 'th';

let jwtToken = localStorage.getItem('cyber_jwt') || null;
let userProfile = localStorage.getItem('cyber_profile') ? JSON.parse(localStorage.getItem('cyber_profile')) : null;

if (userProfile && userProfile.username) {
    loggedInUser = userProfile.username;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('rshop_lang', lang);
    applyTranslations();
    updateLangButtons();
}

function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[currentLang] && translations[currentLang][key]) {
            el.innerHTML = translations[currentLang][key];
        }
    });
}

function updateLangButtons() {
    const thBtn = document.getElementById('btn-lang-th');
    const enBtn = document.getElementById('btn-lang-en');
    if (!thBtn || !enBtn) return;
    if (currentLang === 'th') {
        thBtn.className = 'text-black bg-emerald-400 px-3 py-1 rounded-sm uppercase font-bold text-[10px]';
        enBtn.className = 'text-emerald-400 border border-emerald-500 px-3 py-1 rounded-sm uppercase text-[10px]';
    } else {
        enBtn.className = 'text-black bg-emerald-400 px-3 py-1 rounded-sm uppercase font-bold text-[10px]';
        thBtn.className = 'text-emerald-400 border border-emerald-500 px-3 py-1 rounded-sm uppercase text-[10px]';
    }
}

function handleActionClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (!action) return;

    switch (action) {
        case 'navigate-customer-page':
            navigateTo('customer-page');
            break;
        case 'navigate-login-cust-page':
            window.location.href = '/login.html';
            break;
        case 'navigate-register-cust-page':
            window.location.href = '/login.html';
            break;
        case 'navigate-forgot-page':
            navigateTo('forgot-page');
            break;
        case 'navigate-login-page':
            navigateTo('login-page');
            break;
        case 'navigate-dev-page':
            navigateTo('dev-page');
            break;
        case 'login-customer':
            loginCustomer();
            break;
        case 'register-customer':
            registerCustomer();
            break;
        case 'view-orders':
            viewOrders();
            break;
        case 'logout-customer':
            logoutCustomer();
            break;
        case 'login-dev':
            loginDev();
            break;
        case 'logout-dev':
            logoutDev();
            break;
        case 'start-google-login':
            startGoogleLogin();
            break;
        case 'request-reset-password':
            requestResetPassword();
            break;
        case 'execute-reset-password':
            executeResetPassword();
            break;
        case 'switch-dev-tab':
            switchDevTab(button.dataset.devTab || 'products');
            break;
        case 'view-admin-orders':
            viewAdminOrders();
            break;
        case 'add-product':
            addProduct();
            break;
        case 'cancel-checkout':
            cancelCheckout();
            break;
        case 'simulate-kbank-callback':
            simulateKBankCallback();
            break;
        case 'close-slip-modal':
            closeSlipModal();
            break;
        case 'submit-slip-upload':
            submitSlipUpload();
            break;
        case 'close-password-modal':
            closePasswordModal();
            break;
        case 'submit-admin-password-change':
            submitAdminChangePassword();
            break;
        case 'filter-category':
            if (button.dataset.category) filterCategory(button.dataset.category);
            break;
        case 'buy-product':
            buyProcess(Number(button.dataset.productId));
            break;
        case 'admin-change-password':
            openPasswordModal(button.dataset.username, currentDevUsers.find(u => u.username === button.dataset.username)?.password || '');
            break;
        case 'admin-ban-user':
            adminBanUser(button.dataset.username);
            break;
        case 'admin-unban-user':
            adminUnbanUser(button.dataset.username);
            break;
        case 'admin-timed-lock':
            adminTimedLock(button.dataset.username);
            break;
        case 'open-slip-upload':
            openSlipUploadModal(Number(button.dataset.orderId));
            break;
        case 'download-order-assets':
            downloadOrderAssets(Number(button.dataset.orderId));
            break;
        case 'approve-order':
            approveOrder(Number(button.dataset.orderId));
            break;
        case 'reject-order':
            rejectOrder(Number(button.dataset.orderId));
            break;
        default:
            break;
    }
}

function initLanguage() {
    setLanguage(currentLang);
}

// คลังสินค้าเริ่มต้น (ใช้สำหรับการแสดงผลฝั่งลูกค้าและเปรียบเทียบราคา)
const products = [
    { id: 201, category: "HOME", title: "CHAKRI MAHA PRASAT V2", price: 1250, download: "https://drive.google.com/file/d/sample1", img: "https://images.unsplash.com/photo-1590059132669-467d12a1f173?w=600" },
    { id: 202, category: "CAR", title: "MODERN PROTO CYBER CAR", price: 690, download: "https://drive.google.com/file/d/sample2", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600" },
    { id: 203, category: "HOME", title: "TRADITIONAL NEO THAI HOUSE", price: 850, download: "https://drive.google.com/file/d/sample3", img: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600" }
];

// --- ระบบควบคุมสลับเซกชันหน้าจอ (Router) ---
function navigateTo(sectionId) {
    const publicSections = ['login-cust-page', 'register-cust-page', 'forgot-page', 'reset-password-page', 'login-page', 'dev-page'];

    // ก่อนเข้าเว็บไซต์ ผู้ใช้ต้องเข้าสู่ระบบก่อน
    if (!loggedInUser && !publicSections.includes(sectionId)) {
        sectionId = 'login-cust-page';
    }

    if (sectionId === 'dev-page' && !isDevAuthenticated) {
        sectionId = 'login-page';
    }

    try {
        document.querySelectorAll('section, main').forEach(el => el.classList.add('hidden-section'));
        const targetEl = document.getElementById(sectionId);
        if (targetEl) {
            targetEl.classList.remove('hidden-section');
        } else {
            console.warn(`Section ${sectionId} not found`);
        }

        if (sectionId === 'customer-page') renderCustomerView();
        if (sectionId === 'dev-page') { switchDevTab(activeDevTab); }
        updateAuthUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        console.error('navigateTo error:', err);
    }
}

function updateAuthUI() {
    if (loggedInUser) {
        document.getElementById('guest-zone').classList.add('hidden-section');
        document.getElementById('user-zone').classList.remove('hidden-section');

        let displayHtml = '';
        if (userProfile && userProfile.picture) {
            displayHtml = `<img src="${userProfile.picture}" class="w-5 h-5 rounded-full border border-emerald-500/50 inline-block mr-1 align-middle">${loggedInUser.toUpperCase()}`;
        } else {
            displayHtml = loggedInUser.toUpperCase();
        }
        document.getElementById('user-display').innerHTML = displayHtml;
    } else {
        document.getElementById('guest-zone').classList.remove('hidden-section');
        document.getElementById('user-zone').classList.add('hidden-section');
    }
}

// --- ระบบสลับแท็บในหน้าแอดมิน (โมเดล / บัญชีรายชื่อ) ---
function switchDevTab(tab) {
    activeDevTab = tab;
    document.getElementById('dev-section-products').classList.add('hidden-section');
    document.getElementById('dev-section-users').classList.add('hidden-section');
    document.getElementById('dev-section-finance').classList.add('hidden-section');

    document.getElementById('dev-tab-products').className = "px-5 py-2.5 font-bold border border-zinc-800 text-zinc-400 bg-zinc-900/30 hover:text-emerald-400 cursor-pointer";
    document.getElementById('dev-tab-users').className = "px-5 py-2.5 font-bold border border-zinc-800 text-zinc-400 bg-zinc-900/30 hover:text-emerald-400 cursor-pointer";
    document.getElementById('dev-tab-finance').className = "px-5 py-2.5 font-bold border border-zinc-800 text-zinc-400 bg-zinc-900/30 hover:text-emerald-400 cursor-pointer";

    updateDevStats();

    if (tab === 'products') {
        document.getElementById('dev-section-products').classList.remove('hidden-section');
        document.getElementById('dev-tab-products').className = "px-5 py-2.5 font-bold border border-emerald-500 bg-emerald-500 text-black cursor-pointer";
        renderDevView();
    } else if (tab === 'users') {
        document.getElementById('dev-section-users').classList.remove('hidden-section');
        document.getElementById('dev-tab-users').className = "px-5 py-2.5 font-bold border border-emerald-500 bg-emerald-500 text-black cursor-pointer";
        renderUsersView();
    } else if (tab === 'finance') {
        document.getElementById('dev-section-finance').classList.remove('hidden-section');
        document.getElementById('dev-tab-finance').className = "px-5 py-2.5 font-bold border border-emerald-500 bg-emerald-500 text-black cursor-pointer";
        renderFinanceView();
    }
}

// --- ระบบสถิติหลังบ้านแอดมิน (Dashboard Stats) ---
async function updateDevStats() {
    try {
        const res = await fetch('/api/dev/stats');
        const data = await res.json();

        let totalRevenue = 0;
        if (data.items) {
            data.items.forEach(item => {
                const p = products.find(prod => prod.title === item.item_title);
                if (p) {
                    totalRevenue += p.price;
                }
            });
        }

        document.getElementById('dev-total-users').textContent = data.totalUsers;
        document.getElementById('dev-total-tx').textContent = data.totalTx;
        document.getElementById('dev-total-revenue').textContent = `฿${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
    }
}

// --- บัญชีแยกประเภทการชำระเงิน (Financial Ledger Render) ---
async function renderFinanceView() {
    const tbody = document.getElementById('dev-finance-list');
    tbody.innerHTML = '';

    try {
        const res = await fetch('/api/dev/users');
        const serverUsers = await res.json();

        let txCount = 0;
        serverUsers.forEach(u => {
            if (u.boughtItems) {
                u.boughtItems.forEach((itemTitle) => {
                    txCount++;
                    const p = products.find(prod => prod.title === itemTitle);
                    const price = p ? p.price : 0;
                    const date = new Date(Date.now() - (txCount * 3600000));
                    const timestamp = date.toISOString().replace('T', ' ').substring(0, 19);

                    tbody.innerHTML += `
                        <tr class="hover:bg-zinc-900/40 border-b border-zinc-900 text-xs font-mono transition">
                            <td class="p-4 text-zinc-500">${timestamp}</td>
                            <td class="p-4 text-white font-bold">${u.username}</td>
                            <td class="p-4 text-zinc-300 font-bold">${itemTitle}</td>
                            <td class="p-4 text-right text-emerald-400 font-bold">฿${parseFloat(price).toLocaleString()}</td>
                            <td class="p-4 text-center">
                                <span class="bg-emerald-950/80 border border-emerald-500 text-emerald-400 text-[9px] font-bold px-2 py-0.5">✓ SETTLED</span>
                            </td>
                        </tr>
                    `;
                });
            }
        });

        if (txCount === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-zinc-500">// LEDGER_EMPTY //</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">// ERROR FETCHING LEDGER FROM SERVER //</td></tr>`;
    }
}

// --- ระบบสมัครสมาชิก ---
async function registerCustomer() {
    const username = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();

    if (!username || !pass) return alert('กรุณากรอกข้อมูลเครือข่ายระบบให้ครบถ้วน');

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            alert('บันทึกข้อมูลบัญชีเข้าสู่ระบบเครือข่ายสำเร็จ!');
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-pass').value = '';
            navigateTo('login-cust-page');
        } else {
            alert(`SECURITY DENIED: ${data.error}`);
        }
    } catch (err) {
        alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลักได้');
    }
}

// --- ระบบล็อกอินลูกค้า ---
async function loginCustomer() {
    const username = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    if (!username || !pass) return alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            jwtToken = data.token;
            userProfile = {
                username: data.username,
                displayName: data.displayName,
                picture: null,
                email: null
            };
            localStorage.setItem('cyber_jwt', jwtToken);
            localStorage.setItem('cyber_profile', JSON.stringify(userProfile));
            loggedInUser = data.username;
            alert(`ACCESS GRANTED // เข้าสู่ระบบสำเร็จ: ${loggedInUser}`);
            document.getElementById('login-username').value = '';
            document.getElementById('login-pass').value = '';
            navigateTo('customer-page');
        } else {
            alert(`AUTH FAILURE: ${data.error}`);
        }
    } catch (err) {
        alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลักเพื่อตรวจสอบสิทธิ์ได้');
    }
}

// --- ระบบ Logout ---
async function logoutCustomer() {
    jwtToken = null;
    userProfile = null;
    loggedInUser = null;
    localStorage.removeItem('cyber_jwt');
    localStorage.removeItem('cyber_profile');

    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { }

    alert('ตัดการเชื่อมต่อสัญญาณเรียบร้อย');
    navigateTo('login-cust-page');
}

// --- REAL GOOGLE OAUTH 2.0 INITIALIZATION & FLOW ---
let googleLoginPopup = null;

function initGoogleOAuth() {
    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        const data = event.data;
        if (!data || data.source !== 'google-oauth') return;

        if (data.success) {
            jwtToken = data.token;
            userProfile = {
                username: data.username,
                displayName: data.displayName,
                picture: data.picture,
                email: data.email
            };
            localStorage.setItem('cyber_jwt', jwtToken);
            localStorage.setItem('cyber_profile', JSON.stringify(userProfile));
            loggedInUser = data.username;
            alert(`GOOGLE CONNECTED // ยินดีต้อนรับคุณ ${data.displayName} (${loggedInUser})`);
            navigateTo('customer-page');
        } else {
            alert(`GOOGLE AUTH REJECTED: ${data.error}`);
        }
    });
}

function startGoogleLogin() {
    const width = 500;
    const height = 700;
    const left = window.screenX + ((window.outerWidth - width) / 2);
    const top = window.screenY + ((window.outerHeight - height) / 2);
    const popup = window.open('/api/auth/google?redirect=popup', 'googleLoginPopup', `width=${width},height=${height},left=${left},top=${top}`);

    if (!popup) {
        return alert('โปรดอนุญาตเปิดหน้าต่างป็อปอัปเพื่อเข้าสู่ระบบด้วย Google');
    }

    popup.focus();
    googleLoginPopup = popup;
}

// --- ระบบขอเปลี่ยนรหัสผ่านสไตล์จำลอง (ต่อเข้าเซิร์ฟเวอร์จริง) ---
let usernameTargetForReset = "";

async function requestResetPassword() {
    const username = document.getElementById('forgot-username').value.trim();

    try {
        const res = await fetch('/api/dev/users');
        const serverUsers = await res.json();
        const userExist = serverUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && !u.isGoogle);

        if (!userExist) return alert('ไม่พบบัญชีผู้ใช้งานดังกล่าว หรือเป็นบัญชี Google');

        usernameTargetForReset = username;
        alert(`[GATEWAY SIMULATION] ยืนยันตัวตนสำเร็จ ระบบกำลังเข้าสู่หน้าแก้ไขรหัสผ่านใหม่`);
        document.getElementById('forgot-username').value = '';
        document.getElementById('reset-target-display').textContent = `NODE_TARGET: ${usernameTargetForReset}`;
        navigateTo('reset-password-page');
    } catch (e) {
        alert('ไม่สามารถเชื่อมต่อเพื่อสืบค้นข้อมูลบัญชีได้');
    }
}

async function executeResetPassword() {
    const newPass = document.getElementById('reset-new-pass').value.trim();
    if (!newPass) return alert('กรุณาระบุรหัสผ่านใหม่');

    try {
        const res = await fetch('/api/dev/users/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetUsername: usernameTargetForReset,
                action: 'CHANGE_PASSWORD',
                payload: newPass
            })
        });
        const data = await res.json();
        if (data.success) {
            alert('อัปเดตความปลอดภัยสับเปลี่ยนรหัสผ่านใหม่สำเร็จ!');
            document.getElementById('reset-new-pass').value = '';
            navigateTo('login-cust-page');
        } else {
            alert(`FAILED: ${data.error}`);
        }
    } catch (err) {
        alert('ไม่สามารถอัปเดตรหัสผ่านใหม่ลงฐานข้อมูลหลักได้');
    }
}

// --- ระบบจัดการหน้าแสดงผลสินค้าสำหรับลูกค้า ---
function filterCategory(cat) {
    currentFilter = cat;
    ['ALL', 'HOME', 'CAR', 'OTHER'].forEach(id => {
        const btn = document.getElementById(`btn-cat-${id.toLowerCase()}`);
        if (id === cat) {
            btn.className = "px-5 py-2 text-xs font-bold border border-emerald-500 bg-emerald-500 text-black transition cursor-pointer";
        } else {
            btn.className = "px-5 py-2 text-xs font-bold border border-transparent text-zinc-500 hover:text-emerald-400 transition cursor-pointer";
        }
    });
    renderCustomerView();
}

function renderCustomerView() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    const filtered = products.filter(p => currentFilter === 'ALL' || p.category === currentFilter);
    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-zinc-600 py-20 text-xs font-mono">// NO_ACTIVE_DATA_NODES_FOUND</div>`;
        return;
    }

    filtered.forEach(item => {
        let catText = item.category === 'HOME' ? 'ARCH' : item.category === 'CAR' ? 'VEHICLE' : 'OTHER';
        container.innerHTML += `
            <div class="bg-[#0f0f12] border border-zinc-900 overflow-hidden flex flex-col group relative transition-all duration-300 hover:border-emerald-500/40">
                <div class="product-card-img-container">
                    <span class="absolute top-4 left-4 bg-black/80 text-emerald-400 text-[9px] font-bold px-2 py-0.5 border border-emerald-500/20 z-10 font-mono tracking-widest">${catText}</span>
                    <img class="h-60 w-full object-cover product-card-img" src="${item.img}" alt="${item.title}">
                </div>
                <div class="p-5 flex-grow flex flex-col justify-between bg-[#0f0f12] z-20">
                    <div>
                        <h4 class="text-sm font-black text-white tracking-wider font-mono uppercase mb-3 truncate">${item.title}</h4>
                    </div>
                    <div class="flex items-center justify-between border-t border-zinc-900 pt-3 h-10 overflow-hidden relative">
                        <span class="text-base font-mono font-black text-emerald-400">฿${parseFloat(item.price).toLocaleString()}</span>
                        <button data-action="buy-product" data-product-id="${item.id}" class="product-buy-btn bg-emerald-500 text-black text-[10px] font-mono font-bold uppercase px-3 py-2 hover:bg-emerald-400 transition cursor-pointer">
                            ACQUIRE_DATA
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

// --- ขั้นตอนการชำระเงินจำลองผ่าน KBank ---
function buyProcess(id) {
    if (!loggedInUser) {
        alert('SECURITY REJECTED: กรุณาลงชื่อเข้าสู่รหัสสมาชิกเครือข่ายก่อนสั่งซื้อ');
        navigateTo('login-cust-page');
        return;
    }

    const item = products.find(p => p.id === id);
    if (!item) return;

    activeCheckoutItem = item;
    document.getElementById('checkout-title').textContent = item.title;
    document.getElementById('checkout-price').textContent = `฿${parseFloat(item.price).toLocaleString()}`;

    let timerSetting = parseInt(document.getElementById('system-timer').value) || 45;
    const uniquePayload = `KBANK-GATEWAY-TXID-${Date.now()}-AMT-${item.price}`;
    document.getElementById('qr-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uniquePayload)}`;

    navigateTo('checkout-page');
    startTimer(timerSetting);
}

function startTimer(seconds) {
    if (countdownInterval) clearInterval(countdownInterval);
    let time = seconds;
    const display = document.getElementById('countdown-timer');
    display.textContent = time;

    countdownInterval = setInterval(() => {
        time--;
        display.textContent = time;
        if (time <= 0) {
            clearInterval(countdownInterval);
            alert('TIMEOUT: ออเดอร์หมดเวลาการันตีความปลอดภัยของโครงข่ายกสิกรแล้ว');
            navigateTo('customer-page');
        }
    }, 1000);
}

async function simulateKBankCallback() {
    if (countdownInterval) clearInterval(countdownInterval);

    try {
        const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ itemTitle: activeCheckoutItem.title })
        });
        const data = await res.json();
        if (!data.success) {
            alert(`FAILED TO RECORD TRANSACTION: ${data.error}`);
            navigateTo('customer-page');
            return;
        }
    } catch (err) {
        console.error(err);
        alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลักเพื่อบันทึกสิทธิ์การเข้าถึงได้');
        navigateTo('customer-page');
        return;
    }

    document.getElementById('download-title').textContent = "DECRYPT SUCCESS";
    document.getElementById('download-order-id').textContent = `TX-HASH-${Math.random().toString(36).substr(2, 12).toUpperCase()}-${Date.now()}`;
    document.getElementById('download-secure-link').href = activeCheckoutItem.download || "#";

    navigateTo('download-page');
}

function cancelCheckout() {
    if (countdownInterval) clearInterval(countdownInterval);
    navigateTo('customer-page');
}

// --- แผงควบคุมระบบผู้พัฒนา (Developer Mainframe) ---
function loginDev() {
    if (document.getElementById('dev-password').value === MASTER_DEV_PASS) {
        isDevAuthenticated = true;
        document.getElementById('dev-password').value = '';
        navigateTo('dev-page');
    } else {
        alert('MASTER KEY INVALID: การเข้ารหัสเซิร์ฟเวอร์หลักล้มเหลว');
    }
}

function logoutDev() {
    isDevAuthenticated = false;
    navigateTo('customer-page');
}

// เรนเดอร์ฝั่งสินค้าแอดมิน
function renderDevView() {
    const tbody = document.getElementById('dev-products-list');
    tbody.innerHTML = '';

    products.forEach(item => {
        tbody.innerHTML += `
            <tr class="hover:bg-zinc-900/40 border-b border-zinc-900 transition">
                <td class="p-3"><img src="${item.img}" class="w-10 h-10 object-cover border border-zinc-800"></td>
                <td class="p-3">
                    <div class="font-bold text-white uppercase">${item.title}</div>
                    <span class="text-[9px] font-bold text-emerald-400 uppercase font-mono">${item.category}</span>
                </td>
                <td class="p-3 font-mono text-zinc-500 text-[10px] break-all max-w-xs">${item.download}</td>
                <td class="p-3 text-right font-mono font-bold text-emerald-400">฿${parseFloat(item.price).toLocaleString()}</td>
                <td class="p-3 text-center">
                    <button class="border border-zinc-800 text-zinc-500 px-2 py-0.5 cursor-not-allowed text-[10px]" title="ระบบสินค้าตัวอย่างถูกล็อกสิทธิ์ความปลอดภัยใน Code">LOCKED</button>
                </td>
            </tr>
        `;
    });
}

// 👥 เรนเดอร์ฝั่งผู้ใช้ดึงจากเซิร์ฟเวอร์หลัก
async function renderUsersView() {
    const tbody = document.getElementById('dev-users-list');
    tbody.innerHTML = '';
    const now = Date.now();

    try {
        const res = await fetch('/api/dev/users');
        const serverUsers = await res.json();
        currentDevUsers = serverUsers;

        serverUsers.forEach((user) => {
            let statusBadge = "";
            if (user.status === 'BANNED') {
                statusBadge = `<span class="bg-red-950/80 border border-red-500 text-red-400 text-[9px] font-bold px-2 py-0.5 uppercase font-bold">🛑 BANNED</span>`;
            } else if (user.status === 'TIMED_LOCKED' && now < user.lockUntil) {
                let remain = Math.ceil((user.lockUntil - now) / 1000);
                statusBadge = `<span class="bg-amber-950/80 border border-amber-500 text-amber-400 text-[9px] font-bold px-2 py-0.5 uppercase font-bold">⏳ LOCKED (${remain}s)</span>`;
            } else {
                statusBadge = `<span class="bg-emerald-950/80 border border-emerald-500 text-emerald-400 text-[9px] font-bold px-2 py-0.5 uppercase font-bold">✓ SECURE_ACTIVE</span>`;
            }

            let itemsList = user.boughtItems && user.boughtItems.length > 0
                ? user.boughtItems.map(item => `<div class="text-zinc-300 text-[11px]">• ${item}</div>`).join('')
                : `<span class="text-zinc-500 text-[11px]">ไม่มีประวัติครอบครอง</span>`;

            let passwordDisplay = "";
            if (user.isGoogle) {
                passwordDisplay = `<span class="text-red-400 border border-red-500/20 bg-red-950/20 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase font-bold">[GOOGLE_OAUTH]</span>`;
            } else {
                const hash = user.password || "";
                const shortHash = hash.substring(0, 12) + "...";
                passwordDisplay = `<span class="text-emerald-400 select-all cursor-pointer font-mono font-bold" title="${hash}">${shortHash}</span>`;
            }

            const userLabel = user.isGoogle ? `${user.username} (Google)` : user.username;

            tbody.innerHTML += `
                <tr class="hover:bg-zinc-900/40 border-b border-zinc-900 text-xs font-mono">
                    <td class="p-4 text-white font-bold text-sm lowercase">${userLabel}</td>
                    <td class="p-4 text-zinc-400 font-bold">${passwordDisplay}</td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4 bg-zinc-950/30 border-x border-zinc-900/50">${itemsList}</td>
                    <td class="p-4">
                        <div class="flex flex-wrap gap-2 justify-center">
                            <button data-action="admin-change-password" data-username="${user.username}" data-is-google="${user.isGoogle}"
                                class="bg-zinc-800 text-white hover:bg-zinc-700 px-2 py-1 text-[10px] uppercase font-bold cursor-pointer">🔑 แก้รหัส</button>
                            
                            ${user.status !== 'BANNED'
                    ? `<button data-action="admin-ban-user" data-username="${user.username}"
                        class="bg-red-950/50 border border-red-600 text-red-400 hover:bg-red-600 hover:text-black px-2 py-1 text-[10px] uppercase font-bold cursor-pointer">🛑 แบนถาวร</button>`
                    : `<button data-action="admin-unban-user" data-username="${user.username}"
                        class="bg-zinc-800 border border-zinc-600 text-zinc-300 hover:bg-zinc-600 hover:text-black px-2 py-1 text-[10px] uppercase font-bold cursor-pointer">ปลดแบน</button>`
                }
                            
                            <button data-action="admin-timed-lock" data-username="${user.username}"
                                class="bg-amber-950/50 border border-amber-600 text-amber-400 hover:bg-amber-500 hover:text-black px-2 py-1 text-[10px] uppercase font-bold cursor-pointer">⏳ บล็อกเวลา</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">// ERROR FETCHING USERS FROM SERVER //</td></tr>`;
    }
}

// --- ฟังก์ชันการทำงานปุ่มแอดมินจัดการผู้ใช้ ---
async function sendAdminAction(username, action, payload = '') {
    try {
        const res = await fetch('/api/dev/users/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUsername: username, action, payload })
        });
        const data = await res.json();
        if (data.success) {
            await renderUsersView();
            await updateDevStats();
            return true;
        } else {
            alert(`ACTION FAILED: ${data.error}`);
            return false;
        }
    } catch (err) {
        alert('ไม่สามารถเชื่อมต่อเพื่อดำเนินการได้');
        return false;
    }
}

let activePasswordResetUsername = null;
let activePasswordResetCurrentHash = null;

function openPasswordModal(username, currentHash) {
    activePasswordResetUsername = username;
    activePasswordResetCurrentHash = currentHash;

    document.getElementById('pw-modal-target').textContent = `user: ${username}`;
    document.getElementById('pw-modal-current').textContent = currentHash.substring(0, 15) + "...";
    document.getElementById('pw-modal-current').title = currentHash;
    document.getElementById('pw-modal-input').value = '';

    renderKeyRotationLogs(username);

    document.getElementById('password-modal').classList.remove('hidden-section');
}

function closePasswordModal() {
    document.getElementById('password-modal').classList.add('hidden-section');
    activePasswordResetUsername = null;
    activePasswordResetCurrentHash = null;
}

function renderKeyRotationLogs(username) {
    const tbody = document.getElementById('pw-modal-logs-tbody');
    tbody.innerHTML = '';

    const storageKey = `rshop_pw_rotation_logs_${username}`;
    const logs = JSON.parse(localStorage.getItem(storageKey) || '[]');

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-2 text-center text-zinc-600">// LOGS_EMPTY //</td></tr>`;
        return;
    }

    logs.slice().reverse().forEach(log => {
        tbody.innerHTML += `
            <tr class="hover:bg-zinc-900/40 border-b border-zinc-955 transition text-[10px]">
                <td class="p-2 text-zinc-500">${log.timestamp}</td>
                <td class="p-2 text-zinc-400 font-mono select-all truncate max-w-[120px]" title="${log.oldHash}">${log.oldHash.substring(0, 10)}...</td>
                <td class="p-2 text-emerald-400 font-mono select-all truncate max-w-[120px]" title="${log.newHash}">${log.newHash.substring(0, 10)}...</td>
            </tr>
        `;
    });
}

async function submitAdminChangePassword() {
    const newPass = document.getElementById('pw-modal-input').value.trim();
    if (!newPass) return alert('รหัสผ่านต้องห้ามเป็นช่องว่างครับ');

    const username = activePasswordResetUsername;
    const oldHash = activePasswordResetCurrentHash;

    const success = await sendAdminAction(username, 'CHANGE_PASSWORD', newPass);
    if (success) {
        const res = await fetch('/api/dev/users');
        const serverUsers = await res.json();
        currentDevUsers = serverUsers;
        const updatedUser = serverUsers.find(u => u.username === username);
        const newHash = updatedUser ? updatedUser.password : '[HASH_GENERATION_FAILED]';

        const storageKey = `rshop_pw_rotation_logs_${username}`;
        const logs = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        logs.push({
            timestamp,
            oldHash,
            newHash
        });
        localStorage.setItem(storageKey, JSON.stringify(logs));

        alert('เปลี่ยนรหัสผ่านในระบบคอร์หลักเรียบร้อยแล้ว');
        closePasswordModal();
        await renderUsersView();
    }
}

async function adminChangePassword(username, isGoogle) {
    if (isGoogle) {
        return alert('REJECTED: ไม่สามารถเปลี่ยนรหัสผ่านของบัญชี Google Sign-In ผ่านแผงควบคุมแอดมินได้');
    }
    const user = currentDevUsers.find(u => u.username === username);
    const currentHash = user ? user.password : '';
    openPasswordModal(username, currentHash);
}

async function adminBanUser(username) {
    if (confirm(`คุณต้องการทำการแบนบัญชีผู้ใช้ [ ${username} ] ออกจากเครือข่ายถาวรใช่หรือไม่?`)) {
        await sendAdminAction(username, 'BAN');
    }
}

async function adminUnbanUser(username) {
    const success = await sendAdminAction(username, 'UNBAN');
    if (success) {
        alert('คืนค่าสิทธิ์สัญญาณการเข้าระบบบัญชีผู้ใช้สำเร็จ');
    }
}

async function adminTimedLock(username) {
    const secInput = prompt(`ระบุจำนวน "วินาที" ที่ต้องการบล็อกตัดสัญญาณบัญชีนี้ชั่วคราว (เช่น 30 หรือ 60) :`);
    if (secInput === null) return;
    const seconds = parseInt(secInput);
    if (isNaN(seconds) || seconds <= 0) return alert('กรุณาระบุจำนวนตัวเลขวินาทีที่ถูกต้องครับ');

    const success = await sendAdminAction(username, 'TIMED_LOCK', seconds);
    if (success) {
        alert(`ทำการล็อกสัญญาณบัญชีผู้ใช้ชั่วคราวเป็นเวลา ${seconds} วินาที เรียบร้อย!`);
    }
}

// --- ฟังก์ชันสำหรับจัดการออเดอร์และการอัปโหลดสลิป ---
let currentOrderIdForSlip = null;

async function viewOrders() {
    if (!loggedInUser) {
        alert('กรุณาลงชื่อเข้าสู่ระบบก่อน');
        navigateTo('login-cust-page');
        return;
    }
    navigateTo('orders-page');
    await renderOrdersPage();
}

async function renderOrdersPage() {
    const container = document.getElementById('orders-list');
    container.innerHTML = '<div class="col-span-full text-center text-zinc-400 py-10">กำลังโหลดข้อมูลออเดอร์...</div>';

    try {
        const res = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        const orders = await res.json();

        if (!Array.isArray(orders) || orders.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center text-zinc-600 py-20 text-sm font-mono">// NO_ORDERS_FOUND //</div>`;
            return;
        }

        container.innerHTML = '';
        orders.forEach(order => {
            const statusBadgeClass = order.status === 'APPROVED' ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-400'
                : order.status === 'REJECTED' ? 'bg-red-950/80 border border-red-500 text-red-400'
                    : 'bg-amber-950/80 border border-amber-500 text-amber-400';

            const productsHtml = order.products && order.products.length > 0
                ? order.products.map(p => `<div class="text-zinc-300 text-[11px]">• ${p.title} (฿${parseFloat(p.price).toLocaleString()})</div>`).join('')
                : '<span class="text-zinc-600 text-[11px]">ไม่มีสินค้า</span>';

            let actionHtml = '';
            if (order.status === 'AWAITING_SLIP') {
                actionHtml = `<button data-action="open-slip-upload" data-order-id="${order.id}" class="bg-emerald-500 text-black px-3 py-1.5 text-[10px] font-bold uppercase cursor-pointer hover:bg-emerald-400">UPLOAD_SLIP</button>`;
            } else if (order.status === 'APPROVED') {
                actionHtml = `<button data-action="download-order-assets" data-order-id="${order.id}" class="bg-blue-600 text-white px-3 py-1.5 text-[10px] font-bold uppercase cursor-pointer hover:bg-blue-500">DOWNLOAD</button>`;
            } else {
                actionHtml = `<span class="text-zinc-500 text-[10px]">--</span>`;
            }

            container.innerHTML += `
                <div class="bg-[#0f0f12] border border-zinc-800 p-5 font-mono">
                    <div class="flex justify-between items-start mb-4 border-b border-zinc-900 pb-3">
                        <div>
                            <div class="text-xs font-bold text-white">ORDER #${order.id}</div>
                            <div class="text-[10px] text-zinc-500 mt-1">${new Date(order.createdAt * 1000).toLocaleString()}</div>
                        </div>
                        <span class="text-[9px] font-bold px-2 py-1 ${statusBadgeClass}">${order.status}</span>
                    </div>
                    
                    <div class="mb-4">
                        <div class="text-[10px] text-zinc-500 uppercase mb-2">PRODUCTS:</div>
                        ${productsHtml}
                    </div>
                    
                    <div class="flex justify-between items-center pt-4 border-t border-zinc-900">
                        <span class="text-base font-bold text-emerald-400">฿${parseFloat(order.totalPrice).toLocaleString()}</span>
                        ${actionHtml}
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error('Failed to load orders:', err);
        container.innerHTML = `<div class="col-span-full text-center text-red-500 py-10 text-sm">// ERROR LOADING ORDERS //</div>`;
    }
}

function openSlipUploadModal(orderId) {
    currentOrderIdForSlip = orderId;
    const modal = document.getElementById('slip-upload-modal');
    const orderInfo = document.getElementById('slip-order-info');
    orderInfo.innerHTML = `<div class="text-xs text-zinc-300">Order ID: <span class="font-bold text-emerald-400">#${orderId}</span></div><div class="text-[10px] text-zinc-500 mt-1">กรุณาอัปโหลดสลิปการชำระเงิน</div>`;
    modal.classList.remove('hidden-section');
}

function closeSlipModal() {
    document.getElementById('slip-upload-modal').classList.add('hidden-section');
    document.getElementById('slip-file-input').value = '';
    currentOrderIdForSlip = null;
}

async function submitSlipUpload() {
    const fileInput = document.getElementById('slip-file-input');
    if (!fileInput.files.length) {
        alert('กรุณาเลือกไฟล์สลิป');
        return;
    }

    const formData = new FormData();
    formData.append('slip', fileInput.files[0]);

    try {
        const res = await fetch(`/api/orders/${currentOrderIdForSlip}/upload-slip`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${jwtToken}` },
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            alert('อัปโหลดสลิปสำเร็จแล้ว รอการอนุมัติจากแอดมิน');
            closeSlipModal();
            await renderOrdersPage();
        } else {
            alert(`ERROR: ${data.error}`);
        }
    } catch (err) {
        console.error('Upload failed:', err);
        alert('ไม่สามารถอัปโหลดสลิปได้');
    }
}

async function downloadOrderAssets(orderId) {
    try {
        const res = await fetch(`/api/orders/${orderId}/download`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        const data = await res.json();

        if (data.success && data.downloadUrl) {
            window.open(data.downloadUrl, '_blank');
        } else {
            alert(`Download not available: ${data.error}`);
        }
    } catch (err) {
        console.error('Download failed:', err);
        alert('ไม่สามารถดาวน์โหลดได้');
    }
}

// --- Admin Order Approval Panel ---
async function viewAdminOrders() {
    if (!isDevAuthenticated) {
        alert('Access denied');
        return;
    }
    navigateTo('admin-orders-page');
    await renderAdminOrdersTable();
}

async function renderAdminOrdersTable() {
    const tbody = document.getElementById('admin-orders-tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-zinc-500">Loading...</td></tr>';

    try {
        const res = await fetch('/api/admin/orders');
        const orders = await res.json();

        if (!Array.isArray(orders) || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-zinc-600">// NO_ORDERS //</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        orders.forEach(order => {
            const statusClass = order.status === 'APPROVED' ? 'text-emerald-400'
                : order.status === 'REJECTED' ? 'text-red-400'
                    : 'text-amber-400';

            const productsStr = order.products && order.products.length > 0
                ? order.products.map(p => p.title).join(', ')
                : 'N/A';

            const slipStatus = order.slip ? `<span class="text-emerald-400 text-[9px] font-bold">✓ UPLOADED</span>` : '<span class="text-red-400 text-[9px]">✗ PENDING</span>';

            const actionButtons = order.status === 'AWAITING_SLIP' || order.status === 'SLIP_UPLOADED'
                ? `<button data-action="approve-order" data-order-id="${order.id}" class="bg-emerald-600 text-white px-2 py-1 text-[9px] font-bold cursor-pointer hover:bg-emerald-500">APPROVE</button>
                   <button data-action="reject-order" data-order-id="${order.id}" class="bg-red-600 text-white px-2 py-1 text-[9px] font-bold cursor-pointer hover:bg-red-500 ml-1">REJECT</button>`
                : '<span class="text-zinc-500 text-[9px]">--</span>';

            tbody.innerHTML += `
                <tr class="hover:bg-zinc-900/40 border-b border-zinc-900 text-xs font-mono transition">
                    <td class="p-4">#${order.id}</td>
                    <td class="p-4 text-white font-bold">${order.username}</td>
                    <td class="p-4 text-zinc-300">${productsStr}</td>
                    <td class="p-4 text-right font-bold text-emerald-400">฿${parseFloat(order.totalPrice).toLocaleString()}</td>
                    <td class="p-4"><span class="${statusClass} text-[9px] font-bold uppercase">${order.status}</span></td>
                    <td class="p-4 text-center">${slipStatus}</td>
                    <td class="p-4">${actionButtons}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Failed to load admin orders:', err);
        tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-red-500">// ERROR //</td></tr>';
    }
}

async function approveOrder(orderId) {
    const comment = prompt('Admin comment (optional):');
    if (comment === null) return;

    try {
        const res = await fetch(`/api/admin/orders/${orderId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'APPROVE', comment: comment || '' })
        });
        const data = await res.json();

        if (data.success) {
            alert('Order approved successfully');
            await renderAdminOrdersTable();
        } else {
            alert(`ERROR: ${data.error}`);
        }
    } catch (err) {
        console.error('Approval failed:', err);
        alert('Failed to approve order');
    }
}

async function rejectOrder(orderId) {
    const comment = prompt('Rejection reason:');
    if (comment === null) return;

    try {
        const res = await fetch(`/api/admin/orders/${orderId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'REJECT', comment: comment || '' })
        });
        const data = await res.json();

        if (data.success) {
            alert('Order rejected');
            await renderAdminOrdersTable();
        } else {
            alert(`ERROR: ${data.error}`);
        }
    } catch (err) {
        console.error('Rejection failed:', err);
        alert('Failed to reject order');
    }
}

// --- Dev Panel: Add Product ---
async function addProduct() {
    const category = document.getElementById('prod-category').value;
    const title = document.getElementById('prod-title').value.trim();
    const price = document.getElementById('prod-price').value;
    const downloadUrl = document.getElementById('prod-download').value.trim();
    const imgUrl = document.getElementById('prod-img').value.trim();

    if (!title || !price || !downloadUrl || !imgUrl) {
        alert('กรุณากรอกข้อมูลสินค้าให้ครบถ้วน');
        return;
    }

    try {
        const res = await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, title, price, downloadUrl, imgUrl })
        });
        const data = await res.json();

        if (data.success) {
            alert('เพิ่มสินค้าเข้าระบบสำเร็จ!');
            document.getElementById('prod-title').value = '';
            document.getElementById('prod-price').value = '';
            document.getElementById('prod-download').value = '';
            document.getElementById('prod-img').value = '';
            renderDevView();
        } else {
            alert(`ERROR: ${data.error}`);
        }
    } catch (err) {
        console.error('Add product failed:', err);
        alert('ไม่สามารถเพิ่มสินค้าได้');
    }
}

// สั่งทำงานและโหลด Google Sign-In เมื่อโหลด DOM เสร็จ
document.addEventListener('DOMContentLoaded', () => {
    try {
        initLanguage();
        updateAuthUI();

        document.body.addEventListener('click', handleActionClick);

        // If user is logged in, show customer page; otherwise show login page
        if (loggedInUser) {
            navigateTo('customer-page');
            renderCustomerView();
        } else {
            navigateTo('login-cust-page');
        }

        initGoogleOAuth();
    } catch (err) {
        console.error('Initialization error:', err);
    }
});