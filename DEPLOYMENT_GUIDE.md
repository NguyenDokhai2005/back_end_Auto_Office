# Deployment Guide - Office Automation Platform

## Overview

This guide covers deploying the Office Automation Platform backend to production using Vercel and Supabase.

## Prerequisites

- Node.js 18+ installed locally
- Vercel CLI installed (`npm i -g vercel`)
- Supabase account
- GitHub repository set up

## 1. Production Supabase Project Setup

### 1.1 Create Production Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `office-automation-prod`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Wait for project creation (2-3 minutes)

### 1.2 Configure Database Schema

1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the entire content from `database-schema.sql`
3. Click "Run" to execute the schema
4. Verify tables are created in the Table Editor

### 1.3 Configure Authentication

1. Go to Authentication > Settings
2. Configure Site URL: `https://your-domain.com`
3. Configure Redirect URLs:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)
4. Enable email confirmations if desired
5. Configure email templates if needed

### 1.4 Get API Keys

1. Go to Settings > API
2. Copy the following values:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon Key**: `eyJ...` (public key)
   - **Service Role Key**: `eyJ...` (secret key - keep secure!)

## 2. Vercel Project Setup

### 2.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 2.2 Login to Vercel

```bash
vercel login
```

### 2.3 Link GitHub Repository

1. Push your code to GitHub if not already done
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `sourse/Back-end`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.4 Configure Environment Variables

In Vercel dashboard, go to Settings > Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_AI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
NEXTAUTH_SECRET=your-32-character-secret
RATE_LIMIT_REQUESTS_PER_MINUTE=20
ALLOWED_ORIGINS=https://your-domain.vercel.app
```

### 2.5 Deploy

```bash
cd sourse/Back-end
vercel --prod
```

## 3. Custom Domain Setup (Optional)

### 3.1 Add Domain in Vercel

1. Go to your project in Vercel dashboard
2. Go to Settings > Domains
3. Add your custom domain
4. Follow DNS configuration instructions

### 3.2 Update Environment Variables

Update these variables with your custom domain:
- `NEXT_PUBLIC_APP_URL`
- `ALLOWED_ORIGINS`
- Supabase Site URL and Redirect URLs

## 4. Post-Deployment Verification

### 4.1 Health Check

Visit these endpoints to verify deployment:

- `https://your-domain.com/api/health` (if implemented)
- `https://your-domain.com/api/auth/user` (should return 401 without auth)

### 4.2 Test Authentication

1. Try to sign up a new user
2. Check if user appears in Supabase Auth dashboard
3. Try to log in with the new user

### 4.3 Test API Endpoints

Use a tool like Postman or curl to test:

```bash
# Test login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test workflows (with auth token)
curl -X GET https://your-domain.com/api/workflows \
  -H "Authorization: Bearer your-jwt-token"
```

## 5. Monitoring and Maintenance

### 5.1 Set Up Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Supabase Monitoring**: Check database performance
3. **Error Tracking**: Consider Sentry integration

### 5.2 Database Maintenance

1. **Backups**: Supabase automatically backs up your database
2. **Indexes**: Monitor query performance and add indexes as needed
3. **RLS Policies**: Regularly audit Row Level Security policies

### 5.3 Security Monitoring

1. **API Usage**: Monitor for unusual patterns
2. **Rate Limiting**: Check if limits are appropriate
3. **Authentication**: Monitor failed login attempts

## 6. Scaling Considerations

### 6.1 Database Scaling

- Monitor database connections and consider connection pooling
- Upgrade Supabase plan if needed for more connections
- Consider read replicas for heavy read workloads

### 6.2 API Scaling

- Vercel automatically scales serverless functions
- Monitor function execution time and memory usage
- Consider edge functions for global performance

### 6.3 Rate Limiting

- Adjust rate limits based on usage patterns
- Consider different limits for different user tiers
- Implement more sophisticated rate limiting if needed

## 7. Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Verify variables are set in Vercel dashboard
   - Check variable names match exactly
   - Redeploy after adding variables

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check if database is accessible
   - Verify RLS policies allow operations

3. **CORS Issues**
   - Check ALLOWED_ORIGINS environment variable
   - Verify domain matches exactly
   - Check if HTTPS is enforced

4. **Authentication Issues**
   - Verify Supabase auth settings
   - Check redirect URLs
   - Verify JWT secret configuration

### Getting Help

- Check Vercel deployment logs
- Check Supabase logs and metrics
- Review Next.js and Supabase documentation
- Check GitHub issues for known problems

## 8. Security Checklist

- [ ] All environment variables are set securely
- [ ] Service role key is not exposed in client code
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] RLS policies are tested and working
- [ ] HTTPS is enforced
- [ ] Authentication is working correctly
- [ ] Input validation is in place
- [ ] Error messages don't leak sensitive information

## 9. Performance Checklist

- [ ] Database indexes are optimized
- [ ] API responses are properly cached
- [ ] Large payloads are paginated
- [ ] Connection pooling is configured
- [ ] Rate limiting prevents abuse
- [ ] Monitoring is set up
- [ ] Error tracking is configured