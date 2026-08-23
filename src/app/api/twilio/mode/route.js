// Mode choice webhook (Talk vs Voicemail) — supports POST and GET
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import {
  twiml, say, gather, redirect, record, webhookUrl,
  detectModeFromSpeech, getGreeting
} from '@/lib/twiml';

async function handleMode(request) {
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
    const honorific = session?.honorific === 'maam' ? "Ma'am" : 'Sir';

    const mode = detectModeFromSpeech(speechResult);

    if (session) {
      session.mode = mode;
      await session.save();
    }

    if (mode === 'voicemail') {
      // === VOICEMAIL FLOW ===
      const vmPrompt = getGreeting('voicemailReady', language);
      xml = twiml(
        say(vmPrompt, language) +
        record({
          action: webhookUrl('/api/twilio/voicemail'),
          maxLength: 120,
          playBeep: true,
          transcribe: true,
          transcribeCallback: webhookUrl('/api/twilio/voicemail-transcript'),
          finishOnKey: '#',
        })
      );
    } else {
      // === TALK FLOW ===
      const talkPrompt = getGreeting('talkReady', language, honorific);

      if (session) {
        session.transcript.push({ role: 'bot', text: talkPrompt });
        session.aiMessages.push({ role: 'assistant', content: talkPrompt });
        await session.save();
      }

      const listenHints = language === 'hindi'
        ? 'जानकारी,बुकिंग,मूल्य,price,booking,information,problem,शिकायत'
        : language === 'marathi'
        ? 'माहिती,बुकिंग,किंमत,price,booking,information,problem,तक्रार'
        : 'information,price,booking,coworking,interior design,problem,complaint,help';

      xml = twiml(
        gather({
          action: webhookUrl('/api/twilio/chat'),
          language,
          hints: listenHints,
          prompt: talkPrompt,
          speechTimeout: 'auto',
          maxSpeechTime: 30,
        }) +
        redirect(webhookUrl('/api/twilio/chat'))
      );
    }

  } catch (error) {
    console.error('[twilio/mode] Error:', error);
    xml = twiml(say('Please tell me your query, how can I assist you?', 'english') + redirect(webhookUrl('/api/twilio/chat')));
  }

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

export async function POST(request) {
  return handleMode(request);
}

export async function GET(request) {
  return handleMode(request);
}
