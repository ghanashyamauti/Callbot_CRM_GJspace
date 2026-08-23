import { NextResponse } from 'next/server';
import { getAllCustomers } from '@/lib/store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filters = {
    search: searchParams.get('search') || '',
    tag: searchParams.get('tag') || 'all',
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
  };

  const result = await getAllCustomers(filters);
  return NextResponse.json(result);
}
