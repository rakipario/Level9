# Relay AI Platform - Production Deployment Guide

This guide covers deploying the Relay AI Platform to production using Vercel (frontend) and Heroku (backend).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Required API Keys & Services](#required-api-keys--services)
3. [Backend Deployment (Heroku)](#backend-deployment-heroku)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- GitHub account
- Heroku account (free tier available)
- Vercel account (free tier available)
- Domain name (optional, for custom domain)

---

## Required API Keys & Services

### 1. OpenAI API Key
**Purpose:** Power the AI chat and agent capabilities

**How to obtain:**
1. Go to https://platform.openai.com
2. Sign up or log in
3. Navigate to "API Keys" in the left sidebar
4. Click "Create new secret key"
5. Copy and save the key (you won't see it again)

**Cost:** Pay-as-you-go, ~$0.03-0.06 per 1K tokens for GPT-4

---

### 2. Email Service (SendGrid Recommended)
**Purpose:** Send verification emails, password resets, notifications

**Why SendGrid over personal email:**
- Better deliverability
- Professional sender reputation
- Email analytics
- Free tier: 100 emails/day

**How to obtain SendGrid API Key:**
1. Go to https://signup.sendgrid.com
2. Create a free account
3. Complete email verification
4. Go to Settings > API Keys
5. Click "Create API Key"
6. Choose "Full Access" or restrict to "Mail Send"
7. Copy the key

**SMTP Settings for SendGrid:**
- Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey`
- Password: Your SendGrid API key

**Alternative:** Mailgun (https://www.mailgun.com) - 5,000 emails/month free

---

### 3. PostgreSQL Database (Heroku Postgres)
**Purpose:** Store user data, agents, conversations, integrations

**How to set up:**
1. In Heroku dashboard, go to your app
2. Click "Resources" tab
3. Search for "Heroku Postgres" in Add-ons
4. Select "Hobby Dev - Free" plan
5. Click "Provision"
6. Go to Settings > Config Vars to get `DATABASE_URL`

---

### 4. Integration API Keys (Optional)

These are only needed if you want to enable specific integrations:

#### Slack
1. Go to https://api.slack.com/apps
2. Click "Create New App" > "From scratch"
3. Navigate to "OAuth & Permissions"
4. Add scopes: `chat:write`, `channels:read`, `users:read`
5. Install to workspace
6. Copy "Bot User OAuth Token"

#### Salesforce
1. Go to https://login.salesforce.com
2. Setup > App Manager > New Connected App
3. Enable OAuth Settings
4. Add scopes: `api`, `refresh_token`
5. Copy Consumer Key and Secret

#### Google (Gmail, Sheets)
1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable Gmail API and/or Google Sheets API
4. Create OAuth 2.0 credentials
5. Copy Client ID and Client Secret

#### Notion
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Copy the "Internal Integration Token"

---

## Backend Deployment (Heroku)

### Step 1: Prepare Your Repository

```bash
# From your project root
cd backend

# Initialize git if not already
git init

# Create a .gitignore file
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
.DS_Store
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

# Commit your code
git add .
git commit -m "Initial backend commit"
```

### Step 2: Create Heroku App

**Option A: Via Heroku CLI**
```bash
# Install Heroku CLI if not already
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create relay-api-prod

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set Node.js version (in package.json, ensure you have):
# "engines": { "node": "20.x" }
```

**Option B: Via Heroku Dashboard**
1. Go to https://dashboard.heroku.com
2. Click "New" > "Create new app"
3. Name it "relay-api-prod" (or your preferred name)
4. Choose region (US or Europe)
5. Click "Create app"
6. Go to "Resources" tab
7. Search "Heroku Postgres" and add it

### Step 3: Configure Environment Variables

In Heroku Dashboard:
1. Go to Settings > Config Vars
2. Click "Reveal Config Vars"
3. Add the following:

| Key | Value | Required |
|-----|-------|----------|
| `DATABASE_URL` | (auto-filled by Heroku Postgres) | Yes |
| `JWT_SECRET` | Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` | Yes |
| `OPENAI_API_KEY` | sk-... | Yes |
| `SMTP_HOST` | smtp.sendgrid.net | Yes |
| `SMTP_PORT` | 587 | Yes |
| `SMTP_USER` | apikey | Yes |
| `SMTP_PASS` | Your SendGrid API key | Yes |
| `FROM_EMAIL` | noreply@yourdomain.com | Yes |
| `FROM_NAME` | Relay | Yes |
| `FRONTEND_URL` | https://your-frontend.vercel.app | Yes |
| `NODE_ENV` | production | Yes |

### Step 4: Deploy Backend

```bash
# Add Heroku remote
heroku git:remote -a relay-api-prod

# Deploy
 git push heroku main

# Run database migrations
heroku run npm run migrate

# Check logs
heroku logs --tail
```

### Step 5: Verify Deployment

```bash
# Test health endpoint
curl https://relay-api-prod.herokuapp.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-..."}
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

```bash
cd ../app

# Update vite.config.ts for production
# The proxy setting is only for development
```

### Step 2: Create Environment File

Create `.env.production`:
```
VITE_API_URL=https://relay-api-prod.herokuapp.com/api
```

### Step 3: Deploy to Vercel

**Option A: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Option B: Via GitHub Integration (Recommended)**
1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   - `VITE_API_URL`: `https://relay-api-prod.herokuapp.com/api`
7. Click "Deploy"

### Step 4: Update Backend CORS

After deploying frontend, update Heroku config:
```bash
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Environment Variables Reference

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://...

# Security
JWT_SECRET=your-super-secret-key-min-64-chars

# OpenAI
OPENAI_API_KEY=sk-...

# Email (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx...
FROM_EMAIL=noreply@relay.ai
FROM_NAME=Relay

# Frontend URL (for CORS and email links)
FRONTEND_URL=https://your-app.vercel.app

# Server
PORT=3001
NODE_ENV=production
```

### Frontend (.env.production)

```env
VITE_API_URL=https://your-backend.herokuapp.com/api
```

---

## Post-Deployment Checklist

### Backend Verification
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Database migrations ran successfully
- [ ] Can register a new user
- [ ] Verification email is sent
- [ ] Can log in
- [ ] Password reset flow works
- [ ] AI chat responds

### Frontend Verification
- [ ] Homepage loads
- [ ] Can navigate to signup/login
- [ ] Registration works end-to-end
- [ ] Email verification works
- [ ] Plan selection works
- [ ] Dashboard loads
- [ ] Can create an agent
- [ ] Chat interface works

### Security Checklist
- [ ] JWT_SECRET is strong (64+ chars)
- [ ] CORS is configured correctly
- [ ] No sensitive data in frontend code
- [ ] Database credentials not exposed
- [ ] HTTPS enforced on both ends

---

## Troubleshooting

### Backend Issues

**Issue: "Cannot find module" errors**
```bash
# Rebuild dependencies
heroku run npm install
```

**Issue: Database connection fails**
- Verify `DATABASE_URL` is set correctly
- Check Heroku Postgres is provisioned
- Run migrations: `heroku run npm run migrate`

**Issue: Emails not sending**
- Verify SendGrid API key
- Check `FROM_EMAIL` is verified in SendGrid
- Review SendGrid activity logs

**Issue: CORS errors**
- Update `FRONTEND_URL` to match your Vercel URL
- Restart Heroku dyno: `heroku restart`

### Frontend Issues

**Issue: API calls failing**
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend is running

**Issue: Build fails**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## Custom Domain Setup (Optional)

### For Vercel Frontend
1. Go to Project Settings > Domains
2. Add your domain
3. Follow DNS configuration instructions

### For Heroku Backend
1. Go to Settings > Domains
2. Add domain and configure SSL
3. Update `FRONTEND_URL` to use custom domain

---

## Monitoring & Maintenance

### Heroku Monitoring
- Use Heroku Metrics for performance monitoring
- Set up Log Drains for centralized logging
- Configure alerts for dyno crashes

### Database Maintenance
- Regular backups (Heroku Postgres auto-backup)
- Monitor connection limits
- Scale plan as needed

### Cost Estimation (Monthly)

| Service | Free Tier | Paid (Starter) |
|---------|-----------|----------------|
| Heroku Dyno | 550 hrs/month | $7/month |
| Heroku Postgres | 10K rows | $5/month |
| SendGrid | 100 emails/day | $19.95/month |
| OpenAI | - | ~$10-50/month |
| Vercel | 100GB bandwidth | $20/month |

**Total estimated cost:** $0 (free tier) to $100+/month (production)

---

## Support & Resources

- **Heroku Docs:** https://devcenter.heroku.com
- **Vercel Docs:** https://vercel.com/docs
- **SendGrid Docs:** https://docs.sendgrid.com
- **OpenAI Docs:** https://platform.openai.com/docs

---

*Last updated: February 2025*
