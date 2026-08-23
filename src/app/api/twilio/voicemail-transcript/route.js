// POST /api/twilio/voicemail-transcript — Async transcription callback
// Twilio calls this AFTER it finishes transcribing the recorded audio.
// Updates the session and call record with the actual text.

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { Call } from '@/lib/models/Call';

export async function POST(request) {
  const formData        = await request.formData();
  const callSid         = formData.get('CallSid')              || '';
  const transcriptionText = formData.get('TranscriptionText')  || '';
  const transcriptionStatus = formData.get('TranscriptionStatus') || '';
  const recordingUrl    = formData.get('RecordingUrl')         || '';

  try {
    await connectDB();

    if (transcriptionStatus === 'completed' && transcriptionText) {
      // Update call session
      const session = await CallSession.findOne({ callSid });
      if (session) {
        session.recordingTranscript = transcriptionText;
        // Update the placeholder voicemail entry in transcript
        const vmIdx = session.transcript.findIndex(t =>
          t.role === 'customer' && t.text.includes('[Voicemail recorded')
        );
        if (vmIdx !== -1) {
          session.transcript[vmIdx].text = transcriptionText;
        }
        await session.save();
      }

      // Also update the Call record if it already exists
      await Call.findOneAndUpdate(
        { callId: callSid },
        { $set: { voicemail: transcriptionText, 'transcript.$[elem].text': transcriptionText } },
        { arrayFilters: [{ 'elem.text': { $regex: /\[Voicemail recorded/ } }] }
      ).catch(() => {}); // non-fatal
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[twilio/voicemail-transcript] Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
