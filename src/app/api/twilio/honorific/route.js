// POST /api/twilio/honorific — Detects Sir or Ma'am from speech
// Updates session with honorific, then asks Talk vs Voicemail

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import {
  twiml, say, gather, redirect, webhookUrl,
  detectHonorificFromSpeech, getGreeting
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

    if (!speechResult) {
      // Retry
      xml = twiml(
        say(getGreeting('honorificRetry', language), language) +
        gather({
          action: webhookUrl('/api/twilio/honorific'),
          language,
          hints: 'Sir,Ma\'am,Madam',
          speechTimeout: 'auto',
          maxSpeechTime: 5,
        }) +
        redirect(webhookUrl('/api/twilio/honorific'))
      );
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

    const honorific = detectHonorificFromSpeech(speechResult);

    if (session) {
      session.honorific = honorific;
      // Add Sakshi's greeting with honorific to transcript
      const honorificLabel = honorific === 'maam' ? "Ma'am" : 'Sir';
      const greeting = getGreeting('modeAsk', language);
      session.transcript.push({ role: 'bot', text: `Hello ${honorificLabel}! ${greeting}` });
      await session.save();
    }

    const honorificLabel = honorific === 'maam' ? "Ma'am" : 'Sir';
    const modePrompt = getGreeting('modeAsk', language);
    const hints = language === 'hindi'
      ? 'बात करना,बात,talk,message,संदेश छोड़ना,voicemail'
      : language === 'marathi'
      ? 'बोलणे,बोला,talk,message,संदेश,voicemail'
      : 'talk,information,message,leave a message,voicemail';

    // Greet with honorific + ask mode
    const greetText = language === 'hindi'
      ? `ठीक है ${honorificLabel}! GJ SpaCes में आपका स्वागत है।`
      : language === 'marathi'
      ? `ठीक आहे ${honorificLabel}! GJ SpaCes मध्ये आपले स्वागत आहे.`
      : `Perfect ${honorificLabel}! Welcome to GJ SpaCes.`;

    xml = twiml(
      say(greetText, language) +
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
    xml = twiml(say('Sorry, something went wrong. Please call again.', 'english') + '<Hangup/>');
  }

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
