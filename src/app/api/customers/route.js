import { NextResponse } from 'next/server';
import { getAllCustomers } from '@/lib/store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || '',
      tag: searchParams.get('tag') || 'all',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    };

    const result = await getAllCustomers(filters);
    return NextResponse.json(result || { customers: [], total: 0 });
  } catch (error) {
    console.error('Customers GET API error:', error);
    return NextResponse.json({ customers: [], total: 0, error: error.message }, { status: 500 });
  }
}
