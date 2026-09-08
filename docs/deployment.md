# Vercel & Production Deployment Guide

## 1. Prerequisites
- GitHub Repository (`https://github.com/stackshad0w/mailtracer.ai`)
- Vercel Account
- Neon Serverless PostgreSQL instance (or Supabase)

## 2. Step-by-Step Deployment
1. **Push to GitHub**:
   Ensure all source code is pushed to your remote repository.
2. **Import to Vercel**:
   - Create new project on Vercel and link `mailtracer.ai`.
   - Set Build Command: `npx prisma generate && next build`.
3. **Configure Environment Variables**:
   ```env
   DATABASE_URL="postgres://user:pass@ep-neon-instance.region.neon.tech/mailtracer?sslmode=require"
   AUTH_SECRET="your-generated-32-char-random-secret"
   NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
   DEMO_MODE="true"
   ```
4. **Deploy & Seed**:
   Run database push and demo seeding:
   ```bash
   npx prisma db push
   node scripts/seed.mjs
   ```
