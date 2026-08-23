// POST /api/twilio/voice — Entry point for all incoming calls
// Twilio calls this when a customer dials your Twilio number.
// Creates a call session and plays Sakshi's greeting.

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import {
  twiml, say, gather, redirect, webhookUrl, getGreeting
} from '@/lib/twiml';

export async function POST(request) {
  const formData = await request.formData();
  const callSid  = formData.get('CallSid')  || '';
  const from     = formData.get('From')     || '';
  const to       = formData.get('To')       || '';

  try {
    await connectDB();

    // Create or reset session for this call
    await CallSession.findOneAndUpdate(
      { callSid },
      {
        callSid,
        from,
        to,
        language: 'english',
        speechLang: 'en-IN',
        honorific: '',
        mode: '',
        transcript: [],
        aiMessages: [],
        startTime: new Date(),
        status: 'active',
      },
      { upsert: true, new: true }
    );

    // Sakshi's opening greeting + language selection
    const xml = twiml(
      say(getGreeting('intro', 'english'), 'english') +
      gather({
        action: webhookUrl('/api/twilio/language'),
        language: 'english',
        hints: 'English,Hindi,Marathi,हिंदी,मराठी,अंग्रेज़ी',
        prompt: '', // already said above
        speechTimeout: 'auto',
        maxSpeechTime: 8,
      }) +
      // If no input, retry
      redirect(webhookUrl('/api/twilio/voice'))
    );

    return new NextResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch (error) {
    console.error('[twilio/voice] Error:', error);
    // Fallback: just greet and hang up gracefully
    const xml = twiml(
      say('Hello, thank you for calling GJ SpaCes. We are experiencing technical difficulties. Please try again shortly. Goodbye!', 'english') +
      '<Hangup/>'
    );
    return new NextResponse(xml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
