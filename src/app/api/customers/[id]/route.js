import { NextResponse } from 'next/server';
import { getCustomerById, getCustomerCalls, updateCustomer, deleteCustomer } from '@/lib/store';

export async function GET(request, { params }) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const calls = await getCustomerCalls(id);
  return NextResponse.json({ ...customer, calls });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const updated = await updateCustomer(id, body);
  if (!updated) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const deleted = await deleteCustomer(id);
  if (!deleted) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
