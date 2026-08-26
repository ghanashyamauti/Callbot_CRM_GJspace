// Language detection → immediately ask for Name (streamlined, skip honorific)
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import {
  twiml, gather, say, record, redirect, webhookUrl,
  detectLanguageFromSpeech, detectModeFromSpeech, getGreeting
} from '@/lib/twiml';
import { syncTwilioCallToCRM } from '@/lib/crm-sync';

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

    // No speech or too low confidence — retry language prompt
    if (!speechResult || confidence < 0.15) {
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

    // If user says 'leave a message' or 'record' during intro, go straight to voicemail
    if (detectModeFromSpeech(speechResult) === 'voicemail') {
      if (session) {
        session.language = language;
        session.speechLang = speechLang;
        session.mode = 'voicemail';
        await session.save();
        await syncTwilioCallToCRM(callSid, { session, status: 'voicemail' });
      }

      const vmPrompt = getGreeting('voicemailReady', language);
      xml = twiml(
        say(vmPrompt, language) +
        record({
          action: webhookUrl('/api/twilio/voicemail'),
          maxLength: 120,
          playBeep: true,
          transcribe: true,
          transcribeCallback: webhookUrl('/api/twilio/voicemail-transcript'),
        })
      );
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

    if (session) {
      session.language = language;
      session.speechLang = speechLang;
      session.honorific = 'sir';
      session.transcript.push({ role: 'customer', text: `Selected: ${language}` });
      await session.save();
      await syncTwilioCallToCRM(callSid, { session, status: 'in-progress' });
    }

    // Go straight to asking the customer's name (no honorific step)
    const namePrompt = getGreeting('nameAsk', language);

    xml = twiml(
      gather({
        action: webhookUrl('/api/twilio/name'),
        language,
        prompt: namePrompt,
        speechTimeout: 'auto',
        maxSpeechTime: 10,
        hints: language === 'hindi' ? 'मेरा नाम,मैं,my name is' 
             : language === 'marathi' ? 'माझे नाव,मी,my name is'
             : 'my name is,I am,this is',
      }) +
      redirect(webhookUrl('/api/twilio/name'))
    );

  } catch (error) {
    console.error('[twilio/language] Error:', error);
    xml = twiml(
      gather({
        action: webhookUrl('/api/twilio/name'),
        language: 'english',
        prompt: 'May I know your good name please?',
        speechTimeout: 'auto',
        maxSpeechTime: 10,
      }) +
      redirect(webhookUrl('/api/twilio/name'))
    );
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
