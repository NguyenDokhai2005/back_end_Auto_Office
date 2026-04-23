# Hướng dẫn Cài đặt Backend - Office Automation Platform

## Tổng quan

Backend của Office Automation Platform được xây dựng với Next.js 14 API Routes, Supabase, và tích hợp AI. Tài liệu này hướng dẫn chi tiết cách cài đặt và cấu hình môi trường development và production.

---

## Yêu cầu Hệ thống

### Phần mềm cần thiết:

- **Node.js**: >= 18.17.0 (khuyến nghị 20.x LTS)
- **npm**: >= 9.0.0 hoặc **yarn**: >= 1.22.0
- **Git**: Để clone repository
- **Code Editor**: VS Code (khuyến nghị) hoặc editor khác

### Tài khoản cần thiết:

1. **Supabase Account** (miễn phí)
   - Đăng ký tại: https://supabase.com
   - Cần để tạo database và authentication

2. **AI API Keys** (ít nhất một trong các sau):
   - **Google AI (Gemini)**: Miễn phí - https://makersuite.google.com/app/apikey
   - **Groq**: Miễn phí - https://console.groq.com
   - **OpenAI**: Trả phí - https://platform.openai.com/api-keys (optional)

---

## Bước 1: Clone và Cài đặt Dependencies

### 1.1. Clone Repository

```bash
git clone <repository-url>
cd Auto-Office/sourse/Back-end
```

### 1.2. Cài đặt Dependencies

```bash
npm install
```

**Dependencies chính:**
- `next` - Next.js framework
- `react`, `react-dom` - React libraries
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Supabase SSR utilities
- `@google/generative-ai` - Google Gemini SDK
- `groq-sdk` - Groq API SDK
- `openai` - OpenAI SDK
- `uuid` - UUID generation
- `typescript` - TypeScript support

---

## Bước 2: Cấu hình Supabase

### 2.1. Tạo Supabase Project

1. Truy cập https://supabase.com/dashboard
2. Click **"New Project"**
3. Điền thông tin:
   - **Name**: `office-automation` (hoặc tên bạn muốn)
   - **Database Password**: Tạo password mạnh (lưu lại)
   - **Region**: Chọn region gần nhất
4. Click **"Create new project"** (chờ ~2 phút)

### 2.2. Lấy API Keys

Sau khi project được tạo:

1. Vào **Settings** → **API**
2. Copy các giá trị sau:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (key dài)
   - **service_role key**: `eyJhbGc...` (key dài, bảo mật)

### 2.3. Tạo Database Schema

1. Vào **SQL Editor** trong Supabase Dashboard
2. Click **"New Query"**
3. Copy toàn bộ nội dung file `database-schema.sql` vào editor
4. Click **"Run"** để thực thi

**Schema bao gồm:**
- 3 tables: `workflows`, `executions`, `user_settings`
- Indexes cho performance
- Row Level Security (RLS) policies
- Triggers cho auto-update timestamps

### 2.4. Xác minh Database

Vào **Table Editor** và kiểm tra 3 tables đã được tạo:
- ✅ `workflows`
- ✅ `executions`
- ✅ `user_settings`

---

## Bước 3: Lấy AI API Keys

### 3.1. Google AI (Gemini) - Miễn phí ⭐

1. Truy cập https://makersuite.google.com/app/apikey
2. Đăng nhập với Google account
3. Click **"Create API Key"**
4. Copy API key (bắt đầu với `AIza...`)

**Giới hạn miễn phí:**
- 60 requests/phút
- Đủ cho development và testing

### 3.2. Groq - Miễn phí ⭐

1. Truy cập https://console.groq.com
2. Đăng ký/Đăng nhập
3. Vào **API Keys**
4. Click **"Create API Key"**
5. Copy API key (bắt đầu với `gsk_...`)

**Giới hạn miễn phí:**
- 30 requests/phút
- Model: Llama 3 70B

### 3.3. OpenAI - Trả phí (Optional)

1. Truy cập https://platform.openai.com/api-keys
2. Đăng ký/Đăng nhập
3. Click **"Create new secret key"**
4. Copy API key (bắt đầu với `sk-...`)
5. Nạp credit vào account (tối thiểu $5)

**Chi phí:**
- GPT-3.5-turbo: ~$0.002/1K tokens
- Cần credit card để sử dụng

---

## Bước 4: Cấu hình Environment Variables

### 4.1. Tạo file `.env.local`

Copy file template:

```bash
cp .env.example .env.local
```

### 4.2. Điền thông tin vào `.env.local`

Mở file `.env.local` và điền các giá trị:

```bash
# ============================================
# SUPABASE CONFIGURATION (Bắt buộc)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# AI API KEYS (Ít nhất một trong các sau)
# ============================================

# Google AI (Gemini) - Miễn phí, khuyến nghị
GOOGLE_AI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Groq - Miễn phí, khuyến nghị
GROQ_API_KEY=gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# OpenAI - Trả phí, optional
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ============================================
# APP CONFIGURATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# ERROR NOTIFICATIONS (Optional)
# ============================================
# Email notifications
ERROR_EMAIL_ENABLED=false
ERROR_EMAIL_RECIPIENTS=admin@example.com
ERROR_FROM_EMAIL=noreply@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_PASSWORD=your-smtp-password

# Webhook notifications
ERROR_WEBHOOK_ENABLED=false
ERROR_WEBHOOK_URL=https://your-webhook-url.com
```

### 4.3. Kiểm tra Environment Variables

Chạy lệnh sau để verify:

```bash
npm run dev
```

Nếu thiếu biến nào, server sẽ báo lỗi cụ thể.

---

## Bước 5: Chạy Development Server

### 5.1. Start Server

```bash
npm run dev
```

Server sẽ chạy tại: **http://localhost:3000**

### 5.2. Kiểm tra Server

Mở browser và truy cập:

```
http://localhost:3000
```

Bạn sẽ thấy trang Next.js default.

### 5.3. Test API Endpoints

Test authentication endpoint:

```bash
curl http://localhost:3000/api/auth/user
```

Kết quả mong đợi (chưa đăng nhập):
```json
{"error":"Unauthorized","code":"AUTH_ERROR"}
```

---

## Bước 6: Test Authentication Flow

### 6.1. Đăng ký User

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 6.2. Đăng nhập

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### 6.3. Test Protected Endpoint

```bash
curl http://localhost:3000/api/auth/user -b cookies.txt
```

Kết quả mong đợi:
```json
{
  "data": {
    "id": "uuid",
    "email": "test@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## Bước 7: Test AI Integration

### 7.1. Test Gemini

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "prompt": "Say hello in Vietnamese",
    "provider": "gemini"
  }'
```

### 7.2. Test Groq

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "prompt": "Say hello in Vietnamese",
    "provider": "groq"
  }'
```

---

## Cấu trúc Project

```
Back-end/
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── signup/
│   │   │   └── user/
│   │   ├── workflows/      # Workflow CRUD endpoints
│   │   │   └── [id]/
│   │   ├── ai/             # AI proxy endpoints
│   │   │   └── chat/
│   │   ├── executions/     # Execution tracking endpoints
│   │   │   └── [id]/
│   │   └── settings/       # User settings endpoints
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── supabase/           # Supabase utilities
│   │   ├── client.ts
│   │   └── server.ts
│   ├── ai/                 # AI adapters
│   │   ├── adapter.ts
│   │   ├── gemini.ts
│   │   ├── groq.ts
│   │   └── openai.ts
│   └── utils/              # Utility functions
│       ├── errors.ts
│       ├── response.ts
│       ├── rateLimit.ts
│       ├── logger.ts
│       └── notifications.ts
├── types/
│   └── index.ts            # TypeScript type definitions
├── .env.local              # Environment variables (local)
├── .env.example            # Environment template
├── database-schema.sql     # Database schema
├── package.json
├── tsconfig.json
└── README.md
```

---

## Scripts Có sẵn

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Build
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

---

## Troubleshooting

### Lỗi: "Missing Supabase environment variables"

**Nguyên nhân:** Chưa cấu hình Supabase credentials

**Giải pháp:**
1. Kiểm tra file `.env.local` có tồn tại
2. Verify các biến `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart dev server

### Lỗi: "Unauthorized" khi gọi API

**Nguyên nhân:** Chưa đăng nhập hoặc session hết hạn

**Giải pháp:**
1. Đăng nhập lại qua `/api/auth/login`
2. Kiểm tra cookie được gửi kèm request
3. Verify RLS policies trong Supabase

### Lỗi: AI API không hoạt động

**Nguyên nhân:** API key không hợp lệ hoặc hết quota

**Giải pháp:**
1. Verify API key trong `.env.local`
2. Kiểm tra quota/limits của provider
3. Test với provider khác (Gemini/Groq)

### Lỗi: Rate limit exceeded

**Nguyên nhân:** Vượt quá 20 requests/phút

**Giải pháp:**
1. Đợi 1 phút trước khi retry
2. Kiểm tra header `X-RateLimit-Remaining`
3. Implement exponential backoff trong client

---

## Production Deployment

### Vercel (Khuyến nghị)

1. **Push code lên GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy trên Vercel**
   - Truy cập https://vercel.com
   - Click **"Import Project"**
   - Chọn GitHub repository
   - Configure environment variables (copy từ `.env.local`)
   - Click **"Deploy"**

3. **Cấu hình Production Supabase**
   - Tạo Supabase project mới cho production
   - Update environment variables trên Vercel
   - Run database schema trên production database

### Environment Variables trên Vercel

Vào **Settings** → **Environment Variables** và thêm:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_AI_API_KEY`
- `GROQ_API_KEY`
- `OPENAI_API_KEY` (optional)
- `NEXT_PUBLIC_APP_URL` (production URL)

---

## Tài liệu Tham khảo

- **API Documentation**: Xem file `doc/API.md`
- **Supabase Setup**: Xem file `SUPABASE_SETUP.md`
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Google AI Docs**: https://ai.google.dev/docs
- **Groq Docs**: https://console.groq.com/docs

---

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:

1. **Console logs**: `npm run dev` output
2. **Browser console**: F12 → Console tab
3. **Supabase logs**: Dashboard → Logs
4. **API Documentation**: `doc/API.md`

---

**Cập nhật lần cuối:** April 23, 2026
