import { NextResponse } from 'next/server';
import { askSakshi } from '@/lib/ai';

// POST /api/chat
// Body: { messages: [{role: 'user'|'assistant', content: string}], language: string }
export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, language = 'english' } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const reply = await askSakshi(messages, language);
    return NextResponse.json({ reply }, { status: 200 });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response', details: error.message },
      { status: 500 }
    );
  }
}
