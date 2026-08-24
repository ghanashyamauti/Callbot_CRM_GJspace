// Customer Name → Greet personally → go straight to AI chat (skip mode selection)
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { Customer } from '@/lib/models/Customer';
import {
  twiml, gather, redirect, webhookUrl,
  extractNameFromSpeech, getGreeting
} from '@/lib/twiml';

async function handleName(request) {
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

    const customerName = extractNameFromSpeech(speechResult) || 'Sir';

    if (session) {
      session.customerName = customerName;
      session.mode = 'talk'; // default to talk (skip mode selection step)
      session.transcript.push({ role: 'customer', text: speechResult || customerName });
      await session.save();

      // Upsert customer in MongoDB CRM
      if (session.from && customerName && customerName !== 'Sir' && customerName !== 'Caller') {
        Customer.findOneAndUpdate(
          { phone: session.from },
          {
            $set: { name: customerName, lastCallDate: new Date() },
            $inc: { totalCalls: 1 },
            $setOnInsert: { createdAt: new Date(), email: '', location: 'Pune', tags: ['lead'] },
          },
          { upsert: true, returnDocument: 'after' }
        ).catch(() => {});
      }
    }

    // Greet by name and go straight to AI chat — no mode selection
    const greetPrompt = getGreeting('nameGreet', language, customerName);

    if (session) {
      session.transcript.push({ role: 'bot', text: greetPrompt });
      session.aiMessages.push({ role: 'assistant', content: greetPrompt });
      await session.save();
    }

    const chatHints = language === 'hindi'
      ? 'जानकारी,प्लॉट,फ्लैट,प्रॉपर्टी,message,संदेश,record,धन्यवाद'
      : language === 'marathi'
      ? 'माहिती,प्लॉट,फ्लॅट,प्रॉपर्टी,message,संदेश,record,धन्यवाद'
      : 'information,plot,flat,property,message,record,voicemail,thank you,bye';

    xml = twiml(
      gather({
        action: webhookUrl('/api/twilio/chat'),
        language,
        hints: chatHints,
        prompt: greetPrompt,
        speechTimeout: 'auto',
        maxSpeechTime: 30,
      }) +
      redirect(webhookUrl('/api/twilio/chat'))
    );

  } catch (error) {
    console.error('[twilio/name] Error:', error);
    xml = twiml(
      gather({
        action: webhookUrl('/api/twilio/chat'),
        language: 'english',
        prompt: 'How can I help you today?',
        speechTimeout: 'auto',
        maxSpeechTime: 30,
      }) +
      redirect(webhookUrl('/api/twilio/chat'))
    );
  }

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

export async function POST(request) {
  return handleName(request);
}

export async function GET(request) {
  return handleName(request);
}
