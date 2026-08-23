// OpenRouter AI client — powers Sakshi's brain
// Uses google/gemini-flash-1.5 by default (fast + free tier available)

import { SAKSHI_SYSTEM_PROMPT } from './sakshi-persona';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Primary model: Gemini 2.0 Flash (ultra-fast ~0.4s response, fully capable multilingual)
const PRIMARY_MODEL = 'google/gemini-2.0-flash-001';
// Fallback model if primary fails
const FALLBACK_MODEL = 'openai/gpt-4o-mini';

/**
 * Send a conversation to Sakshi (AI) and get a response.
 * @param {Array} messages - Array of {role: 'user'|'assistant', content: string}
 * @param {string} language - 'english' | 'hindi' | 'marathi'
 * @param {string} model - override model
 * @returns {Promise<string>} - AI response text
 */
export async function askSakshi(messages, language = 'english', model = PRIMARY_MODEL) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  // Build language-specific system prompt addition
  const langInstruction = language === 'hindi'
    ? '\n\nIMPORTANT: This customer has chosen HINDI. You MUST respond ONLY in Hindi using Devanagari script.'
    : language === 'marathi'
    ? '\n\nIMPORTANT: This customer has chosen MARATHI. You MUST respond ONLY in Marathi using Devanagari script.'
    : '\n\nThis customer has chosen ENGLISH. Respond in clear, professional English.';

  const systemPrompt = SAKSHI_SYSTEM_PROMPT + langInstruction;

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 300,
    temperature: 0.7,
  };

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'GJ SpaCes CallBot CRM',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Try fallback model if primary fails
    if (model !== FALLBACK_MODEL) {
      console.warn(`Primary model ${model} failed, trying fallback ${FALLBACK_MODEL}:`, errorText);
      return askSakshi(messages, language, FALLBACK_MODEL);
    }
    throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI');
  return content.trim();
}

/**
 * Generate a call summary from the transcript.
 * @param {Array} transcript - [{role, text}]
 * @param {string} language
 * @returns {Promise<{summary, queryCategory, sentiment}>}
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
    'english', // always generate summary in English
    PRIMARY_MODEL
  );

  try {
    // Clean up any markdown code blocks if present
    const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    // Fallback if JSON parse fails
    return {
      summary: 'Customer called GJ SpaCes for assistance.',
      queryCategory: 'inquiry',
      sentiment: 'neutral',
      resolution: 'pending',
    };
  }
}
