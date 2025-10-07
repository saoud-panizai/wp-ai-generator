// D:\cloudflare_worker_app\wp-ai-generator\src\index.ts

// NOTE: You must have run 'npm install jszip' previously.
import { JSZip } from 'jszip'; 
// NOTE: You must have created src/wp_docs_content.js with the WP_DOCS array.
import { WP_DOCS } from './wp_docs_content.js'; 

// --- BINDING INTERFACE (Matches your wrangler.jsonc bindings) ---
interface Env {
  AI: any; 
  WP_INDEX: VectorizeIndex; 
  PLUGIN_STORAGE: R2Bucket;
}

// --- WORKERS AI FREE LLM CONFIG ---
const GENERATION_MODEL = '@cf/meta/llama-3.1-8b-instruct'; 
const EMBEDDING_MODEL = '@cf/baai/bge-small-en-v1.5';

// --- Helper: Creates the ZIP file buffer ---
// This requires the 'jszip' dependency
async function createZipBuffer(fileName: string, content: string): Promise<ArrayBuffer> {
    const zip = new JSZip();
    zip.file(fileName, content); 
    
    return zip.generateAsync({ type: "arraybuffer" });
}

// --- TEMPORARY INGESTION FUNCTION (Run once, then ignore) ---
// This function needs to be executed once to populate your Vectorize index.
async function ingestData(env: Env): Promise<Response> {
  const vectors = [];
  
  for (let i = 0; i < WP_DOCS.length; i++) {
    const chunk = WP_DOCS[i];
    
    const embeddingResponse = await env.AI.run(EMBEDDING_MODEL, {
      text: chunk
    });
    const embedding = embeddingResponse.data[0];

    vectors.push({
      id: `doc-${i}`,
      values: embedding,
      metadata: { text: chunk }
    });
  }

  // Insert into Vectorize Index 
  await env.WP_INDEX.upsert(vectors);

  return new Response(JSON.stringify({ 
      message: `Successfully ingested ${vectors.length} vectors into Vectorize. THIS FUNCTION IS FOR SETUP ONLY.` 
  }), { status: 200 });
}


// --- MAIN API HANDLER (Used by your Frontend) ---
async function handleGenerate(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method Not Allowed. Use POST." }), { status: 405 });
    }
    
    try {
      const { prompt } = await request.json();
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Missing 'prompt' in request body." }), { status: 400 });
      }

      // 1. RAG Retrieval (Context Lookup)
      const queryEmbeddingResponse = await env.AI.run(EMBEDDING_MODEL, { text: prompt });
      const searchResults = await env.WP_INDEX.query(queryEmbeddingResponse.data[0], { topK: 3 });
      const context = searchResults.matches.map(match => match.metadata.text).join('\n---\n');

      // 2. Define System Prompt and Generate Code
      const systemPrompt = `You are a world-class WordPress PHP developer. Your goal is to write a single, complete, secure PHP file for a plugin. Use the following CONTEXT: ${context}. Respond with ONLY the raw PHP code, starting with '<?php' and the required plugin header comment block.`;

      const aiResponse = await env.AI.run(GENERATION_MODEL, {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a plugin that: ${prompt}` }
        ]
      });

      const generatedCode = aiResponse.response;
      
      if (!generatedCode || generatedCode.length < 50) {
        throw new Error("AI returned no code or an excessively short response.");
      }

      // 3. Package and Store in R2 (local simulation)
      const sanitizedName = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
      const zipFileName = `wp-plugin-${sanitizedName}.zip`;

      const zipBuffer = await createZipBuffer(`${sanitizedName}.php`, generatedCode);
      
      // Store in R2 (local R2 simulation during dev)
      await env.PLUGIN_STORAGE.put(zipFileName, zipBuffer); 
      
      // Return URL for download (Frontend will use this link)
      const downloadUrl = `http://localhost:8787/download/${zipFileName}`; 

      // 4. Return Success Response (Used by public/app.js)
      return new Response(JSON.stringify({ 
        success: true,
        code: generatedCode, 
        downloadUrl: downloadUrl,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ 
          error: `AI or RAG process failed: ${e.message}`,
          message: `Check Wrangler terminal logs for details.`
      }), { status: 500 });
    }
}


// --- EXPORTED HANDLER (Routes traffic) ---
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Ingestion Route (SETUP ONLY)
    if (url.pathname === '/ingest' && request.method === 'GET') {
      return ingestData(env);
    }
    
    // 2. Download Route (R2 Retrieval) - SIMPLIFIED FOR MVP
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

    // 3. Main API Route (Handles Frontend POST)
    // Assumes the Worker is hosted at the root path, responding to POSTs
    return handleGenerate(request, env);
  }
};