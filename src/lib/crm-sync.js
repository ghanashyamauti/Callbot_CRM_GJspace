import { connectDB } from './mongodb';
import { CallSession } from './models/CallSession';
import { Call } from './models/Call';
import { Customer } from './models/Customer';

function generateWaveform(len = 50) {
  return Array.from({ length: len }, () => Math.random() * 0.8 + 0.2);
}

function formatPhoneAsName(phone) {
  if (!phone) return 'Phone Caller';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    return `Caller ${last10.slice(0, 5)}xxxxx`;
  }
  return 'Phone Caller';
}

/**
 * Synchronize live Twilio Call session directly to MongoDB CRM (Call & Customer collections).
 * Guaranteed to be async/await safe for Vercel Serverless execution.
 */
export async function syncTwilioCallToCRM(callSid, options = {}) {
  if (!callSid) return null;

  try {
    await connectDB();

    let session = options.session;
    if (!session) {
      session = await CallSession.findOne({ callSid });
    }

    const callId = 'CALL-' + callSid.substring(0, 8).toUpperCase();
    const startTime = session?.startTime || options.startTime || new Date();
    const endTime = options.isEnded ? new Date() : (session?.endTime || new Date());
    const duration = options.duration !== undefined 
      ? options.duration 
      : Math.max(Math.round((Date.now() - new Date(startTime).getTime()) / 1000), 5);

    const customerName = session?.customerName || options.customerName || formatPhoneAsName(session?.from || options.from);
    const phone = session?.from || options.from || '+91 93229 79345';
    const language = session?.language || options.language || 'english';
    const transcript = session?.transcript || options.transcript || [];
    const status = options.status || (options.isEnded ? 'completed' : (transcript.length > 0 ? 'completed' : 'in-progress'));

    // Generate summary
    let summary = options.summary;
    if (!summary) {
      if (transcript.length > 2) {
        const lastMsg = transcript[transcript.length - 1]?.text || '';
        summary = `Call with ${customerName} in ${language}. Last query: "${lastMsg.substring(0, 100)}"`;
      } else if (session?.recordingTranscript) {
        summary = `Voicemail: "${session.recordingTranscript.substring(0, 150)}"`;
      } else {
        summary = `Inbound phone call from ${customerName} (${language}).`;
      }
    }

    const callDoc = await Call.findOneAndUpdate(
      { callId },
      {
        $set: {
          callId,
          customerName,
          customerPhone: phone,
          customerLocation: 'Pune',
          direction: options.direction || 'inbound',
          status,
          duration,
          startTime,
          endTime,
          transcript,
          summary,
          queryCategory: options.queryCategory || 'inquiry',
          queryType: options.queryType || 'inquiry',
          sentiment: options.sentiment || 'positive',
          resolution: options.resolution || (options.isEnded ? 'resolved' : 'pending'),
          language,
          recordingUrl: options.recordingUrl || session?.recordingUrl || null,
          voicemail: session?.recordingTranscript || null,
          waveformData: generateWaveform(),
        },
        $setOnInsert: {
          createdAt: startTime,
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Upsert Customer
    if (phone) {
      await Customer.findOneAndUpdate(
        { phone },
        {
          $set: {
            name: customerName,
            lastCallDate: new Date(),
            location: 'Pune',
          },
          $inc: { totalCalls: 1 },
          $addToSet: { tags: language },
          $setOnInsert: {
            createdAt: new Date(),
            email: '',
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    console.log(`[CRM Sync] ✓ Saved call ${callId} to MongoDB (${status}, ${transcript.length} msgs)`);
    return callDoc;
  } catch (err) {
    console.error('[CRM Sync] Error saving call to MongoDB:', err);
    return null;
  }
}
