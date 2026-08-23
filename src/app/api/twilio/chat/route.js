// AI conversation loop — supports POST and GET
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { askSakshi } from '@/lib/ai';
import {
  twiml, say, gather, redirect, hangup, webhookUrl,
  detectFarewellFromSpeech, getGreeting
} from '@/lib/twiml';

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
        await session.save();
      }

      xml = twiml(say(farewell, language) + hangup());
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

    // Add to session
    if (session) {
      session.transcript.push({ role: 'customer', text: speechResult });
      session.aiMessages.push({ role: 'user', content: speechResult });
    }

    // Query OpenRouter AI
    let aiReply;
    try {
      const messages = session?.aiMessages || [{ role: 'user', content: speechResult }];
      aiReply = await askSakshi(messages, language);
    } catch (aiError) {
      console.error('[twilio/chat] AI error:', aiError);
      aiReply = language === 'hindi'
        ? 'GJ SpaCes में को-वर्किंग, प्राइवेट केबिन, और इंटीरियर डिजाइनिंग सेवाएं उपलब्ध हैं। आप साइट विजिट भी बुक कर सकते हैं।'
        : language === 'marathi'
        ? 'GJ SpaCes मध्ये को-वर्किंग, खाजगी केबिन आणि इंटिरिअर डिझाइन सेवा उपलब्ध आहेत. आपण साइट व्हिजिट देखील बुक करू शकता.'
        : 'GJ SpaCes offers flexible coworking plans, private cabins, and full interior design solutions.';
    }

    const cleanReply = sanitizeForPhone(aiReply);

    if (session) {
      session.transcript.push({ role: 'bot', text: cleanReply });
      session.aiMessages.push({ role: 'assistant', content: cleanReply });
      await session.save();
    }

    const continuationHints = language === 'hindi'
      ? 'हां,नहीं,ठीक है,धन्यवाद,अलविदा,और बताइए,booking,price'
      : language === 'marathi'
      ? 'हो,नाही,ठीक आहे,धन्यवाद,निरोप,आणखी,booking,price'
      : 'yes,no,okay,thank you,goodbye,more,booking,price,information';

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
