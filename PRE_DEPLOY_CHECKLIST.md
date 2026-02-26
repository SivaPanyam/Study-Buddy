# 📋 Pre-Vercel Deployment Checklist

**Before you push your code to GitHub, verify all items below:**

## 1️⃣ Local Verification

- [ ] Run `npm install` - All dependencies installed
- [ ] Run `npm run build` - Build completes without errors
- [ ] Build output size acceptable (verified: ~402KB gzipped)
- [ ] `dist/` folder created successfully
- [ ] Run `npm run lint` - No critical linting errors
- [ ] Test the app locally `npm run dev` and verify features work

## 2️⃣ Code & Configuration

- [ ] No hardcoded API keys in `src/` directory
- [ ] All environment variables use `VITE_` prefix
- [ ] `.env` file is in `.gitignore` (✓ verified)
- [ ] `.env.example` has all required variables documented
- [ ] No `console.log()` debugging left in production code
- [ ] No unhandled promises or async warnings

## 3️⃣ Repository Status

- [ ] All changes committed: `git status` shows clean working directory
- [ ] `.gitignore` properly excludes node_modules, dist, .env files
- [ ] README.md is up to date
- [ ] Package.json version is reasonable (currently 0.0.0 - optional to update)
- [ ] No large binary files committed

## 4️⃣ Configuration Files Review

### vercel.json ✅

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "env": {
    /* 3 VITE vars */
  },
  "headers": [
    /* cache headers */
  ]
}
```

### vite.config.js ✅

- Build is optimized with code splitting
- Terser minification enabled
- Console logs dropped in production

### package.json ✅

- All dependencies for production are in `dependencies`
- Dev tools in `devDependencies`
- Correct build script: `vite build`

## 5️⃣ Environment Variables Setup

**Before deploying, prepare these values:**

- [ ] `VITE_SUPABASE_URL` - Get from Supabase Dashboard → Settings → API
- [ ] `VITE_SUPABASE_ANON_KEY` - Get from Supabase Dashboard → Settings → API
- [ ] `VITE_GEMINI_API_KEY` - Get from Google AI Studio → API keys

You'll add these in Vercel Dashboard → Project Settings → Environment Variables

## 6️⃣ Third-Party Service Setup

### Supabase

- [ ] Supabase project is active and accessible
- [ ] Authentication enabled in Supabase
- [ ] Database tables created (users, profiles, etc.)
- [ ] Auth Redirect URL configured (temporary, will update after Vercel deploy)

### Google Gemini

- [ ] API key is active and valid
- [ ] Gemini 2.5 Flash model is available in your region
- [ ] API quota allows for test requests

## 7️⃣ Git Push

```bash
# Before pushing, run:
git status              # Should be clean
npm run build           # Should succeed
npm run lint            # Should pass

# Then push:
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## 8️⃣ Post-Push: Vercel Setup

### Create Vercel Project

- [ ] Go to https://vercel.com/new
- [ ] Select "Add GitHub App" and authorize
- [ ] Select "Study Buddy" repository
- [ ] Framework is auto-detected as Vite
- [ ] Click "Deploy"

### Add Environment Variables

After initial deployment, go to Project Settings:

- [ ] Add `VITE_SUPABASE_URL`
- [ ] Add `VITE_SUPABASE_ANON_KEY`
- [ ] Add `VITE_GEMINI_API_KEY`
- [ ] Mark for Production, Preview, Development environments
- [ ] Redeploy or push a new commit to apply

### Update Supabase

- [ ] Copy your Vercel URL (e.g., `https://study-buddy-xxx.vercel.app`)
- [ ] Go to Supabase → Authentication → URL Configuration
- [ ] Add your Vercel URL to "Redirect URLs"
- [ ] Save settings

## 9️⃣ Testing After Deployment

### Functionality Tests

- [ ] ✅ Site loads without 404 errors
- [ ] ✅ Can navigate to all pages (Dashboard, Quiz, Flashcards, etc.)
- [ ] ✅ Authentication works (Sign up → Login → Logout)
- [ ] ✅ Supabase connection active (check Network tab in DevTools)
- [ ] ✅ Gemini AI calls work (try note summarization)
- [ ] ✅ Theme switching works (Dark/Light mode)
- [ ] ✅ XP and gamification features work
- [ ] ✅ Document upload works (PDF/Word files)

### Performance Checks

- [ ] ✅ Page load time acceptable (target: <3s)
- [ ] ✅ No 404 errors in Network tab
- [ ] ✅ No CORS errors in Console
- [ ] ✅ All API calls return 200/201
- [ ] ✅ CSS and JS load from CDN

### Browser Compatibility

- [ ] ✅ Chrome/Edge
- [ ] ✅ Firefox
- [ ] ✅ Safari
- [ ] ✅ Mobile (test on phone or DevTools)

## 🔟 Post-Deployment Optimization (Optional)

- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure Vercel Analytics
- [ ] Add custom domain if needed
- [ ] Set up GitHub deployments preview
- [ ] Configure automatic dependency updates

---

## 🎯 Summary

| Item              | Status                |
| ----------------- | --------------------- |
| Code Quality      | ✅ No errors          |
| Build Process     | ✅ Verified working   |
| Configuration     | ✅ Ready for Vercel   |
| Environment Setup | ⏳ Need your API keys |
| Documentation     | ✅ Complete           |

**You're ready to deploy!** Just follow the checklist above and you'll be live in minutes.

---

## 📞 Need Help?

- **Build Issues**: See `VERCEL_DEPLOYMENT.md`
- **Quick Reference**: See `QUICK_DEPLOY.md`
- **Full Report**: See `DEPLOYMENT_READY.md`
