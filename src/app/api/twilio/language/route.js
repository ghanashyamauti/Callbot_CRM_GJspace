// Language detection webhook (supports POST and GET)
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import {
  twiml, say, gather, redirect, webhookUrl,
  detectLanguageFromSpeech, getGreeting
} from '@/lib/twiml';

async function handleLanguage(request) {
  let callSid = '';
  let speechResult = '';
  let confidence = 1;

  try {
    if (request.method === 'POST') {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        callSid = formData.get('CallSid') || '';
        speechResult = formData.get('SpeechResult') || '';
        confidence = parseFloat(formData.get('Confidence') || '1');
      }
    }
    if (!callSid || !speechResult) {
      const { searchParams } = new URL(request.url);
      callSid = callSid || searchParams.get('CallSid') || '';
      speechResult = speechResult || searchParams.get('SpeechResult') || '';
    }
  } catch (e) {}

  let xml;

  try {
    await connectDB();
    const session = await CallSession.findOne({ callSid });

    // No speech or low confidence — retry
    if (!speechResult || confidence < 0.2) {
      xml = twiml(
        gather({
          action: webhookUrl('/api/twilio/language'),
          language: 'english',
          hints: 'English,Hindi,Marathi,हिंदी,मराठी',
          prompt: getGreeting('langRetry'),
          speechTimeout: 'auto',
          maxSpeechTime: 8,
        }) +
        redirect(webhookUrl('/api/twilio/voice'))
      );
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

    const { language, speechLang } = detectLanguageFromSpeech(speechResult);

    if (session) {
      session.language = language;
      session.speechLang = speechLang;
      await session.save();
    }

    const honorificPrompt = getGreeting('honorificAsk', language);
    const hints = language === 'hindi'
      ? 'Sir,Ma\'am,Madam,सर,मैडम'
      : language === 'marathi'
      ? 'Sir,Ma\'am,Madam,सर,मॅडम'
      : 'Sir,Ma\'am,Madam';

    xml = twiml(
      gather({
        action: webhookUrl('/api/twilio/honorific'),
        language,
        hints,
        prompt: honorificPrompt,
        speechTimeout: 'auto',
        maxSpeechTime: 6,
      }) +
      redirect(webhookUrl('/api/twilio/language'))
    );

  } catch (error) {
    console.error('[twilio/language] Error:', error);
    xml = twiml(say('Sorry, something went wrong. Please call again.', 'english') + '<Hangup/>');
  }

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

export async function POST(request) {
  return handleLanguage(request);
}

export async function GET(request) {
  return handleLanguage(request);
}
