// D:\cloudflare_worker_app\wp-ai-generator\src\index.ts

import { JSZip } from 'jszip'; 
import { WP_DOCS } from './wp_docs_content.js'; 

// --- BINDING INTERFACE (Matches your wrangler.jsonc bindings) ---
interface Env {
  AI: any; 
  WP_INDEX: VectorizeIndex; 
  PLUGIN_STORAGE: R2Bucket; 
  ASSETS: { fetch: (request: Request) => Promise<Response> }; 
}

// --- WORKERS AI FREE LLM CONFIG ---
const GENERATION_MODEL = '@cf/meta/llama-3.1-8b-instruct'; // Defaulting back to Llama 3 for reliability
const EMBEDDING_MODEL = '@cf/baai/bge-small-en-v1.5';

// --- Helper: Creates the ZIP file buffer ---
async function createZipBuffer(fileName: string, content: string): Promise<ArrayBuffer> {
    const zip = new JSZip();
    zip.file(fileName, content); 
    return zip.generateAsync({ type: "arraybuffer" });
}

// --- TEMPORARY INGESTION FUNCTION (Run once to setup RAG) ---
async function ingestData(env: Env): Promise<Response> {
    // Ingestion logic... (omitted for brevity, assume this runs and populates WP_DOCS)
    // ...

    // **NOTE: You must paste the full ingestion logic from the previous step here!**
    // Since this is just for reference, we'll return the success message:
    return new Response(JSON.stringify({ 
        message: `✅ Vectorize RAG data successfully loaded. Ready for generation.` 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}


// --- MAIN API HANDLER (Processes POST request from Frontend) ---
async function handleGenerate(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method Not Allowed. Use POST." }), { status: 405 });
    }
    
    try {
      const body = await request.json();
      const prompt = body.prompt;

      if (!prompt) {
        return new Response(JSON.stringify({ error: "Missing 'prompt' in request body." }), { status: 400 });
      }

      // 1. RAG Retrieval (Context Lookup)
      const queryEmbeddingResponse = await env.AI.run(EMBEDDING_MODEL, { text: prompt });
      const searchResults = await env.WP_INDEX.query(queryEmbeddingResponse.data[0], { topK: 3 });
      const context = searchResults.matches.map(match => match.metadata.text).join('\n---\n');

      // 2. Define System Prompt and Generate Code
      const systemPrompt = `You are a world-class WordPress PHP developer. Your goal is to write a single, complete, secure PHP file for a plugin. Use the following CONTEXT: ${context}. Respond with ONLY the raw PHP code, starting with '<?php' and the required plugin header comment block. Do not include any explanation or markdown formatting.`;

      const aiResponse = await env.AI.run(GENERATION_MODEL, {
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Generate a plugin that: ${prompt}` }]
      });
      
      // CRITICAL SAFETY CHECK: Ensure the AI returned a response field
      if (!aiResponse || typeof aiResponse.response !== 'string') {
          // Log the raw AI response in the dashboard for debugging
          console.error("AI response failed or returned unexpected type:", JSON.stringify(aiResponse));
          throw new Error("AI service returned a malformed or empty response.");
      }

      // Cleanup code block markdown
      let generatedCode = aiResponse.response.trim();
      if (generatedCode.startsWith('```php')) {
        generatedCode = generatedCode.replace(/```php\s*/, '').replace(/```\s*$/, '').trim();
      }
      
      if (generatedCode.length < 50) {
        throw new Error("AI returned code that was too short or non-existent.");
      }

      // 3. Package and Store in R2
      const sanitizedName = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
      const zipFileName = `wp-plugin-${sanitizedName}.zip`;
      const phpFileName = `${sanitizedName}.php`;

      const zipBuffer = await createZipBuffer(phpFileName, generatedCode);
      await env.PLUGIN_STORAGE.put(zipFileName, zipBuffer); 
      
      const downloadUrl = `/download/${zipFileName}`; 

      // 4. Return Success Response
      return new Response(JSON.stringify({ 
        success: true,
        code: generatedCode, 
        downloadUrl: downloadUrl,
      }), { headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
      console.error("Handler Error:", e.message);
      // Return a 500 with a clean error message for the frontend to display
      return new Response(JSON.stringify({ 
          error: `Backend error during AI processing. Details logged.`,
          message: e.message
      }), { status: 500 });
    }
}


// --- EXPORTED HANDLER (Routes traffic) ---
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Static Asset/Page Request (FIX: Serve the HTML/CSS/JS on GET)
    if (request.method === 'GET' && url.pathname !== '/ingest') {
        return env.ASSETS.fetch(request); 
    }

    // 2. Ingestion Route (SETUP ONLY)
    if (url.pathname === '/ingest' && request.method === 'GET') {
      return ingestData(env);
    }
    
    // 3. Download Route (R2 Retrieval)
    if (url.pathname.startsWith('/download/')) {
        const fileName = url.pathname.substring('/download/'.length);
        const object = await env.PLUGIN_STORAGE.get(fileName);
        
        if (object === null) {
            return new Response('Plugin not found.', { status: 404 });
        }
        
        return new Response(object.body, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${fileName}"`
            }
        });
    }

    // 4. Main API Route (Handles Frontend POST)
    return handleGenerate(request, env);
  }
};