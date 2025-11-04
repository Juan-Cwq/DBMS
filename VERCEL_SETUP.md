# Vercel Deployment - Quick Fix

## The Issue You Saw

The error "Environment Variable 'ANTHROPIC_API_KEY' references Secret 'anthropic_api_key', which does not exist" happened because the environment variable wasn't set in Vercel.

## How to Fix

### 1. Go to Your Vercel Project Settings

1. Open your project in Vercel dashboard
2. Go to **Settings** → **Environment Variables**

### 2. Add the API Key

Add this environment variable:

**Key**: `ANTHROPIC_API_KEY`  
**Value**: Your Anthropic API key (the one from your local `.env` file)

**Environments**: Select all (Production, Preview, Development)

### 3. Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **Redeploy**

Or just push a new commit using the `git-push.sh` script!

## Alternative: Use Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variable
vercel env add ANTHROPIC_API_KEY

# Paste your API key when prompted

# Deploy
vercel --prod
```

## Verify It Works

Once redeployed:
1. Visit your Vercel URL
2. Try generating SQL
3. Check that it works without errors

---

**Note**: I've fixed the `vercel.json` file to not reference secrets. The environment variable should be added directly in the Vercel dashboard.
