# 🚀 Quick Reference Cheat Sheet

## ⚡ Setup Commands

```bash
# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Create R2 bucket
npx wrangler r2 bucket create plugin-zip-storage

# Create Vectorize index
npx wrangler vectorize create wp-knowledge-index --dimensions=384 --metric=cosine

# Set Google Gemini API key
npx wrangler secret put GOOGLE_API_KEY

# Deploy to production
npm run deploy

# Initialize RAG (visit in browser)
https://your-worker.workers.dev/ingest
```

---

## 🧑‍💻 Development Commands

```bash
# Start local dev server
npm run dev                  # Opens http://localhost:8787

# Deploy to production
npm run deploy

# Watch logs (real-time)
npx wrangler tail

# Generate TypeScript types
npm run cf-typegen
```

---

## 📝 Example Prompts

### Simple Plugins
```
Create a hello world plugin
Create a plugin that adds a custom dashboard widget
Build a simple maintenance mode plugin
```

### Shortcode Plugins
```
Create a plugin with a shortcode that displays recent posts
Build a testimonials slider shortcode plugin
Create a pricing table shortcode plugin
```

### Custom Post Types
```
Create a plugin that adds a "Portfolio" custom post type
Build a "Team Members" custom post type plugin
Create an "Events" post type with custom fields
```

### WooCommerce
```
Create a WooCommerce plugin that adds a gift message field
Build a WooCommerce extension for bulk discounts
Create a plugin that adds custom product tabs
```

### Admin Tools
```
Build a plugin that adds custom admin columns
Create a plugin with admin settings page
Build a bulk user management plugin
```

### Forms
```
Create a simple contact form plugin
Build a newsletter subscription form
Create a multi-step registration form plugin
```

---

## 🌐 API Endpoints

```
GET  /                    → Frontend UI
GET  /ingest             → Initialize RAG (one-time)
POST /api/generate       → Generate plugin
GET  /download/{file}    → Download ZIP or blueprint
GET  /playground/{slug}  → Launch in Playground
```

---

## 📂 Generated File Structure

```
your-plugin-slug/
├── your-plugin-slug.php       # Main plugin file
├── readme.txt                 # WP.org readme
├── README.md                  # Developer docs
├── uninstall.php              # Cleanup script
├── LICENSE.txt                # GPL v2
├── .gitignore                 # Git ignore
│
├── admin/                     # Admin files (if needed)
│   ├── css/
│   │   └── admin-style.css
│   ├── js/
│   │   └── admin-script.js
│   └── index.php              # Security
│
└── assets/                    # Frontend files (if needed)
    ├── css/
    │   └── frontend-style.css
    ├── js/
    │   └── frontend-script.js
    └── index.php              # Security
```

---

## 🎮 WordPress Playground URLs

```bash
# Method 1: Use "Test in Playground" button in UI
# Method 2: Direct URL
https://your-worker.workers.dev/playground/plugin-slug

# Method 3: Custom blueprint URL
https://playground.wordpress.net/?blueprint-url=https://your-worker.workers.dev/download/plugin-slug-blueprint.json
```

---

## 🐛 Troubleshooting

### Error: "Index 'wp-knowledge-index' not found"
```bash
npx wrangler vectorize create wp-knowledge-index --dimensions=384 --metric=cosine
# Then visit: /ingest
```

### Error: "Bucket 'plugin-zip-storage' not found"
```bash
npx wrangler r2 bucket create plugin-zip-storage
```

### Error: "GOOGLE_API_KEY is not defined"
```bash
npx wrangler secret put GOOGLE_API_KEY
# Paste your key when prompted
```

### Generation taking too long
- Normal: 10-30 seconds for first request
- Check Gemini API quota
- View logs: `npx wrangler tail`

### Playground not loading plugin
- Verify `/download/` endpoint works
- Check blueprint JSON is valid
- Ensure CORS headers present

---

## 📊 Resource Limits (Free Tier)

| Resource | Free Tier Limit | Typical Usage |
|----------|----------------|---------------|
| Workers Requests | 100K/day | ✅ Plenty |
| Workers AI Neurons | 10K/day | ✅ Sufficient |
| Vectorize Queries | 30M/month | ✅ More than enough |
| R2 Storage | 10GB | ✅ Thousands of plugins |
| R2 Operations | 1M Class A/mo | ✅ Sufficient |

---

## 🎨 UI Features

### Left Panel (Generator)
- ✅ Prompt textarea
- ✅ Generate button
- ✅ Status messages
- ✅ Download ZIP button
- ✅ Test in Playground button
- ✅ Copy all code button

### Right Panel (Preview)
- ✅ File tree (expandable/collapsible)
- ✅ Click file to view
- ✅ Syntax-highlighted code
- ✅ Copy file content
- ✅ File type icons
- ✅ Active file highlighting

---

## 🔒 Security Features (Auto-Included)

```php
// ✅ Direct access prevention
if (!defined('ABSPATH')) exit;

// ✅ Nonce verification
wp_verify_nonce($_POST['nonce'], 'action_name');

// ✅ Capability checks
current_user_can('manage_options');

// ✅ Input sanitization
sanitize_text_field($input);
sanitize_email($email);
sanitize_textarea_field($text);

// ✅ Output escaping
esc_html($text);
esc_attr($attribute);
esc_url($url);

// ✅ SQL injection prevention
$wpdb->prepare("SELECT * FROM table WHERE id = %d", $id);
```

---

## 📱 Keyboard Shortcuts (in UI)

- `Ctrl/Cmd + Enter` - Submit form
- `Ctrl/Cmd + C` - Copy (when file selected)
- `Escape` - Close modals/overlays
- `Arrow Up/Down` - Navigate file tree (future)

---

## 🔗 Important URLs

```
Production Worker:
https://your-worker.your-subdomain.workers.dev

Local Development:
http://localhost:8787

Cloudflare Dashboard:
https://dash.cloudflare.com

Google Gemini API:
https://aistudio.google.com/app/apikey

WordPress Playground:
https://playground.wordpress.net
```

---

## 📚 Documentation Files

- `README.md` - Complete overview
- `QUICK_START.md` - 5-minute setup guide
- `DEPLOYMENT_GUIDE.md` - Detailed deployment
- `FEATURES.md` - All features explained
- `ARCHITECTURE.md` - Technical details
- `COMPARISON.md` - vs Replit/Bolt/Lovable
- `PROJECT_SUMMARY.md` - What was built
- `CHEAT_SHEET.md` - This file

---

## 🎯 Best Practices

### Writing Prompts
```
❌ Bad:  "contact form"
✅ Good: "Create a contact form plugin with email notifications, 
         spam protection using nonces, and admin settings page"

❌ Bad:  "add feature"
✅ Good: "Create a WooCommerce extension that adds a custom 
         checkout field for delivery instructions with validation"
```

### Testing Plugins
1. Generate plugin
2. Review code in preview
3. Click "Test in Playground"
4. Test functionality in live WordPress
5. Download ZIP if satisfied
6. Upload to your WordPress site

---

## 💡 Pro Tips

1. **Be Specific** - More details = better plugin
2. **Mention Admin Settings** - If you need a settings page
3. **Specify Shortcodes** - If you want shortcode functionality
4. **Include Security Needs** - Mention user roles/capabilities
5. **Test Immediately** - Use Playground before downloading
6. **Review Code** - Always review generated code
7. **Customize Further** - Use as starting point, customize as needed

---

## 🎊 Quick Win Workflow

```
1. npm install && npm run deploy
2. Visit /ingest to initialize
3. Open your worker URL
4. Enter: "Create a simple FAQ plugin"
5. Click "Generate Plugin"
6. Wait 30 seconds
7. Click "Test in Playground"
8. See it working in WordPress!
9. Download ZIP
10. Upload to your site
✅ Done!
```

---

## 📞 Getting Help

**Check Logs:**
```bash
npx wrangler tail
```

**Verify Resources:**
```bash
npx wrangler r2 bucket list
npx wrangler vectorize list
npx wrangler secret list
```

**Common Issues:**
- Resources not created → Run create commands
- API key missing → Set secret
- RAG not initialized → Visit /ingest
- Generation fails → Check logs

---

**🚀 Happy Plugin Generating!**

