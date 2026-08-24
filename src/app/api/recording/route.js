// GET /api/recording?url=https://api.twilio.com/...
// Proxies Twilio recording audio through our server with proper authentication.
// Browser can't access Twilio recordings directly (they need Basic Auth).

import { NextResponse } from 'next/server';

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const recordingUrl = searchParams.get('url');

  if (!recordingUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only allow proxying Twilio URLs (security)
  if (!recordingUrl.includes('twilio.com') && !recordingUrl.includes('api.twilio.com')) {
    // If it's a data URL or external URL, redirect directly
    return NextResponse.redirect(recordingUrl);
  }

  if (!TWILIO_SID || !TWILIO_AUTH) {
    return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString('base64');
    
    const response = await fetch(recordingUrl, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      console.error(`[recording-proxy] Twilio returned ${response.status} for ${recordingUrl}`);
      return NextResponse.json({ error: 'Recording not found' }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'audio/mpeg';

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (err) {
    console.error('[recording-proxy] Error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch recording' }, { status: 500 });
  }
}
