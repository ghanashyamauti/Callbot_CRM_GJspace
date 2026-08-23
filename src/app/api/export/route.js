import { NextResponse } from 'next/server';
import { getAllCalls } from '@/lib/store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    const result = await getAllCalls({ limit: '10000' });
    const calls = result?.calls || [];

    if (format === 'csv') {
      const headers = ['Call ID', 'Customer Name', 'Phone', 'Category', 'Status', 'Sentiment', 'Duration (s)', 'Resolution', 'Date', 'Summary'];
      const rows = calls.map(c => [
        c.callId,
        c.customerName,
        c.customerPhone,
        c.queryCategory,
        c.status,
        c.sentiment,
        c.duration,
        c.resolution,
        new Date(c.startTime).toLocaleString('en-IN'),
        `"${(c.summary || '').replace(/"/g, '""')}"`,
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=callbot-crm-export.csv',
        },
      });
    }

    return NextResponse.json(calls);
  } catch (err) {
    console.error('Export API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
