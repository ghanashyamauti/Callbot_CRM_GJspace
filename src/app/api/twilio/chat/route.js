// POST /api/twilio/chat — AI conversation loop
// Called on every customer speech turn during talk mode.
// Sends to OpenRouter (Gemini Flash) and speaks the reply back.

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CallSession } from '@/lib/models/CallSession';
import { askSakshi } from '@/lib/ai';
import {
  twiml, say, gather, redirect, hangup, webhookUrl,
  detectFarewellFromSpeech, getGreeting
} from '@/lib/twiml';

// Trim AI reply to be phone-friendly (shorter, no markdown)
function sanitizeForPhone(text) {
  return text
    .replace(/\*\*/g, '')       // remove bold markdown
    .replace(/\*/g, '')          // remove italic
    .replace(/#{1,6}\s/g, '')   // remove headers
    .replace(/✓|✔|•|→|🎉|😊|🙏|💰|📋|⚠️|🏢|📊/g, '') // remove emojis
    .replace(/₹/g, 'rupees ')   // spell out rupee symbol
    .replace(/\n+/g, '. ')      // newlines → pauses
    .trim();
}

export async function POST(request) {
  const formData     = await request.formData();
  const callSid      = formData.get('CallSid')      || '';
  const speechResult  = formData.get('SpeechResult') || '';
  const confidence   = parseFloat(formData.get('Confidence') || '0');

  let xml;

  try {
    await connectDB();
    const session = await CallSession.findOne({ callSid });

    if (!session) {
      xml = twiml(say('I lost track of our conversation. Please call again. Goodbye!', 'english') + hangup());
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

    const language = session.language || 'english';

    // No speech or very low confidence
    if (!speechResult || confidence < 0.2) {
      const reprompt = language === 'hindi'
        ? 'मुझे सुनाई नहीं दिया। कृपया फिर से बोलें।'
        : language === 'marathi'
        ? 'मला ऐकू नाही आले. कृपया पुन्हा सांगा.'
        : 'Sorry, I didn\'t catch that. Please say that again.';

      xml = twiml(
        say(reprompt, language) +
        gather({
          action: webhookUrl('/api/twilio/chat'),
          language,
          speechTimeout: 'auto',
          maxSpeechTime: 30,
        }) +
        redirect(webhookUrl('/api/twilio/chat'))
      );
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

    // Check for farewell
    if (detectFarewellFromSpeech(speechResult)) {
      const farewell = getGreeting('farewell', language);

      // Add to transcript
      session.transcript.push({ role: 'customer', text: speechResult });
      session.transcript.push({ role: 'bot', text: farewell });
      await session.save();

      xml = twiml(say(farewell, language) + hangup());
      return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
    }

    // Add customer speech to transcript and aiMessages
    session.transcript.push({ role: 'customer', text: speechResult });
    session.aiMessages.push({ role: 'user', content: speechResult });

    // Call OpenRouter (Gemini Flash)
    let aiReply;
    try {
      aiReply = await askSakshi(session.aiMessages, language);
    } catch (aiError) {
      console.error('[twilio/chat] AI error:', aiError);
      aiReply = language === 'hindi'
        ? 'माफ करें, मुझे अभी तकनीकी समस्या हो रही है। हमारी टीम जल्द ही आपसे संपर्क करेगी।'
        : language === 'marathi'
        ? 'माफ करा, मला आत्ता तांत्रिक अडचण येत आहे. आमची टीम लवकरच संपर्क करेल.'
        : 'I apologize, I\'m having a technical difficulty. Our team will contact you shortly.';
    }

    // Clean reply for voice
    const cleanReply = sanitizeForPhone(aiReply);

    // Save to session
    session.transcript.push({ role: 'bot', text: cleanReply });
    session.aiMessages.push({ role: 'assistant', content: cleanReply });
    await session.save();

    // Continue gathering next customer turn
    const continuationHints = language === 'hindi'
      ? 'हां,नहीं,ठीक है,धन्यवाद,अलविदा,और बताइए,booking,price'
      : language === 'marathi'
      ? 'हो,नाही,ठीक आहे,धन्यवाद,निरोप,आणखी,booking,price'
      : 'yes,no,okay,thank you,goodbye,more,booking,price,information';

    xml = twiml(
      say(cleanReply, language) +
      gather({
        action: webhookUrl('/api/twilio/chat'),
        language,
        hints: continuationHints,
        speechTimeout: 'auto',
        maxSpeechTime: 30,
      }) +
      // Silence handler
      say(
        language === 'hindi' ? 'क्या आपका और कोई सवाल है?'
        : language === 'marathi' ? 'आणखी काही प्रश्न आहे का?'
        : 'Is there anything else I can help you with?',
        language
      ) +
      gather({
        action: webhookUrl('/api/twilio/chat'),
        language,
        speechTimeout: '3',
        maxSpeechTime: 15,
      }) +
      say(getGreeting('farewell', language), language) +
      hangup()
    );

  } catch (error) {
    console.error('[twilio/chat] Error:', error);
    xml = twiml(say('Sorry, something went wrong. Please call us again. Goodbye!', 'english') + hangup());
  }

  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}
