# Supabase Project Creation Guide

## Overview

This guide walks you through creating a new Supabase project for the Office Automation Platform. Since the Supabase CLI may be blocked by security policies, this provides a complete manual setup process.

## Prerequisites

- A web browser with internet access
- Access to create accounts on external services
- Basic understanding of environment variables

## Step-by-Step Project Creation

### 1. Account Setup

1. **Visit Supabase**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "Start your project" or "Sign up"

2. **Create Account**
   - Sign up with your email address
   - Or use GitHub/Google OAuth for faster signup
   - Verify your email if required

3. **Access Dashboard**
   - After verification, you'll be redirected to the dashboard
   - You should see the main Supabase dashboard with "New Project" option

### 2. Project Creation

1. **Start New Project**
   - Click the "New Project" button
   - If this is your first project, you may need to create an organization first

2. **Organization Setup** (if required)
   - Organization Name: `office-automation` or your preferred name
   - Click "Create organization"

3. **Project Configuration**
   - **Project Name**: `office-automation-platform`
   - **Database Password**: 
     - Click "Generate a password" for a secure password
     - **IMPORTANT**: Copy and save this password securely
     - You'll need it for direct database access if required
   - **Region**: Choose based on your location:
     - `us-east-1` (US East - Virginia)
     - `eu-west-1` (Europe - Ireland)  
     - `ap-southeast-1` (Asia Pacific - Singapore)
     - Or select the region closest to your users
   - **Pricing Plan**: Select "Free" for development

4. **Create Project**
   - Click "Create new project"
   - Wait 2-3 minutes for project initialization
   - You'll see a progress indicator during setup

### 3. Project Information Collection

Once your project is created, collect the following information:

1. **Project Reference ID**
   - Found in the URL: `https://supabase.com/dashboard/project/[PROJECT_REF]`
   - Example: If URL is `https://supabase.com/dashboard/project/abcdefghijklmnop`, then `abcdefghijklmnop` is your project ref

2. **Project URL**
   - Go to **Settings** → **API** in the left sidebar
   - Copy the "Project URL" (starts with `https://`)
   - Example: `https://abcdefghijklmnop.supabase.co`

3. **API Keys**
   - In the same **Settings** → **API** page:
   - **anon public key**: Copy the key under "Project API keys" → "anon public"
   - **service_role key**: Copy the key under "Project API keys" → "service_role"
   - ⚠️ **Important**: The service_role key has admin privileges - keep it secret!

### 4. Environment Configuration

1. **Open Environment File**
   - Navigate to `sourse/Back-end/.env.local` in your project
   - This file should exist but have empty values

2. **Update Configuration**
   Replace the empty values with your actual Supabase information:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # AI API Keys (configure later)
   GOOGLE_AI_API_KEY=
   GROQ_API_KEY=
   OPENAI_API_KEY=
   
   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

3. **Save the File**
   - Ensure there are no extra spaces or line breaks
   - The file must be named exactly `.env.local` (with the dot)

### 5. Database Schema Setup

1. **Open SQL Editor**
   - In your Supabase dashboard, click **SQL Editor** in the left sidebar
   - Click "New query" to create a blank query

2. **Load Schema File**
   - Open `sourse/Back-end/database-schema.sql` in your code editor
   - Copy the entire contents of this file
   - Paste it into the SQL Editor in Supabase

3. **Execute Schema**
   - Click the "Run" button or press `Ctrl+Enter`
   - Wait for execution to complete
   - You should see success messages for each table and policy created

4. **Verify Creation**
   - Run this verification query:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   - You should see: `executions`, `user_settings`, `workflows`

### 6. Authentication Configuration

1. **Enable Email Auth**
   - Go to **Authentication** → **Settings** in the dashboard
   - Under "Auth Providers", ensure "Email" is enabled
   - This allows users to sign up with email/password

2. **Configure URLs**
   - **Site URL**: Set to `http://localhost:3000` for development
   - **Redirect URLs**: Add `http://localhost:3000/**`
   - This allows authentication redirects to work properly

3. **Email Templates** (Optional)
   - Customize the email templates under **Authentication** → **Email Templates**
   - Or leave as default for now

### 7. Test the Setup

1. **Start Development Server**
   ```bash
   cd sourse/Back-end
   npm run dev
   ```

2. **Verify Connection**
   - Server should start without Supabase connection errors
   - Visit `http://localhost:3000/api/auth/user` in your browser
   - You should see a JSON response (authentication error is expected)

3. **Check Console**
   - No Supabase-related errors should appear in the terminal
   - If you see connection errors, double-check your `.env.local` file

## Project Information Summary

After completing setup, you should have:

- **Project Name**: office-automation-platform
- **Project URL**: https://[your-project-ref].supabase.co
- **Database**: PostgreSQL with 3 tables and RLS policies
- **Authentication**: Email/password enabled
- **Environment**: Configured in `.env.local`

## Security Notes

- **Never commit** `.env.local` to version control
- **Keep service_role key secret** - it has admin privileges
- **Use anon key** for client-side code only
- **Enable RLS policies** for all tables (already done in schema)

## Next Steps

With your Supabase project created and configured:

1. ✅ **Database**: Tables and policies are set up
2. ✅ **Authentication**: Ready for user signup/login
3. ✅ **Environment**: Backend can connect to Supabase
4. 🔄 **AI APIs**: Configure API keys when ready
5. 🔄 **Testing**: Run the test suite to verify everything works

You can now proceed with testing the authentication endpoints and other backend functionality.

## Troubleshooting

If you encounter issues:

1. **Double-check all copied values** for typos or extra spaces
2. **Verify the project is active** in the Supabase dashboard
3. **Check the database schema** was executed successfully
4. **Review the console logs** for specific error messages
5. **Restart the dev server** after changing `.env.local`

For additional help, refer to the main `SUPABASE_SETUP.md` file or the [Supabase documentation](https://supabase.com/docs).