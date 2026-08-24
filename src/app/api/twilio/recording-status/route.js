// POST /api/twilio/recording-status — Called when whole-call recording completes
// Saves the Twilio recording URL to CallSession and Call record.
// This is NOT for voicemail — it's for the full dual-channel call recording.

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { Call } from '@/lib/models/Call';

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
    console.warn('[recording-status] Failed to parse form data:', e.message);
    return new NextResponse('OK', { status: 200 });
  }

  if (!callSid || !recordingUrl) {
    return new NextResponse('OK', { status: 200 });
  }

  // Twilio recording URLs need .mp3 extension for playback
  const audioUrl = recordingUrl.endsWith('.mp3') ? recordingUrl : recordingUrl + '.mp3';

  console.log(`[recording-status] Call ${callSid}: recording ready (${recordingDuration}s) → ${audioUrl}`);

  try {
    await connectDB();

    // Save to active session (if still alive)
    await CallSession.findOneAndUpdate(
      { callSid },
      { $set: { recordingUrl: audioUrl } }
    );

    // Also save directly to Call record (in case status webhook already ran)
    const callId = 'CALL-' + callSid.substring(0, 8).toUpperCase();
    await Call.findOneAndUpdate(
      { callId },
      { $set: { recordingUrl: audioUrl } }
    );

  } catch (err) {
    console.warn('[recording-status] DB error:', err.message);
  }

  // Return 200 OK (no TwiML needed — this is a status callback, not a call flow webhook)
  return new NextResponse('OK', { status: 200 });
}
