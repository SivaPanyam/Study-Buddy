# 🚀 Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. **Vercel Project Configuration**

- [ ] Create a new project on [Vercel Dashboard](https://vercel.com)
- [ ] Connect your GitHub repository to Vercel
- [ ] Select "Other" as the framework (Vite + React setup)
- [ ] Verify build command: `npm run build`
- [ ] Verify output directory: `dist`

### 2. **Environment Variables Setup**

Add these environment variables in Vercel Project Settings > Environment Variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

**Steps:**

1. Go to Vercel Dashboard → Your Project → Settings
2. Navigate to "Environment Variables"
3. Add each variable above
4. Make sure they're available in Production, Preview, and Development

### 3. **DNS & Domain Configuration**

- [ ] Add custom domain if needed (optional)
- [ ] Configure DNS settings in Vercel
- [ ] Add domain to Supabase & Google AI allowed origins

### 4. **Supabase Configuration**

Update these URLs in Supabase settings:

- Add Vercel deployment URL to "Auth Redirect URLs"
- Update CORS origins to include your Vercel URL

**Steps:**

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL (e.g., `https://yourdomain.vercel.app`)
3. Save settings

### 5. **Google AI Configuration**

- [ ] Verify API key is valid in Google AI Studio
- [ ] Check API quotas if not on paid plan
- [ ] Ensure Gemini 2.5 Flash model is available

### 6. **Pre-Deployment Verification**

Run these locally first:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Preview the production build
npm run preview
```

## Deployment Steps

### Option A: Git Push Deployment (Recommended)

1. Commit and push your code to GitHub
2. Vercel automatically detects and deploys
3. Review deployment in Vercel Dashboard
4. Check deployment logs for any errors

### Option B: Manual Deployment (Direct Upload)

1. Run `npm run build` locally to create `dist/` folder
2. Drag and drop the `dist/` folder to Vercel CLI or Dashboard
3. Wait for deployment to complete

## Post-Deployment Testing

### ✅ Essential Tests

- [ ] Access the deployed URL and verify it loads
- [ ] Test authentication flow (Sign up → Login → Logout)
- [ ] Verify Supabase connection (check user data sync)
- [ ] Test Gemini AI features (note summarization, quiz generation)
- [ ] Check if documents upload and processing works
- [ ] Verify XP and gamification features work
- [ ] Test dark/light theme switching
- [ ] Check responsive design on mobile/tablet
- [ ] Test all routes and navigation

### 🔍 Network Requests

Open DevTools (F12) → Network tab and verify:

- ✅ No 404 errors for static assets
- ✅ API calls to Supabase succeed
- ✅ Gemini API requests return 200 status
- ✅ No CORS errors

### 📊 Performance Check

- [ ] Use Vercel's Analytics to monitor performance
- [ ] Check Core Web Vitals
- [ ] Verify images load efficiently
- [ ] Check JavaScript bundle size (should be optimized)

## Troubleshooting

### Issue: "Environment variables not found"

**Solution:**

- Make sure variable names start with `VITE_` for client-side access
- Rebuild after adding variables: `npm run build`
- Check Vercel logs: Dashboard → Deployments → View Build Logs

### Issue: "Supabase connection fails"

**Solution:**

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Add Vercel URL to Supabase Auth Redirect URLs
- Check Supabase project status

### Issue: "Gemini API key errors"

**Solution:**

- Verify `VITE_GEMINI_API_KEY` is valid
- Check API quotas/limits at Google AI Studio
- Ensure no whitespace in the key value

### Issue: "Routes not working (404 on refresh)"

**Solution:**

- Vercel automatically handles SPA routing for Vite
- If routes still break, check `vercel.json` configuration

## Monitoring & Maintenance

- [ ] Set up error monitoring (optional: Sentry, LogRocket)
- [ ] Check Vercel Analytics regularly
- [ ] Monitor Supabase database usage
- [ ] Keep dependencies updated quarterly
- [ ] Review deployment logs after each update

## Quick Reference

**Project Type:** Vite + React SPA  
**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Node Version:** 18.17.0+  
**Framework:** React 19 + React Router v7  
**Backend:** Supabase + Google AI

---

For more help, visit:

- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Supabase Docs](https://supabase.com/docs)
