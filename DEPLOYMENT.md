# Deployment Guide - SchemaCraft AI

## Deploy to Vercel

### Prerequisites
- GitHub account with the repository pushed
- Vercel account (free tier works)
- Anthropic API key

### Step-by-Step Deployment

#### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Import your repository: `Juan-Cwq/DBMS`

#### 2. Configure Project

**Framework Preset**: Vite

**Build Settings**:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

#### 3. Add Environment Variables

In the Vercel project settings, add:

```
ANTHROPIC_API_KEY=your-api-key-here
```

**Important**: Use your actual Anthropic API key, not the one from the local `.env` file.

#### 4. Deploy

Click "Deploy" and wait for the build to complete (usually 2-3 minutes).

### Post-Deployment

Once deployed, Vercel will provide you with:
- **Production URL**: `https://your-project.vercel.app`
- **Automatic HTTPS**
- **Global CDN**
- **Automatic deployments** on every git push

### How It Works

The deployment uses:
- **Frontend**: Static files served from the `dist` folder
- **Backend**: Serverless functions in the `/api` folder
- **API Routes**: Automatically routed to `/api/*` endpoints

### Testing Your Deployment

1. Visit your Vercel URL
2. Click "Start Building"
3. Try generating SQL or schemas
4. Check that the API calls work correctly

### Troubleshooting

#### API Errors
- Check that `ANTHROPIC_API_KEY` is set in Vercel environment variables
- Verify the API key has credits
- Check Vercel function logs for errors

#### Build Failures
- Ensure all dependencies are in `package.json`
- Check build logs in Vercel dashboard
- Verify Node.js version compatibility

#### CORS Issues
- The serverless function includes CORS headers
- If issues persist, check browser console for specific errors

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

### Monitoring

Vercel provides:
- **Analytics**: Page views and performance
- **Logs**: Function execution logs
- **Insights**: Core Web Vitals

Access these in your Vercel dashboard.

### Cost Considerations

**Free Tier Includes**:
- Unlimited deployments
- 100GB bandwidth/month
- Serverless function executions
- Automatic SSL

**Anthropic API Costs**:
- Claude 3 Haiku: ~$0.25 per 1M input tokens
- Monitor usage in Anthropic console

### Alternative Deployment Options

#### Netlify
Similar to Vercel, supports serverless functions.

#### Railway
Good for full-stack apps with persistent backend.

#### Render
Free tier includes web services and databases.

### Continuous Deployment

Every push to the `main` branch automatically:
1. Triggers a new build
2. Runs tests (if configured)
3. Deploys to production
4. Updates the live site

### Environment-Specific Deployments

- **Production**: `main` branch → `your-project.vercel.app`
- **Preview**: Other branches → unique preview URLs
- **Local**: `npm run dev` → `localhost:5173`

### Security Best Practices

1. ✅ Never commit API keys to git
2. ✅ Use Vercel environment variables
3. ✅ Enable HTTPS (automatic on Vercel)
4. ✅ Monitor API usage and costs
5. ✅ Rotate API keys periodically

### Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Discord**: https://vercel.com/discord
- **GitHub Issues**: Create issues in your repository

---

**Ready to deploy?** Push your changes and follow the steps above!
