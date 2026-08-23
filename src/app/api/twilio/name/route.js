// Customer Name webhook — captures caller name, personalizes greeting, and asks Talk vs Message
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { Customer } from '@/lib/models/Customer';
import {
  twiml, say, gather, redirect, webhookUrl,
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
    const honorific = session?.honorific === 'maam' ? "Ma'am" : 'Sir';

    const customerName = extractNameFromSpeech(speechResult) || honorific;

    if (session) {
      session.customerName = customerName;
      session.transcript.push({ role: 'customer', text: speechResult || customerName });
      await session.save();

      // Upsert customer in MongoDB
      if (session.from && customerName && customerName !== 'Sir' && customerName !== "Ma'am") {
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

    const greetPrompt = getGreeting('nameGreet', language, customerName);
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
        prompt: greetPrompt,
        speechTimeout: 'auto',
        maxSpeechTime: 10,
      }) +
      redirect(webhookUrl('/api/twilio/mode'))
    );

  } catch (error) {
    console.error('[twilio/name] Error:', error);
    xml = twiml(say('Would you like to talk to me or leave a message?', 'english') + redirect(webhookUrl('/api/twilio/mode')));
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
