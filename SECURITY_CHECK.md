# Security Check - Kiểm tra trước khi Publish

## ✅ Đã cấu hình

### 1. File .gitignore đã được cập nhật
- ✅ Ignore tất cả file `.env*` (trừ `.env.example`)
- ✅ Ignore `.env.production`
- ✅ Ignore build files và cache
- ✅ Ignore API keys và certificates

### 2. File đã xóa khỏi Git tracking
- ✅ `.env.production` - Đã xóa khỏi Git (file vẫn tồn tại local)

## 🔍 Kiểm tra nhanh

### Lệnh 1: Xem file nào sẽ được commit
```bash
git status
```

**KHÔNG được thấy:**
- ❌ `.env.local`
- ❌ `.env.production`
- ❌ `.env` (không có .example)
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ `*.tsbuildinfo`

### Lệnh 2: Kiểm tra file nhạy cảm trong Git
```bash
git ls-files | Select-String -Pattern '\.env|\.pem|\.key|credentials|secrets'
```

**CHỈ được thấy:**
- ✅ `.env.example` (OK - chỉ có placeholder)

### Lệnh 3: Kiểm tra lịch sử Git
```bash
git log --all --full-history -- ".env.local"
git log --all --full-history -- ".env.production"
```

**Nếu tìm thấy:** Cần clean Git history (xem phần dưới)

## ⚠️ Nếu đã commit nhầm file nhạy cảm

### Bước 1: Xóa khỏi Git (giữ file local)
```bash
git rm --cached .env.local
git rm --cached .env.production
git commit -m "Remove sensitive files from Git"
```

### Bước 2: Clean Git history (NGUY HIỂM - Backup trước!)
```bash
# Backup repository
git clone . ../backup-repo

# Clean history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local .env.production" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (nếu đã push lên remote)
git push origin --force --all
```

### Bước 3: Revoke tất cả API Keys

#### Google AI (Gemini)
- URL: https://makersuite.google.com/app/apikey
- Action: Revoke key cũ, tạo key mới

#### Groq
- URL: https://console.groq.com/keys
- Action: Revoke key cũ, tạo key mới

#### Supabase
- URL: https://supabase.com/dashboard/project/fzahzvxgilcrifreozsw/settings/api
- Action: Rotate Service Role Key

#### OpenAI (nếu có)
- URL: https://platform.openai.com/api-keys
- Action: Revoke key cũ, tạo key mới

## 📋 File an toàn để publish

### ✅ CÓ THỂ commit
```
✅ Source code: *.ts, *.tsx, *.js, *.jsx
✅ Config: package.json, tsconfig.json, next.config.mjs
✅ .env.example (chỉ placeholder)
✅ .gitignore
✅ SQL schemas: *.sql
✅ Tests: __tests__/**/*.test.ts
✅ Public assets: public/**/*
```

### ❌ KHÔNG được commit
```
❌ .env.local - Credentials thật
❌ .env.production - Production config
❌ .env - Bất kỳ file env nào không phải .env.example
❌ node_modules/ - Dependencies
❌ .next/, build/, dist/ - Build outputs
❌ *.tsbuildinfo - Build cache
❌ *.pem, *.key - Certificates và keys
❌ credentials.json, secrets.json
```

## 🚀 Quy trình publish an toàn

### 1. Kiểm tra local
```bash
# Xem file sẽ được commit
git add .
git status

# Nếu thấy file nhạy cảm
git reset HEAD <file>
```

### 2. Commit an toàn
```bash
git add .
git commit -m "Your commit message"
```

### 3. Kiểm tra trước push
```bash
# Xem những gì sẽ được push
git diff origin/main..HEAD

# Kiểm tra file trong commit cuối
git show --name-only
```

### 4. Push
```bash
git push origin main
```

## 🔒 Best Practices

### 1. Sử dụng .env.example
- Luôn cập nhật `.env.example` khi thêm biến mới
- Chỉ dùng placeholder, không dùng giá trị thật
- Thêm comment giải thích cách lấy API key

### 2. Rotate keys định kỳ
- Mỗi 3-6 tháng rotate tất cả API keys
- Sau khi có người rời team
- Sau khi phát hiện security incident

### 3. Sử dụng Secret Management
- Development: `.env.local` (local only)
- Production: Vercel Environment Variables
- Team: 1Password, AWS Secrets Manager, HashiCorp Vault

### 4. Monitor usage
- Thiết lập alerts cho unusual API usage
- Theo dõi logs định kỳ
- Giới hạn rate limits

## 📞 Emergency Response

### Nếu keys bị lộ:

1. **NGAY LẬP TỨC** (trong 5 phút):
   - Revoke tất cả keys bị lộ
   - Tạo keys mới
   - Cập nhật vào `.env.local` và Vercel

2. **Trong 1 giờ**:
   - Kiểm tra logs để xem có abuse không
   - Thông báo cho team
   - Document incident

3. **Trong 24 giờ**:
   - Review security practices
   - Cập nhật documentation
   - Training cho team

## ✅ Checklist cuối cùng

Trước khi publish, check tất cả:

- [ ] Đã chạy `git status` và không thấy file nhạy cảm
- [ ] Đã kiểm tra `.gitignore` hoạt động đúng
- [ ] Đã xóa file nhạy cảm khỏi Git tracking
- [ ] `.env.example` chỉ có placeholder
- [ ] Đã backup `.env.local` vào thư mục `privite/`
- [ ] Đã test ứng dụng vẫn chạy được
- [ ] Nếu đã commit nhầm: đã revoke và tạo lại keys
- [ ] Đã clean Git history (nếu cần)
- [ ] Đã đọc và hiểu SECURITY_CHECK.md này

## Ngày cập nhật: 2026-04-27
