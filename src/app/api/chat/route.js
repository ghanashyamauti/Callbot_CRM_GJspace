import { NextResponse } from 'next/server';
import { askSakshi, detectLanguageSwitch } from '@/lib/ai';

// POST /api/chat
// Body: { messages: [{role: 'user'|'assistant', content: string}], language: string }
export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, language: initialLanguage = 'english' } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const latestUserMsg = messages[messages.length - 1]?.content || '';
    const switchRequest = detectLanguageSwitch(latestUserMsg);
    const activeLanguage = switchRequest ? switchRequest.language : initialLanguage;

    const reply = await askSakshi(messages, activeLanguage);
    return NextResponse.json({ reply, language: activeLanguage }, { status: 200 });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response', details: error.message },
      { status: 500 }
    );
  }
}
