'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, PhoneOff, Bot, User, Loader2, CheckCircle2, ArrowRight,
  Mic, MicOff, MessageSquare, Globe, Volume2, VolumeX, Send, Radio, Sparkles
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useNotifications } from '@/components/NotificationContext';
import {
  INDIAN_NAMES,
  getRandomItem,
  getRandomPhone,
  PUNE_AREAS,
} from '@/lib/gjspaces-knowledge';
import { getHonorific, getSakshiIntro } from '@/lib/sakshi-persona';

// ==================== HELPERS ====================

function generateWaveform(len = 60) {
  return Array.from({ length: len }, () => Math.random() * 0.8 + 0.2);
}

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function generateCallId() {
  return 'CALL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
}

const LANGUAGE_OPTIONS = [
  { key: 'english', label: 'English', emoji: '🇬🇧', native: 'English' },
  { key: 'hindi', label: 'Hindi', emoji: '🇮🇳', native: 'हिंदी' },
  { key: 'marathi', label: 'Marathi', emoji: '🟠', native: 'मराठी' },
];

function RingingScreen({ customerName, brandName }) {
  return (
    <div className="sakshi-ringing-screen">
      <div className="sakshi-ring-outer">
        <div className="sakshi-ring-mid">
          <div className="sakshi-ring-inner">
            <Phone size={36} />
          </div>
        </div>
      </div>
      <div className="sakshi-ringing-label">Incoming Call</div>
      <div className="sakshi-ringing-name">{customerName}</div>
      <div className="sakshi-ringing-brand">Calling {brandName}...</div>
      <div className="sakshi-ringing-dots">
        <span /><span /><span />
      </div>
    </div>
  );
}

function TranscriptBubble({ msg, customerName, isNew }) {
  const isBot = msg.role === 'bot';
  return (
    <div className={`sakshi-bubble ${isBot ? 'bot' : 'customer'} ${isNew ? 'new' : ''}`}>
      <div className="sakshi-bubble-avatar">
        {isBot ? <Bot size={14} /> : <User size={14} />}
      </div>
      <div className="sakshi-bubble-content">
        <div className="sakshi-bubble-label">
          {isBot ? 'Sakshi (AI Assistant)' : customerName}
        </div>
        <div className="sakshi-bubble-text" style={{ whiteSpace: 'pre-line' }}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="sakshi-bubble bot">
      <div className="sakshi-bubble-avatar"><Bot size={14} /></div>
      <div className="sakshi-bubble-content">
        <div className="sakshi-bubble-label">Sakshi is speaking...</div>
        <div className="sakshi-typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function SimulatePage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'GJ SpaCes';

  const [customer] = useState(() => {
    const name = getRandomItem(INDIAN_NAMES);
    const phone = getRandomPhone();
    const email = name.toLowerCase().replace(/\s+/g, '.') + '@' + getRandomItem(['gmail.com', 'yahoo.com', 'outlook.com']);
    const location = getRandomItem(PUNE_AREAS) + ', Pune';
    return { name, phone, email, location };
  });

  const [phase, setPhase] = useState('idle');
  const [language, setLanguage] = useState('english');
  const [transcript, setTranscript] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [voicemailText, setVoicemailText] = useState('');
  const [startTime] = useState(new Date());
  const [callDuration, setCallDuration] = useState(0);
  const [savedCall, setSavedCall] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);

  const transcriptEndRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Play natural neural speech audio
  const playSpeech = useCallback((text, lang = 'english') => {
    if (isMuted || typeof window === 'undefined') return;

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsBotSpeaking(true);

    // Try Neural TTS API
    const audioUrl = `/api/tts?language=${lang}&text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;

    audio.onended = () => setIsBotSpeaking(false);
    audio.onerror = () => {
      // Fallback to browser SpeechSynthesis
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        if (lang === 'hindi') utter.lang = 'hi-IN';
        else if (lang === 'marathi') utter.lang = 'mr-IN';
        else utter.lang = 'en-IN';
        utter.onend = () => setIsBotSpeaking(false);
        utter.onerror = () => setIsBotSpeaking(false);
        window.speechSynthesis.speak(utter);
      } else {
        setIsBotSpeaking(false);
      }
    };

    audio.play().catch(() => {
      setIsBotSpeaking(false);
    });
  }, [isMuted]);

  // Setup Browser Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event) => {
          let transcriptText = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcriptText += event.results[i][0].transcript;
          }
          setUserInput(transcriptText);
          if (event.results[0].isFinal && transcriptText.trim()) {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  function toggleSpeechRecognition() {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (language === 'hindi') recognitionRef.current.lang = 'hi-IN';
      else if (language === 'marathi') recognitionRef.current.lang = 'mr-IN';
      else recognitionRef.current.lang = 'en-IN';
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  }

  // Scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, isAiTyping]);

  // Call timer
  useEffect(() => {
    if (phase === 'talking' || phase === 'recording' || phase === 'beep') {
      timerRef.current = setInterval(() => setCallDuration(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  function startCall() {
    setPhase('ringing');
    setTimeout(() => {
      setPhase('language_select');
      playSpeech(`Hello! My name is Sakshi, and I am the AI assistant for ${brandName}. Which language do you prefer? English, Hindi, or Marathi?`, 'english');
    }, 2000);
  }

  function selectLanguage(lang) {
    setLanguage(lang);
    const honorific = getHonorific(customer.name, lang);
    const introText = getSakshiIntro(lang, honorific);

    setTranscript([{ role: 'bot', text: introText }]);
    playSpeech(introText, lang);

    addNotification({
      type: 'call',
      title: '📞 Incoming Call',
      message: `${customer.name} — CallBot Active`,
      callId: 'live',
      category: 'inquiry',
      sentiment: 'neutral',
    });

    setPhase('mode_select');
  }

  function selectTalkMode() {
    const modeMsg = language === 'hindi'
      ? `बहुत अच्छा! मुझे बताइए, मैं आपकी किस तरह मदद कर सकती हूं?`
      : language === 'marathi'
      ? `छान! सांगा, मी आपली कशी मदत करू शकते?`
      : `Great! Please go ahead and tell me how I can help you today.`;

    setTranscript(prev => [...prev, { role: 'bot', text: modeMsg }]);
    setAiMessages([{ role: 'assistant', content: modeMsg }]);
    playSpeech(modeMsg, language);
    setPhase('talking');
    setTimeout(() => inputRef.current?.focus(), 300);
  }

  function selectRecordMode() {
    const beepMsg = language === 'hindi'
      ? 'ठीक है! कृपया बीप के बाद अपना संदेश छोड़ें। मैं यह हमारी टीम तक पहुंचाऊंगी।'
      : language === 'marathi'
      ? 'ठीक आहे! कृपया बीप नंतर आपला संदेश द्या. मी तो आमच्या टीमला पोहोचवीन.'
      : 'Sure! Please leave your message after the beep. Our team will get back to you shortly.';

    setTranscript(prev => [...prev, { role: 'bot', text: beepMsg }]);
    playSpeech(beepMsg, language);
    setPhase('beep');
    setTimeout(() => setPhase('recording'), 2000);
  }

  const sendMessage = useCallback(async () => {
    const text = userInput.trim();
    if (!text || isAiTyping) return;

    setUserInput('');

    const userMsg = { role: 'customer', text };
    setTranscript(prev => [...prev, userMsg]);

    const updatedAiMessages = [...aiMessages, { role: 'user', content: text }];
    setAiMessages(updatedAiMessages);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedAiMessages, language }),
      });

      if (!res.ok) throw new Error('AI response failed');
      const data = await res.json();
      const reply = data.reply;

      const botMsg = { role: 'bot', text: reply };
      setTranscript(prev => [...prev, botMsg]);
      setAiMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      playSpeech(reply, language);
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = language === 'hindi'
        ? 'माफ करें, मुझे कुछ तकनीकी समस्या हो रही है। कृपया थोड़ी देर बाद कोशिश करें।'
        : language === 'marathi'
        ? 'माफ करा, मला काही तांत्रिक अडचण येत आहे. कृपया थोड्या वेळाने प्रयत्न करा.'
        : 'I apologize, I\'m having a technical issue right now. Please try again in a moment.';
      setTranscript(prev => [...prev, { role: 'bot', text: errMsg }]);
      playSpeech(errMsg, language);
    } finally {
      setIsAiTyping(false);
    }
  }, [userInput, isAiTyping, aiMessages, language, playSpeech]);

  async function endCall() {
    setIsSaving(true);
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    let summary = `Live Call with ${customer.name} handled by Sakshi.`;
    let queryCategory = 'inquiry';
    let sentiment = 'neutral';
    let resolution = 'resolved';

    try {
      if (transcript.length > 1) {
        const transcriptForSummary = [...aiMessages];
        if (transcriptForSummary.length > 0) {
          transcriptForSummary.push({
            role: 'user',
            content: `Please generate a brief JSON summary with keys: summary, queryCategory (inquiry|booking|complaint|support), sentiment (positive|neutral|negative), resolution (resolved|pending|escalated).`
          });
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: transcriptForSummary, language: 'english' }),
          });
          if (res.ok) {
            const data = await res.json();
            try {
              const cleaned = data.reply.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              summary = parsed.summary || summary;
              queryCategory = parsed.queryCategory || queryCategory;
              sentiment = parsed.sentiment || sentiment;
              resolution = parsed.resolution || resolution;
            } catch (_) {}
          }
        }
      }
    } catch (_) {}

    const callData = {
      id: crypto.randomUUID(),
      callId: generateCallId(),
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerLocation: customer.location,
      direction: 'inbound',
      status: 'completed',
      duration: Math.max(duration, 25),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      transcript: transcript.map((m, i) => ({ ...m, timestamp: Math.round((i + 1) * duration / transcript.length) })),
      voicemail: null,
      summary,
      queryCategory,
      queryType: queryCategory,
      sentiment,
      resolution,
      language,
      waveformData: generateWaveform(),
      createdAt: startTime.toISOString(),
    };

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData),
      });
      const saved = await res.json();
      setSavedCall(saved);
    } catch (err) {
      setSavedCall(callData);
    }

    setCallDuration(duration);
    setIsSaving(false);
    setPhase('done');
  }

  async function submitVoicemail() {
    if (!voicemailText.trim()) return;
    setIsSaving(true);

    const vmCustomerMsg = { role: 'customer', text: voicemailText };
    const vmBotMsg = {
      role: 'bot',
      text: language === 'hindi'
        ? `धन्यवाद! आपका संदेश प्राप्त हो गया है। हमारी टीम जल्द ही आपसे संपर्क करेगी।`
        : language === 'marathi'
        ? `धन्यवाद! आपला संदेश मिळाला. आमची टीम लवकरच आपल्याशी संपर्क करेल.`
        : `Thank you! Your message has been recorded. Our team will contact you shortly.`,
    };

    const finalTranscript = [...transcript, vmCustomerMsg, vmBotMsg];
    setTranscript(finalTranscript);
    playSpeech(vmBotMsg.text, language);

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    const callData = {
      id: crypto.randomUUID(),
      callId: generateCallId(),
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerLocation: customer.location,
      direction: 'inbound',
      status: 'voicemail',
      duration,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      transcript: finalTranscript.map((m, i) => ({ ...m, timestamp: Math.round((i + 1) * duration / finalTranscript.length) })),
      voicemail: voicemailText,
      summary: `Voicemail from ${customer.name}: "${voicemailText.substring(0, 100)}"`,
      queryCategory: 'inquiry',
      queryType: 'Voicemail',
      sentiment: 'neutral',
      resolution: 'pending',
      language,
      waveformData: generateWaveform(),
      createdAt: startTime.toISOString(),
    };

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData),
      });
      const saved = await res.json();
      setSavedCall(saved);
    } catch (err) {
      setSavedCall(callData);
    }

    setCallDuration(duration);
    setIsSaving(false);
    setPhase('done');
  }

  function resetAll() {
    setPhase('idle');
    setLanguage('english');
    setTranscript([]);
    setAiMessages([]);
    setUserInput('');
    setVoicemailText('');
    setSavedCall(null);
    setCallDuration(0);
  }

  return (
    <>
      <TopBar title="AI Voice Call Simulator" subtitle={`Studio HD Neural Voice — ${brandName}`} />
      <div className="page-container">

        {/* ---- IDLE ---- */}
        {phase === 'idle' && (
          <div className="sakshi-idle-container">
            <div className="sakshi-idle-hero">
              <div className="sakshi-avatar-lg">
                <Bot size={48} />
                <span className="sakshi-avatar-badge"><Sparkles size={10} /> Neural</span>
              </div>
              <h1 className="sakshi-hero-title">Talk with Sakshi AI</h1>
              <p className="sakshi-hero-subtitle">
                Experience crystal-clear, human-sounding neural voice AI for {brandName}.
                Speak with your microphone or listen with realistic emotional tone in English, Hindi & Marathi.
              </p>
              <div className="sakshi-features">
                <div className="sakshi-feature">
                  <Volume2 size={18} /><span>Neural Voice (Swara/Neerja)</span>
                </div>
                <div className="sakshi-feature">
                  <Mic size={18} /><span>Real Microphone Input</span>
                </div>
                <div className="sakshi-feature">
                  <Globe size={18} /><span>English, Hindi, Marathi</span>
                </div>
                <div className="sakshi-feature">
                  <Radio size={18} /><span>Live CRM Auto-Save</span>
                </div>
              </div>
              <div className="sakshi-customer-preview">
                <div className="sakshi-customer-avatar">{customer.name.charAt(0)}</div>
                <div>
                  <div className="sakshi-customer-name">{customer.name}</div>
                  <div className="sakshi-customer-phone">{customer.phone} • {customer.location}</div>
                </div>
              </div>
              <button className="sakshi-call-btn" onClick={startCall}>
                <Phone size={20} />
                Start Voice Call
              </button>
            </div>
          </div>
        )}

        {/* ---- RINGING ---- */}
        {phase === 'ringing' && (
          <div className="sakshi-full-screen">
            <RingingScreen customerName={customer.name} brandName={brandName} />
          </div>
        )}

        {/* ---- ACTIVE CALL LAYOUT ---- */}
        {['language_select', 'mode_select', 'talking', 'recording', 'beep', 'done'].includes(phase) && (
          <div className="sakshi-call-layout">
            <div className="sakshi-call-header">
              <div className="sakshi-call-header-left">
                <div className={`sakshi-status-dot ${phase === 'done' ? 'done' : 'live'}`} />
                <span className="sakshi-call-status">
                  {phase === 'done' ? 'Call Ended' : isBotSpeaking ? 'Sakshi Speaking...' : isListening ? 'Listening to You...' : 'Live Neural Call'}
                </span>
              </div>
              <div className="sakshi-call-header-center">
                <div className={`sakshi-call-avatar ${isBotSpeaking ? 'speaking-pulse' : ''}`}>{customer.name.charAt(0)}</div>
                <div>
                  <div className="sakshi-call-customer-name">{customer.name}</div>
                  <div className="sakshi-call-customer-phone">{customer.phone}</div>
                </div>
              </div>
              <div className="sakshi-call-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX size={18} style={{ color: 'var(--danger)' }} /> : <Volume2 size={18} style={{ color: 'var(--accent-primary)' }} />}
                </button>
                <div className="sakshi-call-timer">{formatDuration(callDuration)}</div>
                {phase !== 'done' && (
                  <button
                    className="sakshi-hangup-btn"
                    onClick={phase === 'talking' ? endCall : submitVoicemail}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <PhoneOff size={16} />}
                    {isSaving ? 'Saving...' : 'End Call'}
                  </button>
                )}
              </div>
            </div>

            {/* Transcript Panel */}
            <div className="sakshi-transcript-panel">
              {transcript.map((msg, i) => (
                <TranscriptBubble
                  key={i}
                  msg={msg}
                  customerName={customer.name}
                  isNew={i === transcript.length - 1}
                />
              ))}
              {isAiTyping && <TypingIndicator />}
              <div ref={transcriptEndRef} />
            </div>

            {/* ---- LANGUAGE SELECT ---- */}
            {phase === 'language_select' && (
              <div className="sakshi-bottom-panel">
                <div className="sakshi-panel-label">
                  <Volume2 size={14} /> Sakshi is asking: Which language do you prefer?
                </div>
                <div className="sakshi-lang-buttons">
                  {LANGUAGE_OPTIONS.map(lang => (
                    <button
                      key={lang.key}
                      className="sakshi-lang-btn"
                      onClick={() => selectLanguage(lang.key)}
                    >
                      <span className="sakshi-lang-emoji">{lang.emoji}</span>
                      <span className="sakshi-lang-name">{lang.native}</span>
                      <span className="sakshi-lang-sub">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---- MODE SELECT ---- */}
            {phase === 'mode_select' && (
              <div className="sakshi-bottom-panel">
                <div className="sakshi-panel-label">
                  <Volume2 size={14} /> Sakshi is asking: How would you like to proceed?
                </div>
                <div className="sakshi-mode-buttons">
                  <button className="sakshi-mode-btn talk" onClick={selectTalkMode}>
                    <MessageSquare size={28} />
                    <div className="sakshi-mode-title">
                      {language === 'hindi' ? 'मुझसे बात करें' : language === 'marathi' ? 'माझ्याशी बोला' : 'Talk to Sakshi'}
                    </div>
                    <div className="sakshi-mode-desc">
                      {language === 'hindi' ? 'Neural AI लाइव आवाज' : language === 'marathi' ? 'थेट आवाज संवाद' : 'Live Neural Voice Conversation'}
                    </div>
                  </button>
                  <button className="sakshi-mode-btn record" onClick={selectRecordMode}>
                    <Mic size={28} />
                    <div className="sakshi-mode-title">
                      {language === 'hindi' ? 'संदेश छोड़ें' : language === 'marathi' ? 'संदेश सोडा' : 'Leave a Message'}
                    </div>
                    <div className="sakshi-mode-desc">
                      {language === 'hindi' ? 'बीप के बाद रिकॉर्ड करें' : language === 'marathi' ? 'बीप नंतर रेकॉर्ड करा' : 'Record after the beep'}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ---- BEEP ---- */}
            {phase === 'beep' && (
              <div className="sakshi-bottom-panel">
                <div className="sakshi-beep-container">
                  <div className="sakshi-beep-waves">
                    <div className="sakshi-wave" /><div className="sakshi-wave" /><div className="sakshi-wave" />
                  </div>
                  <div className="sakshi-beep-label">🔔 BEEP</div>
                  <div className="sakshi-beep-sub">Recording will start in a moment...</div>
                </div>
              </div>
            )}

            {/* ---- RECORDING ---- */}
            {phase === 'recording' && (
              <div className="sakshi-bottom-panel">
                <div className="sakshi-recording-indicator">
                  <span className="sakshi-rec-dot" />
                  <span>
                    {language === 'hindi' ? 'रिकॉर्डिंग हो रही है...' : language === 'marathi' ? 'रेकॉर्डिंग सुरू...' : 'Recording...'}
                  </span>
                </div>
                <div className="sakshi-voicemail-input-wrap">
                  <textarea
                    className="sakshi-voicemail-textarea"
                    rows={3}
                    placeholder="Type or speak your voicemail message here..."
                    value={voicemailText}
                    onChange={e => setVoicemailText(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="sakshi-vm-submit"
                    onClick={submitVoicemail}
                    disabled={!voicemailText.trim() || isSaving}
                  >
                    {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                    Send Message
                  </button>
                </div>
              </div>
            )}

            {/* ---- TALKING (With Microphone and Neural Voice) ---- */}
            {phase === 'talking' && (
              <div className="sakshi-bottom-panel">
                <div className="sakshi-input-row" style={{ gap: '8px' }}>
                  <button
                    className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'} btn-icon`}
                    onClick={toggleSpeechRecognition}
                    title={isListening ? 'Stop Listening' : 'Click to Speak via Microphone'}
                    style={{
                      height: '46px',
                      width: '46px',
                      borderRadius: '50%',
                      boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'none',
                      animation: isListening ? 'pulse 1.5s infinite' : 'none'
                    }}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} style={{ color: 'var(--accent-primary)' }} />}
                  </button>
                  <input
                    ref={inputRef}
                    className="sakshi-chat-input"
                    type="text"
                    placeholder={
                      isListening
                        ? '🎙️ Listening to you speak... (say your query)'
                        : language === 'hindi' ? 'बोलें या टाइप करें...'
                        : language === 'marathi' ? 'बोला किंवा टाइप करा...'
                        : 'Click mic to speak, or type here...'
                    }
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={isAiTyping}
                  />
                  <button
                    className="sakshi-send-btn"
                    onClick={sendMessage}
                    disabled={!userInput.trim() || isAiTyping}
                  >
                    {isAiTyping ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
                  </button>
                </div>
                <div className="sakshi-input-hint" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span>Click 🎙️ Mic to speak naturally with Sakshi</span>
                  <span>Neural Voice: {language === 'hindi' ? 'Swara (Hindi)' : language === 'marathi' ? 'Aarohi (Marathi)' : 'Neerja (English)'}</span>
                </div>
              </div>
            )}

            {/* ---- DONE / SUMMARY ---- */}
            {phase === 'done' && savedCall && (
              <div className="sakshi-summary-panel">
                <div className="sakshi-summary-header">
                  <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                  <span>Call Saved to CRM</span>
                </div>
                <div className="sakshi-summary-grid">
                  <div className="sakshi-summary-item">
                    <div className="sakshi-summary-label">Duration</div>
                    <div className="sakshi-summary-value font-mono">{formatDuration(savedCall.duration || callDuration)}</div>
                  </div>
                  <div className="sakshi-summary-item">
                    <div className="sakshi-summary-label">Category</div>
                    <span className={`badge badge-${savedCall.queryCategory}`}>{savedCall.queryCategory}</span>
                  </div>
                  <div className="sakshi-summary-item">
                    <div className="sakshi-summary-label">Sentiment</div>
                    <span className={`badge badge-${savedCall.sentiment}`}>{savedCall.sentiment}</span>
                  </div>
                  <div className="sakshi-summary-item">
                    <div className="sakshi-summary-label">Language</div>
                    <span className="badge badge-inquiry">{LANGUAGE_OPTIONS.find(l => l.key === language)?.native || language}</span>
                  </div>
                  <div className="sakshi-summary-item">
                    <div className="sakshi-summary-label">Resolution</div>
                    <span className={`badge badge-${savedCall.resolution}`}>{savedCall.resolution}</span>
                  </div>
                </div>
                {savedCall.summary && (
                  <div className="sakshi-summary-text">{savedCall.summary}</div>
                )}
                <div className="sakshi-summary-actions">
                  <button className="btn btn-secondary" onClick={resetAll}>
                    <Phone size={14} /> New Call
                  </button>
                  <button className="btn btn-primary" onClick={() => router.push('/calls')}>
                    View All Calls <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .speaking-pulse {
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.8) !important;
          animation: pulse 1.2s infinite;
        }
      `}</style>
    </>
  );
}
