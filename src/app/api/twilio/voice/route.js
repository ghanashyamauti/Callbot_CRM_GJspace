// Entry point for Twilio calls (supports GET and POST)
// Automatically initiates full-call dual audio recording and creates live MongoDB session.
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { twiml, gather, redirect, webhookUrl, getGreeting } from '@/lib/twiml';

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;

// Start full-call dual-channel recording via Twilio REST API
// Records BOTH user's real voice + Sakshi's voice on separate channels
async function startCallRecording(callSid) {
  if (!callSid || !TWILIO_SID || !TWILIO_AUTH) return;
  try {
    const authHeader = 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString('base64');
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls/${callSid}/Recordings.json`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          RecordingChannels: 'dual',  // Both sides recorded
          RecordingStatusCallback: webhookUrl('/api/twilio/recording-status'),
          RecordingStatusCallbackEvent: 'completed',
        }).toString(),
      }
    );
    const data = await res.json();
    console.log(`[twilio/voice] Recording started: ${data.sid || 'unknown'}`);
  } catch (err) {
    console.warn('[twilio/voice] Recording start warning:', err.message);
  }
}


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

  // Start background whole-call recording
  if (callSid && !callSid.startsWith('LIVE-')) {
    startCallRecording(callSid).catch(() => {});
  }

  // Safely record session in MongoDB
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
      { upsert: true, returnDocument: 'after' }
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
