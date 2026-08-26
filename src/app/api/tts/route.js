// GET / POST /api/tts — Studio-Quality Indian Female Voice TTS
// Primary: Sarvam AI Bulbul v3 (Ultra-natural Indian female voice 'shreya')
// Fallback: Microsoft Edge Neural TTS (Neerja / Swara / Aarohi) when limit exceeded

import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Language mappings for Sarvam AI Bulbul v3
const SARVAM_LANG_MAP = {
  english: 'en-IN',
  hindi:   'hi-IN',
  marathi: 'mr-IN',
};

// Premium Indian Female Neural Voice Models for Edge TTS fallback
const EDGE_FEMALE_VOICES = {
  english: 'en-IN-NeerjaExpressiveNeural',
  hindi:   'hi-IN-SwaraNeural',
  marathi: 'mr-IN-AarohiNeural',
};

const EDGE_FALLBACK_VOICES = {
  english: 'en-IN-NeerjaNeural',
  hindi:   'hi-IN-SwaraNeural',
  marathi: 'mr-IN-AarohiNeural',
};

function cleanTextForSpeech(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/[✓✔•→🎉😊🙏💰📋⚠️🏢📊🎙️📞]/g, '')
    .replace(/₹/g, 'rupees ')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate speech using Sarvam AI Bulbul v3
 */
async function generateSarvamSpeech(text, language = 'english') {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error('SARVAM_API_KEY not configured');

  const langCode = SARVAM_LANG_MAP[language] || 'en-IN';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000); // 6s max

  try {
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: langCode,
        speaker: 'shreya', // High-fidelity Indian female voice
        model: 'bulbul:v3',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Sarvam TTS error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (!data.audios || data.audios.length === 0) {
      throw new Error('No audio returned from Sarvam TTS');
    }

    const audioBuffer = Buffer.from(data.audios[0], 'base64');
    return { buffer: audioBuffer, contentType: 'audio/wav' };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Generate speech using Microsoft Edge Neural TTS (Fallback)
 */
async function generateEdgeSpeech(text, language = 'english') {
  const voiceName = EDGE_FEMALE_VOICES[language] || EDGE_FEMALE_VOICES.english;
  const fallback = EDGE_FALLBACK_VOICES[language] || EDGE_FALLBACK_VOICES.english;

  for (const voice of [voiceName, fallback]) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

      const { audioStream } = tts.toStream(text, {
        rate: '-5%',
        pitch: '+5Hz',
        volume: '+10%',
      });

      const chunks = [];
      const buffer = await new Promise((resolve, reject) => {
        audioStream.on('data', (data) => chunks.push(data));
        audioStream.on('end', () => resolve(Buffer.concat(chunks)));
        audioStream.on('error', (err) => reject(err));
      });

      return { buffer, contentType: 'audio/mpeg' };
    } catch (err) {
      if (voice === fallback) throw err;
      console.warn(`[api/tts] Edge Voice ${voice} failed, trying fallback: ${fallback}`);
    }
  }
}

/**
 * Main audio generation dispatcher: Sarvam AI -> Edge TTS fallback
 */
async function generateSpeechAudio(rawText, language = 'english') {
  const text = cleanTextForSpeech(rawText) || 'Hello from GJ SpaCes!';

  // 1. Try Sarvam AI Bulbul v3 (Primary Indian Female Voice)
  if (process.env.SARVAM_API_KEY) {
    try {
      return await generateSarvamSpeech(text, language);
    } catch (sarvamErr) {
      console.warn('[api/tts] Sarvam TTS limit reached or error, falling back to Microsoft Neural TTS:', sarvamErr.message);
    }
  }

  // 2. Fallback to Microsoft Neural Edge TTS
  return await generateEdgeSpeech(text, language);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = body.text || 'Hello from GJ SpaCes!';
    const language = body.language || 'english';

    const { buffer, contentType } = await generateSpeechAudio(text, language);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[api/tts] TTS synthesis error:', error);
    return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || 'Hello from GJ SpaCes!';
    const language = searchParams.get('language') || 'english';

    const { buffer, contentType } = await generateSpeechAudio(text, language);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[api/tts] TTS synthesis error:', error);
    return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 500 });
  }
}
