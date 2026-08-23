import { NextResponse } from 'next/server';
import { addCall } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

// POST /api/simulate
// Saves a completed AI call to the database.
// Body: full call object from the frontend after AI conversation ends.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    // If it's a legacy simulation request (category/directConnect), return error
    // The new flow sends a full call object from the AI conversation
    const callData = {
      id: body.id || uuidv4(),
      callId: body.callId || ('CALL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase()),
      customerName: body.customerName || 'Unknown Customer',
      customerPhone: body.customerPhone || '+91 00000 00000',
      customerEmail: body.customerEmail || '',
      customerLocation: body.customerLocation || 'Pune',
      direction: 'inbound',
      status: body.status || 'completed',
      duration: body.duration || 0,
      startTime: body.startTime || new Date().toISOString(),
      endTime: body.endTime || new Date().toISOString(),
      transcript: body.transcript || [],
      voicemail: body.voicemail || null,
      summary: body.summary || '',
      queryCategory: body.queryCategory || 'inquiry',
      queryType: body.queryType || body.queryCategory || 'inquiry',
      sentiment: body.sentiment || 'neutral',
      resolution: body.resolution || 'pending',
      language: body.language || 'english',
      recordingUrl: body.recordingUrl || null,
      waveformData: body.waveformData || Array.from({ length: 60 }, () => Math.random() * 0.8 + 0.2),
      createdAt: body.startTime || new Date().toISOString(),
    };

    const saved = await addCall(callData);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Save call error:', error);
    return NextResponse.json({ error: 'Failed to save call', details: error.message }, { status: 500 });
  }
}
