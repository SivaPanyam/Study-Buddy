# ⚡ Quick Start Deployment Guide

## 30-Second Vercel Deployment

### Step 1: Prepare Your Code

```bash
# Make sure everything is committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your Study Buddy repository
5. Click "Deploy"

### Step 3: Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

| Variable Name            | Value                     | Source                                 |
| ------------------------ | ------------------------- | -------------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL | https://supabase.com/dashboard         |
| `VITE_SUPABASE_ANON_KEY` | Your public anon key      | Supabase → Settings → API              |
| `VITE_GEMINI_API_KEY`    | Your Gemini API key       | https://aistudio.google.com/app/apikey |

### Step 4: Update Supabase Settings

Go to Supabase Dashboard → Authentication → URL Configuration

Add your Vercel URL:

```
https://yourdomain.vercel.app
```

### Step 5: Test Deployment

- Wait for Vercel to finish building (2-3 minutes)
- Click "Visit" to view your deployed site
- Test login and main features

---

## Common Issues & Fixes

| Issue                                  | Fix                                                         |
| -------------------------------------- | ----------------------------------------------------------- |
| **"Cannot find environment variable"** | Add the variable to Vercel Settings → Environment Variables |
| **"Routes showing 404"**               | Already fixed in `vercel.json` with rewrites                |
| **"Supabase connection fails"**        | Add your Vercel URL to Supabase Auth Redirect URLs          |
| **"API call errors"**                  | Check API keys in Vercel environment variables              |
| **"Build fails"**                      | Check build logs in Vercel Dashboard → Deployments          |

---

## 🔗 Important Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Project**: https://supabase.com/dashboard
- **Google AI Studio**: https://aistudio.google.com
- **Github Repository**: Your repo URL

---

## Next Steps After Deployment

1. ✅ Add custom domain (optional)
2. ✅ Set up custom email via Supabase
3. ✅ Monitor Analytics in Vercel Dashboard
4. ✅ Keep dependencies updated

Need help? See `VERCEL_DEPLOYMENT.md` for detailed instructions.
