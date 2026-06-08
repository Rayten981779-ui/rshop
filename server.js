require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_cyber_mainframe_98213';
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback_session_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

function isGoogleClientIdValid() {
    if (!GOOGLE_CLIENT_ID) return false;
    const lower = GOOGLE_CLIENT_ID.toLowerCase();
    return !lower.includes('your_client_id') && !lower.includes('your_client') && !lower.includes('your-client');
}

function isGoogleClientSecretValid() {
    if (!GOOGLE_CLIENT_SECRET) return false;
    const lower = GOOGLE_CLIENT_SECRET.toLowerCase();
    return !lower.includes('your_client_secret') && !lower.includes('your_client') && !lower.includes('your-secret');
}

function isGoogleOAuthConfigured() {
    return isGoogleClientIdValid() && isGoogleClientSecretValid();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(express.static(__dirname)); // Serve static files (index.html, script.js, style.css)
app.use('/uploads', express.static(uploadDir));

// Setup SQLite Database
const dbPath = path.join(__dirname, 'rshop.db');
const db = new sqlite3.Database(dbPath);

// Database Helper Wrappers (Promises)
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

// Initialize DB Tables
async function initDatabase() {
    await dbRun(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            google_id TEXT UNIQUE,
            email TEXT,
            display_name TEXT,
            profile_picture TEXT,
            status TEXT DEFAULT 'ACTIVE',
            lock_until INTEGER DEFAULT 0,
            is_google INTEGER DEFAULT 0
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            category TEXT,
            price REAL,
            download_url TEXT,
            img_url TEXT,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS carts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            product_id INTEGER,
            quantity INTEGER DEFAULT 1,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            UNIQUE(username, product_id)
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            status TEXT DEFAULT 'AWAITING_SLIP',
            total_price REAL,
            products_json TEXT,
            created_at INTEGER DEFAULT (strftime('%s','now')),
            updated_at INTEGER DEFAULT (strftime('%s','now'))
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS order_slips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            filename TEXT,
            original_name TEXT,
            uploaded_at INTEGER DEFAULT (strftime('%s','now')),
            approved INTEGER DEFAULT 0,
            admin_comment TEXT
        )
    `);

    await dbRun(`
        CREATE TABLE IF NOT EXISTS bought_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            item_title TEXT
        )
    `);

    // Insert Default Stock Products if DB is empty
    const productCount = await dbGet("SELECT COUNT(*) as count FROM products");
    if (productCount.count === 0) {
        await dbRun("INSERT INTO products (title, category, price, download_url, img_url) VALUES (?, ?, ?, ?, ?)", [
            'CHAKRI MAHA PRASAT V2', 'HOME', 1250, 'https://drive.google.com/file/d/sample1', 'https://images.unsplash.com/photo-1590059132669-467d12a1f173?w=600'
        ]);
        await dbRun("INSERT INTO products (title, category, price, download_url, img_url) VALUES (?, ?, ?, ?, ?)", [
            'MODERN PROTO CYBER CAR', 'CAR', 690, 'https://drive.google.com/file/d/sample2', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600'
        ]);
        await dbRun("INSERT INTO products (title, category, price, download_url, img_url) VALUES (?, ?, ?, ?, ?)", [
            'TRADITIONAL NEO THAI HOUSE', 'HOME', 850, 'https://drive.google.com/file/d/sample3', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600'
        ]);
        console.log('Database initialized with default products.');
    }

    // Insert Default Stock Users if DB is empty
    const userCount = await dbGet("SELECT COUNT(*) as count FROM users");
    if (userCount.count === 0) {
        // user1 password is '111'
        const hash1 = bcrypt.hashSync('111', 10);
        // guest password is '222'
        const hash2 = bcrypt.hashSync('222', 10);

        await dbRun("INSERT INTO users (username, password_hash, status, is_google) VALUES (?, ?, 'ACTIVE', 0)", ['user1', hash1]);
        await dbRun("INSERT INTO users (username, password_hash, status, is_google) VALUES (?, ?, 'BANNED', 0)", ['guest', hash2]);
        await dbRun("INSERT INTO bought_items (username, item_title) VALUES ('user1', 'CHAKRI MAHA PRASAT V2')");
        console.log('Database initialized with default accounts.');
    }
}

initDatabase().catch(err => console.error('Database migration failed:', err));

// Authenticate JWT Token Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// REST API Endpoints

// 0. Configuration endpoint for frontend client initialization
app.get('/api/config', (req, res) => {
    res.json({
        googleConfigured: isGoogleOAuthConfigured(),
        googleClientId: isGoogleClientIdValid() ? GOOGLE_CLIENT_ID : '',
        googleCallbackUrl: GOOGLE_CALLBACK_URL,
        googleSecretConfigured: isGoogleClientSecretValid()
    });
});

// 0.5 Logout route for frontend session cleanup
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true, message: 'Logged out' });
    });
});

// 0.6 Public products list endpoint
app.get('/api/products', async (req, res) => {
    try {
        const products = await dbAll('SELECT id, title, category, price, download_url as download, img_url as img FROM products ORDER BY id DESC');
        res.json(products);
    } catch (err) {
        console.error('Failed to fetch products:', err);
        res.status(500).json({ error: 'ไม่สามารถดึงรายการสินค้าได้' });
    }
});

// 0.7 Admin add product endpoint
app.post('/api/admin/products', async (req, res) => {
    const { category, title, price, downloadUrl, imgUrl } = req.body;
    if (!category || !title || !price || !downloadUrl || !imgUrl) {
        return res.status(400).json({ error: 'Missing required product fields' });
    }
    try {
        await dbRun(
            'INSERT INTO products (title, category, price, download_url, img_url) VALUES (?, ?, ?, ?, ?)',
            [title, category, parseFloat(price), downloadUrl, imgUrl]
        );
        res.json({ success: true, message: 'Product added successfully' });
    } catch (err) {
        console.error('Failed to add product:', err);
        res.status(500).json({ error: 'ไม่สามารถเพิ่มสินค้าลงระบบได้' });
    }
});

// 1. Register with Username & Password
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    if (username.length < 3) {
        return res.status(400).json({ error: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' });
    }

    try {
        const existingUser = await dbGet("SELECT id FROM users WHERE LOWER(username) = LOWER(?)", [username]);
        if (existingUser) {
            return res.status(400).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานในระบบแล้ว' });
        }

        const passwordHash = bcrypt.hashSync(password, 10);
        await dbRun("INSERT INTO users (username, password_hash, status, is_google) VALUES (?, ?, 'ACTIVE', 0)", [username, passwordHash]);
        
        res.json({ success: true, message: 'ลงทะเบียนสำเร็จ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ข้อผิดพลาดเกี่ยวกับเซิร์ฟเวอร์หลัก' });
    }
});

// 2. Login with Username & Password
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        const user = await dbGet("SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND is_google = 0", [username]);
        if (!user) {
            return res.status(400).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ตรงกับฐานข้อมูล' });
        }

        const matches = bcrypt.compareSync(password, user.password_hash);
        if (!matches) {
            return res.status(400).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ตรงกับฐานข้อมูล' });
        }

        const now = Date.now();
        if (user.status === 'BANNED') {
            return res.status(403).json({ error: 'บัญชีของคุณถูกระงับสัญญาณถาวรโดยผู้พัฒนา' });
        }
        if (user.status === 'TIMED_LOCKED' && now < user.lock_until) {
            const remainSec = Math.ceil((user.lock_until - now) / 1000);
            return res.status(403).json({ error: `บัญชีนี้ถูกล็อกสัญญาณชั่วคราว เหลือเวลาอีก ${remainSec} วินาที` });
        }

        // Sign JWT Token
        const token = jwt.sign({ username: user.username, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
        
        req.session.user = { username: user.username };
        
        res.json({
            success: true,
            token: token,
            username: user.username,
            displayName: user.username,
            message: 'เข้าสู่ระบบสำเร็จ'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ข้อผิดพลาดเซิร์ฟเวอร์หลัก' });
    }
});

// 3. Google OAuth 2.0 Code Exchange Helpers and Routes
async function processGoogleOAuthCode(code, redirectUri = 'postmessage') {
    if (!code) {
        throw new Error('Authorization code is missing');
    }

    if (!isGoogleOAuthConfigured()) {
        const missingKeys = [];
        if (!isGoogleClientIdValid()) missingKeys.push('GOOGLE_CLIENT_ID');
        if (!isGoogleClientSecretValid()) missingKeys.push('GOOGLE_CLIENT_SECRET');
        throw new Error(`System misconfigured: missing ${missingKeys.join(' and ')}`);
    }

    const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    const googleId = payload['sub'];
    const email = payload['email'];
    const displayName = payload['name'];
    const picture = payload['picture'];

    let user = await dbGet("SELECT * FROM users WHERE google_id = ?", [googleId]);

    if (!user) {
        const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
        let baseUsername = emailPrefix || `google_${googleId.substring(0, 8)}`;
        let finalUsername = baseUsername;
        let counter = 1;

        while (await dbGet("SELECT id FROM users WHERE LOWER(username) = LOWER(?)", [finalUsername])) {
            finalUsername = `${baseUsername}${counter}`;
            counter++;
        }

        await dbRun(
            "INSERT INTO users (username, google_id, email, display_name, profile_picture, is_google, status) VALUES (?, ?, ?, ?, ?, 1, 'ACTIVE')",
            [finalUsername, googleId, email, displayName, picture]
        );
        user = await dbGet("SELECT * FROM users WHERE google_id = ?", [googleId]);
    }

    const now = Date.now();
    if (user.status === 'BANNED') {
        throw new Error('บัญชี Google ของคุณถูกระงับการเข้าถึงถาวร');
    }
    if (user.status === 'TIMED_LOCKED' && now < user.lock_until) {
        const remainSec = Math.ceil((user.lock_until - now) / 1000);
        throw new Error(`บัญชีนี้ถูกล็อกสัญญาณชั่วคราว เหลือเวลาอีก ${remainSec} วินาที`);
    }

    const token = jwt.sign(
        { username: user.username, email: user.email, isGoogle: true },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return {
        user,
        token,
        displayName: user.display_name || displayName,
        picture: user.profile_picture || picture,
        email
    };
}

async function handleGoogleOAuthCodeExchange(req, res) {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code is missing' });
    }

    try {
        const result = await processGoogleOAuthCode(code, 'postmessage');
        req.session.user = { username: result.user.username };
        return res.json({
            success: true,
            token: result.token,
            username: result.user.username,
            email: result.email,
            displayName: result.displayName,
            picture: result.picture,
            message: 'เชื่อมต่อ Google สำเร็จ'
        });
    } catch (err) {
        console.error('Google OAuth exchange error:', err);
        return res.status(500).json({ error: err.message.includes('System misconfigured') ?
            'ระบบยังไม่ได้ตั้งค่า Google OAuth ในไฟล์ .env ของเซิร์ฟเวอร์ กรุณาตรวจสอบ GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET' :
            'การตรวจสอบสิทธิ์กับ Google OAuth 2.0 ล้มเหลว: ' + err.message
        });
    }
}

app.post('/api/auth/google', handleGoogleOAuthCodeExchange);
app.post('/auth/google', handleGoogleOAuthCodeExchange);

app.get('/auth/google', (req, res) => {
    console.log('GET /auth/google called.');
    console.log(`GOOGLE_CLIENT_ID present: ${isGoogleClientIdValid()}`);
    console.log(`GOOGLE_CALLBACK_URL: ${GOOGLE_CALLBACK_URL}`);
    if (!isGoogleClientIdValid()) {
        return res.status(500).send('Google Client ID is not configured on the server.');
    }
    if (!GOOGLE_CALLBACK_URL) {
        return res.status(500).send('Google callback URL is not configured on the server. Set GOOGLE_CALLBACK_URL in environment variables.');
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(GOOGLE_CALLBACK_URL)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&access_type=online&prompt=consent`;
    console.log('Redirecting to Google OAuth endpoint:', authUrl);
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    const { code, error } = req.query;
    console.log('GET /auth/google/callback called.');
    console.log('originalUrl:', req.originalUrl);
    console.log('callback query:', req.query);
    console.log('callback code:', code);
    console.log('callback error:', error);

    if (error) {
        return res.status(400).send(`Google OAuth error: ${error}`);
    }
    if (!code) {
        const queryDump = JSON.stringify(req.query, null, 2);
        return res.status(400).send(`Missing authorization code from Google callback.\n\nQuery: ${queryDump}`);
    }

    try {
        const result = await processGoogleOAuthCode(code, GOOGLE_CALLBACK_URL);
        req.session.user = { username: result.user.username };

        const payload = {
            source: 'google-oauth',
            success: true,
            token: result.token,
            username: result.user.username,
            email: result.email,
            displayName: result.displayName,
            picture: result.picture
        };
        const safePayload = JSON.stringify(payload).replace(/</g, '\u003c');

        return res.send(`<!DOCTYPE html><html><body><p>Google login successful. You can close this window.</p><script>
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(${safePayload}, window.location.origin);
                window.close();
            }
        </script></body></html>`);
    } catch (err) {
        console.error('Google callback error:', err);
        return res.status(500).send(`Google callback failed: ${err.message}`);
    }
});

// 4. Create order and simulate payment initiation
app.post('/api/checkout', authenticateToken, async (req, res) => {
    const { itemIds, itemTitle } = req.body;
    const { username } = req.user;

    let products = [];
    if (Array.isArray(itemIds) && itemIds.length > 0) {
        const placeholders = itemIds.map(() => '?').join(',');
        products = await dbAll(`SELECT * FROM products WHERE id IN (${placeholders})`, itemIds);
        if (products.length === 0) {
            return res.status(404).json({ error: 'Products not found' });
        }
    } else if (itemTitle) {
        const product = await dbGet('SELECT * FROM products WHERE LOWER(title) = LOWER(?)', [itemTitle]);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        products = [product];
    } else {
        return res.status(400).json({ error: 'Order items missing' });
    }

    try {
        const orderProducts = products.map(product => ({
            id: product.id,
            title: product.title,
            price: product.price,
            downloadUrl: product.download_url
        }));

        const totalPrice = orderProducts.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
        const productsJson = JSON.stringify(orderProducts);

        const orderResult = await dbRun(
            'INSERT INTO orders (username, status, total_price, products_json, created_at, updated_at) VALUES (?, ?, ?, ?, strftime(\'%s\',\'now\'), strftime(\'%s\',\'now\'))',
            [username, 'AWAITING_SLIP', totalPrice, productsJson]
        );

        res.json({ success: true, message: 'Order created successfully. Upload your slip in the Orders page.', orderId: orderResult.lastID });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ไม่สามารถสร้างคำสั่งซื้อได้' });
    }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM orders WHERE LOWER(username) = LOWER(?) ORDER BY id DESC', [req.user.username]);
        const orders = await Promise.all(rows.map(async order => {
            const slip = await dbGet('SELECT * FROM order_slips WHERE order_id = ? ORDER BY id DESC LIMIT 1', [order.id]);
            return {
                id: order.id,
                status: order.status,
                totalPrice: order.total_price,
                products: JSON.parse(order.products_json || '[]'),
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                slip: slip ? {
                    id: slip.id,
                    filename: slip.filename,
                    originalName: slip.original_name,
                    uploadedAt: slip.uploaded_at,
                    approved: slip.approved === 1,
                    adminComment: slip.admin_comment || ''
                } : null
            };
        }));
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ไม่สามารถดึงประวัติคำสั่งซื้อได้' });
    }
});

app.post('/api/orders/:orderId/upload-slip', authenticateToken, upload.single('slip'), async (req, res) => {
    const { orderId } = req.params;
    if (!req.file) return res.status(400).json({ error: 'กรุณาแนบไฟล์สลิปก่อนส่ง' });
    try {
        const order = await dbGet('SELECT * FROM orders WHERE id = ? AND LOWER(username) = LOWER(?)', [orderId, req.user.username]);
        if (!order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
        if (order.status !== 'AWAITING_SLIP' && order.status !== 'SLIP_UPLOADED') {
            return res.status(400).json({ error: 'สถานะคำสั่งซื้อไม่สามารถอัปโหลดสลิปได้' });
        }
        await dbRun('INSERT INTO order_slips (order_id, filename, original_name, uploaded_at, approved, admin_comment) VALUES (?, ?, ?, strftime(\'%s\',\'now\'), 0, ?)', [orderId, req.file.filename, req.file.originalname, 'รออนุมัติ']);
        await dbRun('UPDATE orders SET status = ?, updated_at = strftime(\'%s\',\'now\') WHERE id = ?', ['SLIP_UPLOADED', orderId]);
        res.json({ success: true, message: 'อัปโหลดสลิปสำเร็จ รอแอดมินตรวจสอบ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ไม่สามารถอัปโหลดสลิปได้' });
    }
});

app.get('/api/orders/:orderId/download', authenticateToken, async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await dbGet('SELECT * FROM orders WHERE id = ? AND LOWER(username) = LOWER(?)', [orderId, req.user.username]);
        if (!order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อของคุณ' });
        if (order.status !== 'APPROVED') return res.status(403).json({ error: 'คำสั่งซื้อยังไม่ได้รับการอนุมัติ' });
        const products = JSON.parse(order.products_json || '[]');
        res.json({ success: true, downloadUrl: products.length > 0 ? products[0].downloadUrl : '' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ไม่สามารถยืนยันการดาวน์โหลดได้' });
    }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const rows = await dbAll('SELECT * FROM orders ORDER BY id DESC');
        const orders = await Promise.all(rows.map(async order => {
            const slip = await dbGet('SELECT * FROM order_slips WHERE order_id = ? ORDER BY id DESC LIMIT 1', [order.id]);
            return {
                id: order.id,
                username: order.username,
                status: order.status,
                totalPrice: order.total_price,
                products: JSON.parse(order.products_json || '[]'),
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                slip: slip ? {
                    id: slip.id,
                    filename: slip.filename,
                    originalName: slip.original_name,
                    uploadedAt: slip.uploaded_at,
                    approved: slip.approved === 1,
                    adminComment: slip.admin_comment
                } : null
            };
        }));
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ไม่สามารถดึงคำสั่งซื้อแอดมินได้' });
    }
});

app.post('/api/admin/orders/:orderId/action', async (req, res) => {
    const { orderId } = req.params;
    const { action, comment } = req.body;
    if (!action) return res.status(400).json({ error: 'Action is required' });
    try {
        const order = await dbGet('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (!order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
        if (action === 'APPROVE') {
            await dbRun('UPDATE orders SET status = ?, updated_at = strftime(\'%s\',\'now\') WHERE id = ?', ['APPROVED', orderId]);
            await dbRun('UPDATE order_slips SET approved = 1, admin_comment = ? WHERE order_id = ?', [comment || 'อนุมัติโดยแอดมิน', orderId]);
            const products = JSON.parse(order.products_json || '[]');
            for (const product of products) {
                await dbRun('INSERT INTO bought_items (username, item_title) VALUES (?, ?)', [order.username, product.title]);
            }
        } else if (action === 'REJECT') {
            await dbRun('UPDATE orders SET status = ?, updated_at = strftime(\'%s\',\'now\') WHERE id = ?', ['REJECTED', orderId]);
            await dbRun('UPDATE order_slips SET approved = 0, admin_comment = ? WHERE order_id = ?', [comment || 'ปฏิเสธการชำระเงิน', orderId]);
        } else {
            return res.status(400).json({ error: 'Action not supported' });
        }
        res.json({ success: true, message: 'อัปเดตสถานะคำสั่งซื้อแล้ว' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'ไม่สามารถประมวลผลคำสั่งซื้อได้' });
    }
});

// 5. Fetch developer stats
app.get('/api/dev/stats', async (req, res) => {
    try {
        const usersCount = await dbGet("SELECT COUNT(*) as count FROM users");
        const items = await dbAll("SELECT item_title FROM bought_items");
        
        res.json({
            totalUsers: usersCount.count,
            totalTx: items.length,
            items: items
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB Stats lookup failed' });
    }
});

// 6. Fetch developer user lists
app.get('/api/dev/users', async (req, res) => {
    try {
        // Fetch all users and aggregate their bought items
        const usersList = await dbAll("SELECT id, username, password_hash, google_id, email, display_name, status, lock_until, is_google FROM users");
        const boughtList = await dbAll("SELECT username, item_title FROM bought_items");

        const result = usersList.map(u => {
            const items = boughtList.filter(b => b.username.toLowerCase() === u.username.toLowerCase()).map(b => b.item_title);
            return {
                username: u.username,
                password: u.password_hash || (u.is_google ? '[GOOGLE_OAUTH]' : ''),
                googleId: u.google_id,
                email: u.email,
                displayName: u.display_name,
                status: u.status,
                lockUntil: u.lock_until,
                isGoogle: u.is_google,
                boughtItems: items
            };
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'User list lookup failed' });
    }
});

// 7. Developer administrative action panel
app.post('/api/dev/users/action', async (req, res) => {
    const { targetUsername, action, payload } = req.body;

    if (!targetUsername || !action) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    try {
        if (action === 'BAN') {
            await dbRun("UPDATE users SET status = 'BANNED' WHERE LOWER(username) = LOWER(?)", [targetUsername]);
        } else if (action === 'UNBAN') {
            await dbRun("UPDATE users SET status = 'ACTIVE', lock_until = 0 WHERE LOWER(username) = LOWER(?)", [targetUsername]);
        } else if (action === 'TIMED_LOCK') {
            const seconds = parseInt(payload);
            const lockTime = Date.now() + (seconds * 1000);
            await dbRun("UPDATE users SET status = 'TIMED_LOCKED', lock_until = ? WHERE LOWER(username) = LOWER(?)", [lockTime, targetUsername]);
        } else if (action === 'CHANGE_PASSWORD') {
            const newPasswordHash = bcrypt.hashSync(payload, 10);
            await dbRun("UPDATE users SET password_hash = ? WHERE LOWER(username) = LOWER(?) AND is_google = 0", [newPasswordHash, targetUsername]);
        }

        res.json({ success: true, message: 'Action processed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Administrative action failed' });
    }
});

// Serve Frontend Static Files
app.use(express.static(__dirname));

// Fallback index.html mapping for single-page style
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Listen on designated port
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`💥 RSHOP SECURE MAINFRAME RUNNING ON http://localhost:${PORT}`);
    console.log(`Google Client ID loaded: ${isGoogleClientIdValid() ? 'yes' : 'no'}`);
    console.log(`Google OAuth server secret configured: ${isGoogleClientSecretValid() ? 'yes' : 'no'}`);
    if (isGoogleOAuthConfigured()) {
        console.log('Google OAuth is configured and ready.');
        console.log(`Google Callback URL: ${GOOGLE_CALLBACK_URL}`);
    } else {
        console.warn('Google OAuth is NOT fully configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.');
    }
    console.log(`=========================================`);
});
