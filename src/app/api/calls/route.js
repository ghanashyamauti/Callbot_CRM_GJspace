import { NextResponse } from 'next/server';
import { getAllCalls, addCall } from '@/lib/store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || 'all',
      status: searchParams.get('status') || 'all',
      sentiment: searchParams.get('sentiment') || 'all',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      sortBy: searchParams.get('sortBy') || 'startTime',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const result = await getAllCalls(filters);
    return NextResponse.json(result || { calls: [], total: 0 });
  } catch (error) {
    console.error('Calls GET API error:', error);
    return NextResponse.json({ calls: [], total: 0, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const call = await addCall(body);
    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    console.error('Calls POST API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
