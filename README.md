# WordPress Plugin Generator - AI Powered 🚀

A modern, **Replit/Bolt/Lovable-style** WordPress plugin generator powered by Cloudflare Workers AI and Google Gemini. Generate complete, production-ready WordPress plugins with best practices and test them instantly in WordPress Playground.

![Status](https://img.shields.io/badge/status-production-success)
![Platform](https://img.shields.io/badge/platform-Cloudflare_Workers-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🎯 Complete Plugin Generation
- **Full Directory Structure** - Generates proper WordPress plugin structure with all best practices
- **Multi-File Output** - Main PHP, readme.txt, uninstall.php, CSS, JS, and more
- **Security Built-in** - Automatic sanitization, escaping, nonces, and capability checks
- **WordPress Standards** - Follows [official WordPress plugin guidelines](https://developer.wordpress.org/plugins/)

### 🎨 Modern IDE-Like Interface
- **Split-Screen Editor** - File explorer on left, code preview on right
- **Syntax Highlighting** - Beautiful code highlighting for PHP, CSS, JS
- **File Tree Navigation** - Expandable/collapsible folder structure
- **One-Click Copy** - Copy individual files or entire plugin code

### 🎮 WordPress Playground Integration
- **Instant Testing** - Launch your plugin in WordPress Playground with one click
- **Auto-Configuration** - Automatically creates blueprints for immediate testing
- **Pre-Activated** - Plugin is installed and activated automatically
- **Live Demo** - Share playground links with clients or users

### 🔧 Plugin Structure Generated

```
your-plugin-name/
├── your-plugin-name.php       # Main plugin file with all logic
├── readme.txt                 # WordPress.org standard readme
├── README.md                  # Developer documentation
├── uninstall.php              # Clean uninstall script
├── LICENSE.txt                # GPL v2 license
├── .gitignore                 # Git ignore rules
│
├── admin/                     # Admin interface files
│   ├── css/
│   │   └── admin-style.css    # Admin styling
│   ├── js/
│   │   └── admin-script.js    # Admin JavaScript
│   └── index.php              # Security file
│
└── assets/                    # Frontend files
    ├── css/
    │   └── frontend-style.css # Frontend styling
    ├── js/
    │   └── frontend-script.js # Frontend JavaScript
    └── index.php              # Security file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Cloudflare account (free tier works!)
- Google Gemini API key (free tier works!)
- Wrangler CLI installed

### 1. Install Dependencies

```bash
cd wp-ai-generator
npm install
```

### 2. Set Up Cloudflare Resources

```bash
# Create R2 bucket for plugin storage
npx wrangler r2 bucket create plugin-zip-storage

# Create Vectorize index for RAG
npx wrangler vectorize create wp-knowledge-index --dimensions=384 --metric=cosine

# Set Google Gemini API key as secret
npx wrangler secret put GOOGLE_API_KEY
# Paste your Gemini API key when prompted
```

### 3. Deploy to Cloudflare Workers

```bash
npm run deploy
```

### 4. Initialize the RAG Knowledge Base

After deployment, visit:
```
https://your-worker.workers.dev/ingest
```

This loads WordPress best practices into the Vectorize index (one-time setup).

### 5. Start Generating Plugins! 🎉

Visit your worker URL and start describing plugins!

## 💻 Local Development

```bash
# Start local development server
npm run dev

# Open browser to http://localhost:8787

# Initialize RAG (only needed once)
curl http://localhost:8787/ingest
```

## 📖 How to Use

### 1. Describe Your Plugin

In the text area, describe what you want your plugin to do:

**Examples:**
- "Create a WooCommerce extension that adds a custom checkout field for gift messages"
- "Build a contact form plugin with email notifications and spam protection"
- "Create a custom post type for testimonials with star ratings"

### 2. Generate Plugin

Click **"Generate Plugin"** and wait 10-30 seconds while the AI creates your complete plugin structure.

### 3. Review Code

- Browse the file tree on the right
- Click any file to view its contents with syntax highlighting
- Review the generated code for quality

### 4. Test in Playground

Click **"Test in Playground"** to instantly launch a WordPress instance with your plugin pre-installed and activated!

### 5. Download & Use

Click **"Download ZIP"** to get your complete plugin package, ready to upload to WordPress.

## 🎯 API Endpoints

### `POST /api/generate`
Generates a complete WordPress plugin structure.

**Request:**
```json
{
  "prompt": "Create a simple analytics plugin that tracks page views"
}
```

**Response:**
```json
{
  "success": true,
  "pluginName": "Simple Analytics Plugin",
  "pluginSlug": "simple-analytics-plugin",
  "files": [
    {
      "path": "simple-analytics-plugin.php",
      "content": "<?php ...",
      "type": "php"
    },
    ...
  ],
  "downloadUrl": "/download/simple-analytics-plugin.zip",
  "playgroundUrl": "https://playground.wordpress.net/?blueprint-url=...",
  "blueprintUrl": "/download/simple-analytics-plugin-blueprint.json"
}
```

### `GET /download/{filename}`
Downloads generated plugin ZIP or blueprint JSON.

### `GET /playground/{plugin-slug}`
Redirects to WordPress Playground with the plugin pre-installed.

### `GET /ingest`
One-time initialization endpoint to populate the RAG knowledge base.

## 🔧 Configuration

### WordPress Playground Settings

Edit `src/blueprintGenerator.ts` to customize:
- PHP version (default: 8.2)
- WordPress version (default: latest)
- Landing page (default: /wp-admin/plugins.php)
- Additional setup steps

### AI Model Configuration

Edit `src/index.ts` to modify:
- Embedding model (Workers AI)
- Generation model (Google Gemini)
- RAG context depth
- Prompt templates

## 📁 Project Structure

```
wp-ai-generator/
├── src/
│   ├── index.ts                      # Main worker logic
│   ├── pluginStructureGenerator.ts   # Multi-file plugin generator
│   ├── blueprintGenerator.ts         # WordPress Playground blueprints
│   ├── types.ts                      # TypeScript type definitions
│   └── wp_docs_content.js            # WordPress best practices RAG data
│
├── public/
│   ├── index.html                    # Modern UI interface
│   ├── app.js                        # Frontend logic
│   └── style.css                     # Modern IDE-like styling
│
├── wrangler.jsonc                    # Cloudflare Workers configuration
├── package.json                      # Dependencies
└── README.md                         # This file
```

## 🎨 Customization

### Modify Plugin Prompts

Edit the prompt template in `src/index.ts` (line ~88) to change how plugins are generated:

```typescript
const fullPrompt = `You are a world-class WordPress PHP developer...`;
```

### Add Custom File Types

Extend `src/pluginStructureGenerator.ts` to generate additional files:

```typescript
files.push({
  path: 'includes/custom-file.php',
  content: generateCustomFile(),
  type: 'php'
});
```

### Customize UI Theme

Modify color variables in `public/style.css`:

```css
:root {
    --primary-color: #2271b1;  /* Change primary color */
    --bg-dark: #1e1e1e;        /* Change code editor background */
}
```

## 🔒 Security Features

All generated plugins include:
- ✅ Input sanitization (`sanitize_text_field()`, etc.)
- ✅ Output escaping (`esc_html()`, `esc_attr()`, etc.)
- ✅ Nonce verification for forms
- ✅ Capability checks (`current_user_can()`)
- ✅ Prepared database queries (`$wpdb->prepare()`)
- ✅ Direct access prevention (`ABSPATH` check)

## 🌟 WordPress Best Practices

Generated plugins follow:
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- [Plugin Security Guidelines](https://developer.wordpress.org/plugins/security/)
- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- Proper hook usage (actions & filters)
- Translation-ready code
- Uninstall cleanup

## 🚀 Performance

- **RAG-Enhanced Generation** - Retrieves relevant WordPress best practices for context
- **Cloudflare Edge Network** - Deploy globally with low latency
- **Free Tier Compatible** - Runs entirely on Cloudflare free tier
- **Efficient Caching** - R2 storage for generated plugins

## 🐛 Troubleshooting

### "Vectorize index not found"
Run the ingestion endpoint: `https://your-worker.workers.dev/ingest`

### "Gemini API key missing"
Set the secret: `npx wrangler secret put GOOGLE_API_KEY`

### "R2 bucket not found"
Create bucket: `npx wrangler r2 bucket create plugin-zip-storage`

### Plugin doesn't work in WordPress
- Check WordPress version compatibility
- Review PHP error logs
- Verify plugin follows WordPress standards

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional WordPress best practices in RAG data
- More plugin templates
- Enhanced error handling
- Additional file types (images, fonts, etc.)
- Multi-language support

## 📝 License

This project is licensed under the MIT License. Generated plugins use GPL v2 (WordPress standard).

## 🔗 Resources

- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- [WordPress Playground](https://wordpress.github.io/wordpress-playground/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Google Gemini](https://ai.google.dev/)

## 💡 Credits

Built with:
- **Cloudflare Workers** - Serverless platform
- **Cloudflare Workers AI** - Embeddings (RAG)
- **Google Gemini** - Code generation
- **Cloudflare Vectorize** - Vector database
- **Cloudflare R2** - Object storage
- **WordPress Playground** - Instant testing

---

**Made with ❤️ for the WordPress community**
