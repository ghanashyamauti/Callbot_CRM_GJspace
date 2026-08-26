// POST /api/twilio/voicemail — Called when recording completes
// Saves recording URL and thanks the customer.
// The actual transcription comes via /api/twilio/voicemail-transcript (async)

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { twiml, say, hangup, getGreeting } from '@/lib/twiml';
import { syncTwilioCallToCRM } from '@/lib/crm-sync';

export async function POST(request) {
  let callSid = '';
  let recordingUrl = '';
  let recordingDuration = '0';

  try {
    const formData = await request.formData();
    callSid = formData.get('CallSid') || '';
    recordingUrl = formData.get('RecordingUrl') || '';
    recordingDuration = formData.get('RecordingDuration') || '0';
  } catch (e) {
    const { searchParams } = new URL(request.url);
    callSid = searchParams.get('CallSid') || '';
    recordingUrl = searchParams.get('RecordingUrl') || '';
  }

  let xml;

  try {
    await connectDB();
    const session = await CallSession.findOne({ callSid });
    const language = session?.language || 'english';

    if (session) {
      session.recordingUrl = recordingUrl ? (recordingUrl.endsWith('.mp3') ? recordingUrl : recordingUrl + '.mp3') : null;
      const duration = parseInt(recordingDuration);

      const vmText = `[Voicemail recorded: ${duration} seconds]`;
      session.transcript.push({ role: 'customer', text: vmText });
      const thankText = getGreeting('voicemailSaved', language);
      session.transcript.push({ role: 'bot', text: thankText });
      session.mode = 'voicemail';
      await session.save();

      // Sync to CRM
      await syncTwilioCallToCRM(callSid, {
        session,
        isEnded: true,
        status: 'voicemail',
        duration,
        recordingUrl: session.recordingUrl,
      });
    }

    const farewell = getGreeting('voicemailSaved', language || 'english');
    xml = twiml(say(farewell, session?.language || 'english') + hangup());

  } catch (error) {
    console.error('[twilio/voicemail] Error:', error);
    xml = twiml(say('Your message has been saved. Thank you! Goodbye!', 'english') + hangup());
  }

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
