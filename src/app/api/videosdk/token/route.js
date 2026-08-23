import { NextResponse } from 'next/server';
import { createVideoSDKRoom, getVideoSDKToken } from '@/lib/videosdk';

export async function GET() {
  try {
    const token = getVideoSDKToken();
    return NextResponse.json({ token });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { roomId, token } = await createVideoSDKRoom();
    return NextResponse.json({ roomId, token });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
