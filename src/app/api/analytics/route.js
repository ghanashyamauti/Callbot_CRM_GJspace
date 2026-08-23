import { NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/store';

export async function GET() {
  try {
    const analytics = await getAnalytics();
    return NextResponse.json(analytics || {});
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics', details: error.message },
      { status: 500 }
    );
  }
}
