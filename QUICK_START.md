# ⚡ Quick Start Guide

Get your WordPress Plugin Generator running in **5 minutes**!

## 🎯 Prerequisites (2 minutes)

1. **Node.js 18+** installed → [Download](https://nodejs.org/)
2. **Cloudflare account** (free) → [Sign up](https://dash.cloudflare.com/sign-up)
3. **Google Gemini API key** (free) → [Get key](https://aistudio.google.com/app/apikey)

## 🚀 Installation (3 minutes)

### Step 1: Install Dependencies

```bash
cd wp-ai-generator
npm install
```

### Step 2: Login to Cloudflare

```bash
npx wrangler login
```

### Step 3: Create Resources

```bash
# Create R2 bucket (storage)
npx wrangler r2 bucket create plugin-zip-storage

# Create Vectorize index (RAG database)
npx wrangler vectorize create wp-knowledge-index --dimensions=384 --metric=cosine

# Set Gemini API key
npx wrangler secret put GOOGLE_API_KEY
# (paste your key when prompted)
```

### Step 4: Deploy

```bash
npm run deploy
```

You'll get a URL like: `https://wp-ai-generator.your-subdomain.workers.dev`

### Step 5: Initialize RAG (One-Time)

Visit: `https://your-worker-url.workers.dev/ingest`

You should see: `✅ Vectorize RAG data successfully loaded`

## ✅ You're Done! 

Visit your worker URL and start generating WordPress plugins!

---

## 🧪 Local Development (Optional)

### Start Dev Server

```bash
npm run dev
```

Open: `http://localhost:8787`

### Initialize Local RAG

```bash
npm run ingest
```

---

## 📝 Quick Test

### 1. Visit Your URL

Open your deployed worker URL in browser

### 2. Enter a Prompt

```
Create a simple contact form plugin with email notifications
```

### 3. Click "Generate Plugin"

Wait 10-30 seconds...

### 4. Explore Results

- Browse file tree
- View generated code
- Click "Test in Playground"
- Download ZIP

---

## 🎉 Example Prompts to Try

**Simple Plugins:**
```
Create a hello world plugin that adds a widget
```

**WooCommerce:**
```
Build a WooCommerce extension that adds a gift message field at checkout
```

**Shortcodes:**
```
Create a plugin with a shortcode that displays recent posts in a grid
```

**Admin Tools:**
```
Build a plugin that adds a custom dashboard widget showing site statistics
```

**Custom Post Types:**
```
Create a plugin that adds a "Testimonials" post type with star ratings
```

---

## 🐛 Common Issues

### "Index not found"
```bash
npx wrangler vectorize create wp-knowledge-index --dimensions=384 --metric=cosine
```
Then visit `/ingest` endpoint

### "Bucket not found"
```bash
npx wrangler r2 bucket create plugin-zip-storage
```

### "API key not found"
```bash
npx wrangler secret put GOOGLE_API_KEY
```

---

## 📚 Next Steps

- Read [FEATURES.md](./FEATURES.md) for full capabilities
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed setup
- Review [README.md](./README.md) for complete documentation

---

## 🆘 Need Help?

1. Check logs: `npx wrangler tail`
2. Verify resources in Cloudflare Dashboard
3. Review browser console for errors
4. Ensure all prerequisites are met

---

**🎊 Happy Plugin Generating!**

Built with ❤️ using Cloudflare Workers + Google Gemini

