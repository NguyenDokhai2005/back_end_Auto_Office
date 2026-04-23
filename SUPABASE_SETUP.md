# Supabase Setup Guide

## Prerequisites

⚠️ **Important**: This guide provides manual setup instructions since the Supabase CLI may be blocked by security policies.

## Step 1: Create Supabase Project

1. **Sign up/Login to Supabase**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign up with your email or login if you already have an account
   - Verify your email if required

2. **Create New Project**
   - Click "New Project" button
   - Fill in the project details:
     - **Organization:** Select or create an organization
     - **Project Name:** `office-automation-platform`
     - **Database Password:** Generate a strong password and **save it securely**
     - **Region:** Choose the region closest to your users (e.g., US East, Europe West)
     - **Pricing Plan:** Select "Free" for development
   - Click "Create new project"
   - Wait for project to be created (~2-3 minutes)

3. **Project Creation Confirmation**
   - You should see a success message
   - The project dashboard will load automatically
   - Note down your project reference ID (visible in the URL)

## Step 2: Get API Keys and Configuration

1. **Navigate to API Settings**
   - In your Supabase project dashboard, click on **Settings** in the left sidebar
   - Click on **API** in the settings menu

2. **Copy Required Values**
   - **Project URL**: Copy the URL (starts with `https://`)
     - This goes into `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: Copy the long key under "Project API keys"
     - This goes into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Copy the service role key (⚠️ **Keep this secret!**)
     - This goes into `SUPABASE_SERVICE_ROLE_KEY`

3. **Important Security Notes**
   - The `anon` key is safe to use in client-side code
   - The `service_role` key has admin privileges - never expose it in client code
   - Store the `service_role` key only in server environment variables

## Step 3: Update Environment Variables

1. **Open the environment file**
   - Navigate to `sourse/Back-end/.env.local`
   - This file should already exist with empty values

2. **Fill in the Supabase configuration**
   ```bash
   # Replace with your actual values from Step 2
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Keep other variables as they are**
   - The AI API keys can be configured later
   - The APP_URL should remain as `http://localhost:3000` for development

4. **Save the file**
   - Make sure there are no extra spaces or line breaks
   - The file should be saved as `.env.local` (note the dot at the beginning)

## Step 4: Set Up Database Schema

1. **Open SQL Editor**
   - In your Supabase project dashboard, click on **SQL Editor** in the left sidebar
   - Click "New query" to create a new SQL query

2. **Load the Database Schema**
   - Open the file `sourse/Back-end/database-schema.sql` in your code editor
   - Copy the entire content of this file
   - Paste it into the SQL Editor in Supabase

3. **Execute the Schema**
   - Click the "Run" button or press `Ctrl+Enter` (Windows) or `Cmd+Enter` (Mac)
   - Wait for the query to complete
   - You should see a success message indicating all tables and policies were created

4. **Verify Schema Creation**
   - The schema includes:
     - `workflows` table for storing user workflows
     - `executions` table for tracking workflow runs
     - `user_settings` table for user preferences
     - Row Level Security (RLS) policies for data protection
     - Proper indexes for performance

## Step 5: Verify Database Setup

Run these verification queries in the SQL Editor to ensure everything is set up correctly:

### Check Tables
```sql
-- This should return 3 tables: workflows, executions, user_settings
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check Row Level Security (RLS)
```sql
-- This should show RLS enabled (true) for all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check Security Policies
```sql
-- This should show multiple policies for each table
SELECT tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Expected Results
You should see:
- ✅ **3 tables**: `executions`, `user_settings`, `workflows`
- ✅ **RLS enabled**: All tables should have `rowsecurity = true`
- ✅ **Security policies**: Multiple policies for each table (view, create, update, delete)

If any of these checks fail, review the database schema execution in Step 4.

## Step 6: Test Backend Connection

1. **Start the Development Server**
   ```bash
   cd sourse/Back-end
   npm run dev
   ```

2. **Check for Connection Errors**
   - The server should start without Supabase-related errors
   - Look for any error messages in the console
   - The server should be accessible at `http://localhost:3000`

3. **Test API Endpoints**
   - Open your browser and go to `http://localhost:3000/api/auth/user`
   - You should see a JSON response (likely an authentication error, which is expected)
   - This confirms the API routes are working and can connect to Supabase

## Step 7: Enable Authentication (Optional)

If you want to test user authentication:

1. **Enable Email Authentication**
   - In Supabase dashboard, go to **Authentication** → **Settings**
   - Under "Auth Providers", ensure "Email" is enabled
   - Configure email templates if needed

2. **Configure Site URL**
   - Set the Site URL to `http://localhost:3000` for development
   - Add `http://localhost:3000/**` to Redirect URLs

3. **Test User Registration**
   - You can now test the `/api/auth/signup` endpoint
   - Users will receive confirmation emails if email confirmation is enabled

## Troubleshooting

### Common Issues and Solutions

#### Error: "Missing Supabase environment variables"
- **Cause**: `.env.local` file is missing or has empty values
- **Solution**: 
  - Ensure `.env.local` exists in `sourse/Back-end/` directory
  - Fill in all three Supabase variables from Step 2
  - Restart the dev server after updating the file

#### Error: "Invalid API key" or "Unauthorized"
- **Cause**: Incorrect API keys copied from Supabase dashboard
- **Solution**:
  - Double-check you copied the correct keys from **Settings** → **API**
  - Ensure there are no extra spaces or line breaks in the keys
  - Make sure you're using the keys from the correct project

#### Error: "relation does not exist" or "table not found"
- **Cause**: Database schema was not executed properly
- **Solution**:
  - Go back to Step 4 and re-run the database schema
  - Check the SQL Editor for any error messages during execution
  - Verify the schema using the queries in Step 5

#### Error: "Failed to connect to database"
- **Cause**: Network issues or incorrect project URL
- **Solution**:
  - Verify the project URL is correct and starts with `https://`
  - Check your internet connection
  - Ensure the Supabase project is active (not paused)

#### Error: "Row Level Security policy violation"
- **Cause**: RLS policies are not set up correctly
- **Solution**:
  - Re-run the database schema from `database-schema.sql`
  - Verify policies exist using the query in Step 5
  - Check that authentication is working properly

### Getting Help

If you encounter issues not covered here:
1. Check the Supabase project logs in the dashboard
2. Review the browser console for client-side errors
3. Check the Next.js server logs for backend errors
4. Consult the [Supabase documentation](https://supabase.com/docs)

## Next Steps

After completing the Supabase setup, you can proceed with:

### Immediate Next Steps
- ✅ **Task 3**: Authentication API implementation
- ✅ **Task 5**: Workflow API implementation  
- ✅ **Task 6**: AI API proxy implementation

### Configuration Checklist
Before proceeding, ensure you have:
- [ ] Created Supabase project successfully
- [ ] Copied all three API keys to `.env.local`
- [ ] Executed the database schema without errors
- [ ] Verified tables and RLS policies exist
- [ ] Tested the development server starts without errors

### Optional Enhancements
- Configure AI API keys in `.env.local` for full functionality
- Set up email templates in Supabase for user authentication
- Configure custom domain for production deployment

---

**Setup Status:** 🔄 **Manual setup required** - Follow steps above to complete Supabase configuration

**Note**: This manual setup replaces the automated CLI-based setup due to security policy restrictions. The end result is identical - a fully configured Supabase project ready for the Office Automation Platform backend.
