# Supabase Setup Checklist

## Quick Setup Checklist for Task 2.1

Follow this checklist to complete the Supabase project creation:

### ☐ 1. Create Supabase Account
- [ ] Go to [https://supabase.com](https://supabase.com)
- [ ] Sign up with email or OAuth (GitHub/Google)
- [ ] Verify email if required
- [ ] Access the dashboard

### ☐ 2. Create New Project
- [ ] Click "New Project" in dashboard
- [ ] Create organization if needed
- [ ] Set project name: `office-automation-platform`
- [ ] Generate and save database password securely
- [ ] Choose appropriate region
- [ ] Select "Free" pricing plan
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for initialization

### ☐ 3. Collect Project Information
- [ ] Note project reference ID from URL
- [ ] Go to **Settings** → **API**
- [ ] Copy Project URL (starts with https://)
- [ ] Copy anon public key
- [ ] Copy service_role key (keep secret!)

### ☐ 4. Configure Environment Variables
- [ ] Open `sourse/Back-end/.env.local`
- [ ] Fill in `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Fill in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Fill in `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Save the file

### ☐ 5. Set Up Database Schema
- [ ] Go to **SQL Editor** in Supabase dashboard
- [ ] Click "New query"
- [ ] Copy content from `sourse/Back-end/database-schema.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" or press Ctrl+Enter
- [ ] Verify success messages

### ☐ 6. Verify Database Setup
- [ ] Run verification query to check tables exist
- [ ] Confirm 3 tables: executions, user_settings, workflows
- [ ] Verify RLS policies are enabled

### ☐ 7. Configure Authentication
- [ ] Go to **Authentication** → **Settings**
- [ ] Ensure "Email" provider is enabled
- [ ] Set Site URL to `http://localhost:3000`
- [ ] Add redirect URL: `http://localhost:3000/**`

### ☐ 8. Test the Setup
- [ ] Run `npm run dev` in `sourse/Back-end`
- [ ] Verify server starts without Supabase errors
- [ ] Test API endpoint: `http://localhost:3000/api/auth/user`
- [ ] Confirm JSON response (auth error expected)

## Completion Criteria

✅ **Task 2.1 is complete when:**
- Supabase project is created and active
- All environment variables are configured
- Database schema is deployed successfully
- Development server connects without errors
- Authentication is configured and ready

## Files Created/Updated

- ✅ `SUPABASE_PROJECT_CREATION.md` - Detailed setup guide
- ✅ `SUPABASE_SETUP.md` - Updated with comprehensive instructions
- ✅ `SUPABASE_SETUP_CHECKLIST.md` - This checklist
- 🔄 `.env.local` - User needs to fill in actual values

## Next Steps After Completion

Once this checklist is complete, you can proceed to:
- Task 3: Authentication API testing
- Task 5: Workflow API testing
- Task 6: AI API integration

## Need Help?

- See `SUPABASE_PROJECT_CREATION.md` for detailed step-by-step instructions
- See `SUPABASE_SETUP.md` for troubleshooting and verification
- Check [Supabase documentation](https://supabase.com/docs) for additional help

---

**Status**: 🔄 Manual setup required (CLI blocked by security policy)
**Estimated Time**: 15-20 minutes
**Requirements**: Internet access, email account