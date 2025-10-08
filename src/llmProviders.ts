// Multi-LLM Provider System for WordPress Plugin Generation

export interface LLMProvider {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
  requiresApiKey: boolean;
  maxTokens: number;
  generate: (prompt: string, apiKey?: string, env?: any) => Promise<GenerationResult>;
}

export interface GenerationResult {
  code: string;
  tokensUsed?: number;
  tokensRemaining?: number;
  model?: string;
}

// OpenRouter - Qwen3 Coder (FREE - specialized for coding!)
export const OpenRouterQwen3: LLMProvider = {
  id: 'openrouter-qwen3-coder',
  name: 'Qwen3 Coder (FREE)',
  description: 'Code-specialized model, 1M free tokens/day, excellent for WordPress',
  isFree: true,
  requiresApiKey: true,
  maxTokens: 8192,
  
  async generate(prompt: string, apiKey?: string, env?: any): Promise<GenerationResult> {
    const key = apiKey || env?.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error('OpenRouter API key not configured');
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://wp-ai-generator.saoud-panizai.workers.dev',
        'X-Title': 'WordPress Plugin Generator'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder:free',
        messages: [
          { role: 'system', content: 'You are a world-class WordPress PHP developer specialized in creating secure, production-ready plugins.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 8192,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as any;
    
    // Extract token usage from OpenRouter response
    const tokensUsed = data.usage?.total_tokens || 0;
    const dailyLimit = 1000000; // 1M tokens per day
    const tokensRemaining = dailyLimit - tokensUsed;
    
    return {
      code: data.choices?.[0]?.message?.content || '',
      tokensUsed,
      tokensRemaining,
      model: data.model || 'qwen3-coder'
    };
  }
};

// Cloudflare Workers AI Provider (FREE - no API key needed)
export const CloudflareWorkersAI: LLMProvider = {
  id: 'workers-ai-llama',
  name: 'Cloudflare Workers AI (Llama 3.1)',
  description: 'Free tier, fast, runs on Cloudflare edge',
  isFree: true,
  requiresApiKey: false,
  maxTokens: 4096,
  
  async generate(prompt: string, apiKey?: string, env?: any): Promise<GenerationResult> {
    if (!env?.AI) {
      throw new Error('Workers AI binding not available');
    }
    
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are a world-class WordPress PHP developer.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4096,
      temperature: 0.7
    });
    
    return {
      code: response.response || response.text || ''
    };
  }
};

// Cloudflare Workers AI - Mistral Model
export const CloudflareMistral: LLMProvider = {
  id: 'workers-ai-mistral',
  name: 'Cloudflare Workers AI (Mistral 7B)',
  description: 'Free tier, good for code generation',
  isFree: true,
  requiresApiKey: false,
  maxTokens: 4096,
  
  async generate(prompt: string, apiKey?: string, env?: any): Promise<GenerationResult> {
    if (!env?.AI) {
      throw new Error('Workers AI binding not available');
    }
    
    const response = await env.AI.run('@cf/mistral/mistral-7b-instruct-v0.1', {
      messages: [
        { role: 'system', content: 'You are a world-class WordPress PHP developer.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4096,
      temperature: 0.7
    });
    
    return {
      code: response.response || response.text || ''
    };
  }
};

// Google Gemini Provider (FREE tier - requires API key)
export const GoogleGemini: LLMProvider = {
  id: 'gemini-2.0-flash',
  name: 'Google Gemini 2.0 Flash',
  description: 'Free tier, excellent for WordPress code',
  isFree: true,
  requiresApiKey: true,
  maxTokens: 8192,
  
  async generate(prompt: string, apiKey?: string, env?: any): Promise<GenerationResult> {
    const key = apiKey || env?.GOOGLE_API_KEY;
    if (!key) {
      throw new Error('Google Gemini API key not configured');
    }
    
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    
    const response = await fetch(GEMINI_API_URL + '?key=' + key, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json() as any;
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Gemini returned invalid response structure');
    }

    // Gemini doesn't provide token counts in the response for free tier
    return {
      code: data.candidates[0].content.parts[0].text.trim()
    };
  }
};

// Groq Provider (FREE tier - very fast!)
export const GroqLlama: LLMProvider = {
  id: 'groq-llama-3.3',
  name: 'Groq (Llama 3.3 70B)',
  description: 'Free tier, extremely fast inference',
  isFree: true,
  requiresApiKey: true,
  maxTokens: 8000,
  
  async generate(prompt: string, apiKey?: string, env?: any): Promise<GenerationResult> {
    const key = apiKey || env?.GROQ_API_KEY;
    if (!key) {
      throw new Error('Groq API key not configured');
    }
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a world-class WordPress PHP developer.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 8000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json() as any;
    
    // Groq provides token usage
    const tokensUsed = data.usage?.total_tokens || 0;
    
    return {
      code: data.choices?.[0]?.message?.content || '',
      tokensUsed
    };
  }
};

// Groq - Mixtral Model
export const GroqMixtral: LLMProvider = {
  id: 'groq-mixtral',
  name: 'Groq (Mixtral 8x7B)',
  description: 'Free tier, fast and capable',
  isFree: true,
  requiresApiKey: true,
  maxTokens: 32768,
  
  async generate(prompt: string, apiKey?: string, env?: any): Promise<GenerationResult> {
    const key = apiKey || env?.GROQ_API_KEY;
    if (!key) {
      throw new Error('Groq API key not configured');
    }
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: 'You are a world-class WordPress PHP developer.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 8000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const data = await response.json() as any;
    
    // Groq provides token usage
    const tokensUsed = data.usage?.total_tokens || 0;
    
    return {
      code: data.choices?.[0]?.message?.content || '',
      tokensUsed
    };
  }
};

// All available providers
export const LLM_PROVIDERS: Record<string, LLMProvider> = {
  'openrouter-qwen3-coder': OpenRouterQwen3, // NEW! Code-specialized
  'gemini-2.0-flash': GoogleGemini,
  'groq-llama-3.3': GroqLlama,
  'groq-mixtral': GroqMixtral,
  'workers-ai-llama': CloudflareWorkersAI,
  'workers-ai-mistral': CloudflareMistral,
};

// Auto mode: Try providers in order of preference
export async function generateWithAutoMode(
  prompt: string,
  env: any
): Promise<{ code: string; modelUsed: string; tokensUsed?: number; tokensRemaining?: number }> {
  
  // Priority order: fastest/best first
  // Note: Qwen3 removed from auto-priority due to API key issues
  // Add back when valid OpenRouter key is configured
  const providers = [
    // { id: 'openrouter-qwen3-coder', provider: OpenRouterQwen3 }, // Disabled - invalid API key
    { id: 'gemini-2.0-flash', provider: GoogleGemini },
    { id: 'groq-llama-3.3', provider: GroqLlama },
    { id: 'groq-mixtral', provider: GroqMixtral },
    { id: 'workers-ai-llama', provider: CloudflareWorkersAI },
    { id: 'workers-ai-mistral', provider: CloudflareMistral },
  ];
  
  const errors: string[] = [];
  
  for (const { id, provider } of providers) {
    try {
      console.log(`Attempting to generate with: ${provider.name}`);
      const result = await provider.generate(prompt, undefined, env);
      
      if (result.code && result.code.length > 50) {
        console.log(`✅ Success with: ${provider.name}`);
        return { 
          code: result.code, 
          modelUsed: id,
          tokensUsed: result.tokensUsed,
          tokensRemaining: result.tokensRemaining
        };
      }
    } catch (error: any) {
      console.log(`❌ Failed with ${provider.name}: ${error.message}`);
      errors.push(`${provider.name}: ${error.message}`);
      continue; // Try next provider
    }
  }
  
  throw new Error(`All LLM providers failed. Errors: ${errors.join('; ')}`);
}

// Generate with specific provider
export async function generateWithProvider(
  providerId: string,
  prompt: string,
  env: any
): Promise<GenerationResult> {
  const provider = LLM_PROVIDERS[providerId];
  
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  
  console.log(`Generating with: ${provider.name}`);
  return await provider.generate(prompt, undefined, env);
}

// Clean up markdown code blocks
export function cleanGeneratedCode(code: string): string {
  let cleaned = code.trim();
  
  // Remove markdown code blocks
  if (cleaned.startsWith('```php')) {
    cleaned = cleaned.replace(/```php\s*/, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\s*/, '').replace(/```\s*$/, '').trim();
  }
  
  return cleaned;
}

