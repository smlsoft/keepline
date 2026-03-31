<div align="center">

# Keep Line

### เก็บประวัติแชท LINE OA & Group ตลอดชีวิต --- ไม่มีหาย ไม่มีหมดอายุ

**ระบบ CRM อัจฉริยะสำหรับ SMEs ไทย และสำนักงานบัญชี**
**LINE OA & Group + AI วิเคราะห์ + ตามลูกค้าอัตโนมัติ + ตามงานพนักงาน**
**Open Source เพื่อการศึกษา --- เอาไปใช้ฟรี ไม่มีเงื่อนไข**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.caddy.yml)
[![LINE](https://img.shields.io/badge/LINE-OA_Messaging_API-00C300?logo=line&logoColor=white)](#features)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](#tech-stack)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](#tech-stack)

[ทดลองใช้งาน](https://keepline.satistang.com/dashboard) · [คู่มือ](https://keepline.satistang.com/dashboard/guide) · [แจ้งปัญหา](https://github.com/smlsoft/keepline/issues)

</div>

---

## ปัญหาที่ Keep Line แก้

> **LINE เก็บแชทแค่ 30 วัน** --- ทั้ง OA และ Group หลังจากนั้นหายหมด ไม่มีวันกู้คืน

สำหรับ **SMEs ไทย** และ **สำนักงานบัญชี** นี่คือปัญหาใหญ่:

| ปัญหา | ผลกระทบ |
|--------|---------|
| แชทลูกค้าหายหลัง 30 วัน | ลืมว่าคุยอะไรไว้ ลูกค้ารู้สึกไม่ใส่ใจ |
| ไม่มีประวัติย้อนหลัง | ตรวจสอบหลักฐานไม่ได้ ยื่นภาษีลำบาก |
| ลูกค้าแจ้งปัญหาซ้ำๆ | เสียเวลาถามข้อมูลเดิม ลูกค้าหงุดหงิด |
| พนักงานลาออก | ข้อมูลลูกค้าหายไปพร้อมกัน |
| หลายคนใช้ LINE OA เดียวกัน | ไม่รู้ใครตอบอะไร ตกหล่น |

**Keep Line เก็บทุกข้อความตลอดชีวิต** --- ไม่มีหมดอายุ ไม่มีลบอัตโนมัติ ข้อมูลเป็นของคุณ 100%

---

## คุณสมบัติหลัก

### เก็บแชทตลอดชีวิต
- **ข้อความ + รูป + สติกเกอร์ + ไฟล์** --- เก็บทุกอย่างจาก LINE OA & Group
- **ค้นหาย้อนหลังได้ทันที** --- หาแชทเก่าเมื่อปีที่แล้วก็เจอ
- **ข้อมูลเป็นของคุณ** --- เก็บใน MongoDB ของคุณเอง ไม่โดน lock-in

### CRM สำหรับ SMEs ไทย
- **สร้างข้อมูลลูกค้าอัตโนมัติ** จากแชท LINE OA & Group
- **Pipeline:** ใหม่ → สนใจ → เสนอราคา → ต่อรอง → ปิดการขาย
- **รวมลูกค้า DM + กลุ่ม** --- คนเดียวกันคุย DM และในกลุ่ม merge อัตโนมัติ

### เหมาะสำหรับสำนักงานบัญชี
- **เก็บหลักฐานการสื่อสาร** กับลูกค้าทุกราย ตลอดชีวิต
- **ตรวจสลิปอัตโนมัติ** --- AI ตรวจจับสลิปโอนเงิน ยืนยัน/ปฏิเสธ
- **จำแนกเอกสารอัตโนมัติ** --- AI แยกบัญชี/เอกสาร/ภาพ + confidence score
- **เตือนนัดหมาย** --- ปฏิทินนัดยื่นภาษี ส่งเอกสาร ติดตามงาน

### ตามลูกค้าอัตโนมัติ
- **AI เตือนลูกค้าเสี่ยงหาย** 3/7/30 วัน --- ก่อนที่จะสายเกินไป
- **แนะนำข้อความ re-engage** --- AI ร่างข้อความดึงลูกค้ากลับให้
- **ติดตามสลิปค้าง** --- ลูกค้าบอกโอนแต่ยังไม่เจอสลิป AI แจ้งเตือน
- **Lead Scoring** --- คะแนน 0-100 จัดอันดับ Hot/Warm/Cold โฟกัสคนที่พร้อมซื้อ

### ตามงานพนักงานอัตโนมัติ
- **KPI Dashboard** --- แชทตอบกี่ราย ปิดการขายกี่ราย ใครทำได้ดี
- **AI โค้ชทีม** --- วิเคราะห์การตอบแชทของพนักงาน แนะนำวิธีปรับปรุง
- **มอบหมายลูกค้า** --- แบ่งลูกค้าให้พนักงานดูแล ติดตามได้
- **สรุปรายวัน** --- AI สรุปข้อความ ลูกค้าใหม่ ยอดขาย ทุกวัน 20:00

### AI อ่าน + เข้าใจเอกสาร
- **ลูกค้าส่งรูปเอกสารมาใน LINE** --- AI อ่าน วิเคราะห์ สรุปให้ทันที
- **จำแนกเอกสาร 14 ประเภท** --- สลิป, ใบเสนอราคา, ใบแจ้งหนี้, สัญญา, แบบก่อสร้าง ฯลฯ
- **ไม่ต้องเปิดอ่านเอง** --- AI สรุปสาระสำคัญ ยอดเงิน เงื่อนไข ให้อัตโนมัติ

### AI จำลูกค้าทุกคน
- **จดจำประวัติ ความชอบ สินค้าที่เคยถาม** ปัญหาที่เคยแจ้ง
- **ลูกค้าทักมาอีกที AI รู้ทุกอย่าง** ไม่ต้องถามซ้ำ
- **Knowledge Base** --- ใส่ข้อมูลร้าน AI ดึงไปตอบลูกค้าแม่นยำ

### AI วิเคราะห์อัตโนมัติ
- **วิเคราะห์ความพอใจ / โอกาสซื้อ / แท็กอัตโนมัติ**
- **AI แนะนำคำตอบ** --- กดปุ่มเดียว AI ร่างคำตอบให้
- **Broadcast แยกกลุ่มเป้าหมาย** --- ส่งโปรตรงกลุ่มตาม Pipeline, Tag, คะแนน

---

## Architecture

```
LINE OA (DM + Group)
  | webhook
Caddy (Auto HTTPS)
  |
Agent (Docker) → AI + RAG → reply + เก็บทุกข้อความ
  |
MongoDB (ข้อมูลเป็นของคุณ)
  |
Keep Line (cron) → วิเคราะห์ → AI Advice
  |
Dashboard (Next.js) → Google Login → CRM + แชท + รายงาน
```

### Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Agent | Node.js + Express |
| Dashboard | Next.js 16 + Tailwind CSS |
| Database | MongoDB 7 (เก็บแชทตลอดชีวิต) |
| AI | OpenRouter (auto-discover free models) |
| Auth | Google OAuth (NextAuth) |
| Deploy | Docker Compose + Caddy + DigitalOcean VPS |

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/smlsoft/keepline.git
cd keepline

# 2. Setup environment
cp .env.example .env
# แก้ไขค่าใน .env (MongoDB URI, AI keys, LINE token)

# 3. Run with Docker
docker compose up -d --build

# 4. เปิดเบราว์เซอร์
# http://localhost:3002/dashboard
```

---

## ราคา --- เริ่มต้นฟรี

### แพ็คฟรี (AI ฟรี)

| รายการ | ราคา |
|--------|------|
| Keep Line ทุกฟีเจอร์ | **ฟรี** (Open Source) |
| AI ฟรี (OpenRouter, SambaNova, Gemini) | **ฟรี** |
| MongoDB (Docker, local) | **ฟรี** (ไม่จำกัด) |
| LINE OA & Group | **ฟรี** |
| **รวม** | **ค่า VPS ~$24/เดือน เท่านั้น** |

### แพ็ค AI Pro (ฉลาดขึ้น)

ต้องการให้ AI ฉลาดขึ้น? เพิ่ม API Key จาก OpenAI, Anthropic หรือ Groq:

| ระดับการใช้งาน | ค่า AI โดยประมาณ |
|---------------|----------------|
| ร้านค้าเล็ก (แชท ~100 ข้อความ/วัน) | **~200-500 บาท/เดือน** |
| ร้านค้ากลาง + วิเคราะห์ลูกค้า | **~500-1,000 บาท/เดือน** |
| สำนักงานบัญชี + วิเคราะห์เอกสาร | **~500-1,500 บาท/เดือน** |

> **AI Pro ได้อะไรเพิ่ม?** GPT-4o / Claude ตอบฉลาดกว่า เข้าใจภาษาไทยดีกว่า วิเคราะห์แม่นขึ้น ตรวจสลิปแม่นขึ้น --- ใส่ API Key เมื่อไหร่ก็ได้ อัพเกรดทันที

---

## Open Source เพื่อการศึกษา

> **เอาไปใช้ฟรีได้เลย** --- ไม่ต้องขออนุญาต ไม่มีค่าลิขสิทธิ์ ไม่มีเงื่อนไขซ่อน (MIT License)

| ใครเอาไปใช้ | ทำอะไรได้ |
|------------|----------|
| **นักศึกษา / นักพัฒนา** | Fork ไปศึกษา เรียนรู้ Next.js, MongoDB, AI, LINE API ได้ทั้งระบบ |
| **SMEs / ร้านค้า** | ติดตั้งใช้งานจริงในธุรกิจ ปรับแต่งตามต้องการ ไม่จำกัดจำนวนลูกค้า |
| **Software House** | นำไปต่อยอดเป็นโปรดักต์ของตัวเอง ขายเป็น SaaS ได้เลย |

> ข้อมูลเป็นของคุณ 100% --- เก็บใน MongoDB ของคุณเอง ไม่โดน lock-in

---

## เอกสาร

| เอกสาร | เนื้อหา |
|--------|---------|
| [คู่มือติดตั้ง](docs/INSTALL.md) | ติดตั้งทั้งระบบบน Docker Desktop |
| [Deploy DigitalOcean](docs/DEPLOY-DIGITALOCEAN.md) | Deploy production บน DigitalOcean + Caddy |
| [MongoDB](docs/setup-mongodb.md) | ตั้งค่า MongoDB |
| [LINE Messaging API](docs/setup-line.md) | สร้าง LINE Channel |
| [AI Providers](docs/setup-ai-providers.md) | สมัคร AI Providers (ฟรีทั้งหมด) |

---

## Contributing

ยินดีรับ Pull Request!

1. Fork repo
2. สร้าง branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "feat: add my feature"`
4. Push + เปิด PR

**Commit Convention:** `feat:` / `fix:` / `docs:` / `refactor:` / `chore:`

---

## License

[MIT License](LICENSE)

---

<div align="center">

**Keep Line** --- เก็บประวัติแชท LINE OA & Group ตลอดชีวิต

Open Source เพื่อการศึกษา --- เอาไปใช้ฟรี ไม่มีเงื่อนไข --- ข้อมูลเป็นของคุณ

[keepline.satistang.com](https://keepline.satistang.com) · [GitHub](https://github.com/smlsoft/keepline)

Made with love for Thai SMEs

</div>
