# 🏗️ Architecture Overview

Complete technical architecture of the WordPress Plugin Generator.

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  Modern IDE-like Web App (HTML/CSS/JS + Highlight.js)         │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS Request
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  index.ts (Main Router)                                  │  │
│  │  - Routes API requests                                   │  │
│  │  - Serves static assets                                  │  │
│  │  - Handles downloads                                     │  │
│  │  - Playground redirects                                  │  │
│  └───────────┬──────────────────────────────────────────────┘  │
│              │                                                   │
│  ┌───────────▼──────────────────────────────────────────────┐  │
│  │  /api/generate Endpoint                                  │  │
│  │  1. Receive user prompt                                  │  │
│  │  2. Embed query (Workers AI)                             │  │
│  │  3. Retrieve context (Vectorize)                         │  │
│  │  4. Generate code (Gemini)                               │  │
│  │  5. Build plugin structure                               │  │
│  │  6. Create blueprint                                     │  │
│  │  7. Store in R2                                          │  │
│  │  8. Return response                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │              │              │              │
           │              │              │              │
           ▼              ▼              ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Workers  │  │Vectorize │  │  Gemini  │  │    R2    │
    │   AI     │  │  Index   │  │   API    │  │  Bucket  │
    │          │  │          │  │          │  │          │
    │Embeddings│  │   RAG    │  │   Code   │  │ Storage  │
    │  Model   │  │ Database │  │Generation│  │ZIP/JSON  │
    └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## 🔄 Request Flow

### 1️⃣ Plugin Generation Flow

```
User Input
    ↓
[1] POST /api/generate with prompt
    ↓
[2] Worker receives request
    ↓
[3] Embed user prompt using Workers AI
    │   Model: @cf/baai/bge-small-en-v1.5
    │   Output: 384-dimensional vector
    ↓
[4] Query Vectorize with embedding
    │   Retrieve: Top 3 relevant documents
    │   Context: WordPress best practices
    ↓
[5] Build enhanced prompt
    │   User prompt + Retrieved context + Instructions
    ↓
[6] Call Google Gemini API
    │   Model: gemini-2.0-flash-exp
    │   Generate: Main plugin PHP code
    ↓
[7] Generate plugin structure (pluginStructureGenerator.ts)
    │   - Parse generated code
    │   - Create all necessary files
    │   - Add documentation
    │   - Generate assets
    ↓
[8] Create ZIP package (JSZip)
    │   - Organize files in proper structure
    │   - Generate ArrayBuffer
    ↓
[9] Store in R2 bucket
    │   - Plugin ZIP file
    │   - Playground blueprint JSON
    ↓
[10] Generate playground blueprint
    │    - Plugin URL
    │    - WordPress config
    │    - Installation steps
    ↓
[11] Return response to frontend
    │    - Plugin files
    │    - Download URL
    │    - Playground URL
    │    - Blueprint URL
    ↓
[12] Frontend displays results
    │    - File tree
    │    - Code preview
    │    - Action buttons
```

---

## 🧩 Component Details

### Frontend Layer

**Files:**
- `public/index.html` - Modern UI structure
- `public/app.js` - Interactive functionality
- `public/style.css` - IDE-like styling

**Features:**
- Split-screen layout
- Interactive file tree with collapse/expand
- Syntax-highlighted code preview
- Copy to clipboard functionality
- Responsive design
- Real-time status updates

**Libraries:**
- Highlight.js - Syntax highlighting
- Native Fetch API - HTTP requests
- Native DOM API - UI manipulation

---

### Worker Layer (Backend)

#### Main Router (`src/index.ts`)

**Routes:**
```typescript
GET  /                    → Serve frontend (static assets)
GET  /ingest             → Initialize RAG knowledge base
POST /api/generate       → Generate plugin
GET  /download/{file}    → Download ZIP or blueprint
GET  /playground/{slug}  → Redirect to Playground
```

**Bindings:**
```typescript
interface Env {
  AI: any;                    // Workers AI binding
  WP_INDEX: VectorizeIndex;   // Vectorize binding
  PLUGIN_STORAGE: R2Bucket;   // R2 bucket binding
  ASSETS: { fetch() };        // Static assets binding
  GOOGLE_API_KEY: string;     // Secret binding
}
```

#### Plugin Structure Generator (`src/pluginStructureGenerator.ts`)

**Responsibilities:**
1. Parse generated main PHP code
2. Extract metadata (name, version, description)
3. Generate complementary files:
   - `readme.txt` (WordPress.org standard)
   - `README.md` (developer docs)
   - `uninstall.php` (cleanup script)
   - `LICENSE.txt` (GPL v2)
   - Admin CSS/JS (if admin interface detected)
   - Frontend CSS/JS (if frontend functionality detected)
   - Security `index.php` files
   - `.gitignore`

**Detection Logic:**
```typescript
if (code.includes('add_menu_page'))     → Generate admin files
if (code.includes('add_shortcode'))     → Generate frontend files
if (code.includes('wp_enqueue_style'))  → Create asset directories
```

#### Blueprint Generator (`src/blueprintGenerator.ts`)

**Purpose:** Create WordPress Playground configuration

**Blueprint Structure:**
```json
{
  "$schema": "https://playground.wordpress.net/blueprint-schema.json",
  "landingPage": "/wp-admin/plugins.php",
  "preferredVersions": {
    "php": "8.2",
    "wp": "latest"
  },
  "steps": [
    { "step": "login", ... },
    { "step": "installPlugin", ... },
    { "step": "setSiteOptions", ... }
  ]
}
```

**Functions:**
- `generatePlaygroundBlueprint()` - Basic blueprint
- `generateAdvancedBlueprint()` - With demo content
- `generateQuickTestBlueprint()` - Minimal setup
- `generatePlaygroundUrl()` - URL from blueprint
- `generatePlaygroundUrlFromHosted()` - URL from hosted blueprint

---

## 💾 Data Storage

### R2 Bucket Structure

```
plugin-zip-storage/
├── plugin-slug-1.zip                    # Plugin package
├── plugin-slug-1-blueprint.json         # Playground config
├── plugin-slug-2.zip
├── plugin-slug-2-blueprint.json
└── ...
```

**Storage Features:**
- No egress fees (free bandwidth)
- S3-compatible API
- Automatic CDN distribution
- CORS enabled for Playground access

### Vectorize Index Structure

```
wp-knowledge-index (384 dimensions, cosine similarity)
├── Vector: wp-doc-0
│   ├── Values: [0.123, 0.456, ...]
│   └── Metadata: { text: "WordPress best practice..." }
├── Vector: wp-doc-1
│   ├── Values: [0.789, 0.012, ...]
│   └── Metadata: { text: "Security guideline..." }
└── ...
```

**Indexing Process:**
1. WordPress documentation chunks stored in `wp_docs_content.js`
2. Each chunk embedded using Workers AI
3. Vectors stored in Vectorize with original text as metadata
4. Query-time: User prompt embedded → Similar vectors retrieved

---

## 🔐 Security Architecture

### Input Layer
```
User Input → Sanitization → Validation → Processing
```

**Frontend:**
- HTML escaping for display
- XSS prevention
- Input validation

**Backend:**
- Request validation
- Rate limiting (configurable)
- CORS configuration
- Secret management (Cloudflare Secrets)

### Generated Code Security

**Automatic Inclusion:**
```php
// Direct access prevention
if (!defined('ABSPATH')) exit;

// Nonce verification
wp_verify_nonce($nonce, $action);

// Capability checks
current_user_can('manage_options');

// Input sanitization
sanitize_text_field($input);
sanitize_email($email);

// Output escaping
esc_html($output);
esc_attr($attribute);
esc_url($url);

// SQL injection prevention
$wpdb->prepare($query, $params);
```

---

## 🚀 Deployment Architecture

### Development Environment

```
Local Machine
    ↓
npm run dev
    ↓
Wrangler Dev Server (localhost:8787)
    ├── Local bindings (simulated)
    ├── Remote AI/Gemini API
    └── Hot reload enabled
```

### Production Environment

```
Git Push / CLI Deploy
    ↓
wrangler deploy
    ↓
Cloudflare Edge Network (275+ locations)
    ├── Automatic SSL/TLS
    ├── DDoS protection
    ├── CDN distribution
    └── Global routing
```

---

## 📊 Performance Characteristics

### Latency Breakdown

| Operation | Time | Notes |
|-----------|------|-------|
| Static asset serving | < 10ms | Edge cache |
| Embedding generation | ~100ms | Workers AI |
| Vectorize query | ~50ms | Vector search |
| Gemini API call | 5-20s | Code generation |
| ZIP creation | ~200ms | JSZip processing |
| R2 storage | ~100ms | Object upload |
| **Total (typical)** | **6-21s** | User-perceived |

### Scalability

**Horizontal Scaling:**
- Workers: Automatic, unlimited instances
- Vectorize: Distributed query processing
- R2: Global object replication
- Edge network: 275+ locations

**Limits (Free Tier):**
- Workers: 100K requests/day
- Workers AI: 10K neurons/day
- Vectorize: 30M queries/month
- R2: 10GB storage, 1M Class A operations

---

## 🔄 Data Flow Diagrams

### RAG Pipeline

```
┌──────────────┐
│ User Prompt  │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Workers AI Embed    │  @cf/baai/bge-small-en-v1.5
│ Input: Text         │
│ Output: [384d vec]  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Vectorize Query     │  Cosine similarity search
│ Input: Vector       │
│ Output: Top K docs  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Context Assembly    │  Combine retrieved docs
│ + User prompt       │
│ + System prompt     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Gemini Generation   │  gemini-2.0-flash-exp
│ Input: Full prompt  │
│ Output: PHP code    │
└─────────────────────┘
```

### File Generation Pipeline

```
┌──────────────────┐
│ Generated PHP    │
└────────┬─────────┘
         │
         ▼
┌────────────────────────┐
│ Metadata Extraction    │
│ - Plugin name          │
│ - Version              │
│ - Description          │
│ - Author               │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Feature Detection      │
│ - Has admin menu?      │
│ - Has shortcode?       │
│ - Needs assets?        │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ File Generation        │
│ ├─ Main PHP            │
│ ├─ readme.txt          │
│ ├─ uninstall.php       │
│ ├─ LICENSE.txt         │
│ ├─ Admin CSS/JS        │
│ ├─ Frontend CSS/JS     │
│ └─ Documentation       │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ ZIP Package Assembly   │
│ plugin-slug/           │
│   ├─ files...          │
│   └─ subdirs/          │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ R2 Storage             │
│ + Blueprint JSON       │
└────────────────────────┘
```

---

## 🎯 Design Decisions

### Why Cloudflare Workers?

✅ **Global edge deployment**
✅ **No server management**
✅ **Generous free tier**
✅ **Integrated AI/storage services**
✅ **Automatic scaling**
✅ **Built-in security**

### Why Google Gemini + Workers AI?

**Workers AI (Embeddings):**
- Free and fast
- Integrated with Cloudflare
- No external API calls for embeddings
- Low latency

**Google Gemini (Generation):**
- Superior code generation quality
- Better WordPress understanding
- Larger context window
- Free tier generous enough

### Why RAG (Vectorize)?

Without RAG:
- Generic code output
- Missing WordPress specifics
- Security vulnerabilities
- Non-standard patterns

With RAG:
- WordPress-aware generation
- Best practices automatically included
- Security built-in
- Professional code quality

---

## 🔧 Configuration Files

### `wrangler.jsonc`
```jsonc
{
  "name": "wp-ai-generator",
  "main": "src/index.ts",
  "compatibility_date": "2025-10-07",
  
  "assets": {
    "directory": "./public",
    "binding": "ASSETS"
  },
  
  "r2_buckets": [...],
  "vectorize": [...],
  "ai": { "binding": "AI" }
}
```

### `tsconfig.json`
TypeScript configuration for Workers environment

### `package.json`
Dependencies and scripts

---

## 📈 Future Architecture Considerations

**Potential Enhancements:**

1. **Caching Layer**
   - Cache generated plugins for duplicate requests
   - Use Workers KV for blueprint caching

2. **Analytics**
   - Track popular plugin types
   - Monitor generation success rates
   - User behavior analytics

3. **Advanced RAG**
   - Multiple Vectorize indexes (security, UI, WooCommerce)
   - Dynamic index selection based on prompt
   - Hybrid search (semantic + keyword)

4. **Code Quality**
   - Post-generation linting
   - Security scanning
   - Performance analysis

5. **Version Control**
   - Plugin versioning
   - Change tracking
   - Update mechanism

---

**Built with modern edge computing architecture for maximum performance and scalability! 🚀**

