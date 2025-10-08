# 🚀 Deployment Guide - WordPress Plugin Generator

Complete step-by-step guide to deploy your WordPress Plugin Generator to Cloudflare Workers.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18+** installed ([Download](https://nodejs.org/))
- [ ] **Cloudflare account** ([Sign up free](https://dash.cloudflare.com/sign-up))
- [ ] **Google Gemini API key** ([Get free key](https://aistudio.google.com/app/apikey))
- [ ] **Git** installed (optional, for version control)
- [ ] **Wrangler CLI** (will be installed via npm)

## 🎯 Step 1: Clone or Download Project

```bash
# If using Git
git clone <your-repo-url>
cd cloudflare_worker_app/wp-ai-generator

# Or download and extract ZIP, then navigate to folder
cd wp-ai-generator
```

## 📦 Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `wrangler` - Cloudflare Workers CLI
- `jszip` - ZIP file creation
- `hono` - Web framework
- `chanfana` - OpenAPI framework
- TypeScript and dependencies

## 🔑 Step 3: Configure Cloudflare Account

### 3.1 Login to Cloudflare

```bash
npx wrangler login
```

This opens your browser to authenticate with Cloudflare.

### 3.2 Verify Login

```bash
npx wrangler whoami
```

Should show your Cloudflare account email.

## 🗄️ Step 4: Create R2 Bucket (Storage)

R2 stores generated plugin ZIP files and blueprints.

```bash
# Production bucket
npx wrangler r2 bucket create plugin-zip-storage

# Preview/development bucket (optional but recommended)
npx wrangler r2 bucket create plugin-zip-storage-preview
```

**Expected output:**
```
✅ Created bucket 'plugin-zip-storage' with default storage class.
```

## 🔍 Step 5: Create Vectorize Index (RAG Database)

Vectorize stores WordPress best practices for AI context retrieval.

```bash
npx wrangler vectorize create wp-knowledge-index --dimensions=384 --metric=cosine
```

**Parameters explained:**
- `dimensions=384` - Matches Cloudflare's BGE-small embedding model
- `metric=cosine` - Similarity calculation method

**Expected output:**
```
✅ Successfully created index 'wp-knowledge-index'
```

## 🔐 Step 6: Set API Keys

### Google Gemini API Key

```bash
npx wrangler secret put GOOGLE_API_KEY
```

When prompted, paste your Google Gemini API key and press Enter.

**To get your Gemini API key:**
1. Visit https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy the key

**Expected output:**
```
✅ Successfully created secret GOOGLE_API_KEY
```

### Verify Secrets

```bash
npx wrangler secret list
```

Should show `GOOGLE_API_KEY` in the list.

## 🔧 Step 7: Configure wrangler.jsonc (If Needed)

Your `wrangler.jsonc` should look like this:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "wp-ai-generator",  // Change this to your preferred name
  "main": "src/index.ts",
  "compatibility_date": "2025-10-07",
  "observability": {
    "enabled": true
  },

  // Static assets (frontend)
  "assets": {
    "directory": "./public",
    "binding": "ASSETS"
  },

  // R2 bucket binding
  "r2_buckets": [
    {
      "bucket_name": "plugin-zip-storage",
      "binding": "PLUGIN_STORAGE",
      "preview_bucket_name": "plugin-zip-storage-preview"
    }
  ],
  
  // Vectorize index binding
  "vectorize": [
    { 
      "binding": "WP_INDEX", 
      "index_name": "wp-knowledge-index" 
    }
  ],

  // Workers AI binding
  "ai": {
    "binding": "AI"
  }
}
```

**Important:** Change the `"name"` field to your desired worker name (e.g., `"my-plugin-generator"`).

## 🚀 Step 8: Deploy to Production

```bash
npm run deploy
```

Or directly:

```bash
npx wrangler deploy
```

**Expected output:**
```
✨ Built successfully
✨ Uploaded successfully
✨ Deployment complete
🌍 https://wp-ai-generator.your-subdomain.workers.dev
```

**Save this URL!** This is your live application.

## 🗂️ Step 9: Initialize RAG Knowledge Base

After deployment, you must populate the Vectorize index with WordPress best practices.

Visit (replace with your actual worker URL):
```
https://wp-ai-generator.your-subdomain.workers.dev/ingest
```

**Expected response:**
```json
{
  "message": "✅ Vectorize RAG data successfully loaded. X documents indexed.",
  "count": X
}
```

**This is a ONE-TIME operation.** You don't need to run it again unless you update the knowledge base.

## ✅ Step 10: Test Your Deployment

### Test the Frontend

Visit your worker URL:
```
https://wp-ai-generator.your-subdomain.workers.dev
```

You should see the modern plugin generator interface.

### Test Plugin Generation

1. Enter a prompt like: "Create a simple hello world plugin"
2. Click "Generate Plugin"
3. Wait 10-30 seconds
4. You should see:
   - File tree with plugin structure
   - Code preview
   - Download ZIP button
   - Test in Playground button

### Test WordPress Playground Integration

Click "Test in Playground" - this should:
1. Open WordPress Playground in a new tab
2. Automatically install your plugin
3. Activate the plugin
4. Show the WordPress admin

## 🔄 Step 11: Updates and Redeployment

When you make code changes:

```bash
# Test locally first
npm run dev

# Deploy changes
npm run deploy
```

**Note:** You do NOT need to:
- Re-create R2 buckets
- Re-create Vectorize index
- Re-run `/ingest` endpoint
- Re-set API keys

These persist across deployments.

## 🌍 Step 12: Custom Domain (Optional)

### Add Custom Domain

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Go to Settings → Triggers → Custom Domains
5. Click "Add Custom Domain"
6. Enter your domain (e.g., `plugins.yourdomain.com`)
7. Cloudflare automatically configures DNS

### Update URLs

After adding custom domain, update any hardcoded URLs if necessary.

## 🧪 Local Development Setup

### Start Development Server

```bash
npm run dev
```

This starts a local server at `http://localhost:8787`

### Initialize Local RAG

```bash
curl http://localhost:8787/ingest
```

### Test Locally

1. Open http://localhost:8787
2. Generate plugins
3. Changes auto-reload with Wrangler

**Note:** Local development uses:
- Local bindings (simulated R2, Vectorize)
- Remote Workers AI and Gemini API
- Preview R2 bucket (if configured)

## 📊 Monitoring and Logs

### View Real-time Logs

```bash
npx wrangler tail
```

### View Logs in Dashboard

1. Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Click "Logs" tab
4. Real-time streaming logs

### Check Resource Usage

1. Dashboard → Workers & Pages
2. Your worker → Analytics tab
3. Monitor:
   - Requests
   - Errors
   - CPU time
   - R2 operations

## 💰 Cost Breakdown (Free Tier Limits)

| Service | Free Tier | This App Usage |
|---------|-----------|----------------|
| Workers | 100K requests/day | ✅ Well within |
| Workers AI | 10K neurons/day | ✅ Within limit |
| Vectorize | 30M queries/month | ✅ More than enough |
| R2 Storage | 10GB storage | ✅ Plenty for plugins |
| R2 Operations | 1M Class A ops | ✅ Sufficient |

**Estimated cost on free tier: $0/month** 🎉

## 🐛 Troubleshooting

### Error: "Index 'wp-knowledge-index' not found"

**Solution:**
```bash
npx wrangler vectorize create wp-knowledge-index --dimensions=384 --metric=cosine
```

Then visit `/ingest` endpoint.

### Error: "Bucket 'plugin-zip-storage' not found"

**Solution:**
```bash
npx wrangler r2 bucket create plugin-zip-storage
```

### Error: "GOOGLE_API_KEY is not defined"

**Solution:**
```bash
npx wrangler secret put GOOGLE_API_KEY
```

### Error: "Failed to fetch Workers AI"

**Possible causes:**
- Workers AI binding not configured
- Account not activated for Workers AI

**Solution:**
Check `wrangler.jsonc` has:
```jsonc
"ai": {
  "binding": "AI"
}
```

### Plugin Generation Takes Too Long

**Normal:** First request after deployment may take 10-30 seconds.

**If consistently slow:**
- Check Gemini API quota
- Verify network connectivity
- Check Cloudflare Workers dashboard for errors

### WordPress Playground Not Loading Plugin

**Possible causes:**
- Plugin ZIP not publicly accessible
- Blueprint JSON has wrong URL

**Solution:**
- Verify `/download/` endpoint works
- Check CORS headers are set
- Test blueprint URL directly

## 🔐 Security Best Practices

### Protect Sensitive Endpoints

Add authentication to `/ingest` endpoint (one-time use):

```typescript
if (url.pathname === '/ingest') {
  const auth = request.headers.get('Authorization');
  if (auth !== 'Bearer your-secret-token') {
    return new Response('Unauthorized', { status: 401 });
  }
  return ingestData(env);
}
```

### Rate Limiting

Consider adding rate limiting for the `/api/generate` endpoint:

```typescript
// Use Cloudflare Rate Limiting or implement custom logic
```

### Monitor Usage

Regularly check Cloudflare dashboard for:
- Unexpected traffic spikes
- Error rates
- Resource usage

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Cloudflare Vectorize Docs](https://developers.cloudflare.com/vectorize/)
- [WordPress Playground](https://wordpress.github.io/wordpress-playground/)

## 🆘 Getting Help

If you encounter issues:

1. Check troubleshooting section above
2. Review Cloudflare Workers logs (`wrangler tail`)
3. Check browser console for frontend errors
4. Verify all prerequisites are met
5. Ensure API keys are correctly set

---

## ✅ Deployment Checklist

Before going live:

- [ ] Dependencies installed (`npm install`)
- [ ] Logged into Cloudflare (`wrangler login`)
- [ ] R2 bucket created (`plugin-zip-storage`)
- [ ] Vectorize index created (`wp-knowledge-index`)
- [ ] Google Gemini API key set (secret)
- [ ] Worker deployed (`npm run deploy`)
- [ ] RAG initialized (visited `/ingest`)
- [ ] Frontend loads correctly
- [ ] Plugin generation works
- [ ] WordPress Playground integration works
- [ ] Download ZIP works
- [ ] Custom domain added (optional)

**Congratulations! 🎉 Your WordPress Plugin Generator is live!**

