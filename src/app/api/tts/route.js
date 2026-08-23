// GET / POST /api/tts — Free Studio-Grade Neural Text-to-Speech API
// Uses Microsoft Neural Voices for 100% human-like Indian English, Hindi, and Marathi.

import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VOICE_MAP = {
  english: 'en-IN-NeerjaNeural',
  hindi:   'hi-IN-SwaraNeural',
  marathi: 'mr-IN-AarohiNeural',
};

async function generateSpeechAudio(text, language = 'english') {
  const voice = VOICE_MAP[language] || VOICE_MAP.english;
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const readable = tts.toStream(text);
  const chunks = [];

  return new Promise((resolve, reject) => {
    readable.on('data', (data) => chunks.push(data));
    readable.on('end', () => resolve(Buffer.concat(chunks)));
    readable.on('error', (err) => reject(err));
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = body.text || 'Hello from GJ SpaCes!';
    const language = body.language || 'english';

    const audioBuffer = await generateSpeechAudio(text, language);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[api/tts] Neural TTS error:', error);
    return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || 'Hello from GJ SpaCes!';
    const language = searchParams.get('language') || 'english';

    const audioBuffer = await generateSpeechAudio(text, language);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[api/tts] Neural TTS error:', error);
    return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 500 });
  }
}
