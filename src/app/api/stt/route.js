// POST /api/stt — High Accuracy Speech-to-Text
// Primary: Sarvam AI Saaras v3 (Superior Indian languages STT: Hindi, Marathi, English)
// Fallback: Groq Whisper (whisper-large-v3-turbo) when Sarvam limit exceeded

import { NextResponse } from 'next/server';

const SARVAM_API_URL = 'https://api.sarvam.ai/speech-to-text';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

const SARVAM_LANG_CODE_MAP = {
  hindi: 'hi-IN',
  marathi: 'mr-IN',
  english: 'en-IN',
};

const GROQ_LANG_CODE_MAP = {
  hindi: 'hi',
  marathi: 'mr',
  english: 'en',
};

/**
 * Transcribe via Sarvam AI Saaras v3
 */
async function transcribeWithSarvam(audioFile, language = 'english') {
  const sarvamApiKey = process.env.SARVAM_API_KEY;
  if (!sarvamApiKey) throw new Error('SARVAM_API_KEY not configured');

  const langCode = SARVAM_LANG_CODE_MAP[language] || 'en-IN';

  const form = new FormData();
  form.append('file', audioFile, 'audio.webm');
  form.append('model', 'saaras:v3');
  form.append('language_code', langCode);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8s max

  try {
    const response = await fetch(SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamApiKey,
      },
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Sarvam STT failed ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.transcript ? data.transcript.trim() : '';
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Transcribe via Groq Whisper (Fallback)
 */
async function transcribeWithGroq(audioFile, language = 'english') {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) throw new Error('GROQ_API_KEY not configured');

  const langCode = GROQ_LANG_CODE_MAP[language] || 'en';

  const groqForm = new FormData();
  groqForm.append('file', audioFile, 'audio.webm');
  groqForm.append('model', 'whisper-large-v3-turbo');
  groqForm.append('language', langCode);
  groqForm.append('response_format', 'text');
  groqForm.append('temperature', '0');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: groqForm,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq STT failed ${response.status}: ${errText}`);
    }

    const text = await response.text();
    return text.trim();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const language = formData.get('language') || 'english';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // 1. Try Sarvam AI Saaras v3 (Primary STT)
    if (process.env.SARVAM_API_KEY) {
      try {
        const text = await transcribeWithSarvam(audioFile, language);
        return NextResponse.json({ text, provider: 'sarvam' });
      } catch (sarvamErr) {
        console.warn('[api/stt] Sarvam STT limit reached or error, falling back to Groq Whisper:', sarvamErr.message);
      }
    }

    // 2. Fallback to Groq Whisper
    try {
      const text = await transcribeWithGroq(audioFile, language);
      return NextResponse.json({ text, provider: 'groq' });
    } catch (groqErr) {
      console.error('[api/stt] Both Sarvam and Groq STT failed:', groqErr.message);
      return NextResponse.json(
        { error: 'Speech transcription failed on all providers', details: groqErr.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[api/stt] Unexpected error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
