// AI conversation loop — supports POST and GET
// Automatically synchronizes live call record & transcript to MongoDB CRM on every turn
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { askSakshi } from '@/lib/ai';
import {
  twiml, say, gather, record, redirect, hangup, webhookUrl,
  detectFarewellFromSpeech, detectModeFromSpeech, getGreeting
} from '@/lib/twiml';
import { syncTwilioCallToCRM } from '@/lib/crm-sync';

function sanitizeForPhone(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/✓|✔|•|→|🎉|😊|🙏|💰|📋|⚠️|🏢|📊/g, '')
    .replace(/₹/g, 'rupees ')
    .replace(/\n+/g, '. ')
    .trim();
}

async function handleChat(request) {
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

    // Low confidence or silence
    if (!speechResult || confidence < 0.2) {
      const reprompt = language === 'hindi'
        ? 'मुझे सुनाई नहीं दिया। कृपया फिर से बोलें।'
        : language === 'marathi'
        ? 'मला ऐकू नाही आले. कृपया पुन्हा सांगा.'
        : 'Sorry, I didn\'t catch that. Please say that again.';

      xml = twiml(
        gather({
          action: webhookUrl('/api/twilio/chat'),
          language,
          prompt: reprompt,
          speechTimeout: 'auto',
          maxSpeechTime: 30,
        }) +
        redirect(webhookUrl('/api/twilio/chat'))
      );
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

    // Check for farewell
    if (detectFarewellFromSpeech(speechResult)) {
      const farewell = getGreeting('farewell', language);

      if (session) {
        session.transcript.push({ role: 'customer', text: speechResult });
        session.transcript.push({ role: 'bot', text: farewell });
        session.status = 'ended';
        await session.save();
        // Await CRM sync on farewell
        await syncTwilioCallToCRM(callSid, { session, isEnded: true, status: 'completed' });
      }

      xml = twiml(say(farewell, language) + hangup());
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

    // Check for voicemail / leave message intent
    if (detectModeFromSpeech(speechResult) === 'voicemail') {
      const vmPrompt = getGreeting('voicemailReady', language);

      if (session) {
        session.transcript.push({ role: 'customer', text: speechResult });
        session.transcript.push({ role: 'bot', text: vmPrompt });
        session.mode = 'voicemail';
        await session.save();
        await syncTwilioCallToCRM(callSid, { session, status: 'voicemail' });
      }

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

    // Add to session
    if (session) {
      session.transcript.push({ role: 'customer', text: speechResult });
      session.aiMessages.push({ role: 'user', content: speechResult });
    }

    // Query AI Brain (Groq / OpenRouter)
    let aiReply;
    try {
      const messages = session?.aiMessages || [{ role: 'user', content: speechResult }];
      aiReply = await askSakshi(messages, language);
    } catch (aiError) {
      console.error('[twilio/chat] AI error:', aiError);
      aiReply = language === 'hindi'
        ? 'GJ SpaCes में प्लॉट, फ्लैट और प्रॉपर्टी उपलब्ध हैं। हमारी टीम जल्द ही आपसे संपर्क करेगी।'
        : language === 'marathi'
        ? 'GJ SpaCes मध्ये प्लॉट, फ्लॅट आणि प्रॉपर्टी उपलब्ध आहेत. आमची टीम लवकरच आपल्याशी संपर्क करेल.'
        : 'GJ SpaCes offers residential plots, flats, and property solutions in Pune. Our team will contact you shortly with details.';
    }

    const cleanReply = sanitizeForPhone(aiReply);

    if (session) {
      session.transcript.push({ role: 'bot', text: cleanReply });
      session.aiMessages.push({ role: 'assistant', content: cleanReply });
      await session.save();
      // Crucial: Await CRM sync so MongoDB persists before response returns!
      await syncTwilioCallToCRM(callSid, { session, status: 'completed' });
    }

    const continuationHints = language === 'hindi'
      ? 'हां,नहीं,ठीक है,धन्यवाद,अलविदा,और बताइए,message,संदेश,record'
      : language === 'marathi'
      ? 'हो,नाही,ठीक आहे,धन्यवाद,निरोप,आणखी,message,संदेश,record'
      : 'yes,no,okay,thank you,goodbye,more,message,record,voicemail,leave a message';

    xml = twiml(
      gather({
        action: webhookUrl('/api/twilio/chat'),
        language,
        hints: continuationHints,
        prompt: cleanReply,
        speechTimeout: 'auto',
        maxSpeechTime: 30,
      }) +
      say(getGreeting('farewell', language), language) +
      hangup()
    );

  } catch (error) {
    console.error('[twilio/chat] Error:', error);
    xml = twiml(say('Thank you for calling GJ SpaCes! Have a wonderful day.', 'english') + hangup());
  }

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

export async function POST(request) {
  return handleChat(request);
}

export async function GET(request) {
  return handleChat(request);
}
