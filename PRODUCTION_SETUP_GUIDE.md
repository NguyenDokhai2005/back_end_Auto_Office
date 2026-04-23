# Production Environment Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the production environment for the Office Automation Platform. This includes creating a production Supabase project, configuring environment variables, setting up Vercel for deployment, and linking your GitHub repository.

**Estimated Time:** 30-45 minutes  
**Prerequisites:** GitHub account, Vercel account (free), Supabase account

---

## Table of Contents

1. [Production Supabase Project Setup](#1-production-supabase-project-setup)
2. [Production Environment Variables Configuration](#2-production-environment-variables-configuration)
3. [Vercel Project Setup](#3-vercel-project-setup)
4. [GitHub Repository Linkage](#4-github-repository-linkage)
5. [Deployment Verification](#5-deployment-verification)
6. [Post-Deployment Configuration](#6-post-deployment-configuration)
7. [Troubleshooting](#troubleshooting)

---

## 1. Production Supabase Project Setup

### 1.1 Create Production Project

⚠️ **Important:** Create a **separate** Supabase project for production. Do not use your development project.

1. **Navigate to Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Log in to your account

2. **Create New Project**
   - Click "New Project" button
   - Select your organization (or create a new one for production)
   
3. **Configure Production Project**
   - **Project Name:** `office-automation-prod` (or your preferred name)
   - **Database Password:** 
     - Click "Generate a password" for a strong password
     - **CRITICAL:** Copy and save this password in a secure password manager
     - You'll need it for database backups and direct access
   - **Region:** Choose based on your target users:
     - `us-east-1` (US East - Virginia) - Good for North America
     - `eu-west-1` (Europe - Ireland) - Good for Europe
     - `ap-southeast-1` (Asia Pacific - Singapore) - Good for Asia
     - `ap-northeast-1` (Asia Pacific - Tokyo) - Good for East Asia
   - **Pricing Plan:** 
     - Select "Free" for initial deployment
     - Consider "Pro" plan for production workloads with higher limits

4. **Wait for Project Creation**
   - Project initialization takes 2-3 minutes
   - Do not close the browser during this process

### 1.2 Collect Production API Credentials

Once your project is created:

1. **Navigate to API Settings**
   - Click **Settings** → **API** in the left sidebar

2. **Copy Production Credentials**
   - **Project URL:** Copy the URL (format: `https://[project-ref].supabase.co`)
   - **anon public key:** Copy the key under "Project API keys" → "anon public"
   - **service_role key:** Copy the key under "Project API keys" → "service_role"

3. **Store Credentials Securely**
   - Save these in a secure password manager or encrypted file
   - **Never commit these to version control**
   - You'll use these in Vercel environment variables

### 1.3 Deploy Database Schema to Production

1. **Open SQL Editor**
   - In your production Supabase project, click **SQL Editor**
   - Click "New query"

2. **Load Production Schema**
   - Open `sourse/Back-end/database-schema.sql` from your local project
   - Copy the entire contents
   - Paste into the SQL Editor

3. **Execute Schema**
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Wait for execution to complete
   - Verify success messages appear

4. **Verify Schema Deployment**
   Run this verification query:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   
   Expected result: 3 tables
   - `executions`
   - `user_settings`
   - `workflows`

5. **Verify RLS Policies**
   Run this query:
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```
   
   You should see multiple policies for each table (view, create, update, delete)

### 1.4 Configure Production Authentication

1. **Enable Email Authentication**
   - Go to **Authentication** → **Settings**
   - Under "Auth Providers", ensure "Email" is enabled

2. **Configure Site URL** (Update after Vercel deployment)
   - **Site URL:** `https://your-domain.vercel.app` (update after step 3)
   - **Redirect URLs:** Add these patterns:
     - `https://your-domain.vercel.app/**`
     - `https://your-domain.vercel.app/auth/callback`

3. **Email Configuration** (Optional but recommended)
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation and password reset emails
   - Or use default templates

4. **Security Settings**
   - **Enable email confirmations:** Recommended for production
   - **JWT expiry:** Default (3600 seconds) is fine
   - **Refresh token rotation:** Enable for better security

### 1.5 Apply Database Indexes (Performance Optimization)

1. **Open SQL Editor**
   - In your production Supabase project, go to **SQL Editor**

2. **Load Index Script**
   - Open `sourse/Back-end/database-indexes.sql` from your local project
   - Copy the entire contents
   - Paste into the SQL Editor

3. **Execute Indexes**
   - Click "Run" to create performance indexes
   - Verify success messages

---

## 2. Production Environment Variables Configuration

### 2.1 Prepare Environment Variables

Create a secure document with all production environment variables. You'll need:

#### Required Variables

```bash
# Supabase Configuration (from Step 1.2)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# AI API Keys (Production keys - separate from development)
GOOGLE_AI_API_KEY=your-production-gemini-api-key
GROQ_API_KEY=your-production-groq-api-key
OPENAI_API_KEY=your-production-openai-api-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production

# Security Configuration
NEXTAUTH_SECRET=generate-a-random-32-character-string-here
NEXTAUTH_URL=https://your-domain.vercel.app

# Rate Limiting Configuration
RATE_LIMIT_REQUESTS_PER_MINUTE=20
RATE_LIMIT_WINDOW_MS=60000

# CORS Configuration
ALLOWED_ORIGINS=https://your-domain.vercel.app

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_RATE_LIMITING=true
ENABLE_CORS_PROTECTION=true

# Logging Configuration
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

### 2.2 Generate Security Secrets

#### Generate NEXTAUTH_SECRET

Use one of these methods:

**Method 1: OpenSSL (Linux/Mac)**
```bash
openssl rand -base64 32
```

**Method 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Method 3: Online Generator**
- Visit [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)
- Copy the generated secret

### 2.3 Obtain Production AI API Keys

⚠️ **Important:** Use separate API keys for production to track usage and costs separately.

#### Google AI (Gemini)
1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Create a new API key for production
3. Label it "Office Automation - Production"
4. Copy the key

#### Groq
1. Go to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Create a new API key
3. Name it "Office Automation - Production"
4. Copy the key

#### OpenAI (Optional)
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Name it "Office Automation - Production"
4. Copy the key immediately (it won't be shown again)

---

## 3. Vercel Project Setup

### 3.1 Install Vercel CLI (Optional)

While you can deploy through the web interface, the CLI is useful for testing:

```bash
npm install -g vercel
```

### 3.2 Create Vercel Account

1. **Sign Up for Vercel**
   - Go to [https://vercel.com/signup](https://vercel.com/signup)
   - Sign up with GitHub (recommended for easier integration)
   - Or use email/Google

2. **Verify Account**
   - Complete email verification if required
   - Access the Vercel dashboard

### 3.3 Create New Project via Dashboard

1. **Navigate to Dashboard**
   - Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"

2. **Import Git Repository**
   - You'll see a list of your GitHub repositories
   - If you don't see your repo, click "Adjust GitHub App Permissions"
   - Select your Office Automation Platform repository
   - Click "Import"

3. **Configure Project Settings**
   
   **Framework Preset:**
   - Select "Next.js" (should be auto-detected)
   
   **Root Directory:**
   - Click "Edit" next to Root Directory
   - Set to: `sourse/Back-end`
   - This tells Vercel where your Next.js app is located
   
   **Build and Output Settings:**
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)
   
   **Node.js Version:**
   - Select "18.x" or "20.x" (recommended)

4. **Add Environment Variables**
   
   ⚠️ **Critical Step:** Add all environment variables from Section 2.1
   
   - Click "Environment Variables" section
   - For each variable:
     - Enter the **Name** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
     - Enter the **Value** (paste from your secure document)
     - Select environments: Check "Production", "Preview", and "Development"
   - Click "Add" for each variable
   
   **Quick Add Method:**
   - Click "Paste .env" button
   - Paste all your environment variables at once
   - Vercel will parse them automatically

5. **Deploy**
   - Click "Deploy" button
   - Wait for deployment to complete (2-5 minutes)
   - First deployment may take longer as it installs dependencies

### 3.4 Verify Deployment

1. **Check Deployment Status**
   - You'll see a deployment progress screen
   - Wait for "Building" → "Deploying" → "Ready"

2. **Get Deployment URL**
   - Once complete, you'll see your deployment URL
   - Format: `https://your-project-name.vercel.app`
   - Click "Visit" to open your deployed application

3. **Test Basic Functionality**
   - Visit: `https://your-domain.vercel.app/api/auth/user`
   - You should see a JSON response (authentication error is expected)
   - This confirms the API routes are working

---

## 4. GitHub Repository Linkage

### 4.1 Verify GitHub Integration

The GitHub integration should be automatic if you imported from GitHub in Step 3.3.

1. **Check Integration Status**
   - In Vercel dashboard, go to your project
   - Click "Settings" → "Git"
   - You should see your GitHub repository connected

2. **Configure Branch Settings**
   - **Production Branch:** `main` (or `master`)
   - **Preview Branches:** Enable for all branches
   - This allows testing changes before merging to main

### 4.2 Configure Automatic Deployments

1. **Production Deployments**
   - Go to Settings → Git
   - Ensure "Production Branch" is set to `main`
   - Every push to `main` will trigger a production deployment

2. **Preview Deployments**
   - Enable "Automatically create Preview Deployments"
   - Every pull request will get a unique preview URL
   - Useful for testing before merging

3. **Deployment Protection** (Optional)
   - Go to Settings → Deployment Protection
   - Enable "Vercel Authentication" to require login for previews
   - Useful for private projects

### 4.3 Set Up Deployment Notifications (Optional)

1. **GitHub Integration**
   - Go to Settings → Git → GitHub
   - Enable "Deployment Status Checks"
   - Deployment status will appear in pull requests

2. **Slack/Discord Notifications** (Optional)
   - Go to Settings → Integrations
   - Connect Slack or Discord
   - Get notified of deployment success/failure

---

## 5. Deployment Verification

### 5.1 Update Supabase URLs

Now that you have your Vercel deployment URL, update Supabase:

1. **Update Authentication URLs**
   - Go to your production Supabase project
   - Navigate to **Authentication** → **Settings**
   - Update **Site URL:** `https://your-domain.vercel.app`
   - Update **Redirect URLs:** Add `https://your-domain.vercel.app/**`

2. **Update CORS Settings** (if needed)
   - Go to **Settings** → **API**
   - Add your Vercel domain to allowed origins if CORS issues occur

### 5.2 Test Production Endpoints

Test each API endpoint to ensure everything works:

#### Test Authentication Endpoint
```bash
curl https://your-domain.vercel.app/api/auth/user
```
Expected: JSON response with authentication error (401)

#### Test Signup (Create Test User)
```bash
curl -X POST https://your-domain.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```
Expected: Success response with user data

#### Test Login
```bash
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```
Expected: Success response with session token

#### Test Workflows Endpoint (with auth)
```bash
curl https://your-domain.vercel.app/api/workflows \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
Expected: Empty array or list of workflows

### 5.3 Verify Database Connectivity

1. **Check Supabase Logs**
   - Go to your production Supabase project
   - Navigate to **Logs** → **Database**
   - You should see connection logs from Vercel

2. **Verify RLS Policies**
   - Create a test workflow through the API
   - Check that it appears in Supabase Table Editor
   - Verify you can only see your own data

### 5.4 Test AI Integration

Test each AI provider:

#### Test Gemini
```bash
curl -X POST https://your-domain.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "Say hello",
    "provider": "gemini",
    "temperature": 0.7
  }'
```

#### Test Groq
```bash
curl -X POST https://your-domain.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "Say hello",
    "provider": "groq",
    "temperature": 0.7
  }'
```

Expected: JSON response with AI-generated text

---

## 6. Post-Deployment Configuration

### 6.1 Set Up Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to your project in Vercel
   - Click Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `automation.yourdomain.com`)

2. **Configure DNS**
   - Vercel will provide DNS records to add
   - Add these records in your domain registrar:
     - **A Record** or **CNAME Record** as instructed
   - Wait for DNS propagation (5-60 minutes)

3. **Update Environment Variables**
   - Go to Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` to your custom domain
   - Update `NEXTAUTH_URL` to your custom domain
   - Update `ALLOWED_ORIGINS` to include your custom domain
   - Redeploy for changes to take effect

4. **Update Supabase URLs**
   - Update Site URL and Redirect URLs in Supabase
   - Use your custom domain instead of `.vercel.app`

### 6.2 Enable Production Monitoring

1. **Vercel Analytics**
   - Go to your project → Analytics
   - Click "Enable Analytics"
   - Free tier includes basic metrics

2. **Vercel Speed Insights**
   - Go to your project → Speed Insights
   - Click "Enable Speed Insights"
   - Monitor Core Web Vitals

3. **Supabase Monitoring**
   - In Supabase dashboard, go to **Reports**
   - Monitor database performance
   - Set up alerts for high usage

### 6.3 Configure Error Tracking (Recommended)

#### Option 1: Sentry (Recommended)

1. **Create Sentry Account**
   - Go to [https://sentry.io](https://sentry.io)
   - Sign up for free account

2. **Create Project**
   - Select "Next.js" as platform
   - Follow setup instructions

3. **Add to Vercel**
   - Install Sentry integration in Vercel
   - Or add `SENTRY_DSN` environment variable

#### Option 2: LogRocket or Similar

- Follow provider's integration guide
- Add environment variables to Vercel

### 6.4 Set Up Backup Strategy

1. **Supabase Backups**
   - Free tier: Daily backups (7-day retention)
   - Pro tier: Point-in-time recovery
   - Go to **Settings** → **Database** to configure

2. **Manual Backup Script** (Optional)
   ```bash
   # Create a backup script
   pg_dump -h db.your-project-ref.supabase.co \
     -U postgres \
     -d postgres \
     -f backup-$(date +%Y%m%d).sql
   ```

3. **Schedule Regular Backups**
   - Use GitHub Actions or cron job
   - Store backups in secure location (S3, Google Cloud Storage)

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Environment variables not loading"

**Symptoms:** API returns errors about missing configuration

**Solutions:**
1. Verify all environment variables are set in Vercel
2. Check variable names match exactly (case-sensitive)
3. Ensure variables are enabled for "Production" environment
4. Redeploy after adding/updating variables

#### Issue: "Database connection failed"

**Symptoms:** 500 errors when accessing API endpoints

**Solutions:**
1. Verify Supabase URL and keys are correct
2. Check Supabase project is active (not paused)
3. Verify RLS policies are set up correctly
4. Check Supabase logs for connection errors

#### Issue: "CORS errors in browser"

**Symptoms:** Browser console shows CORS policy errors

**Solutions:**
1. Verify `ALLOWED_ORIGINS` includes your domain
2. Check Supabase CORS settings
3. Ensure `NEXT_PUBLIC_APP_URL` is set correctly
4. Add your domain to Supabase allowed origins

#### Issue: "Authentication not working"

**Symptoms:** Login/signup fails or returns errors

**Solutions:**
1. Verify Supabase auth is enabled
2. Check Site URL and Redirect URLs in Supabase
3. Verify `NEXTAUTH_SECRET` is set
4. Check Supabase auth logs for errors

#### Issue: "AI API calls failing"

**Symptoms:** AI endpoints return errors

**Solutions:**
1. Verify AI API keys are correct and active
2. Check API key quotas and limits
3. Test API keys directly with provider's API
4. Check rate limiting isn't blocking requests

#### Issue: "Build fails on Vercel"

**Symptoms:** Deployment fails during build step

**Solutions:**
1. Check build logs in Vercel dashboard
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are listed
4. Check Node.js version compatibility
5. Try building locally: `npm run build`

#### Issue: "Slow API responses"

**Symptoms:** API endpoints take >3 seconds to respond

**Solutions:**
1. Check Supabase database performance
2. Verify indexes are created (run `database-indexes.sql`)
3. Monitor Vercel function execution time
4. Consider upgrading Supabase plan for better performance
5. Enable connection pooling if needed

---

## Deployment Checklist

Use this checklist to ensure everything is set up correctly:

### Supabase Production Setup
- [ ] Production Supabase project created
- [ ] Database schema deployed successfully
- [ ] RLS policies verified
- [ ] Database indexes created
- [ ] Authentication configured
- [ ] Site URL and Redirect URLs updated
- [ ] API credentials saved securely

### Environment Variables
- [ ] All Supabase variables configured
- [ ] All AI API keys configured (production keys)
- [ ] NEXTAUTH_SECRET generated and set
- [ ] APP_URL set to production domain
- [ ] ALLOWED_ORIGINS configured
- [ ] All variables enabled for Production environment

### Vercel Setup
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Root directory set to `sourse/Back-end`
- [ ] Environment variables added
- [ ] First deployment successful
- [ ] Deployment URL accessible

### GitHub Integration
- [ ] Repository connected to Vercel
- [ ] Production branch configured
- [ ] Automatic deployments enabled
- [ ] Preview deployments enabled (optional)

### Verification
- [ ] API endpoints responding correctly
- [ ] Authentication working (signup/login)
- [ ] Database connectivity verified
- [ ] AI integration tested (all providers)
- [ ] RLS policies working correctly
- [ ] Rate limiting functional

### Post-Deployment
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring enabled (Vercel Analytics)
- [ ] Error tracking configured (Sentry/similar)
- [ ] Backup strategy in place
- [ ] Documentation updated with production URLs

---

## Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files to version control
- ✅ Use different API keys for development and production
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use Vercel's encrypted environment variables
- ✅ Limit access to production environment variables

### Database Security
- ✅ Enable RLS on all tables
- ✅ Test RLS policies thoroughly
- ✅ Use service role key only in server-side code
- ✅ Enable database backups
- ✅ Monitor for unusual database activity

### API Security
- ✅ Enable rate limiting
- ✅ Validate all input data
- ✅ Use HTTPS only (enforced by Vercel)
- ✅ Configure CORS properly
- ✅ Monitor API usage and errors

### Authentication Security
- ✅ Enable email confirmation for new users
- ✅ Use strong password requirements
- ✅ Enable MFA for admin accounts
- ✅ Monitor failed login attempts
- ✅ Set appropriate JWT expiry times

---

## Next Steps

After completing this setup:

1. **Test Thoroughly**
   - Run through all user flows
   - Test with real data
   - Verify error handling

2. **Monitor Performance**
   - Check Vercel Analytics
   - Monitor Supabase metrics
   - Review error logs regularly

3. **Plan for Scale**
   - Monitor usage and costs
   - Plan for database scaling
   - Consider CDN for static assets

4. **Document**
   - Update README with production URLs
   - Document any custom configurations
   - Create runbook for common issues

5. **Continuous Improvement**
   - Set up CI/CD pipeline
   - Implement automated testing
   - Plan regular security audits

---

## Support and Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Supabase Discord](https://discord.supabase.com)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)

### Project Documentation
- `DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `API.md` - API endpoint documentation
- `README.md` - Project overview and setup

---

**Setup Complete!** 🎉

Your Office Automation Platform is now deployed to production and ready for use.

**Production URL:** `https://your-domain.vercel.app`  
**Supabase Dashboard:** `https://supabase.com/dashboard/project/your-project-ref`  
**Vercel Dashboard:** `https://vercel.com/dashboard`
