// Sakshi AI Brain — Multi-Provider with Auto-Fallback
// Priority: Groq (llama-3.3-70b, ultra-fast + free) → OpenRouter (gemini-flash, fallback)
// Switches silently — user never knows which provider is active.

import { SAKSHI_SYSTEM_PROMPT } from './sakshi-persona.js';

function getGroqKey() {
  return process.env.GROQ_API_KEY;
}

function getOpenRouterKey() {
  return process.env.OPENROUTER_API_KEY;
}

// ── Groq Config (Primary — FREE, ~200ms response) ────────────────────────────
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_PRIMARY_MODEL = 'groq/compound-mini';       // Ultra-fast (~200ms) for phone calls
const GROQ_FALLBACK_MODEL = 'openai/gpt-oss-20b';       // Clean direct response fallback

// ── OpenRouter Config (Silent Fallback — backup when Groq limit hit) ──────────
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_PRIMARY_MODEL = 'google/gemini-2.0-flash-001';
const OPENROUTER_FALLBACK_MODEL = 'meta-llama/llama-3.3-70b-instruct';

// Track which provider is active (in-memory, resets on restart)
let activeProvider = 'groq'; // starts with groq

/**
 * Detect if user requested a mid-conversation language switch
 */
export function detectLanguageSwitch(text = '') {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // Check Hindi switch intent
  const hindiTriggers = [
    'hindi', 'हिंदी', 'हिन्दी', 'hindi please', 'talk in hindi', 'speak in hindi',
    'talk to me in hindi', 'speak hindi', 'can you speak hindi', 'can we talk in hindi',
    'hindi mein', 'hindi me', 'hindi bolo', 'hindi mai', 'hindi me baat', 'hindi madhe'
  ];
  if (hindiTriggers.some(t => lower.includes(t))) {
    return { language: 'hindi', speechLang: 'hi-IN' };
  }

  // Check Marathi switch intent
  const marathiTriggers = [
    'marathi', 'मराठी', 'marathi please', 'talk in marathi', 'speak in marathi',
    'talk to me in marathi', 'speak marathi', 'can you speak marathi', 'can we talk in marathi',
    'marathi madhe', 'marathit', 'marathit bola', 'marathi bola', 'marathi sanga'
  ];
  if (marathiTriggers.some(t => lower.includes(t))) {
    return { language: 'marathi', speechLang: 'mr-IN' };
  }

  // Check English switch intent
  const englishTriggers = [
    'english', 'अंग्रेजी', 'इंग्रजी', 'english please', 'talk in english', 'speak in english',
    'talk to me in english', 'speak english', 'can you speak english', 'can we talk in english',
    'angrezi', 'ingreji', 'in english'
  ];
  if (englishTriggers.some(t => lower.includes(t))) {
    return { language: 'english', speechLang: 'en-IN' };
  }

  return null;
}

function buildLangInstruction(language) {
  if (language === 'hindi') {
    return '\n\n## LANGUAGE INSTRUCTION\nRespond in fluent, conversational Hindi using Devanagari script (हिंदी).\nIf the customer asks to speak in English or Marathi, gladly acknowledge and immediately switch.\nKeep replies to 1-2 short, snappy sentences. This is a voice call.';
  }
  if (language === 'marathi') {
    return '\n\n## LANGUAGE INSTRUCTION\nRespond in fluent, conversational Marathi using Devanagari script (मराठी).\nIf the customer asks to speak in English or Hindi, gladly acknowledge and immediately switch.\nKeep replies to 1-2 short, snappy sentences. This is a voice call.';
  }
  return '\n\n## LANGUAGE INSTRUCTION\nRespond in clear, natural Indian English.\nIf the customer asks to speak in Hindi or Marathi, gladly acknowledge and immediately switch.\nKeep replies to 1-2 short, snappy sentences. This is a voice call.';
}

async function callGroq(messages, language, model = GROQ_PRIMARY_MODEL) {
  const apiKey = getGroqKey();
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const systemPrompt = SAKSHI_SYSTEM_PROMPT + buildLangInstruction(language);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000); // 4s max

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 60,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();

      // Rate limit or model error -> try fallback model or switch to OpenRouter
      if (model !== GROQ_FALLBACK_MODEL) {
        console.warn(`[AI] Groq ${model} failed (${response.status}), trying Groq fallback...`);
        return callGroq(messages, language, GROQ_FALLBACK_MODEL);
      }
      throw new Error(`GROQ_ERROR:${response.status}:${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');
    
    // Clean any thinking tags if present
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return content;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function callOpenRouter(messages, language, model = OPENROUTER_PRIMARY_MODEL) {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const systemPrompt = SAKSHI_SYSTEM_PROMPT + buildLangInstruction(language);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000); // 6s max

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'GJ SpaCes CallBot CRM',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 60,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      if (model !== OPENROUTER_FALLBACK_MODEL) {
        console.warn('[AI] OpenRouter primary failed, trying fallback...');
        return callOpenRouter(messages, language, OPENROUTER_FALLBACK_MODEL);
      }
      throw new Error(`OpenRouter error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenRouter');
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return content;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function getSarvamKey() {
  return process.env.SARVAM_API_KEY;
}

async function callSarvamChat(messages, language) {
  const apiKey = getSarvamKey();
  if (!apiKey) throw new Error('SARVAM_API_KEY not configured');

  const systemPrompt = SAKSHI_SYSTEM_PROMPT + buildLangInstruction(language);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000); // 4s max

  try {
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 60,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Sarvam Chat error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from Sarvam Chat');
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return content;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Ask Sakshi AI — executes the fastest provider first (Groq <200ms -> Sarvam Chat -> OpenRouter).
 * @param {Array} messages - [{role: 'user'|'assistant', content: string}]
 * @param {string} language - 'english' | 'hindi' | 'marathi'
 * @param {string} [model] - optional model override
 */
export async function askSakshi(messages, language = 'english', model = null) {
  const groqKey = getGroqKey();
  // 1. Try Groq (Primary Ultra-fast, ~160ms)
  if (groqKey) {
    try {
      const result = await callGroq(messages, language, model || GROQ_PRIMARY_MODEL);
      return result;
    } catch (err) {
      console.warn('[AI] Groq failed, trying Sarvam Chat fallback:', err.message);
    }
  }

  // 2. Try Sarvam AI 105B Chat (Fast Indian Multilingual Brain)
  const sarvamKey = getSarvamKey();
  if (sarvamKey) {
    try {
      const result = await callSarvamChat(messages, language);
      return result;
    } catch (sarvamErr) {
      console.warn('[AI] Sarvam Chat failed, trying OpenRouter fallback:', sarvamErr.message);
    }
  }

  // 3. Fallback to OpenRouter (Gemini Flash)
  try {
    const result = await callOpenRouter(messages, language, model || OPENROUTER_PRIMARY_MODEL);
    return result;
  } catch (err) {
    throw new Error(`All AI providers failed: ${err.message}`);
  }
}

/**
 * Generate a call summary from transcript.
 * Uses the same multi-provider fallback chain.
 */
export async function generateCallSummary(transcript, language = 'english') {
  const transcriptText = transcript
    .map(m => `${m.role === 'bot' ? 'Sakshi' : 'Customer'}: ${m.text}`)
    .join('\n');

  const prompt = `Based on this call transcript between Sakshi (GJ SpaCes AI bot) and a customer, provide a JSON object with:
- "summary": A concise 1-2 sentence summary of the customer's query and outcome (in English always)
- "queryCategory": One of: inquiry, booking, complaint, support
- "sentiment": One of: positive, neutral, negative
- "resolution": One of: resolved, pending, escalated, voicemail

Transcript:
${transcriptText}

Respond with ONLY a valid JSON object, no markdown, no extra text.`;

  const response = await askSakshi(
    [{ role: 'user', content: prompt }],
    'english'
  );

  try {
    const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return {
      summary: 'Customer called GJ SpaCes for assistance.',
      queryCategory: 'inquiry',
      sentiment: 'neutral',
      resolution: 'pending',
    };
  }
}
