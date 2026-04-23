# Office Automation Platform - Backend

Backend API cho Office Automation Platform, xây dựng với Next.js 14 API Routes và Supabase.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **AI Integration:** Google Gemini, Groq, OpenAI

## 📁 Project Structure

```
Back-end/
├── app/
│   └── api/              # API Routes
│       ├── auth/         # Authentication endpoints
│       ├── workflows/    # Workflow CRUD endpoints
│       ├── ai/           # AI proxy endpoints
│       ├── executions/   # Execution tracking endpoints
│       └── settings/     # User settings endpoints
├── lib/
│   ├── supabase/         # Supabase client utilities
│   ├── ai/               # AI service adapters
│   └── utils/            # Utility functions
├── types/                # TypeScript type definitions
└── .env.local            # Environment variables
```

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase Project

**⚠️ Important**: Due to security policies, manual setup is required.

Follow the setup guides in order:

1. **Quick Start**: `SUPABASE_SETUP_CHECKLIST.md` - Step-by-step checklist
2. **Detailed Guide**: `SUPABASE_PROJECT_CREATION.md` - Complete setup instructions  
3. **Troubleshooting**: `SUPABASE_SETUP.md` - Verification and troubleshooting

**Summary of steps:**
- Create Supabase account and project
- Get API keys and project URL
- Configure `.env.local` with your credentials
- Run database schema in Supabase SQL Editor
- Enable authentication settings

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GOOGLE_AI_API_KEY` - Google Gemini API key
- `GROQ_API_KEY` - Groq API key
- `OPENAI_API_KEY` - OpenAI API key (optional)

### 4. Verify Setup

After configuring Supabase and environment variables:

```bash
# Check that all environment variables are set
cat .env.local

# Start the development server
npm run dev
```

The server should start without Supabase connection errors.

### 5. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/user` - Get current user

### Workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows` - List workflows
- `GET /api/workflows/[id]` - Get workflow
- `PUT /api/workflows/[id]` - Update workflow
- `DELETE /api/workflows/[id]` - Delete workflow

### AI
- `POST /api/ai/chat` - Execute AI model (Gemini, Groq, OpenAI)

### Executions
- `POST /api/executions` - Create execution record
- `GET /api/executions` - List executions
- `GET /api/executions/[id]` - Get execution details
- `PATCH /api/executions/[id]` - Update execution status

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

## 🔒 Security

- All API routes require authentication (except auth endpoints)
- Row Level Security (RLS) enabled on all database tables
- Rate limiting: 20 requests/minute per user on AI endpoints
- Input validation on all endpoints
- API keys stored securely in environment variables

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration
```

## 🚀 Deployment

### Production Setup

For complete production deployment instructions, see:

1. **Quick Reference**: `PRODUCTION_SETUP_CHECKLIST.md` - Step-by-step checklist
2. **Complete Guide**: `PRODUCTION_SETUP_GUIDE.md` - Detailed setup instructions
3. **Environment Variables**: `ENVIRONMENT_VARIABLES.md` - All configuration options
4. **Deployment Guide**: `DEPLOYMENT_GUIDE.md` - Deployment procedures

### Quick Start - Production Deployment

1. **Create Production Supabase Project**
   - Follow `PRODUCTION_SETUP_GUIDE.md` Section 1
   - Deploy database schema and indexes
   - Configure authentication

2. **Set Up Vercel**
   - Import GitHub repository
   - Set root directory to `sourse/Back-end`
   - Configure all environment variables
   - Deploy

3. **Verify Deployment**
   - Test all API endpoints
   - Verify database connectivity
   - Test AI integration
   - Check monitoring and logs

### Production Checklist

- [ ] Production Supabase project created
- [ ] Database schema and indexes deployed
- [ ] All environment variables configured in Vercel
- [ ] GitHub repository linked to Vercel
- [ ] Automatic deployments enabled
- [ ] All API endpoints tested
- [ ] Authentication flow verified
- [ ] AI integration tested
- [ ] Monitoring and error tracking enabled
- [ ] Documentation updated with production URLs

## 📖 Documentation

See `doc/API.md` for detailed API documentation.

## 🤝 Contributing

This is a private project. For questions, contact the development team.

## 📄 License

Proprietary - All rights reserved
