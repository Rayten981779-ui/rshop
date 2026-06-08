# คู่มือการตั้งค่า Google OAuth 2.0 (Official Setup Guide)

เอกสารนี้จะแนะนำการตั้งค่าโปรเจกต์ Google Cloud Console เพื่อสร้าง Client ID และ Client Secret สำหรับใช้งานระบบล็อกอินด้วย Google Account อย่างเป็นทางการในระบบ RShop

---

## ขั้นตอนที่ 1: สร้างโปรเจกต์บน Google Cloud Console

1. เข้าไปที่หน้าเว็บ [Google Cloud Console](https://console.cloud.google.com/)
2. เข้าสู่ระบบด้วยบัญชี Google ของคุณ
3. คลิกที่เมนูเลือกโปรเจกต์ (ปุ่มด้านซ้ายบน ถัดจากโลโก้ Google Cloud) และกดปุ่ม **"New Project"** (สร้างโปรเจกต์ใหม่)
4. ตั้งชื่อโปรเจกต์ (เช่น `RShop-Mainframe`) แล้วคลิก **"Create"**
5. รอระบบสร้างโปรเจกต์สักครู่ จากนั้นเลือกโปรเจกต์ที่เพิ่งสร้างขึ้น

---

## ขั้นตอนที่ 2: ตั้งค่าหน้าจอขอความยินยอม (OAuth Consent Screen)

ก่อนที่จะสร้าง Credentials คุณต้องกำหนดข้อมูลที่จะแสดงในหน้าต่างยินยอมเข้าสู่ระบบ:

1. จากแถบเมนูด้านซ้าย ไปที่เมนู **"APIs & Services"** > **"OAuth consent screen"**
2. เลือก **User Type** เป็น:
   - **External**: หากต้องการให้บุคคลทั่วไปที่มี Gmail เข้าสู่ระบบได้ (แนะนำสำหรับการทดสอบทั่วไป)
   - คลิก **"Create"**
3. กรอกข้อมูลแอปพลิเคชันพื้นฐาน:
   - **App name**: `RShop Secure Marketplace`
   - **User support email**: เลือกอีเมลของคุณ
   - **Developer contact information**: กรอกอีเมลของคุณสำหรับรับข่าวสารความปลอดภัย
4. คลิก **"Save and Continue"** ผ่านหน้า Scopes ไปยังหน้า Test users
5. ในหน้า **"Test users"**:
   - คลิก **"Add Users"** และเพิ่มอีเมล Gmail ของคุณเอง (หรือบัญชีที่ต้องการใช้ทดสอบการล็อกอินขณะที่สถานะโปรเจกต์ยังเป็น Testing/ยังไม่ขึ้น Production)
   - คลิก **"Save and Continue"** และตรวจสอบข้อมูลสรุป จากนั้นคลิก **"Back to Dashboard"**

---

## ขั้นตอนที่ 3: สร้าง OAuth 2.0 Client ID & Client Secret

1. ไปที่เมนูด้านซ้าย เลือก **"APIs & Services"** > **"Credentials"**
2. คลิกปุ่ม **"+ Create Credentials"** ที่ด้านบน แล้วเลือก **"OAuth client ID"**
3. เลือก **Application type** เป็น: **"Web application"**
4. ตั้งชื่อ Credential (เช่น `RShop Web Client`)
5. ตั้งค่าหัวข้อ **Authorized JavaScript origins** (ต้นทางที่อนุญาตให้รันสคริปต์เข้าสู่ระบบ):
   - คลิก **"+ Add URI"**
   - ใส่ลิงก์สำหรับรันเครื่องตัวเอง (Localhost): `http://localhost:5000`
   - หาก Deploy ขึ้นเซิร์ฟเวอร์จริง ให้เพิ่มลิงก์ต้นทางของเซิร์ฟเวอร์นั้นด้วย (เช่น `https://rshop.net` หรือ `https://rshop-marketplace.onrender.com`)
6. ตั้งค่าหัวข้อ **Authorized redirect URIs**:
   - ใส่ `http://localhost:5000/auth/google/callback`
   - หาก Deploy ขึ้นเซิร์ฟเวอร์จริง ให้เพิ่ม redirect URI ของโดเมนจริง เช่น `https://rshop.net/auth/google/callback` หรือ `https://rshop-marketplace.onrender.com/auth/google/callback`
7. คลิกปุ่ม **"Create"**
8. ระบบจะแสดงหน้าต่าง **"OAuth client created"**:
   - **Copy ค่า Client ID** (เช่น `xxxxxx-xxxxxx.apps.googleusercontent.com`)
   - **Copy ค่า Client Secret** (เช่น `GOCSPX-xxxxxxxxx`)
   - เก็บค่าความลับเหล่านี้ไว้เพื่อนำไปใส่ในไฟล์ตั้งค่าของเซิร์ฟเวอร์

---

## ขั้นตอนที่ 4: เชื่อมต่อเซิร์ฟเวอร์ RShop

ในการรันระบบ full-stack RShop บนเครื่องของคุณ ให้ทำตามขั้นตอนดังนี้:

### 1. ติดตั้ง Node.js
หากเครื่องคอมพิวเตอร์ของคุณยังไม่มี Node.js:
- เข้าไปดาวน์โหลดตัวติดตั้งที่ [nodejs.org](https://nodejs.org/) (แนะนำรุ่น LTS)
- กดติดตั้งตามขั้นตอนปกติ

### 2. ตั้งค่าไฟล์สภาพแวดล้อม (Environment Variables)
- คัดลอกไฟล์เทมเพลตชื่อ `.env.example` เป็นชื่อใหม่ว่า `.env` ในโฟลเดอร์เดียวกัน
- เปิดไฟล์ `.env` ขึ้นมาแก้ไขข้อมูล และนำค่า Client ID / Secret ที่ได้จากขั้นตอนที่ 3 มาใส่:
  ```env
  PORT=5000
  JWT_SECRET=ใส่คีย์สุ่มความปลอดภัยของคุณ (เช่น cyber_secret_2026)
  SESSION_SECRET=ใส่คีย์สุ่มสำหรับระบบเซสชัน
  
  GOOGLE_CLIENT_ID=นำค่า Client ID ของคุณมาใส่ตรงนี้
  GOOGLE_CLIENT_SECRET=นำค่า Client Secret ของคุณมาใส่ตรงนี้
  ```

### 3. ติดตั้ง Dependencies และรันเซิร์ฟเวอร์
เปิดโปรแกรม Command Prompt, PowerShell หรือ Terminal ในโฟลเดอร์โปรเจกต์นี้ จากนั้นรันคำสั่ง:

```bash
# 1. ติดตั้งไลบรารีและแพ็กเกจที่จำเป็น
npm install

# 2. เริ่มทำงานเซิร์ฟเวอร์ RShop
npm start
```

เมื่อเซิร์ฟเวอร์รันสำเร็จ จะแสดงข้อความ:
`💥 RSHOP SECURE MAINFRAME RUNNING ON http://localhost:5000`

เปิด Browser แล้วเข้าไปที่ลิงก์ [http://localhost:5000](http://localhost:5000) เพื่อทดลองใช้งานระบบล็อกอินด้วย Google Account จริงแบบสมบูรณ์!
33