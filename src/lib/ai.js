// Sakshi AI Brain — Multi-Provider with Auto-Fallback
// Priority: Groq (llama-3.3-70b, ultra-fast + free) → OpenRouter (gemini-flash, fallback)
// Switches silently — user never knows which provider is active.

import { SAKSHI_SYSTEM_PROMPT } from './sakshi-persona';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// ── Groq Config (Primary — FREE, ~200ms response) ────────────────────────────
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_PRIMARY_MODEL = 'llama-3.3-70b-versatile';   // Best reasoning + multilingual
const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant';     // Ultra-fast if 70b rate-limited

// ── OpenRouter Config (Silent Fallback — backup when Groq limit hit) ──────────
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_PRIMARY_MODEL = 'google/gemini-2.0-flash-001';
const OPENROUTER_FALLBACK_MODEL = 'openai/gpt-4o-mini';

// Track which provider is active (in-memory, resets on restart)
let activeProvider = 'groq'; // starts with groq

function buildLangInstruction(language) {
  if (language === 'hindi') {
    return '\n\nIMPORTANT: Respond ONLY in Hindi (Devanagari script). Keep response to 1-2 short sentences. This is a phone call — be concise.';
  }
  if (language === 'marathi') {
    return '\n\nIMPORTANT: Respond ONLY in Marathi (Devanagari script). Keep response to 1-2 short sentences. This is a phone call — be concise.';
  }
  return '\n\nRespond in clear, natural Indian English. Keep response to 1-2 short sentences. This is a phone call — be concise.';
}

async function callGroq(messages, language, model = GROQ_PRIMARY_MODEL) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');

  const systemPrompt = SAKSHI_SYSTEM_PROMPT + buildLangInstruction(language);

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 120,
      temperature: 0.65,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    const errData = JSON.parse(errText).catch?.(() => ({})) || {};

    // Rate limit (429) or token limit exceeded → switch to fallback model, then OpenRouter
    if (response.status === 429 || response.status === 413) {
      if (model !== GROQ_FALLBACK_MODEL) {
        console.warn('[AI] Groq primary rate-limited, trying Groq fallback model...');
        return callGroq(messages, language, GROQ_FALLBACK_MODEL);
      }
      // Both Groq models exhausted — throw to trigger OpenRouter switch
      throw new Error(`GROQ_RATE_LIMIT:${response.status}`);
    }
    throw new Error(`Groq error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');
  return content.trim();
}

async function callOpenRouter(messages, language, model = OPENROUTER_PRIMARY_MODEL) {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');

  const systemPrompt = SAKSHI_SYSTEM_PROMPT + buildLangInstruction(language);

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
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
      max_tokens: 120,
      temperature: 0.65,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (model !== OPENROUTER_FALLBACK_MODEL) {
      console.warn('[AI] OpenRouter primary failed, trying fallback...');
      return callOpenRouter(messages, language, OPENROUTER_FALLBACK_MODEL);
    }
    throw new Error(`OpenRouter error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenRouter');
  return content.trim();
}

/**
 * Ask Sakshi AI — automatically uses Groq first, silently falls back to OpenRouter.
 * @param {Array} messages - [{role: 'user'|'assistant', content: string}]
 * @param {string} language - 'english' | 'hindi' | 'marathi'
 * @param {string} [model] - optional model override
 */
export async function askSakshi(messages, language = 'english', model = null) {
  // Try Groq first if it's the active provider and API key exists
  if (activeProvider === 'groq' && GROQ_API_KEY) {
    try {
      const result = await callGroq(messages, language, model || GROQ_PRIMARY_MODEL);
      return result;
    } catch (err) {
      const msg = err.message || '';
      if (msg.startsWith('GROQ_RATE_LIMIT') || msg.includes('rate') || msg.includes('429')) {
        // Groq quota exhausted — silently switch to OpenRouter for this session
        console.warn('[AI] Groq rate limit reached — switching to OpenRouter silently.');
        activeProvider = 'openrouter';
      } else {
        // Non-rate-limit error — still try OpenRouter as emergency fallback
        console.warn('[AI] Groq error, falling back to OpenRouter:', msg);
      }
      // Fall through to OpenRouter
    }
  }

  // Use OpenRouter (either as default or after Groq failure/rate-limit)
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
