# Setup Guide - REACH Church Vietnam

**Quick Start**: ~30 minutes from clone to running locally

---

## Prerequisites

### System Requirements

```bash
# Check versions
node --version      # ≥ 20.0.0
npm --version       # ≥ 10.0.0
git --version       # ≥ 2.40.0
```

### Install Requirements

- **Node.js 20+** → [nodejs.org](https://nodejs.org/)
- **npm 10+** → Usually comes with Node
- **Git** → [git-scm.com](https://git-scm.com/)
- **Supabase Account** → [supabase.com](https://supabase.com/) (free tier available)
- **Code Editor** → VSCode recommended

---

## Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/truonga-dev/REACH_Church_App.git
cd REACH_Church_App

# Check branch
git branch -a
git checkout develop  # or main
```

---

## Step 2: Install Dependencies

```bash
# Install npm packages
npm install

# Verify installation
npm list
```

**Expected output:** Shows dependency tree with Next.js, React, TypeScript, etc.

---

## Step 3: Configure Environment Variables

### 3.1 Create `.env.local` file

```bash
# Copy from template
cp .env.example .env.local

# Edit the file
# Linux/Mac:
nano .env.local

# Windows (PowerShell):
notepad .env.local
```

### 3.2 Get Supabase Keys

1. **Create Supabase Project**
   - Go to [app.supabase.com](https://app.supabase.com/)
   - Click "New Project"
   - Choose region (nearest to you)
   - Get your API URL and Key

2. **Set Environment Variables**

```bash
# In .env.local

# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (development)
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEBUG=true
```

### 3.3 Verify Variables

```bash
# Check if variables are loaded
npm run dev

# Open browser console and check:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)  # Should log the URL
```

---

## Step 4: Setup Database

### 4.1 Create Tables (Supabase)

```bash
# Copy the SQL schema
cat supabase/schema.sql
```

Go to Supabase → SQL Editor → Create new query → Paste schema → Run

**Or run migrations:**

```bash
# Using Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Push migrations
supabase db push
```

### 4.2 Seed Sample Data (Optional)

```bash
# Create sample prayers, devotionals, etc.
# Go to Supabase → SQL Editor → Create sample records

INSERT INTO devotionals (title, content, author, published_at) 
VALUES ('Sample Devotional', 'Content here...', 'Pastor John', NOW());
```

---

## Step 5: Run Development Server

```bash
# Start Next.js dev server
npm run dev

# Output should show:
# ▲ Next.js 16.2.6
# - Local:        http://localhost:3000
# - Environments: .env.local
```

### Access the App

- Open browser → `http://localhost:3000`
- You should see the home page
- Try signing up with email

---

## Step 6: Verify Setup

### Test Checklist

- [ ] Page loads without errors
- [ ] Can sign up with email
- [ ] Can see Bible verses (`/bible`)
- [ ] Can view devotionals (`/devotional`)
- [ ] Can create prayer request (`/prayer`) - requires login
- [ ] Admin panel accessible (`/admin`) - requires admin role
- [ ] Bottom navigation works
- [ ] No console errors (F12 → Console)

---

## Common Issues & Solutions

### Issue 1: "Cannot find module '@supabase/supabase-js'"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue 2: "Supabase connection failed"

**Solution:**
- Check `.env.local` has correct Supabase URL and key
- Verify Supabase project is active
- Check internet connection
- Go to Supabase dashboard → check service status

### Issue 3: "Port 3000 already in use"

**Solution:**
```bash
# Use different port
npm run dev -- -p 3001

# Or kill process using port 3000
# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Linux/Mac:
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Issue 4: "TypeScript errors"

**Solution:**
```bash
# Check for type errors
npm run build

# If build fails, check:
npx tsc --noEmit

# Fix common errors in files
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

### 2. Make Changes

```bash
# Edit files in src/
code src/app/page.tsx

# Test locally
npm run dev
```

### 3. Run Tests (if tests exist)

```bash
npm run test
npm run test:coverage
```

### 4. Check Linting

```bash
npm run lint
npm run lint -- --fix  # Auto-fix issues
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/my-feature
```

### 6. Create Pull Request

Go to GitHub → Create PR → feature branch → develop

---

## Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm start                # Start production server

# Testing
npm run test             # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Code Quality
npm run lint            # Check ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Check TypeScript

# Utilities
npm run format          # Format code (Prettier)
npm run clean           # Clean build artifacts
```

---

## VS Code Extensions (Recommended)

Install for better development experience:

1. **ES7+ React/Redux/React-Native snippets**
   - Publisher: dsznajder
   - ID: dsznajder.es7-react-js-snippets

2. **TypeScript Vue Plugin (Volar)**
   - Publisher: Vue
   - ID: vue.volar

3. **Prettier - Code formatter**
   - Publisher: Prettier
   - ID: esbenp.prettier-vscode

4. **ESLint**
   - Publisher: Microsoft
   - ID: dbaeumer.vscode-eslint

5. **Supabase**
   - Publisher: Supabase
   - ID: supabase.supabase-vscode

6. **Thunder Client** (for API testing)
   - Publisher: rangav
   - ID: rangav.vscode-thunder-client

---

## VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Project Structure Quick Reference

```
reach-church/
├── src/
│   ├── app/              # Pages and layouts
│   ├── components/       # Reusable components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities and services
│   └── types/            # TypeScript types
├── public/               # Static files
├── supabase/             # Database schema
├── scripts/              # Utility scripts
├── .env.example          # Environment template
├── .env.local            # Local env (don't commit)
├── jest.config.js        # Test configuration
├── tsconfig.json         # TypeScript config
├── next.config.mjs       # Next.js config
└── package.json          # Dependencies
```

---

## Database Schema Quick Overview

```sql
-- Users (via Supabase Auth)
auth.users

-- Profiles
public.user_profiles

-- Bible
public.bible_highlights
public.bible_reading_plans

-- Content
public.devotionals
public.sermons
public.news_posts

-- Community
public.prayer_requests
```

---

## Next Steps

1. ✅ Read [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. ✅ Review [ARCHITECTURE.md](ARCHITECTURE.md)
3. ✅ Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
4. ✅ Read [CONTRIBUTING.md](CONTRIBUTING.md) for code standards
5. ✅ Join development team channel

---

## Need Help?

- 📚 **Documentation:** See docs/ folder
- 🐛 **Issues:** [GitHub Issues](https://github.com/truonga-dev/REACH_Church_App/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/truonga-dev/REACH_Church_App/discussions)
- 📧 **Email:** dev-team@reach-church.com

---

**Last Updated:** June 5, 2026  
**Tested with:** Node.js 20.12, npm 10.5, macOS 14.5
