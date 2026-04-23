# Environment Variables Reference

## Overview

This document provides a comprehensive reference for all environment variables used in the Office Automation Platform backend. Use this guide when configuring development, staging, or production environments.

---

## Table of Contents

1. [Required Variables](#required-variables)
2. [Optional Variables](#optional-variables)
3. [Environment-Specific Configuration](#environment-specific-configuration)
4. [Security Best Practices](#security-best-practices)
5. [Troubleshooting](#troubleshooting)

---

## Required Variables

These variables **must** be set for the application to function correctly.

### Supabase Configuration

#### `NEXT_PUBLIC_SUPABASE_URL`
- **Description:** Your Supabase project URL
- **Format:** `https://[project-ref].supabase.co`
- **Example:** `https://abcdefghijklmnop.supabase.co`
- **Where to find:** Supabase Dashboard → Settings → API → Project URL
- **Public:** Yes (safe to expose in client-side code)
- **Required:** ✅ Yes

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description:** Supabase anonymous/public API key
- **Format:** Long JWT token starting with `eyJ`
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Settings → API → Project API keys → anon public
- **Public:** Yes (safe to expose in client-side code, protected by RLS)
- **Required:** ✅ Yes

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Description:** Supabase service role key with admin privileges
- **Format:** Long JWT token starting with `eyJ`
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find:** Supabase Dashboard → Settings → API → Project API keys → service_role
- **Public:** ❌ **NO** - Server-side only, never expose to client
- **Required:** ✅ Yes
- **Security:** Keep this secret! Has full database access, bypasses RLS

### AI API Keys

#### `GOOGLE_AI_API_KEY`
- **Description:** Google AI (Gemini) API key
- **Format:** String (typically 39 characters)
- **Example:** `AIzaSyD1234567890abcdefghijklmnopqrstuv`
- **Where to find:** [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Public:** ❌ No - Server-side only
- **Required:** ✅ Yes (for AI features)
- **Cost:** Free tier available, pay-as-you-go for higher usage

#### `GROQ_API_KEY`
- **Description:** Groq API key for fast LLM inference
- **Format:** String starting with `gsk_`
- **Example:** `gsk_1234567890abcdefghijklmnopqrstuvwxyz`
- **Where to find:** [Groq Console](https://console.groq.com/keys)
- **Public:** ❌ No - Server-side only
- **Required:** ✅ Yes (for AI features)
- **Cost:** Free tier available

#### `OPENAI_API_KEY`
- **Description:** OpenAI API key (optional, for GPT models)
- **Format:** String starting with `sk-`
- **Example:** `sk-1234567890abcdefghijklmnopqrstuvwxyz`
- **Where to find:** [OpenAI Platform](https://platform.openai.com/api-keys)
- **Public:** ❌ No - Server-side only
- **Required:** ⚠️ Optional (but recommended for full AI features)
- **Cost:** Pay-as-you-go, no free tier

### Application Configuration

#### `NEXT_PUBLIC_APP_URL`
- **Description:** The public URL where your application is hosted
- **Format:** Full URL with protocol
- **Development:** `http://localhost:3000`
- **Production:** `https://your-domain.vercel.app` or custom domain
- **Public:** Yes
- **Required:** ✅ Yes
- **Usage:** Used for redirects, CORS, and absolute URLs

#### `NODE_ENV`
- **Description:** Node.js environment mode
- **Format:** String enum
- **Values:** `development`, `production`, `test`
- **Development:** `development`
- **Production:** `production`
- **Public:** Yes
- **Required:** ✅ Yes
- **Auto-set:** Vercel sets this automatically in production

---

## Optional Variables

These variables are optional but recommended for production environments.

### Authentication & Security

#### `NEXTAUTH_SECRET`
- **Description:** Secret key for NextAuth.js session encryption
- **Format:** Random string (minimum 32 characters)
- **Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Generate:** 
  ```bash
  openssl rand -base64 32
  # OR
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- **Public:** ❌ No - Server-side only
- **Required:** ⚠️ Recommended for production
- **Default:** Auto-generated in development

#### `NEXTAUTH_URL`
- **Description:** Canonical URL for NextAuth.js
- **Format:** Full URL with protocol
- **Development:** `http://localhost:3000`
- **Production:** `https://your-domain.vercel.app`
- **Public:** Yes
- **Required:** ⚠️ Recommended for production
- **Default:** Auto-detected in development

### Rate Limiting

#### `RATE_LIMIT_REQUESTS_PER_MINUTE`
- **Description:** Maximum API requests per user per minute
- **Format:** Integer
- **Default:** `20`
- **Recommended:** `20` for free tier, `60` for paid tier
- **Public:** No
- **Required:** ❌ Optional
- **Usage:** Protects against API abuse

#### `RATE_LIMIT_WINDOW_MS`
- **Description:** Rate limit time window in milliseconds
- **Format:** Integer (milliseconds)
- **Default:** `60000` (1 minute)
- **Public:** No
- **Required:** ❌ Optional
- **Usage:** Works with RATE_LIMIT_REQUESTS_PER_MINUTE

### CORS Configuration

#### `ALLOWED_ORIGINS`
- **Description:** Comma-separated list of allowed CORS origins
- **Format:** Comma-separated URLs
- **Development:** `http://localhost:3000`
- **Production:** `https://your-domain.vercel.app,https://www.your-domain.com`
- **Public:** No
- **Required:** ⚠️ Recommended for production
- **Default:** Same as NEXT_PUBLIC_APP_URL
- **Security:** Prevents unauthorized cross-origin requests

### Feature Flags

#### `ENABLE_AI_FEATURES`
- **Description:** Enable/disable AI functionality
- **Format:** Boolean string
- **Values:** `true`, `false`
- **Default:** `true`
- **Public:** No
- **Required:** ❌ Optional
- **Usage:** Quickly disable AI features if needed

#### `ENABLE_RATE_LIMITING`
- **Description:** Enable/disable rate limiting
- **Format:** Boolean string
- **Values:** `true`, `false`
- **Default:** `true`
- **Public:** No
- **Required:** ❌ Optional
- **Usage:** Disable for testing, enable for production

#### `ENABLE_CORS_PROTECTION`
- **Description:** Enable/disable CORS protection
- **Format:** Boolean string
- **Values:** `true`, `false`
- **Default:** `true`
- **Public:** No
- **Required:** ❌ Optional
- **Usage:** Disable for development, enable for production

### Logging & Monitoring

#### `LOG_LEVEL`
- **Description:** Logging verbosity level
- **Format:** String enum
- **Values:** `error`, `warn`, `info`, `debug`
- **Development:** `debug`
- **Production:** `info` or `warn`
- **Public:** No
- **Required:** ❌ Optional
- **Default:** `info`

#### `ENABLE_REQUEST_LOGGING`
- **Description:** Log all API requests
- **Format:** Boolean string
- **Values:** `true`, `false`
- **Default:** `true`
- **Public:** No
- **Required:** ❌ Optional
- **Usage:** Useful for debugging and monitoring

#### `SENTRY_DSN`
- **Description:** Sentry error tracking DSN
- **Format:** URL
- **Example:** `https://abc123@o123456.ingest.sentry.io/123456`
- **Where to find:** Sentry project settings
- **Public:** Yes (DSN is safe to expose)
- **Required:** ❌ Optional
- **Usage:** Enable error tracking in production

### Database Configuration

#### `DATABASE_POOL_SIZE`
- **Description:** Maximum database connection pool size
- **Format:** Integer
- **Default:** `10`
- **Recommended:** `10` for free tier, `20-50` for paid tier
- **Public:** No
- **Required:** ❌ Optional
- **Usage:** Optimize database connections

#### `DATABASE_POOL_TIMEOUT`
- **Description:** Database connection timeout in milliseconds
- **Format:** Integer (milliseconds)
- **Default:** `30000` (30 seconds)
- **Public:** No
- **Required:** ❌ Optional
- **Usage:** Prevent hanging connections

---

## Environment-Specific Configuration

### Development Environment

Create `.env.local` in `sourse/Back-end/`:

```bash
# Supabase (Development Project)
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

# AI APIs (Development Keys)
GOOGLE_AI_API_KEY=your-dev-gemini-key
GROQ_API_KEY=your-dev-groq-key
OPENAI_API_KEY=your-dev-openai-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional - Development
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
ENABLE_RATE_LIMITING=false
```

### Production Environment

Configure in Vercel Dashboard → Settings → Environment Variables:

```bash
# Supabase (Production Project)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# AI APIs (Production Keys)
GOOGLE_AI_API_KEY=your-prod-gemini-key
GROQ_API_KEY=your-prod-groq-key
OPENAI_API_KEY=your-prod-openai-key

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production

# Security
NEXTAUTH_SECRET=your-generated-secret-32-chars-minimum
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

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
```

### Testing Environment

Create `.env.test` in `sourse/Back-end/`:

```bash
# Supabase (Test Project or Mock)
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key

# AI APIs (Test Keys or Mocked)
GOOGLE_AI_API_KEY=test-key
GROQ_API_KEY=test-key
OPENAI_API_KEY=test-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=test

# Testing Configuration
ENABLE_RATE_LIMITING=false
ENABLE_CORS_PROTECTION=false
LOG_LEVEL=error
```

---

## Security Best Practices

### 1. Never Commit Secrets
```bash
# ✅ Good - Add to .gitignore
.env.local
.env.production
.env.test

# ❌ Bad - Never commit these files
git add .env.local  # DON'T DO THIS
```

### 2. Use Different Keys for Each Environment
- **Development:** Use separate API keys labeled "Development"
- **Production:** Use separate API keys labeled "Production"
- **Testing:** Use separate API keys labeled "Testing" or mock keys

### 3. Rotate Secrets Regularly
- Rotate `NEXTAUTH_SECRET` every 90 days
- Rotate AI API keys every 6 months
- Rotate Supabase service role key annually

### 4. Limit Access
- Only share production secrets with authorized team members
- Use Vercel's team access controls
- Store secrets in a password manager (1Password, LastPass, etc.)

### 5. Monitor Usage
- Track API key usage in provider dashboards
- Set up alerts for unusual activity
- Monitor Supabase logs for suspicious queries

### 6. Use Environment-Specific Projects
- **Development:** Separate Supabase project
- **Production:** Separate Supabase project
- **Testing:** Separate Supabase project or mock

---

## Troubleshooting

### Issue: "Missing environment variable"

**Error Message:**
```
Error: Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL
```

**Solutions:**
1. Check `.env.local` exists in `sourse/Back-end/`
2. Verify variable name is spelled correctly (case-sensitive)
3. Ensure no extra spaces around `=` sign
4. Restart dev server after adding variables

### Issue: "Invalid API key"

**Error Message:**
```
Error: Invalid Supabase API key
```

**Solutions:**
1. Verify you copied the correct key from Supabase dashboard
2. Check for extra spaces or line breaks in the key
3. Ensure you're using keys from the correct project (dev vs prod)
4. Regenerate keys if they were rotated

### Issue: "Environment variables not loading in Vercel"

**Solutions:**
1. Verify variables are set in Vercel dashboard
2. Check variables are enabled for correct environment (Production/Preview/Development)
3. Redeploy after adding/updating variables
4. Check variable names match exactly (case-sensitive)

### Issue: "CORS errors in production"

**Solutions:**
1. Verify `ALLOWED_ORIGINS` includes your domain
2. Check `NEXT_PUBLIC_APP_URL` is set correctly
3. Ensure HTTPS is used (not HTTP)
4. Add domain to Supabase allowed origins

### Issue: "Rate limiting not working"

**Solutions:**
1. Verify `ENABLE_RATE_LIMITING=true`
2. Check `RATE_LIMIT_REQUESTS_PER_MINUTE` is set
3. Ensure rate limit middleware is applied to routes
4. Test with multiple requests in quick succession

---

## Validation Checklist

Use this checklist to verify your environment configuration:

### Development
- [ ] `.env.local` file exists
- [ ] All required variables are set
- [ ] Supabase connection works
- [ ] AI APIs respond correctly
- [ ] Dev server starts without errors

### Production
- [ ] All variables set in Vercel dashboard
- [ ] Variables enabled for Production environment
- [ ] Separate production API keys used
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] `ALLOWED_ORIGINS` configured correctly
- [ ] Deployment successful
- [ ] All API endpoints working

### Security
- [ ] `.env.local` in `.gitignore`
- [ ] Service role key never exposed to client
- [ ] Different keys for dev and prod
- [ ] Secrets stored in password manager
- [ ] Team access properly configured

---

## Quick Reference

### Required for Basic Functionality
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_AI_API_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

### Recommended for Production
```bash
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RATE_LIMIT_REQUESTS_PER_MINUTE=
ALLOWED_ORIGINS=
ENABLE_RATE_LIMITING=
LOG_LEVEL=
```

### Optional Enhancements
```bash
OPENAI_API_KEY=
SENTRY_DSN=
DATABASE_POOL_SIZE=
ENABLE_REQUEST_LOGGING=
```

---

## Related Documentation

- `PRODUCTION_SETUP_GUIDE.md` - Complete production setup instructions
- `DEPLOYMENT_GUIDE.md` - Deployment procedures
- `.env.example` - Template for environment variables
- `.env.production` - Production environment template

---

**Last Updated:** 2024  
**Maintained By:** Office Automation Platform Team
