// Entry point for Twilio calls (supports both GET and POST)
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { twiml, gather, redirect, webhookUrl, getGreeting } from '@/lib/twiml';

async function handleVoiceRequest(request) {
  let callSid = '';
  let from = '';
  let to = '';

  try {
    if (request.method === 'POST') {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        callSid = formData.get('CallSid') || '';
        from = formData.get('From') || '';
        to = formData.get('To') || '';
      }
    }
    if (!callSid) {
      const { searchParams } = new URL(request.url);
      callSid = searchParams.get('CallSid') || `LIVE-${Date.now()}`;
      from = searchParams.get('From') || '';
      to = searchParams.get('To') || '';
    }
  } catch (e) {
    callSid = `LIVE-${Date.now()}`;
  }

  // Safely record session in MongoDB (non-blocking if DB is slow)
  connectDB().then(() => {
    return CallSession.findOneAndUpdate(
      { callSid },
      {
        callSid,
        from,
        to,
        language: 'english',
        speechLang: 'en-IN',
        honorific: '',
        mode: '',
        transcript: [],
        aiMessages: [],
        startTime: new Date(),
        status: 'active',
      },
      { upsert: true, new: true }
    );
  }).catch((err) => {
    console.warn('[twilio/voice] Session create warning:', err.message);
  });

  // TwiML: Prompt caller with Sakshi's greeting and listen for speech
  const xml = twiml(
    gather({
      action: webhookUrl('/api/twilio/language'),
      language: 'english',
      hints: 'English,Hindi,Marathi,हिंदी,मराठी,अंग्रेज़ी',
      prompt: getGreeting('intro', 'english'),
      speechTimeout: 'auto',
      maxSpeechTime: 10,
    }) +
    redirect(webhookUrl('/api/twilio/voice'))
  );

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

export async function POST(request) {
  return handleVoiceRequest(request);
}

export async function GET(request) {
  return handleVoiceRequest(request);
}
