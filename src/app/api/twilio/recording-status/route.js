// POST /api/twilio/recording-status — Called when whole-call recording completes
// Saves the Twilio recording URL to CallSession and Call record.

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { Call } from '@/lib/models/Call';
import { syncTwilioCallToCRM } from '@/lib/crm-sync';

export async function POST(request) {
  let callSid = '';
  let recordingUrl = '';
  let recordingSid = '';
  let recordingDuration = 0;

  try {
    const formData = await request.formData();
    callSid = formData.get('CallSid') || '';
    recordingUrl = formData.get('RecordingUrl') || '';
    recordingSid = formData.get('RecordingSid') || '';
    recordingDuration = parseInt(formData.get('RecordingDuration') || '0');
  } catch (e) {
    const { searchParams } = new URL(request.url);
    callSid = searchParams.get('CallSid') || '';
    recordingUrl = searchParams.get('RecordingUrl') || '';
  }

  if (!callSid || !recordingUrl) {
    return new NextResponse('OK', { status: 200 });
  }

  // Twilio recording URLs need .mp3 extension for playback
  const audioUrl = recordingUrl.endsWith('.mp3') ? recordingUrl : recordingUrl + '.mp3';

  console.log(`[recording-status] Call ${callSid}: recording ready (${recordingDuration}s) → ${audioUrl}`);

  try {
    await connectDB();

    // Save to active session
    await CallSession.findOneAndUpdate(
      { callSid },
      { $set: { recordingUrl: audioUrl } }
    );

    // Save directly to Call record via sync helper
    await syncTwilioCallToCRM(callSid, {
      recordingUrl: audioUrl,
      duration: recordingDuration || undefined,
    });

  } catch (err) {
    console.warn('[recording-status] DB error:', err.message);
  }

  return new NextResponse('OK', { status: 200 });
}
