// TwiML helpers — shared utilities for all Twilio webhook routes
// Handles voice config, language mapping, and TwiML XML generation.

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://callbot-crm-g-jspace.vercel.app';
}

// ==================== VOICE CONFIG ====================

// Polly.Aditi supports en-IN and hi-IN
// For mr-IN (Marathi), we use standard Twilio TTS which supports Marathi natively
const VOICE_CONFIG = {
  english: { voice: 'Polly.Aditi', ttsLang: 'en-IN', gatherLang: 'en-IN' },
  hindi:   { voice: 'Polly.Aditi', ttsLang: 'hi-IN', gatherLang: 'hi-IN' },
  marathi: { voice: null,          ttsLang: 'mr-IN', gatherLang: 'mr-IN' },
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

// ==================== LANGUAGE DETECTION ====================

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

  // Default to English
  return { language: 'english', speechLang: 'en-IN' };
}

export function detectHonorificFromSpeech(speechResult = '') {
  const lower = (speechResult || '').toLowerCase().trim();
  if (
    lower.includes('maam') || lower.includes("ma'am") || lower.includes('madam') ||
    lower.includes('mam') || lower.includes('मैडम') || lower.includes('मेडम') ||
    lower.includes('मॅडम') || lower.includes('madame')
  ) {
    return 'maam';
  }
  // Default to sir
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
  // Default to talk
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

// Build a complete TwiML response with XML header
export function twiml(innerXml) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${innerXml}</Response>`;
}

// <Say> tag with proper voice config
export function say(text, language = 'english') {
  const { voice, ttsLang } = getVoiceConfig(language);
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  if (voice) {
    return `<Say voice="${voice}" language="${ttsLang}">${escaped}</Say>`;
  }
  return `<Say language="${ttsLang}">${escaped}</Say>`;
}

// <Gather> tag for speech input with Say inside
export function gather(opts = {}) {
  const {
    action,
    language = 'english',
    prompt = '',
    speechTimeout = 'auto',
    hints = '',
    maxSpeechTime = 25,
  } = opts;

  const { gatherLang } = getVoiceConfig(language);
  const hintsAttr = hints ? ` hints="${hints}"` : '';
  const inner = prompt ? say(prompt, language) : '';

  return `<Gather input="speech" language="${gatherLang}" action="${action}" method="POST" speechTimeout="${speechTimeout}" maxSpeechTime="${maxSpeechTime}"${hintsAttr}>${inner}</Gather>`;
}

// <Redirect> tag
export function redirect(url, method = 'POST') {
  return `<Redirect method="${method}">${url}</Redirect>`;
}

// <Hangup> tag
export function hangup() {
  return '<Hangup/>';
}

// <Record> tag for voicemail
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
    english: 'Hello! My name is Sakshi and I am the AI assistant for GJ SpaCes. Please say your preferred language. Say English, Hindi, or Marathi.',
    hindi:   'नमस्ते! मेरा नाम सक्षी है, मैं GJ SpaCes की AI सहायक हूं। कृपया अपनी भाषा बताएं — हिंदी, अंग्रेजी, या मराठी।',
    marathi: 'नमस्कार! माझे नाव सक्षी आहे, मी GJ SpaCes ची AI सहाय्यक आहे. कृपया आपली भाषा सांगा — मराठी, हिंदी, किंवा इंग्रजी.',
  },
  honorificAsk: {
    english: 'Should I address you as Sir or Ma\'am?',
    hindi:   'मैं आपको Sir कहूं या Ma\'am?',
    marathi: 'मी आपल्याला Sir म्हणू की Ma\'am?',
  },
  modeAsk: {
    english: 'Would you like to talk to me for information, or leave a message for our team?',
    hindi:   'क्या आप मुझसे जानकारी लेना चाहेंगे, या हमारी टीम के लिए संदेश छोड़ना चाहेंगे?',
    marathi: 'आपल्याला माझ्याशी बोलायचे आहे, की आमच्या टीमसाठी संदेश सोडायचा आहे?',
  },
  talkReady: {
    english: (h) => `Great ${h}! Please go ahead and tell me how I can help you today.`,
    hindi:   (h) => `बहुत अच्छा ${h}! बताइए, मैं आपकी किस तरह मदद कर सकती हूं?`,
    marathi: (h) => `छान ${h}! सांगा, मी आपली कशी मदत करू शकते?`,
  },
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
  farewell: {
    english: 'Thank you for calling GJ SpaCes! Have a wonderful day. Goodbye!',
    hindi:   'GJ SpaCes में कॉल करने के लिए धन्यवाद! आपका दिन शुभ हो। नमस्ते!',
    marathi: 'GJ SpaCes ला कॉल केल्याबद्दल धन्यवाद! आपला दिवस आनंदाचा जावो. नमस्कार!',
  },
  langRetry: 'Sorry, I did not catch that. Please say English, Hindi, or Marathi.',
  honorificRetry: {
    english: 'Sorry, please say Sir or Ma\'am.',
    hindi:   'माफ करें, कृपया Sir या Ma\'am कहें।',
    marathi: 'माफ करा, कृपया Sir किंवा Ma\'am सांगा.',
  },
  modeRetry: {
    english: 'Sorry, say "talk" to chat with me, or "message" to leave a voicemail.',
    hindi:   'माफ करें, "बात" कहें मुझसे चैट करने के लिए, या "संदेश" कहें वॉइसमेल छोड़ने के लिए।',
    marathi: 'माफ करा, "बोला" म्हणा माझ्याशी बोलण्यासाठी, किंवा "संदेश" म्हणा व्हॉइसमेल सोडण्यासाठी.',
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
