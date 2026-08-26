// POST /api/twilio/status — Call status callback
// Twilio calls this when a call ENDS (completed, failed, busy, no-answer).
// This is where we assemble the full call record and save it to MongoDB CRM.

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { generateCallSummary } from '@/lib/ai';
import { syncTwilioCallToCRM } from '@/lib/crm-sync';

export async function POST(request) {
  let callSid = '';
  let callStatus = '';
  let callDuration = 0;
  let from = '';
  let to = '';
  let direction = 'inbound';

  try {
    const formData = await request.formData();
    callSid       = formData.get('CallSid')       || '';
    callStatus    = formData.get('CallStatus')     || '';
    callDuration  = parseInt(formData.get('CallDuration') || '0');
    from          = formData.get('From')           || '';
    to            = formData.get('To')             || '';
    direction     = formData.get('Direction')      || 'inbound';
  } catch (e) {
    const { searchParams } = new URL(request.url);
    callSid       = searchParams.get('CallSid')       || '';
    callStatus    = searchParams.get('CallStatus')     || '';
    callDuration  = parseInt(searchParams.get('CallDuration') || '0');
    from          = searchParams.get('From')           || '';
    to            = searchParams.get('To')             || '';
  }

  // Only process on call end
  const terminalStatuses = ['completed', 'failed', 'busy', 'no-answer', 'canceled'];
  if (!terminalStatuses.includes(callStatus)) {
    return new NextResponse('OK', { status: 200 });
  }

  try {
    await connectDB();
    const session = await CallSession.findOne({ callSid });

    const language    = session?.language || 'english';
    const transcript  = session?.transcript || [];
    const mode        = session?.mode || 'talk';

    let status     = 'completed';
    let resolution = 'pending';

    if (callStatus === 'no-answer' || callStatus === 'missed') {
      status = 'missed';
      resolution = 'pending';
    } else if (mode === 'voicemail') {
      status = 'voicemail';
      resolution = 'pending';
    }

    let summary       = 'Customer called GJ SpaCes.';
    let queryCategory = 'inquiry';
    let sentiment     = 'neutral';
    let aiResolution  = resolution;

    if (transcript.length > 2 && callStatus === 'completed') {
      try {
        const summaryResult = await generateCallSummary(transcript, language);
        summary       = summaryResult.summary       || summary;
        queryCategory = summaryResult.queryCategory || queryCategory;
        sentiment     = summaryResult.sentiment     || sentiment;
        aiResolution  = summaryResult.resolution    || aiResolution;
      } catch (aiErr) {
        console.warn('[twilio/status] AI summary warning:', aiErr.message);
      }
    }

    if (mode === 'voicemail') {
      summary       = session?.recordingTranscript
        ? `Voicemail: "${session.recordingTranscript.substring(0, 150)}"`
        : 'Customer left a voicemail message.';
      queryCategory = 'inquiry';
      aiResolution  = 'pending';
    }

    // Save final call record to MongoDB CRM
    await syncTwilioCallToCRM(callSid, {
      session,
      from,
      to,
      direction: direction === 'outbound-api' ? 'outbound' : 'inbound',
      duration: callDuration,
      status,
      summary,
      queryCategory,
      sentiment,
      resolution: aiResolution,
      isEnded: true,
    });

    if (session) {
      session.status = 'ended';
      await session.save();
    }

    console.log(`[twilio/status] ✓ Finalized call ${callSid} (${callStatus}, ${callDuration}s)`);
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('[twilio/status] Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
