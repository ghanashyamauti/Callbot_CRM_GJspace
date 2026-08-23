// GET / POST /api/tts — Free High-Quality Indian Female Neural TTS
// Uses Microsoft Edge TTS via msedge-tts (100% free, no API key needed)
// Premium Voices: Neerja (English), Swara (Hindi), Aarohi (Marathi)

import { NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Premium Indian Female Neural Voice Models
const FEMALE_VOICES = {
  english: 'en-IN-NeerjaExpressiveNeural', // Most expressive Indian English female
  hindi:   'hi-IN-SwaraNeural',            // Natural Hindi female
  marathi: 'mr-IN-AarohiNeural',           // Native Marathi female
};

// Fallback voices if expressive not available
const FALLBACK_VOICES = {
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

async function generateSpeechAudio(rawText, language = 'english') {
  const voiceName = FEMALE_VOICES[language] || FEMALE_VOICES.english;
  const fallback = FALLBACK_VOICES[language] || FALLBACK_VOICES.english;
  const text = cleanTextForSpeech(rawText) || 'Hello from GJ SpaCes!';

  // Try primary (expressive) voice first, fall back if not available
  for (const voice of [voiceName, fallback]) {
    try {
      const tts = new MsEdgeTTS();
      // Use highest quality 24kHz audio format
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

      const { audioStream } = tts.toStream(text, {
        rate: '-5%',   // Slightly slower = more natural, conversational
        pitch: '+5Hz', // Slightly higher pitch = more feminine and warm
        volume: '+10%', // Clearer volume
      });

      const chunks = [];
      return await new Promise((resolve, reject) => {
        audioStream.on('data', (data) => chunks.push(data));
        audioStream.on('end', () => resolve(Buffer.concat(chunks)));
        audioStream.on('error', (err) => reject(err));
      });
    } catch (err) {
      if (voice === fallback) throw err; // Both failed
      console.warn(`[api/tts] Voice ${voice} failed, trying fallback: ${fallback}`);
    }
  }
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
        'Cache-Control': 'no-cache',
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
        'Cache-Control': 'no-cache',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[api/tts] Neural TTS error:', error);
    return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 500 });
  }
}
