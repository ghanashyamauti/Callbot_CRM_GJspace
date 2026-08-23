import { NextResponse } from 'next/server';
import { getCallById, updateCall, deleteCall } from '@/lib/store';

export async function GET(request, { params }) {
  const { id } = await params;
  const call = await getCallById(id);
  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  return NextResponse.json(call);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const updated = await updateCall(id, body);
  if (!updated) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const deleted = await deleteCall(id);
  if (!deleted) return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
