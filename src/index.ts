// D:\cloudflare_worker_app\wp-ai-generator\src\index.ts

import JSZip from 'jszip'; 
import { WP_DOCS } from './wp_docs_content.js'; 
import { generatePluginStructure, PluginStructure } from './pluginStructureGenerator';
import { 
  generatePlaygroundBlueprint, 
  generatePlaygroundUrlFromHosted 
} from './blueprintGenerator';

// --- BINDING INTERFACE (Matches your wrangler.jsonc bindings) ---
interface Env {
  AI: any; 
  WP_INDEX: VectorizeIndex; 
  PLUGIN_STORAGE: R2Bucket; 
  ASSETS: { fetch: (request: Request) => Promise<Response> }; 
  GOOGLE_API_KEY: string; // Google Gemini API Key (stored as secret)
}

// --- AI MODEL CONFIG ---
const EMBEDDING_MODEL = '@cf/baai/bge-small-en-v1.5'; // Still using Workers AI for embeddings (free & fast)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// --- Helper: Creates a ZIP file from plugin structure ---
async function createPluginZipBuffer(pluginStructure: PluginStructure): Promise<ArrayBuffer> {
    const zip = new JSZip();
    const pluginFolder = zip.folder(pluginStructure.pluginSlug);
    
    if (!pluginFolder) {
        throw new Error('Failed to create plugin folder in ZIP');
    }
    
    // Add all files to the ZIP with proper directory structure
    for (const file of pluginStructure.files) {
        pluginFolder.file(file.path, file.content);
    }
    
    return zip.generateAsync({ type: "arraybuffer" });
}

// --- INGESTION FUNCTION (Populates Vectorize RAG index) ---
async function ingestData(env: Env): Promise<Response> {
    try {
        // Generate embeddings and insert into Vectorize
        const vectors = [];
        
        for (let i = 0; i < WP_DOCS.length; i++) {
            const doc = WP_DOCS[i];
            
            // Generate embedding for this document
            const embeddingResponse = await env.AI.run(EMBEDDING_MODEL, { text: doc });
            
            vectors.push({
                id: `wp-doc-${i}`,
                values: embeddingResponse.data[0],
                metadata: { text: doc }
            });
        }
        
        // Insert all vectors into the Vectorize index
        await env.WP_INDEX.upsert(vectors);
        
        return new Response(JSON.stringify({ 
            message: `✅ Vectorize RAG data successfully loaded. ${WP_DOCS.length} documents indexed.`,
            count: WP_DOCS.length
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        
    } catch (error: any) {
        console.error("Ingestion error:", error);
        return new Response(JSON.stringify({ 
            error: "Failed to ingest data",
            message: error.message 
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}


// --- MAIN API HANDLER (Processes POST request from Frontend) ---
async function handleGenerate(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method Not Allowed. Use POST." }), { status: 405 });
    }
    
    try {
      const body = await request.json() as { prompt?: string };
      const prompt = body.prompt;

      if (!prompt) {
        return new Response(JSON.stringify({ error: "Missing 'prompt' in request body." }), { status: 400 });
      }

      // 1. RAG Retrieval (Context Lookup)
      const queryEmbeddingResponse = await env.AI.run(EMBEDDING_MODEL, { text: prompt });
      const searchResults = await env.WP_INDEX.query(queryEmbeddingResponse.data[0], { topK: 3 });
      
      // Extract context with defensive coding
      const context = searchResults.matches
        .filter(match => match.metadata && match.metadata.text)
        .map(match => match.metadata.text)
        .join('\n---\n');

      // 2. Generate Code using Google Gemini
      const fullPrompt = `You are a world-class WordPress PHP developer with 10+ years of experience. Create a professional, production-ready WordPress plugin.

WORDPRESS BEST PRACTICES CONTEXT:
${context}

USER REQUEST: ${prompt}

PLUGIN STRUCTURE REQUIREMENTS:

1. HEADER BLOCK (Required):
   - Start with <?php
   - Add comprehensive plugin header with: Plugin Name, Plugin URI, Description, Version, Author, Author URI, License, Text Domain, Domain Path
   - Include "Prevent direct access" check: if (!defined('ABSPATH')) exit;

2. USAGE DOCUMENTATION (Critical - At Top After Header):
   Add a detailed comment block explaining:
   /**
    * HOW TO USE THIS PLUGIN:
    * 
    * [If using shortcodes] Add shortcode documentation:
    * - Shortcode: [shortcode_name]
    * - Example: [shortcode_name attribute="value"]
    * - Available attributes: list all attributes with descriptions
    * 
    * [If has admin settings] Admin menu location:
    * - Navigate to: WordPress Admin > Menu Location > Plugin Name
    * 
    * [If has widgets] Widget information:
    * - Go to: Appearance > Widgets > Find "Widget Name"
    * 
    * [If extends WooCommerce/other plugins] Requirements:
    * - Required plugins: List dependencies
    * 
    * INSTALLATION:
    * 1. Upload the plugin folder to /wp-content/plugins/
    * 2. Activate through WordPress admin
    * 3. [Any additional setup steps]
    */

3. CODE ORGANIZATION:
   - Define constants for plugin paths and URLs (use __FILE__, plugin_dir_path(), plugin_dir_url())
   - Group related functions together with section comments
   - Use proper function prefixes to avoid conflicts (e.g., pluginname_function())
   - Add PHPDoc comments for all functions explaining parameters and return values

4. SECURITY BEST PRACTICES (Mandatory):
   - Sanitize ALL user inputs: sanitize_text_field(), sanitize_email(), sanitize_textarea_field()
   - Escape ALL outputs: esc_html(), esc_attr(), esc_url(), wp_kses_post()
   - Use nonces for forms: wp_nonce_field() and wp_verify_nonce()
   - Check user capabilities: current_user_can('manage_options')
   - Prepare database queries: $wpdb->prepare()
   - Validate and sanitize AJAX requests

5. STANDARD WORDPRESS HOOKS:
   - Activation: register_activation_hook()
   - Deactivation: register_deactivation_hook()
   - Use appropriate action hooks: init, admin_menu, admin_enqueue_scripts, wp_enqueue_scripts
   - Use appropriate filter hooks where needed

6. ADMIN INTERFACE (If Applicable):
   - Create settings page with add_menu_page() or add_submenu_page()
   - Use Settings API for options (register_setting(), add_settings_section(), add_settings_field())
   - Display admin notices for user feedback
   - Include clear instructions on the settings page

7. SHORTCODES (If Applicable):
   - Register with add_shortcode()
   - Document shortcode name and all attributes clearly
   - Use shortcode_atts() for default values
   - Return content (don't echo) from shortcode functions
   - Add usage examples in comments

8. FRONTEND DISPLAY (If Applicable):
   - Enqueue CSS/JS properly (don't use inline styles/scripts unless necessary)
   - Use wp_enqueue_style() and wp_enqueue_script()
   - Add proper HTML5 markup
   - Ensure responsive design considerations
   - Add ARIA labels for accessibility

9. ERROR HANDLING:
   - Check for required functions/plugins before executing
   - Validate data before processing
   - Provide helpful error messages
   - Log errors appropriately (error_log())

10. CODE QUALITY:
    - Follow WordPress Coding Standards
    - Use meaningful variable and function names
    - Add inline comments for complex logic
    - Keep functions focused and under 20 lines when possible
    - DRY principle (Don't Repeat Yourself)

11. ADDITIONAL FEATURES:
    - Make translation-ready with text domain
    - Add uninstall.php if plugin creates database tables/options
    - Include version checking if needed
    - Add action links (Settings, Documentation) in plugin list

FINAL CHECKLIST:
✓ Plugin header complete with all fields
✓ Usage instructions at the top (including shortcodes if any)
✓ Security: All inputs sanitized, outputs escaped, nonces used
✓ Proper WordPress hooks and filters
✓ Admin interface with clear instructions (if needed)
✓ Shortcodes documented with examples (if used)
✓ Code follows WordPress standards
✓ No direct file access possible
✓ Production-ready and tested logic

OUTPUT FORMAT:
Respond with ONLY the raw PHP code. No explanations before or after. No markdown formatting. No code blocks. Just pure, complete, working PHP code starting with <?php.`;

      // Call Google Gemini API
      const geminiResponse = await fetch(GEMINI_API_URL + '?key=' + env.GOOGLE_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }]
        })
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error("Gemini API error:", errorText);
        throw new Error(`Gemini API returned status ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json() as any;
      
      // Extract generated text from Gemini response
      if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
        console.error("Gemini response structure invalid:", JSON.stringify(geminiData));
        throw new Error("Gemini returned an invalid response structure.");
      }

      let generatedCode = geminiData.candidates[0].content.parts[0].text.trim();
      
      // Cleanup markdown code blocks if present
      if (generatedCode.startsWith('```php')) {
        generatedCode = generatedCode.replace(/```php\s*/, '').replace(/```\s*$/, '').trim();
      } else if (generatedCode.startsWith('```')) {
        generatedCode = generatedCode.replace(/```\s*/, '').replace(/```\s*$/, '').trim();
      }
      
      if (generatedCode.length < 50) {
        throw new Error("Gemini returned code that was too short or non-existent.");
      }

      // 3. Generate Complete Plugin Structure (multi-file)
      const pluginStructure = await generatePluginStructure(
        generatedCode, 
        prompt,
        env.GOOGLE_API_KEY
      );
      
      // 4. Package and Store in R2
      const zipFileName = `${pluginStructure.pluginSlug}.zip`;
      const zipBuffer = await createPluginZipBuffer(pluginStructure);
      await env.PLUGIN_STORAGE.put(zipFileName, zipBuffer, {
        httpMetadata: {
          contentType: 'application/zip'
        }
      }); 
      
      const downloadUrl = `/download/${zipFileName}`;
      
      // 5. Generate and store WordPress Playground blueprint
      const workerUrl = new URL(request.url).origin;
      const publicZipUrl = `${workerUrl}${downloadUrl}`;
      
      // Check if plugin has shortcode
      const hasShortcode = generatedCode.includes('add_shortcode');
      const shortcodeMatch = generatedCode.match(/add_shortcode\s*\(\s*['"]([^'"]+)['"]/);
      const shortcodeName = shortcodeMatch ? shortcodeMatch[1] : undefined;
      
      const blueprint = generatePlaygroundBlueprint(
        publicZipUrl,
        pluginStructure.pluginSlug,
        pluginStructure.pluginName
      );
      
      // Store blueprint in R2
      const blueprintFileName = `${pluginStructure.pluginSlug}-blueprint.json`;
      await env.PLUGIN_STORAGE.put(blueprintFileName, JSON.stringify(blueprint, null, 2), {
        httpMetadata: {
          contentType: 'application/json'
        }
      });
      
      const blueprintUrl = `${workerUrl}/download/${blueprintFileName}`;
      const playgroundUrl = generatePlaygroundUrlFromHosted(blueprintUrl);

      // 6. Return Success Response with file structure
      return new Response(JSON.stringify({ 
        success: true,
        pluginName: pluginStructure.pluginName,
        pluginSlug: pluginStructure.pluginSlug,
        files: pluginStructure.files.map(f => ({
          path: f.path,
          content: f.content,
          type: f.type
        })),
        downloadUrl: downloadUrl,
        playgroundUrl: playgroundUrl,
        blueprintUrl: blueprintUrl
      }), { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
      const error = e as Error;
      console.error("Handler Error:", error.message);
      // Return a 500 with a clean error message for the frontend to display
      return new Response(JSON.stringify({ 
          error: `Backend error during AI processing. Details logged.`,
          message: error.message
      }), { status: 500 });
    }
}


// --- EXPORTED HANDLER (Routes traffic) ---
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // 1. Ingestion Route (SETUP ONLY)
    if (url.pathname === '/ingest' && request.method === 'GET') {
      return ingestData(env);
    }
    
    // 2. API Generation Route (Handles Frontend POST)
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      return handleGenerate(request, env);
    }
    
    // 3. Download Route (R2 Retrieval)
    if (url.pathname.startsWith('/download/')) {
        const fileName = url.pathname.substring('/download/'.length);
        const object = await env.PLUGIN_STORAGE.get(fileName);
        
        if (object === null) {
            return new Response('File not found.', { status: 404 });
        }
        
        // Determine content type
        const contentType = fileName.endsWith('.json') 
          ? 'application/json' 
          : 'application/zip';
        
        const disposition = fileName.endsWith('.json')
          ? `inline; filename="${fileName}"`
          : `attachment; filename="${fileName}"`;
        
        return new Response(object.body, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': disposition,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    }
    
    // 4. WordPress Playground Launcher Route
    if (url.pathname.startsWith('/playground/')) {
        const pluginSlug = url.pathname.substring('/playground/'.length);
        const blueprintFileName = `${pluginSlug}-blueprint.json`;
        
        // Check if blueprint exists
        const blueprintObject = await env.PLUGIN_STORAGE.get(blueprintFileName);
        
        if (blueprintObject === null) {
            return new Response('Plugin blueprint not found. Please generate the plugin first.', { 
              status: 404 
            });
        }
        
        // Redirect to WordPress Playground with blueprint URL
        const workerUrl = url.origin;
        const blueprintUrl = `${workerUrl}/download/${blueprintFileName}`;
        const playgroundUrl = generatePlaygroundUrlFromHosted(blueprintUrl);
        
        return Response.redirect(playgroundUrl, 302);
    }

    // 5. Static Asset/Page Request (Serve the HTML/CSS/JS)
    return env.ASSETS.fetch(request);
  }
};