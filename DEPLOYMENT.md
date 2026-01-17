# Deployment Guide - Vercel with GitHub Actions

This guide explains how to set up automated deployments to Vercel using GitHub Actions.

## 📁 Files Added

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to exclude from deployment

## 🚀 Quick Setup

### Step 1: Install Vercel CLI

```bash
npm install -g vercel@latest
```

### Step 2: Link Your Project

```bash
# Login to Vercel
vercel login

# Link your project (run from project root)
vercel link
```

This will:
- Prompt you to select your Vercel scope/team
- Create or link to an existing project
- Generate a `.vercel` folder with project configuration

### Step 3: Get Your Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click "Create" to generate a new token
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token value (you won't see it again!)

### Step 4: Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click "New repository secret"
4. Add:
   - **Name**: `VERCEL_TOKEN`
   - **Value**: Your token from Step 3

### Step 5: Push to GitHub

```bash
git add .
git commit -m "Add Vercel deployment workflow"
git push origin main
```

The workflow will automatically trigger and deploy your app! 🎉

## 🔄 How It Works

### Automatic Deployments

- **Push to `main`/`master`**: Deploys to production
- **Pull Request**: Creates a preview deployment

### Workflow Steps

1. Checkout code from GitHub
2. Set up Node.js 22 with npm caching
3. Install dependencies (`npm ci`)
4. Build the project (`npm run build`)
5. Install Vercel CLI
6. Pull Vercel environment settings
7. Build artifacts for Vercel
8. Deploy to Vercel production

### Deployment URL

After deployment, you'll see:
- **Production URL**: `https://your-project.vercel.app`
- **GitHub Actions Status**: Check the "Actions" tab in your repository

## 🛠️ Manual Deployment

You can also deploy manually using the Vercel CLI:

```bash
# Deploy to preview environment
vercel

# Deploy to production
vercel --prod
```

## ⚙️ Configuration Files

### `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This configures:
- Build command for Vercel
- Output directory (`dist`)
- Framework detection (Vite)
- SPA routing (all routes → index.html)

### `.vercelignore`

Excludes unnecessary files from deployment:
- `node_modules`
- `.git` folder
- Log files
- Environment files
- Build artifacts

## 🔧 Environment Variables

### Local Development

Create `.env.local`:

```bash
VITE_API_URL=http://localhost:8080/api/v1
```

### Vercel Production

Add environment variables in Vercel dashboard:

1. Go to your project on vercel.com
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: Your production API URL
   - **Environment**: Production

## 📊 Monitoring Deployments

### GitHub Actions

- View workflow runs: Repository → **Actions** tab
- Check logs for build/deployment status
- See deployment URLs in workflow output

### Vercel Dashboard

- View all deployments: https://vercel.com/dashboard
- Monitor analytics and performance
- Configure custom domains

## 🐛 Troubleshooting

### Build Fails

**Check TypeScript errors:**
```bash
npm run build
```

**View logs in GitHub Actions:**
- Go to Actions tab
- Click on failed workflow
- Expand each step to see error details

### Deployment Fails

**Verify Vercel token:**
- Ensure `VERCEL_TOKEN` secret is set correctly in GitHub
- Token should have full access permissions

**Check Vercel project link:**
```bash
vercel link
```

**Re-pull configuration:**
```bash
vercel pull --environment=production
```

### Wrong Environment Deployed

The workflow deploys to **production** environment by default. To change:

Edit `.github/workflows/deploy.yml`:
```yaml
# For preview/staging
run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

# For production
run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 🔐 Security Best Practices

1. **Never commit** `.vercel` folder to Git (already in `.gitignore`)
2. **Never commit** Vercel token - use GitHub Secrets only
3. **Rotate tokens** periodically
4. **Use separate tokens** for different projects/environments
5. **Review** GitHub Actions logs regularly

## 🎯 Next Steps

After successful deployment:

1. **Configure Custom Domain**
   - Go to Vercel dashboard → Project → Settings → Domains
   - Add your custom domain

2. **Set Up HTTPS**
   - Automatic with Vercel (Let's Encrypt)

3. **Enable Analytics**
   - Vercel dashboard → Project → Analytics

4. **Set Up Monitoring**
   - Integrate with logging services
   - Set up error tracking (Sentry, etc.)

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## 🆘 Support

If you encounter issues:

1. Check GitHub Actions logs
2. Check Vercel deployment logs
3. Verify all secrets are configured
4. Ensure `.vercel` project is linked correctly

---

**Happy Deploying! 🚀**
