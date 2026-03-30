# OpenClaw Mini CRM — Project Rules

## Architecture
```
LINE (DM + Group)
  ↓ webhook
Caddy (SSL + reverse proxy)
  ↓
Agent (Docker) → AI + RAG + MCP → reply (DM only, group = เก็บข้อมูลเท่านั้น)
  ↓
MongoDB (messages + customers + groups)
  ↓
OpenClaw (แกนหลัก) ← cron ทุก 1 ชม. → วิเคราะห์ → เก็บ advice
  ↓
Dashboard (Docker) → Google Login → แสดงสนทนา + CRM + KPI + Advice + Costs
```

## Brand
- **ชื่อ:** OpenClaw Mini CRM
- **Tagline:** AI Chat Intelligence — LINE
- **Domain:** seaandhill.satistang.com (production)
- **Deploy:** Hetzner VPS + Docker Compose

## Core Principle — OpenClaw เป็นแกนหลัก
- **OpenClaw** = สมองกลาง (AI Advisor) — gateway + cron + multi-channel
- **Agent** = หูและปาก (LINE webhook + RAG + AI reply + MCP)
- **Dashboard** = ตา (แสดงข้อมูลจาก MongoDB + Google Login)

## Services
| Service | Role | Port | Folder |
|---------|------|------|--------|
| **Nginx** | Reverse proxy + SSL | 80/443 | `nginx/` |
| **OpenClaw** | AI Advisor (แกนหลัก) | 18789 | `openclaw/` |
| **Agent** | LINE webhook + RAG + MCP | 3000 | `proxy/` |
| **Dashboard** | Web UI + Auth | 3001 | `seaandhilldashboard/` |

## URLs
- **Production:** `https://seaandhill.satistang.com/dashboard`
- **LINE webhook:** `https://seaandhill.satistang.com/webhook`
- **OpenClaw:** `http://localhost:18789` (internal)

## Platform — LINE Only
- **sourceId format:** DM=`Uxxx`, Group=`Cxxx`
- **Customer match:** ด้วย `lineUserId` (unique per bot)
- **Group:** เก็บข้อมูล + วิเคราะห์เท่านั้น ไม่ตอบ AI ในกลุ่ม
- **ลูกค้าคนเดียวกัน:** DM + กลุ่ม = auto merge ด้วย lineUserId

## Authentication (Google OAuth)
- **NextAuth** + Google Provider
- **Login page:** `/dashboard/login`
- **Dev mode:** ไม่มี GOOGLE_CLIENT_ID → ข้ามไป ไม่ต้อง login

## Database Schema
```
customers       { lineUserId (unique), name, rooms[], groups[], tags[], pipelineStage, sentiment }
messages        { sourceId, userId, role, content, messageType, ... }
groups_meta     { sourceId, groupName, sourceType, members[], memberCount }
user_skills     { sourceId, userId, sentiment, purchaseIntent, tags }
chat_analytics  { sourceId, sentiment, purchaseIntent }
```

## Advisor API (Agent ให้บริการ)
| Endpoint | Method | หน้าที่ |
|----------|--------|---------|
| `/api/advisor/sources-changed?since=ISO` | GET | ดู sourceId ที่มีข้อความใหม่ |
| `/api/advisor/source-detail/:sourceId?since=ISO` | GET | ข้อความ + analytics + skills + alerts |
| `/api/advisor/advice` | POST | บันทึกคำแนะนำ |
| `/api/advisor/update-pulled` | POST | อัพเดต lastPulledAt |
| `/api/advisor/cost` | POST | บันทึกค่าใช้จ่าย AI |
| `/api/costs` | GET | ดูสรุปค่าใช้จ่าย (dashboard) |

## AI Providers (ฟรีทั้งหมด)
1. OpenRouter (free) → 2. SambaNova → 3. Groq → 4. Cerebras → 5. Gemini

## Database
- **MongoDB** (local Docker)
- **แยกคน/กลุ่ม:** ใช้ `sourceId` field
- **ลูกค้า:** match ด้วย `lineUserId` (ไม่ใช่ชื่อ)
- **อย่าแยก collection ตามคน/กลุ่ม** — ใช้ collection เดียวเสมอ

## Env vars (.env)
- `MONGODB_URI` — MongoDB Atlas
- `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`
- `SAMBANOVA_API_KEY`, `GROQ_API_KEY`, `CEREBRAS_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`
- `MCP_ERP_API_KEY` — bc-erp MCP auth
- `OPENCLAW_GATEWAY_TOKEN` — OpenClaw gateway
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — NextAuth

## Deploy
- **Production:** `docker compose -f docker-compose.prod.yml up -d`
- **Dev:** `docker compose up -d --build`
- **CI/CD:** GitHub Actions → SSH → Hetzner
- **คู่มือ:** `docs/DEPLOY-HETZNER.md`

## Design Rules (บังคับทุกหน้า)
- **ภาษาไทยเท่านั้น** — ทุก label, button, placeholder, error message, tooltip ต้องเป็นภาษาไทย ห้ามใช้ภาษาอังกฤษ (ยกเว้นชื่อเฉพาะ เช่น LINE, CRM, AI)
- **Mobile First** — ออกแบบ UI สำหรับมือถือก่อน แล้วขยายไป desktop
- **Bottom Tabs 5 ปุ่ม:** หน้าหลัก | ปฏิทินภาษี | แชท | ลูกค้า | เพิ่มเติม
- **ตัวอักษรใหญ่** — เหมาะสำหรับคนอายุมาก (text-xs=13px, text-sm=15px, text-base=17px)
- **ลด padding/margin ให้น้อยที่สุด** — p-2 แทน p-4, gap-1 แทน gap-3, py-1 แทน py-3 กระชับทุกจุด
- **Spacing มาตรฐาน:** card=p-2 md:p-3, header=py-2 px-3, modal=p-3, gap=gap-1.5, mb=mb-1
- **แสดงข้อมูลให้มากที่สุด** — ใช้ทุก pixel ให้คุ้ม ไม่เว้นที่ว่างเปล่า ใช้ table/grid แน่น, badge เล็กกระชับ, ยัดข้อมูลเข้า 1 บรรทัดให้ได้มากที่สุด ไม่ต้องสวยแต่ต้องใช้งานได้จริง

## สิ่งที่ห้ามทำ
- ห้ามลบ folder/service โดยไม่ถามบอสก่อน
- ห้ามเปลี่ยน deploy strategy โดยไม่แจ้ง
- ห้ามแยก MongoDB collection ตามคน/กลุ่ม
- ห้ามลบ OpenClaw — เป็นแกนหลักของระบบ
- ห้าม hardcode สี Tailwind ในหน้าใหม่ — ใช้ theme-* classes

## Skills
| Skill | File | หน้าที่ |
|-------|------|--------|
| theming | `skills/theming/SKILL.md` | มาตรฐานสี Dark/Light theme ทุกจอ |
| thai-language | `skills/thai-language/SKILL.md` | ภาษาไทยที่เข้าใจง่าย — แปลศัพท์เทคนิค, labels, สถานะ, บทบาท |
