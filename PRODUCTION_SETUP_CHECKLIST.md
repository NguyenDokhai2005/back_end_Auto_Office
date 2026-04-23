# Production Setup Quick Checklist

## Task 13.1: Production Environment Setup

This checklist provides a quick reference for setting up the production environment. For detailed instructions, see `PRODUCTION_SETUP_GUIDE.md`.

---

## Phase 1: Production Supabase Project

### Create Production Project
- [ ] Go to [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Click "New Project"
- [ ] Set name: `office-automation-prod`
- [ ] Generate and save database password securely
- [ ] Choose appropriate region for your users
- [ ] Select pricing plan (Free or Pro)
- [ ] Wait for project creation (2-3 minutes)

### Collect Credentials
- [ ] Go to Settings → API
- [ ] Copy Project URL: `https://[ref].supabase.co`
- [ ] Copy anon public key
- [ ] Copy service_role key
- [ ] Store all credentials securely

### Deploy Database Schema
- [ ] Open SQL Editor in Supabase
- [ ] Copy content from `database-schema.sql`
- [ ] Paste and execute in SQL Editor
- [ ] Verify 3 tables created: workflows, executions, user_settings
- [ ] Run verification query to confirm RLS policies

### Apply Performance Indexes
- [ ] Open SQL Editor
- [ ] Copy content from `database-indexes.sql`
- [ ] Paste and execute
- [ ] Verify indexes created successfully

### Configure Authentication
- [ ] Go to Authentication → Settings
- [ ] Enable Email provider
- [ ] Set Site URL: `https://your-domain.vercel.app` (update after Vercel setup)
- [ ] Add Redirect URLs: `https://your-domain.vercel.app/**`
- [ ] Enable email confirmations (recommended)

---

## Phase 2: Environment Variables

### Generate Security Secrets
- [ ] Generate NEXTAUTH_SECRET (32+ characters)
  ```bash
  openssl rand -base64 32
  # OR
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```

### Obtain Production AI API Keys
- [ ] **Google AI (Gemini):** Get key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] **Groq:** Get key from [Groq Console](https://console.groq.com/keys)
- [ ] **OpenAI (optional):** Get key from [OpenAI Platform](https://platform.openai.com/api-keys)
- [ ] Label all keys as "Production" to track usage separately

### Prepare Environment Variables Document
Create a secure document with these variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# AI APIs
GOOGLE_AI_API_KEY=your-prod-gemini-key
GROQ_API_KEY=your-prod-groq-key
OPENAI_API_KEY=your-prod-openai-key

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production

# Security
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-domain.vercel.app

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=20
RATE_LIMIT_WINDOW_MS=60000

# CORS
ALLOWED_ORIGINS=https://your-domain.vercel.app

# Features
ENABLE_AI_FEATURES=true
ENABLE_RATE_LIMITING=true
ENABLE_CORS_PROTECTION=true

# Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

---

## Phase 3: Vercel Project Setup

### Create Vercel Account
- [ ] Go to [Vercel](https://vercel.com/signup)
- [ ] Sign up with GitHub (recommended)
- [ ] Verify account

### Import Project
- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click "Add New..." → "Project"
- [ ] Select your GitHub repository
- [ ] Click "Import"

### Configure Project
- [ ] Framework Preset: Next.js (auto-detected)
- [ ] Root Directory: `sourse/Back-end`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Node.js Version: 18.x or 20.x

### Add Environment Variables
- [ ] Click "Environment Variables" section
- [ ] Click "Paste .env" button
- [ ] Paste all variables from Phase 2
- [ ] Ensure all variables are enabled for Production, Preview, and Development
- [ ] Verify all variables are added correctly

### Deploy
- [ ] Click "Deploy" button
- [ ] Wait for deployment (2-5 minutes)
- [ ] Note your deployment URL: `https://[project].vercel.app`

---

## Phase 4: GitHub Repository Linkage

### Verify Integration
- [ ] In Vercel project, go to Settings → Git
- [ ] Verify GitHub repository is connected
- [ ] Confirm repository name and branch

### Configure Deployment Settings
- [ ] Set Production Branch: `main` (or `master`)
- [ ] Enable automatic deployments for production branch
- [ ] Enable preview deployments for pull requests
- [ ] Configure deployment protection (optional)

### Set Up Notifications (Optional)
- [ ] Enable GitHub deployment status checks
- [ ] Connect Slack/Discord for deployment notifications
- [ ] Configure email notifications

---

## Phase 5: Update Supabase with Vercel URL

### Update Authentication URLs
- [ ] Go to production Supabase project
- [ ] Navigate to Authentication → Settings
- [ ] Update Site URL: `https://your-domain.vercel.app`
- [ ] Update Redirect URLs: `https://your-domain.vercel.app/**`
- [ ] Save changes

### Update CORS Settings (if needed)
- [ ] Go to Settings → API
- [ ] Add Vercel domain to allowed origins if CORS issues occur

---

## Phase 6: Deployment Verification

### Test API Endpoints

#### Health Check
```bash
curl https://your-domain.vercel.app/api/auth/user
# Expected: 401 Unauthorized (JSON response)
```

#### Test Signup
```bash
curl -X POST https://your-domain.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
# Expected: Success with user data
```

#### Test Login
```bash
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
# Expected: Success with session token
```

#### Test AI Integration
```bash
curl -X POST https://your-domain.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prompt":"Hello","provider":"gemini"}'
# Expected: AI response
```

### Verify Database
- [ ] Check Supabase Logs → Database for connections
- [ ] Verify test user appears in Authentication → Users
- [ ] Check Table Editor for test data
- [ ] Confirm RLS policies are working

### Check Deployment Logs
- [ ] Review Vercel deployment logs for errors
- [ ] Check Vercel Functions logs for runtime errors
- [ ] Monitor Supabase logs for database issues

---

## Phase 7: Post-Deployment Configuration

### Enable Monitoring
- [ ] Enable Vercel Analytics
- [ ] Enable Vercel Speed Insights
- [ ] Review Supabase Reports dashboard
- [ ] Set up alerts for high usage

### Configure Error Tracking (Recommended)
- [ ] Sign up for Sentry or similar service
- [ ] Create project for production
- [ ] Add SENTRY_DSN to Vercel environment variables
- [ ] Redeploy to enable error tracking

### Set Up Backups
- [ ] Verify Supabase automatic backups are enabled
- [ ] Document backup retention policy
- [ ] Create manual backup script (optional)
- [ ] Test backup restoration process

### Custom Domain (Optional)
- [ ] Add domain in Vercel Settings → Domains
- [ ] Configure DNS records at domain registrar
- [ ] Wait for DNS propagation
- [ ] Update environment variables with custom domain
- [ ] Update Supabase URLs with custom domain
- [ ] Redeploy

---

## Final Verification Checklist

### Infrastructure
- [ ] Production Supabase project is active
- [ ] Database schema deployed successfully
- [ ] RLS policies verified and working
- [ ] Performance indexes created
- [ ] Vercel project deployed successfully
- [ ] GitHub integration working
- [ ] Automatic deployments enabled

### Configuration
- [ ] All environment variables set correctly
- [ ] Supabase URLs updated with Vercel domain
- [ ] Authentication configured properly
- [ ] CORS settings correct
- [ ] Rate limiting enabled

### Testing
- [ ] Authentication endpoints working
- [ ] Workflow CRUD operations working
- [ ] AI integration tested (all providers)
- [ ] Database connectivity verified
- [ ] RLS policies tested with multiple users
- [ ] Rate limiting functional

### Monitoring & Security
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Backup strategy in place
- [ ] Security headers configured
- [ ] API keys secured (not exposed)

### Documentation
- [ ] Production URLs documented
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide available

---

## Quick Reference

### Important URLs
- **Production App:** `https://your-domain.vercel.app`
- **Vercel Dashboard:** `https://vercel.com/dashboard`
- **Supabase Dashboard:** `https://supabase.com/dashboard/project/[ref]`
- **GitHub Repository:** `https://github.com/[user]/[repo]`

### Key Files
- `PRODUCTION_SETUP_GUIDE.md` - Detailed setup instructions
- `DEPLOYMENT_GUIDE.md` - Deployment procedures
- `database-schema.sql` - Database schema
- `database-indexes.sql` - Performance indexes
- `.env.production` - Production environment template

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Troubleshooting Quick Fixes

### Build Fails
1. Check Vercel build logs
2. Verify `package.json` scripts
3. Test build locally: `npm run build`
4. Check Node.js version compatibility

### Environment Variables Not Loading
1. Verify variables in Vercel dashboard
2. Check variable names (case-sensitive)
3. Ensure enabled for Production
4. Redeploy after changes

### Database Connection Issues
1. Verify Supabase URL and keys
2. Check project is active (not paused)
3. Review Supabase connection logs
4. Test connection with SQL query

### Authentication Not Working
1. Check Supabase auth settings
2. Verify Site URL and Redirect URLs
3. Check NEXTAUTH_SECRET is set
4. Review Supabase auth logs

### CORS Errors
1. Verify ALLOWED_ORIGINS
2. Check Supabase CORS settings
3. Ensure NEXT_PUBLIC_APP_URL is correct
4. Add domain to Supabase allowed origins

---

## Completion Criteria

Task 13.1 is complete when:

✅ Production Supabase project created and configured  
✅ Database schema and indexes deployed  
✅ All environment variables configured in Vercel  
✅ Vercel project deployed successfully  
✅ GitHub repository linked with automatic deployments  
✅ All API endpoints tested and working  
✅ Authentication flow verified  
✅ AI integration tested  
✅ Monitoring and error tracking enabled  
✅ Documentation updated with production URLs  

---

**Estimated Time:** 30-45 minutes  
**Prerequisites:** GitHub account, Vercel account, Supabase account  
**Difficulty:** Intermediate  

**Status:** Ready for execution  
**Next Task:** 13.2 Security hardening
