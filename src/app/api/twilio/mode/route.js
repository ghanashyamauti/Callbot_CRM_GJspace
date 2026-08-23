// POST /api/twilio/mode — Detects Talk vs Voicemail choice
// Routes to either the AI chat loop or the voicemail recorder

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import {
  twiml, say, gather, redirect, record, webhookUrl,
  detectModeFromSpeech, getGreeting
} from '@/lib/twiml';

export async function POST(request) {
  const formData     = await request.formData();
  const callSid      = formData.get('CallSid')      || '';
  const speechResult  = formData.get('SpeechResult') || '';

  let xml;

  try {
    await connectDB();
    const session = await CallSession.findOne({ callSid });
    const language = session?.language || 'english';
    const honorific = session?.honorific === 'maam' ? "Ma'am" : 'Sir';

    if (!speechResult) {
      xml = twiml(
        say(getGreeting('modeRetry', language), language) +
        gather({
          action: webhookUrl('/api/twilio/mode'),
          language,
          hints: 'talk,message,voicemail,बात,संदेश',
          speechTimeout: 'auto',
          maxSpeechTime: 8,
        }) +
        redirect(webhookUrl('/api/twilio/mode'))
      );
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

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

      // Add bot opening to transcript + aiMessages
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
        say(talkPrompt, language) +
        gather({
          action: webhookUrl('/api/twilio/chat'),
          language,
          hints: listenHints,
          speechTimeout: 'auto',
          maxSpeechTime: 30,
        }) +
        // If silence, gently prompt
        say(
          language === 'hindi' ? 'क्या आप अभी भी वहां हैं? बताइए मैं आपकी कैसे मदद कर सकती हूं।'
          : language === 'marathi' ? 'आपण अजून आहात का? सांगा मी कशी मदत करू.'
          : 'Are you still there? Please go ahead and ask your question.',
          language
        ) +
        redirect(webhookUrl('/api/twilio/mode'))
      );
    }

  } catch (error) {
    console.error('[twilio/mode] Error:', error);
    xml = twiml(say('Sorry, something went wrong. Please call again.', 'english') + '<Hangup/>');
  }

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
