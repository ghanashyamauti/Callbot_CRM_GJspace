// Honorific webhook (Sir/Ma'am) — detects Sir/Ma'am then asks for Customer Name
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import {
  twiml, say, gather, redirect, webhookUrl,
  detectHonorificFromSpeech, getGreeting
} from '@/lib/twiml';

async function handleHonorific(request) {
  let callSid = '';
  let speechResult = '';

  try {
    if (request.method === 'POST') {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        callSid = formData.get('CallSid') || '';
        speechResult = formData.get('SpeechResult') || '';
      }
    }
    if (!callSid) {
      const { searchParams } = new URL(request.url);
      callSid = searchParams.get('CallSid') || '';
      speechResult = speechResult || searchParams.get('SpeechResult') || '';
    }
  } catch (e) {}

  let xml;

  try {
    await connectDB();
    const session = await CallSession.findOne({ callSid });
    const language = session?.language || 'english';

    const honorific = detectHonorificFromSpeech(speechResult);
    const honorificLabel = honorific === 'maam' ? "Ma'am" : 'Sir';

    if (session) {
      session.honorific = honorific;
      session.transcript.push({ role: 'bot', text: `Hello ${honorificLabel}!` });
      await session.save();
    }

    // Ask for customer's Name
    const namePrompt = getGreeting('nameAsk', language, honorificLabel);

    xml = twiml(
      gather({
        action: webhookUrl('/api/twilio/name'),
        language,
        prompt: namePrompt,
        speechTimeout: 'auto',
        maxSpeechTime: 8,
      }) +
      redirect(webhookUrl('/api/twilio/name'))
    );

  } catch (error) {
    console.error('[twilio/honorific] Error:', error);
    xml = twiml(say('May I know your name please?', 'english') + redirect(webhookUrl('/api/twilio/name')));
  }

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

export async function POST(request) {
  return handleHonorific(request);
}

export async function GET(request) {
  return handleHonorific(request);
}
