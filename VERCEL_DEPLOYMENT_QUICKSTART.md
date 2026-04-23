# Vercel Deployment Quick Start

## Overview

This is a condensed guide for deploying the Office Automation Platform to Vercel. For complete instructions, see `PRODUCTION_SETUP_GUIDE.md`.

**Time Required:** 15-20 minutes  
**Prerequisites:** GitHub account, Vercel account (free)

---

## Step 1: Prepare Production Supabase (5 minutes)

### Create Production Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: `office-automation-prod`
4. Generate and save database password
5. Choose region closest to users
6. Wait for project creation

### Deploy Database
1. Open SQL Editor in Supabase
2. Copy content from `database-schema.sql`
3. Paste and execute
4. Copy content from `database-indexes.sql`
5. Paste and execute

### Get Credentials
1. Go to Settings → API
2. Copy Project URL
3. Copy anon public key
4. Copy service_role key
5. Save all three securely

---

## Step 2: Prepare Environment Variables (5 minutes)

### Generate Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

### Get AI API Keys
- **Gemini:** [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Groq:** [Groq Console](https://console.groq.com/keys)
- **OpenAI (optional):** [OpenAI Platform](https://platform.openai.com/api-keys)

### Prepare Variables List
Create a text file with these variables (you'll paste into Vercel):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
GOOGLE_AI_API_KEY=your-prod-gemini-key
GROQ_API_KEY=your-prod-groq-key
OPENAI_API_KEY=your-prod-openai-key
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NODE_ENV=production
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-project.vercel.app
RATE_LIMIT_REQUESTS_PER_MINUTE=20
RATE_LIMIT_WINDOW_MS=60000
ALLOWED_ORIGINS=https://your-project.vercel.app
ENABLE_AI_FEATURES=true
ENABLE_RATE_LIMITING=true
ENABLE_CORS_PROTECTION=true
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

---

## Step 3: Deploy to Vercel (5 minutes)

### Import Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"

### Configure Project
1. **Framework Preset:** Next.js (auto-detected)
2. **Root Directory:** Click "Edit" → Set to `sourse/Back-end`
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (default)
5. **Node.js Version:** 18.x or 20.x

### Add Environment Variables
1. Scroll to "Environment Variables" section
2. Click "Paste .env" button
3. Paste all variables from Step 2
4. Ensure "Production", "Preview", and "Development" are checked
5. Click "Add" or "Save"

### Deploy
1. Click "Deploy" button
2. Wait 2-5 minutes for deployment
3. Note your deployment URL: `https://[project].vercel.app`

---

## Step 4: Update Supabase URLs (2 minutes)

### Update Authentication Settings
1. Go to production Supabase project
2. Navigate to Authentication → Settings
3. Update **Site URL:** `https://your-project.vercel.app`
4. Update **Redirect URLs:** `https://your-project.vercel.app/**`
5. Save changes

---

## Step 5: Verify Deployment (3 minutes)

### Test API Endpoints

#### Health Check
```bash
curl https://your-project.vercel.app/api/auth/user
```
Expected: 401 Unauthorized (JSON response)

#### Test Signup
```bash
curl -X POST https://your-project.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```
Expected: Success with user data

#### Test Login
```bash
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```
Expected: Success with session token

### Check Logs
1. In Vercel dashboard, go to your project
2. Click "Deployments" → Latest deployment
3. Click "Functions" tab to see logs
4. Verify no errors

---

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Verify `package.json` is correct
- Test build locally: `npm run build`

### Environment Variables Not Loading
- Verify all variables are set in Vercel
- Check variable names (case-sensitive)
- Ensure enabled for "Production"
- Redeploy after adding variables

### Database Connection Fails
- Verify Supabase URL and keys
- Check Supabase project is active
- Review Supabase logs

### Authentication Not Working
- Verify Site URL in Supabase
- Check Redirect URLs
- Ensure NEXTAUTH_SECRET is set

---

## Next Steps

### Enable Monitoring
1. Go to your project in Vercel
2. Enable Analytics
3. Enable Speed Insights

### Set Up Automatic Deployments
1. Go to Settings → Git
2. Verify production branch is `main`
3. Enable automatic deployments

### Configure Custom Domain (Optional)
1. Go to Settings → Domains
2. Add your custom domain
3. Configure DNS records
4. Update environment variables with new domain
5. Update Supabase URLs

---

## Quick Reference

### Important URLs
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Your App:** https://your-project.vercel.app

### Key Files
- `PRODUCTION_SETUP_GUIDE.md` - Complete guide
- `PRODUCTION_SETUP_CHECKLIST.md` - Detailed checklist
- `ENVIRONMENT_VARIABLES.md` - All variables reference
- `DEPLOYMENT_GUIDE.md` - Deployment procedures

### Support
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Completion Checklist

- [ ] Production Supabase project created
- [ ] Database schema deployed
- [ ] Environment variables prepared
- [ ] Vercel project created and deployed
- [ ] Supabase URLs updated
- [ ] API endpoints tested
- [ ] Deployment verified

**Status:** ✅ Ready for production use

---

**Estimated Total Time:** 15-20 minutes  
**Difficulty:** Beginner-friendly  
**Cost:** Free (using free tiers)
