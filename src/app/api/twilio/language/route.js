// POST /api/twilio/language — Detects language from customer's speech
// SpeechResult will be "English", "Hindi", "Marathi" (or local variants)
// Updates session, then asks Sir/Ma'am

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import {
  twiml, say, gather, redirect, webhookUrl,
  detectLanguageFromSpeech, getGreeting
} from '@/lib/twiml';

export async function POST(request) {
  const formData    = await request.formData();
  const callSid     = formData.get('CallSid')      || '';
  const speechResult = formData.get('SpeechResult') || '';
  const confidence  = parseFloat(formData.get('Confidence') || '0');

  let xml;

  try {
    await connectDB();
    const session = await CallSession.findOne({ callSid });

    // Low confidence or no speech — retry
    if (!speechResult || confidence < 0.3) {
      xml = twiml(
        say(getGreeting('langRetry'), 'english') +
        gather({
          action: webhookUrl('/api/twilio/language'),
          language: 'english',
          hints: 'English,Hindi,Marathi,हिंदी,मराठी',
          speechTimeout: 'auto',
          maxSpeechTime: 8,
        }) +
        redirect(webhookUrl('/api/twilio/voice'))
      );
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

    const { language, speechLang } = detectLanguageFromSpeech(speechResult);

    // Update session
    if (session) {
      session.language   = language;
      session.speechLang = speechLang;
      // Add bot's language-confirmed message to transcript
      const confirmText = language === 'hindi'
        ? 'भाषा चुनने के लिए धन्यवाद!'
        : language === 'marathi'
        ? 'भाषा निवडल्याबद्दल धन्यवाद!'
        : 'Thank you!';
      await session.save();
    }

    // Ask Sir or Ma'am in the detected language
    const honorificPrompt = getGreeting('honorificAsk', language);
    const hints = language === 'hindi'
      ? 'Sir,Ma\'am,Madam,सर,मैडम'
      : language === 'marathi'
      ? 'Sir,Ma\'am,Madam,सर,मॅडम'
      : 'Sir,Ma\'am,Madam';

    xml = twiml(
      say(honorificPrompt, language) +
      gather({
        action: webhookUrl('/api/twilio/honorific'),
        language,
        hints,
        speechTimeout: 'auto',
        maxSpeechTime: 6,
      }) +
      // Retry if no input
      redirect(webhookUrl('/api/twilio/language'))
    );

  } catch (error) {
    console.error('[twilio/language] Error:', error);
    xml = twiml(
      say('Sorry, something went wrong. Please call again.', 'english') +
      '<Hangup/>'
    );
  }

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
