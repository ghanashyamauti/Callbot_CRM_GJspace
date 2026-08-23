// POST /api/stt — Free Speech-to-Text via Groq Whisper
// Groq Whisper is FREE — 14,400 audio minutes/day
// Languages: Hindi (hi), Marathi (mr), English (en)

import { NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

const LANG_CODE_MAP = {
  hindi: 'hi',
  marathi: 'mr',
  english: 'en',
};

export async function POST(request) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured. Get a free key at console.groq.com' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const language = formData.get('language') || 'english';
    const langCode = LANG_CODE_MAP[language] || 'en';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Build multipart form for Groq
    const groqForm = new FormData();
    groqForm.append('file', audioFile, 'audio.webm');
    groqForm.append('model', 'whisper-large-v3-turbo'); // Fastest + free
    groqForm.append('language', langCode);
    groqForm.append('response_format', 'text');
    groqForm.append('temperature', '0');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: groqForm,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[api/stt] Groq error:', response.status, errText);
      return NextResponse.json(
        { error: `Groq transcription failed: ${response.status}` },
        { status: 500 }
      );
    }

    const text = await response.text();
    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    console.error('[api/stt] Error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
