// TwiML helpers — shared utilities for all Twilio webhook routes
// Uses Google Neural Indian Female voices for highest quality on phone calls.

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://callbot-crm-g-jspace.vercel.app';
}

// ==================== VOICE CONFIG ====================
// Google Neural voices = highest quality Indian female on Twilio phone calls.
// Never use Polly.Aditi (can sound male) or default <Say> (robot male).

const VOICE_CONFIG = {
  english: { voice: 'Google.en-IN-Wavenet-A', ttsLang: 'en-IN', gatherLang: 'en-IN' },
  hindi:   { voice: 'Google.hi-IN-Wavenet-A', ttsLang: 'hi-IN', gatherLang: 'hi-IN' },
  marathi: { voice: 'Google.mr-IN-Wavenet-A', ttsLang: 'mr-IN', gatherLang: 'mr-IN' },
};

export function getVoiceConfig(language = 'english') {
  return VOICE_CONFIG[language] || VOICE_CONFIG.english;
}

export function webhookUrl(path, params = {}) {
  const base = getBaseUrl();
  const url = new URL(path, base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

// ==================== SPEECH PARSERS ====================

export function detectLanguageFromSpeech(speechResult = '') {
  const lower = (speechResult || '').toLowerCase().trim();

  if (
    lower.includes('hindi') || lower.includes('हिंदी') || lower.includes('हिन्दी') ||
    lower.includes('hind') || lower === 'हिंदी'
  ) {
    return { language: 'hindi', speechLang: 'hi-IN' };
  }

  if (
    lower.includes('marathi') || lower.includes('मराठी') || lower.includes('marathee') ||
    lower.includes('marath')
  ) {
    return { language: 'marathi', speechLang: 'mr-IN' };
  }

  return { language: 'english', speechLang: 'en-IN' };
}

export function extractNameFromSpeech(speechResult = '') {
  if (!speechResult) return '';
  let cleaned = speechResult.trim();

  const prefixes = [
    /^(my name is|i am|this is|myself|it's|its)\s+/i,
    /^(mera naam|mera naam hai|main|mai|hum|mera)\s+/i,
    /^(maaza naav|maza naav|maza naav aahe|mee|me|mi)\s+/i,
    /\s+(bol raha hoon|bol rahi hoon|baat kar raha hoon|speaking|here)$/i,
    /\s+(boltoy|bolte|ahe|aahe|hai)$/i,
  ];

  prefixes.forEach((regex) => {
    cleaned = cleaned.replace(regex, '').trim();
  });

  if (cleaned.length > 0) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return 'Caller';
}

// Kept for backward compatibility — honorific route still exists but is skipped in new flow
export function detectHonorificFromSpeech(speechResult = '') {
  const lower = (speechResult || '').toLowerCase().trim();
  if (
    lower.includes('maam') || lower.includes("ma'am") || lower.includes('madam') ||
    lower.includes('mam') || lower.includes('मैडम') || lower.includes('मेडम') ||
    lower.includes('मॅडम') || lower.includes('madame')
  ) {
    return 'maam';
  }
  return 'sir';
}



export function detectModeFromSpeech(speechResult = '') {
  const lower = (speechResult || '').toLowerCase().trim();
  if (
    lower.includes('message') || lower.includes('sandesh') || lower.includes('संदेश') ||
    lower.includes('leave') || lower.includes('record') || lower.includes('voicemail') ||
    lower.includes('chhod') || lower.includes('छोड') || lower.includes('सोडा')
  ) {
    return 'voicemail';
  }
  return 'talk';
}

export function detectFarewellFromSpeech(speechResult = '') {
  const lower = (speechResult || '').toLowerCase().trim();
  const farewellWords = [
    'bye', 'goodbye', 'thank you', 'thanks', 'that\'s all', 'thats all',
    'dhanyawad', 'dhanyawaad', 'shukriya', 'alvida', 'theek hai', 'bas itna hi',
    'bas', 'okay bye', 'ok bye', 'no thanks', 'no thank you',
    'धन्यवाद', 'अलविदा', 'ठीक है', 'बस', 'आभार', 'नमस्कार'
  ];
  return farewellWords.some(w => lower.includes(w));
}

// ==================== TWIML BUILDERS ====================

export function twiml(innerXml) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${innerXml}</Response>`;
}

// Instantaneous high-quality Google Neural Indian Female voice on Twilio phone calls (0ms network delay)
export function say(text, language = 'english') {
  const { voice, ttsLang } = getVoiceConfig(language);
  
  // Normalize brand name so TTS pronounces "GJ Spaces" naturally without spelling letters
  const normalizedText = text
    .replace(/GJ\s*SpaCes/gi, 'GJ Spaces')
    .replace(/GJspaCes/gi, 'GJ Spaces');

  const escaped = normalizedText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Direct Twilio Google Neural Female voice (<Say>) executes with 0ms network delay on telephone calls
  return `<Say voice="${voice}" language="${ttsLang}">${escaped}</Say>`;
}

// Enhanced Gather with phone-optimized acoustic model & fast 1s speech timeout
export function gather(opts = {}) {
  const {
    action,
    language = 'english',
    prompt = '',
    speechTimeout = '1',
    hints = '',
    maxSpeechTime = 30,
    bargeIn = true,
  } = opts;

  const { gatherLang } = getVoiceConfig(language);
  const hintsAttr = hints ? ` hints="${hints}"` : '';
  const inner = prompt ? say(prompt, language) : '';

  // bargeIn: caller can interrupt Sakshi mid-speech; speechTimeout="1": detects end of speech in 1s
  return `<Gather input="speech" language="${gatherLang}" action="${action}" method="POST" speechModel="phone_call" enhanced="true" speechTimeout="${speechTimeout}" maxSpeechTime="${maxSpeechTime}" profanityFilter="false" bargeIn="${bargeIn}"${hintsAttr}>${inner}</Gather>`;
}

export function redirect(url, method = 'POST') {
  return `<Redirect method="${method}">${url}</Redirect>`;
}

export function hangup() {
  return '<Hangup/>';
}

export function record(opts = {}) {
  const {
    action,
    maxLength = 120,
    playBeep = true,
    transcribe = true,
    transcribeCallback,
    finishOnKey = '#',
  } = opts;

  const tcAttr = transcribeCallback ? ` transcribeCallback="${transcribeCallback}"` : '';
  return `<Record action="${action}" maxLength="${maxLength}" playBeep="${playBeep}" transcribe="${transcribe}" finishOnKey="${finishOnKey}"${tcAttr}/>`;
}

// ==================== GREETING TEXTS ====================

const GREETINGS = {
  intro: {
    english: 'Hello! My name is Sakshi from GJ Spaces. Please say your preferred language — English, Hindi, or Marathi.',
    hindi:   'नमस्ते! मेरा नाम साक्षी है, जीजे स्पेसेस से। कृपया अपनी भाषा बताएं — हिंदी, अंग्रेजी, या मराठी।',
    marathi: 'नमस्कार! माझे नाव साक्षी, जीजे स्पेसेस मधून. कृपया आपली भाषा सांगा — मराठी, हिंदी, किंवा इंग्रजी.',
  },
  nameAsk: {
    english: 'May I please know your good name?',
    hindi:   'क्या मैं आपका शुभ नाम जान सकती हूं?',
    marathi: 'मी आपले शुभ नाव जाणून घेऊ शकते का?',
  },
  nameGreet: {
    english: (name) => `Nice to talk to you, ${name}! How can I help you today?`,
    hindi:   (name) => `${name} जी, आपसे बात करके अच्छा लगा! बताइए, मैं आपकी कैसे मदद कर सकती हूं?`,
    marathi: (name) => `${name} जी, आपल्याशी बोलून बरं वाटलं! सांगा, मी आपली कशी मदत करू शकते?`,
  },
  farewell: {
    english: 'Thank you for calling GJ Spaces! Have a wonderful day. Goodbye!',
    hindi:   'GJ Spaces में कॉल करने के लिए धन्यवाद! आपका दिन शुभ हो। नमस्ते!',
    marathi: 'GJ Spaces ला कॉल केल्याबद्दल धन्यवाद! आपला दिवस आनंदाचा जावो. नमस्कार!',
  },
  langRetry: 'Sorry, I did not catch that. Please say English, Hindi, or Marathi.',
  voicemailReady: {
    english: 'Please leave your message after the beep. Press the hash key when done.',
    hindi:   'कृपया बीप के बाद अपना संदेश दें। पूरा होने पर हैश का बटन दबाएं।',
    marathi: 'कृपया बीप नंतर आपला संदेश द्या. झाल्यावर हॅश बटण दाबा.',
  },
  voicemailSaved: {
    english: 'Thank you! Your message has been saved. Our team will contact you shortly. Goodbye!',
    hindi:   'धन्यवाद! आपका संदेश सहेज लिया गया है। हमारी टीम जल्द ही आपसे संपर्क करेगी। नमस्ते!',
    marathi: 'धन्यवाद! आपला संदेश जतन केला आहे. आमची टीम लवकरच आपल्याशी संपर्क करेल. नमस्कार!',
  },
};

export function getGreeting(key, language = 'english', arg = '') {
  const g = GREETINGS[key];
  if (!g) return '';
  if (typeof g === 'string') return g;
  const val = g[language] || g.english;
  if (typeof val === 'function') return val(arg);
  return val;
}
