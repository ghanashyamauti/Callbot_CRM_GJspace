// Honorific webhook (Sir/Ma'am) — supports POST and GET
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

    const modePrompt = getGreeting('modeAsk', language);
    const hints = language === 'hindi'
      ? 'बात करना,बात,talk,message,संदेश छोड़ना,voicemail'
      : language === 'marathi'
      ? 'बोलणे,बोला,talk,message,संदेश,voicemail'
      : 'talk,information,message,leave a message,voicemail';

    xml = twiml(
      gather({
        action: webhookUrl('/api/twilio/mode'),
        language,
        hints,
        prompt: modePrompt,
        speechTimeout: 'auto',
        maxSpeechTime: 10,
      }) +
      redirect(webhookUrl('/api/twilio/honorific'))
    );

  } catch (error) {
    console.error('[twilio/honorific] Error:', error);
    xml = twiml(say('How can I help you today? Please tell me.', 'english') + redirect(webhookUrl('/api/twilio/chat')));
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
