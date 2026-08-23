// POST /api/twilio/status — Call status callback
// Twilio calls this when a call ENDS (completed, failed, busy, no-answer).
// This is where we assemble the full call record and save it to MongoDB CRM.

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { addCall } from '@/lib/store';
import { generateCallSummary } from '@/lib/ai';
import { v4 as uuidv4 } from 'uuid';

function generateWaveform(len = 60) {
  return Array.from({ length: len }, () => Math.random() * 0.8 + 0.2);
}

function generateCallId(callSid) {
  return 'CALL-' + callSid.substring(0, 8).toUpperCase();
}

export async function POST(request) {
  const formData      = await request.formData();
  const callSid       = formData.get('CallSid')       || '';
  const callStatus    = formData.get('CallStatus')     || '';
  const callDuration  = parseInt(formData.get('CallDuration') || '0');
  const from          = formData.get('From')           || '';
  const to            = formData.get('To')             || '';
  const direction     = formData.get('Direction')      || 'inbound';

  // Only process on call end
  const terminalStatuses = ['completed', 'failed', 'busy', 'no-answer', 'canceled'];
  if (!terminalStatuses.includes(callStatus)) {
    return new NextResponse('OK', { status: 200 });
  }

  try {
    await connectDB();
    const session = await CallSession.findOne({ callSid });

    if (!session || session.status === 'ended') {
      return new NextResponse('OK', { status: 200 });
    }

    session.status = 'ended';
    await session.save();

    const language    = session.language || 'english';
    const transcript  = session.transcript || [];
    const mode        = session.mode || 'talk';

    // Determine status and resolution
    let status     = 'completed';
    let resolution = 'pending';

    if (callStatus === 'no-answer' || callStatus === 'missed') {
      status = 'missed';
      resolution = 'pending';
    } else if (mode === 'voicemail') {
      status = 'voicemail';
      resolution = 'pending';
    }

    // Generate AI summary from transcript (if any conversation happened)
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
        console.warn('[twilio/status] AI summary failed:', aiErr.message);
      }
    }

    if (mode === 'voicemail') {
      summary       = session.recordingTranscript
        ? `Voicemail: "${session.recordingTranscript.substring(0, 150)}"`
        : 'Customer left a voicemail message.';
      queryCategory = 'inquiry';
      aiResolution  = 'pending';
    }

    // Format timestamps
    const endTime   = new Date();
    const startTime = session.startTime || new Date(endTime.getTime() - callDuration * 1000);

    // Build the full call record
    const callData = {
      id:               uuidv4(),
      callId:           generateCallId(callSid),
      customerName:     formatPhoneAsName(from),  // Will be enriched if customer gave name
      customerPhone:    from,
      customerEmail:    '',
      customerLocation: 'Pune',
      direction:        direction === 'outbound-api' ? 'outbound' : 'inbound',
      status,
      duration:         callDuration,
      startTime:        startTime.toISOString(),
      endTime:          endTime.toISOString(),
      transcript:       transcript.map((m, i) => ({
        ...m,
        timestamp: Math.round((i + 1) * callDuration / Math.max(transcript.length, 1)),
      })),
      voicemail:        session.recordingTranscript || null,
      recordingUrl:     session.recordingUrl || null,
      summary,
      queryCategory,
      queryType:        queryCategory,
      sentiment,
      resolution:       aiResolution,
      language,
      waveformData:     generateWaveform(),
      createdAt:        startTime.toISOString(),
    };

    await addCall(callData);

    // Clean up session after saving call
    await CallSession.deleteOne({ callSid });

    console.log(`[twilio/status] Saved call ${callData.callId} (${callStatus}, ${callDuration}s)`);
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('[twilio/status] Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

// Format phone number as a readable display name until we have the real name
function formatPhoneAsName(phone) {
  if (!phone) return 'Unknown Caller';
  // Remove country code and format nicely
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return `Caller ${last10.slice(0, 5)}xxxxx`;
  }
  return 'Unknown Caller';
}
