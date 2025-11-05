# Deployment Guide

This document outlines the deployment process for the BuyCoffee application.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Environment Variables](#environment-variables)
- [Custom Domain Setup](#custom-domain-setup)
- [Deployment Checklist](#deployment-checklist)
- [Troubleshooting](#troubleshooting)
- [Alternative Deployment Options](#alternative-deployment-options)

## Overview

BuyCoffee is a Next.js 16 application optimized for deployment on **Vercel**, the platform created by Next.js makers. Vercel provides:

- ✅ Zero-configuration deployments
- ✅ Automatic HTTPS
- ✅ Edge network (CDN)
- ✅ Serverless functions
- ✅ Built-in analytics
- ✅ Preview deployments for PRs
- ✅ Environment variable management

## Prerequisites

Before deploying, ensure:

1. ✅ All code is committed to Git
2. ✅ Repository is pushed to GitHub/GitLab/Bitbucket
3. ✅ `pnpm build` succeeds locally
4. ✅ `pnpm lint` passes with no errors
5. ✅ Environment variables are documented
6. ✅ You have a Vercel account (sign up at https://vercel.com)

## Vercel Deployment (Recommended)

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Log in to Vercel**
   - Go to https://vercel.com
   - Sign in with your GitHub/GitLab/Bitbucket account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your Git provider
   - Find and import the `buycoffee` repository
   - Vercel will auto-detect Next.js configuration

3. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `pnpm build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `pnpm install` (auto-detected)

4. **Set Environment Variables**
   - Click "Environment Variables"
   - Add variables from [.env.example](.env.example):
     ```
     NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
     NEXT_PUBLIC_VERCEL_ANALYTICS_ID=(leave empty, auto-configured)
     ```
   - Add more as your app grows (auth, payments, etc.)

5. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Method 3: Deploy via Git Integration (Recommended for Teams)

Once connected, Vercel automatically:
- **Deploys `main` branch** → Production
- **Deploys other branches** → Preview deployments
- **Deploys PR commits** → Preview deployments with unique URLs

**Setup:**
1. Connect repo via Vercel dashboard (Method 1)
2. Push to `main` → Automatic production deployment
3. Open PR → Automatic preview deployment
4. Merge PR → Automatic production deployment

## Environment Variables

### Production Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

#### Required

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://buycoffee.yourdomain.com
```

#### Optional (Add as Features are Implemented)

```bash
# Authentication (when added)
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://buycoffee.yourdomain.com

# Or Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Payments (when added)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service (when added)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@buycoffee.com

# File Storage (when added)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

### Environment Variable Best Practices

✅ **DO:**
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Keep secrets server-side only (no `NEXT_PUBLIC_` prefix)
- Set different values for Production/Preview/Development environments
- Document all variables in [.env.example](.env.example)

❌ **DON'T:**
- Commit `.env` files to git
- Use `NEXT_PUBLIC_` for API keys or secrets
- Hardcode values in code

### Setting Environment Variables in Vercel

**Via Dashboard:**
1. Project Settings → Environment Variables
2. Add key-value pairs
3. Select environments: Production, Preview, Development
4. Save and redeploy

**Via CLI:**
```bash
# Add production variable
vercel env add NEXT_PUBLIC_APP_URL production

# Add to all environments
vercel env add STRIPE_SECRET_KEY

# Pull environment variables locally
vercel env pull .env.local
```

## Custom Domain Setup

### Add Custom Domain to Vercel

1. **Go to Project Settings → Domains**

2. **Add Domain**
   - Enter your domain: `buycoffee.com` or `www.buycoffee.com`
   - Click "Add"

3. **Configure DNS** (at your domain registrar)

   **Option A: Use Vercel Nameservers (Recommended)**
   - Point nameservers to Vercel:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```
   - Vercel automatically manages DNS records

   **Option B: Use A/CNAME Records**
   - **For root domain (`buycoffee.com`):**
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     ```
   - **For subdomain (`www.buycoffee.com`):**
     ```
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

4. **Wait for DNS Propagation** (5 minutes - 48 hours)

5. **Verify Domain**
   - Vercel will auto-detect DNS changes
   - SSL certificate will be issued automatically
   - Your site will be live at your custom domain

### Update Environment Variables

After adding custom domain:

```bash
NEXT_PUBLIC_APP_URL=https://buycoffee.com
NEXTAUTH_URL=https://buycoffee.com  # If using NextAuth
```

Redeploy to apply changes.

## Deployment Checklist

Before deploying to production:

### Pre-Deployment

- [ ] All features tested locally (`pnpm dev`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Linting passes (`pnpm lint`)
- [ ] TypeScript has no errors (`tsc --noEmit`)
- [ ] No console errors or warnings in browser
- [ ] Mobile responsive design verified
- [ ] All images optimized (use Next.js Image component)
- [ ] Environment variables documented in `.env.example`
- [ ] Secrets are NOT committed to git

### Vercel Configuration

- [ ] Project imported to Vercel
- [ ] Environment variables configured
- [ ] Custom domain added (if applicable)
- [ ] SSL certificate active (auto-issued by Vercel)
- [ ] Preview deployments enabled for PRs
- [ ] Analytics enabled (Vercel Analytics included)

### Post-Deployment

- [ ] Production URL accessible
- [ ] All pages load correctly
- [ ] Navigation works (landing, dashboard, profile, etc.)
- [ ] Forms submit without errors
- [ ] Images load correctly
- [ ] Mobile view works
- [ ] Lighthouse score > 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Monitor Vercel Analytics for errors

### Security

- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Environment variables are server-side only (no sensitive data in `NEXT_PUBLIC_*`)
- [ ] No API keys exposed in client-side code
- [ ] Rate limiting configured (when API routes are added)
- [ ] CSP headers configured (if needed)

## Troubleshooting

### Build Fails on Vercel

**Issue:** Build succeeds locally but fails on Vercel

**Solutions:**
1. Check build logs in Vercel dashboard
2. Ensure `pnpm-lock.yaml` is committed
3. Verify Node.js version matches locally:
   ```json
   // package.json
   "engines": {
     "node": ">=20.0.0",
     "pnpm": ">=9.0.0"
   }
   ```
4. Check for missing environment variables
5. Run `pnpm build` locally to reproduce

### Environment Variables Not Working

**Issue:** Variables are undefined in production

**Solutions:**
1. Verify variable names match exactly (case-sensitive)
2. Client-side variables MUST start with `NEXT_PUBLIC_`
3. Redeploy after adding/changing variables (Vercel caches builds)
4. Check variable is set for correct environment (Production/Preview/Development)

### TypeScript Errors on Vercel

**Issue:** Build fails with TypeScript errors

**Note:** Currently `ignoreBuildErrors: true` in [next.config.mjs](next.config.mjs#L3-L5)

**Proper Fix:**
1. Run `npx tsc --noEmit` locally
2. Fix all type errors
3. Remove `ignoreBuildErrors: true` from config
4. Commit and redeploy

### Slow Build Times

**Issue:** Vercel builds take too long

**Solutions:**
1. Enable build caching (automatic in Vercel)
2. Remove unused dependencies
3. Use `pnpm` instead of `npm` (faster)
4. Optimize images before uploading
5. Consider upgrading Vercel plan for faster builds

### 404 on Dynamic Routes

**Issue:** `/username` routes return 404

**Solutions:**
1. Ensure file is named `[username]/page.tsx` (with brackets)
2. Check file is in `app/` directory
3. Verify no typos in dynamic segment name
4. Redeploy (Vercel may have cached old routes)

### Custom Domain Not Working

**Issue:** Domain shows "Domain Not Found"

**Solutions:**
1. Wait for DNS propagation (up to 48 hours)
2. Check DNS records at domain registrar
3. Use `dig buycoffee.com` to verify DNS resolution
4. Clear browser cache
5. Try incognito/private mode

## Alternative Deployment Options

### Netlify

1. Import project from Git
2. Build command: `pnpm build`
3. Publish directory: `.next`
4. Add environment variables
5. Deploy

**Limitations:**
- No Edge Functions support (Next.js Edge Runtime)
- Less optimized for Next.js than Vercel

### Self-Hosted (Advanced)

**Requirements:**
- Node.js 20+ server
- Process manager (PM2, systemd)
- Reverse proxy (Nginx, Caddy)
- SSL certificate (Let's Encrypt)

**Build for production:**
```bash
pnpm build
pnpm start  # Runs on port 3000
```

**Example with PM2:**
```bash
npm install -g pm2
pm2 start npm --name "buycoffee" -- start
pm2 save
pm2 startup
```

**Not recommended** unless you have specific requirements (compliance, infrastructure constraints).

### Docker (Advanced)

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**Note:** Requires `output: 'standalone'` in `next.config.mjs`

## Monitoring & Analytics

### Vercel Analytics

Already integrated via `@vercel/analytics` in [app/layout.tsx](app/layout.tsx#L4):

- **Web Vitals:** Core Web Vitals tracking (LCP, FID, CLS)
- **Real User Monitoring:** Actual user performance data
- **Automatic:** No configuration needed

**View Analytics:**
- Vercel Dashboard → Project → Analytics

### Error Monitoring (Recommended)

Add Sentry for error tracking:

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Environment variables:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...
```

## CI/CD with GitHub Actions

See [.github/workflows/ci.yml](.github/workflows/ci.yml) for automated:
- ✅ Linting
- ✅ Type checking
- ✅ Build verification
- ✅ Tests (when added)

**Vercel + GitHub Actions:**
- GitHub Actions runs checks on PR
- Vercel deploys preview on PR
- Both must pass before merge

## Rollback Strategy

### Rollback to Previous Deployment

**Via Vercel Dashboard:**
1. Go to Deployments tab
2. Find previous working deployment
3. Click "⋯" → "Promote to Production"
4. Previous version is now live

**Via CLI:**
```bash
vercel rollback
```

### Git-Based Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main  # ⚠️ Use with caution
```

## Support

- 📖 **Vercel Docs:** https://vercel.com/docs
- 📖 **Next.js Deployment:** https://nextjs.org/docs/deployment
- 💬 **Vercel Support:** https://vercel.com/support
- 🐛 **Issues:** Open an issue in the repository

---

**Last Updated:** 2025-01-06
