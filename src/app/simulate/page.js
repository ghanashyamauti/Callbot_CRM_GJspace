'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, PhoneOff, Bot, User, Loader2, CheckCircle2, ArrowRight,
  Mic, MicOff, MessageSquare, Globe, Volume2, Send, Radio
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
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function generateCallId() {
  return 'CALL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase();
}

// Language display labels
const LANGUAGE_OPTIONS = [
  { key: 'english', label: 'English', emoji: '🇬🇧', native: 'English' },
  { key: 'hindi', label: 'Hindi', emoji: '🇮🇳', native: 'हिंदी' },
  { key: 'marathi', label: 'Marathi', emoji: '🟠', native: 'मराठी' },
];

// ==================== SUB-COMPONENTS ====================

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
        {isBot
          ? <Bot size={14} />
          : <User size={14} />
        }
      </div>
      <div className="sakshi-bubble-content">
        <div className="sakshi-bubble-label">
          {isBot ? 'Sakshi' : customerName}
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
        <div className="sakshi-bubble-label">Sakshi</div>
        <div className="sakshi-typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function SimulatePage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'GJ SpaCes';

  // Customer info — randomized at mount
  const [customer] = useState(() => {
    const name = getRandomItem(INDIAN_NAMES);
    const phone = getRandomPhone();
    const email = name.toLowerCase().replace(/\s+/g, '.') + '@' + getRandomItem(['gmail.com', 'yahoo.com', 'outlook.com']);
    const location = getRandomItem(PUNE_AREAS) + ', Pune';
    return { name, phone, email, location };
  });

  // Call phases:
  // idle → ringing → language_select → mode_select → talking → recording → beep → done
  const [phase, setPhase] = useState('idle');
  const [language, setLanguage] = useState('english');
  const [transcript, setTranscript] = useState([]); // [{role, text}]
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [voicemailText, setVoicemailText] = useState('');
  const [startTime] = useState(new Date());
  const [callDuration, setCallDuration] = useState(0);
  const [savedCall, setSavedCall] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiMessages, setAiMessages] = useState([]); // OpenAI-format messages for context

  const transcriptEndRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Scroll transcript to bottom on new messages
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

  // ---- Flow steps ----

  function startCall() {
    setPhase('ringing');
    setTimeout(() => setPhase('language_select'), 2500);
  }

  function selectLanguage(lang) {
    setLanguage(lang);
    const honorific = getHonorific(customer.name, lang);
    const introText = getSakshiIntro(lang, honorific);

    setTranscript([{ role: 'bot', text: introText }]);

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
      ? 'बहुत अच्छा! मुझे बताइए, मैं आपकी किस तरह मदद कर सकती हूं?'
      : language === 'marathi'
      ? 'छान! सांगा, मी आपली कशी मदत करू शकते?'
      : 'Great! Please go ahead and tell me how I can help you today.';

    setTranscript(prev => [...prev, { role: 'bot', text: modeMsg }]);
    setAiMessages([{ role: 'assistant', content: modeMsg }]);
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
    setPhase('beep');
    setTimeout(() => setPhase('recording'), 2000);
  }

  const sendMessage = useCallback(async () => {
    const text = userInput.trim();
    if (!text || isAiTyping) return;

    setUserInput('');

    // Add to transcript
    const userMsg = { role: 'customer', text };
    setTranscript(prev => [...prev, userMsg]);

    // Add to AI context
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
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = language === 'hindi'
        ? 'माफ करें, मुझे कुछ तकनीकी समस्या हो रही है। कृपया थोड़ी देर बाद कोशिश करें।'
        : language === 'marathi'
        ? 'माफ करा, मला काही तांत्रिक अडचण येत आहे. कृपया थोड्या वेळाने प्रयत्न करा.'
        : 'I apologize, I\'m having a technical issue right now. Please try again in a moment.';
      setTranscript(prev => [...prev, { role: 'bot', text: errMsg }]);
    } finally {
      setIsAiTyping(false);
    }
  }, [userInput, isAiTyping, aiMessages, language]);

  async function endCall() {
    setIsSaving(true);
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    // Generate summary via AI
    let summary = 'Customer called GJ SpaCes for assistance.';
    let queryCategory = 'inquiry';
    let sentiment = 'neutral';
    let resolution = 'pending';

    try {
      if (transcript.length > 1) {
        const transcriptForSummary = [...aiMessages];
        if (transcriptForSummary.length > 0) {
          transcriptForSummary.push({
            role: 'user',
            content: `Please now generate a JSON summary of this call with fields: summary (string), queryCategory (one of: inquiry, booking, complaint, support), sentiment (one of: positive, neutral, negative), resolution (one of: resolved, pending, escalated).`
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
            } catch (_) { /* keep defaults */ }
          }
        }
      }
    } catch (_) { /* keep defaults */ }

    const callData = {
      id: crypto.randomUUID(),
      callId: generateCallId(),
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerLocation: customer.location,
      direction: 'inbound',
      status: 'completed',
      duration,
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
      console.error('Save error:', err);
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
      summary: `Voicemail from ${customer.name}: "${voicemailText.substring(0, 100)}${voicemailText.length > 100 ? '...' : ''}"`,
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

  // ==================== RENDER ====================

  return (
    <>
      <TopBar title="AI Call Simulator" subtitle={`Live Sakshi CallBot — ${brandName}`} />
      <div className="page-container">

        {/* ---- IDLE ---- */}
        {phase === 'idle' && (
          <div className="sakshi-idle-container">
            <div className="sakshi-idle-hero">
              <div className="sakshi-avatar-lg">
                <Bot size={48} />
                <span className="sakshi-avatar-badge">AI</span>
              </div>
              <h1 className="sakshi-hero-title">Meet Sakshi</h1>
              <p className="sakshi-hero-subtitle">
                Your AI-powered call assistant for {brandName}. Sakshi greets customers,
                detects language, handles queries in English, Hindi & Marathi, and saves everything to CRM.
              </p>
              <div className="sakshi-features">
                <div className="sakshi-feature">
                  <Globe size={18} /><span>3 Languages</span>
                </div>
                <div className="sakshi-feature">
                  <Bot size={18} /><span>AI Powered</span>
                </div>
                <div className="sakshi-feature">
                  <Mic size={18} /><span>Voice Messages</span>
                </div>
                <div className="sakshi-feature">
                  <Radio size={18} /><span>Live CRM Sync</span>
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
                Simulate Incoming Call
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

        {/* ---- CALL UI (language_select, mode_select, talking, recording, beep, done) ---- */}
        {['language_select', 'mode_select', 'talking', 'recording', 'beep', 'done'].includes(phase) && (
          <div className="sakshi-call-layout">
            {/* Call Header */}
            <div className="sakshi-call-header">
              <div className="sakshi-call-header-left">
                <div className={`sakshi-status-dot ${phase === 'done' ? 'done' : 'live'}`} />
                <span className="sakshi-call-status">
                  {phase === 'done' ? 'Call Ended' : 'Live Call'}
                </span>
              </div>
              <div className="sakshi-call-header-center">
                <div className="sakshi-call-avatar">{customer.name.charAt(0)}</div>
                <div>
                  <div className="sakshi-call-customer-name">{customer.name}</div>
                  <div className="sakshi-call-customer-phone">{customer.phone}</div>
                </div>
              </div>
              <div className="sakshi-call-header-right">
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

            {/* Transcript */}
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
                <div className="sakshi-intro-message">
                  {`Hello! My name is Sakshi, I'm the AI assistant for ${brandName}.\nWhich language would you like to continue in?`}
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
                      {language === 'hindi' ? 'AI के साथ लाइव बातचीत' : language === 'marathi' ? 'AI सोबत थेट संवाद' : 'Live AI conversation'}
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

            {/* ---- BEEP ANIMATION ---- */}
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

            {/* ---- VOICE MESSAGE INPUT ---- */}
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
                    placeholder={
                      language === 'hindi' ? 'यहां अपना संदेश टाइप करें...'
                      : language === 'marathi' ? 'येथे आपला संदेश टाइप करा...'
                      : 'Type your message here...'
                    }
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
                    {language === 'hindi' ? 'भेजें' : language === 'marathi' ? 'पाठवा' : 'Send'}
                  </button>
                </div>
              </div>
            )}

            {/* ---- TALK INPUT ---- */}
            {phase === 'talking' && (
              <div className="sakshi-bottom-panel">
                <div className="sakshi-input-row">
                  <input
                    ref={inputRef}
                    className="sakshi-chat-input"
                    type="text"
                    placeholder={
                      language === 'hindi' ? 'Sakshi से बात करें...'
                      : language === 'marathi' ? 'Sakshi शी बोला...'
                      : 'Type your message to Sakshi...'
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
                    {isAiTyping
                      ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Send size={18} />
                    }
                  </button>
                </div>
                <div className="sakshi-input-hint">
                  Press Enter to send • Sakshi responds via AI
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

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }
        @keyframes ringing-dots {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes beep-wave {
          0% { transform: scaleY(0.4); opacity: 0.6; }
          50% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0.4); opacity: 0.6; }
        }
        @keyframes bubble-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes rec-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        /* Idle */
        .sakshi-idle-container {
          display: flex; justify-content: center; padding: 40px 20px;
        }
        .sakshi-idle-hero {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 48px 40px;
          max-width: 560px;
          width: 100%;
          text-align: center;
          box-shadow: var(--card-shadow);
        }
        .sakshi-avatar-lg {
          width: 100px; height: 100px; border-radius: 50%;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px; color: white; position: relative;
          box-shadow: 0 0 0 12px rgba(var(--brand-primary-rgb, 99,102,241), 0.12);
        }
        .sakshi-avatar-badge {
          position: absolute; top: -4px; right: -4px;
          background: var(--success); color: white;
          font-size: 9px; font-weight: 800; padding: 2px 5px; border-radius: 6px;
          font-family: var(--font-display);
        }
        .sakshi-hero-title {
          font-family: var(--font-display); font-size: 32px; font-weight: 800;
          color: var(--text-primary); margin-bottom: 12px;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .sakshi-hero-subtitle {
          font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 28px;
        }
        .sakshi-features {
          display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 28px;
        }
        .sakshi-feature {
          display: flex; align-items: center; gap: 6px;
          background: var(--accent-light); color: var(--brand-primary);
          padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
        }
        .sakshi-customer-preview {
          display: flex; align-items: center; gap: 14px;
          background: rgba(255,255,255,0.04); border: 1px solid var(--card-border);
          border-radius: 12px; padding: 14px 18px; margin-bottom: 28px; text-align: left;
        }
        .sakshi-customer-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: white; font-size: 18px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sakshi-customer-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .sakshi-customer-phone { font-size: 12px; color: var(--text-tertiary); font-family: var(--font-mono); margin-top: 2px; }
        .sakshi-call-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
          color: white; border: none; padding: 16px 36px;
          border-radius: 14px; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 24px rgba(99,102,241,0.35);
        }
        .sakshi-call-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,0.45); }
        .sakshi-call-btn:active { transform: translateY(0); }

        /* Ringing */
        .sakshi-full-screen {
          display: flex; justify-content: center; align-items: center;
          min-height: calc(100vh - 200px);
        }
        .sakshi-ringing-screen { text-align: center; }
        .sakshi-ring-outer {
          width: 160px; height: 160px; border-radius: 50%;
          background: rgba(99,102,241,0.08);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 32px;
          animation: ring-pulse 1.5s ease-in-out infinite;
        }
        .sakshi-ring-mid {
          width: 120px; height: 120px; border-radius: 50%;
          background: rgba(99,102,241,0.15);
          display: flex; align-items: center; justify-content: center;
          animation: ring-pulse 1.5s ease-in-out infinite 0.3s;
        }
        .sakshi-ring-inner {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
          display: flex; align-items: center; justify-content: center;
          color: white;
        }
        .sakshi-ringing-label {
          font-size: 12px; font-weight: 600; color: var(--danger); text-transform: uppercase;
          letter-spacing: 1.5px; margin-bottom: 8px;
        }
        .sakshi-ringing-name { font-size: 24px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
        .sakshi-ringing-brand { font-size: 13px; color: var(--text-tertiary); margin-bottom: 20px; }
        .sakshi-ringing-dots { display: flex; gap: 6px; justify-content: center; }
        .sakshi-ringing-dots span {
          width: 8px; height: 8px; border-radius: 50%; background: var(--brand-primary);
          animation: ringing-dots 1.4s ease-in-out infinite;
        }
        .sakshi-ringing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .sakshi-ringing-dots span:nth-child(3) { animation-delay: 0.4s; }

        /* Call layout */
        .sakshi-call-layout {
          max-width: 680px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 0;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: var(--card-shadow);
          min-height: 600px;
        }
        .sakshi-call-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid var(--card-border);
          gap: 12px;
        }
        .sakshi-call-header-left { display: flex; align-items: center; gap: 8px; min-width: 80px; }
        .sakshi-status-dot {
          width: 8px; height: 8px; border-radius: 50%;
        }
        .sakshi-status-dot.live {
          background: var(--danger);
          animation: rec-blink 1.2s ease-in-out infinite;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.2);
        }
        .sakshi-status-dot.done { background: var(--success); }
        .sakshi-call-status { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
        .sakshi-call-header-center { display: flex; align-items: center; gap: 12px; flex: 1; justify-content: center; }
        .sakshi-call-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: white; font-weight: 700; font-size: 14px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .sakshi-call-customer-name { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .sakshi-call-customer-phone { font-size: 11px; color: var(--text-tertiary); font-family: var(--font-mono); }
        .sakshi-call-header-right { display: flex; align-items: center; gap: 10px; min-width: 80px; justify-content: flex-end; }
        .sakshi-call-timer { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .sakshi-hangup-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--danger); color: white;
          border: none; padding: 7px 14px; border-radius: 8px;
          font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
        }
        .sakshi-hangup-btn:hover:not(:disabled) { background: #dc2626; }
        .sakshi-hangup-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Transcript */
        .sakshi-transcript-panel {
          flex: 1; overflow-y: auto; padding: 20px;
          display: flex; flex-direction: column; gap: 12px;
          min-height: 300px; max-height: 420px;
          background: rgba(0,0,0,0.1);
        }
        .sakshi-bubble {
          display: flex; gap: 10px; animation: bubble-in 0.25s ease-out;
        }
        .sakshi-bubble.customer { flex-direction: row-reverse; }
        .sakshi-bubble-avatar {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: white;
        }
        .sakshi-bubble.bot .sakshi-bubble-avatar {
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
        }
        .sakshi-bubble.customer .sakshi-bubble-avatar {
          background: linear-gradient(135deg, #f59e0b, #ef4444);
        }
        .sakshi-bubble-content { max-width: 75%; }
        .sakshi-bubble.customer .sakshi-bubble-content { align-items: flex-end; display: flex; flex-direction: column; }
        .sakshi-bubble-label {
          font-size: 10px; font-weight: 700; color: var(--text-tertiary);
          margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .sakshi-bubble-text {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; border-top-left-radius: 2px;
          padding: 10px 14px; font-size: 13px; line-height: 1.6; color: var(--text-primary);
        }
        .sakshi-bubble.customer .sakshi-bubble-text {
          background: rgba(99,102,241,0.18);
          border-color: rgba(99,102,241,0.3);
          border-radius: 12px; border-top-right-radius: 2px;
        }
        .sakshi-typing {
          display: flex; gap: 4px; align-items: center;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; border-top-left-radius: 2px;
          padding: 12px 16px;
        }
        .sakshi-typing span {
          width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary);
          animation: typing-bounce 1.4s ease-in-out infinite;
        }
        .sakshi-typing span:nth-child(2) { animation-delay: 0.2s; }
        .sakshi-typing span:nth-child(3) { animation-delay: 0.4s; }

        /* Bottom panels */
        .sakshi-bottom-panel {
          border-top: 1px solid var(--card-border);
          padding: 16px 20px;
          background: rgba(0,0,0,0.15);
        }
        .sakshi-panel-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: var(--text-tertiary); margin-bottom: 12px;
          font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .sakshi-intro-message {
          font-size: 13px; color: var(--text-secondary); line-height: 1.6;
          background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px; padding: 12px 16px; margin-bottom: 14px;
          white-space: pre-line;
        }
        .sakshi-lang-buttons {
          display: flex; gap: 10px; flex-wrap: wrap;
        }
        .sakshi-lang-btn {
          flex: 1; min-width: 140px;
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: rgba(255,255,255,0.04); border: 1px solid var(--card-border);
          border-radius: 12px; padding: 14px; cursor: pointer; transition: all 0.2s;
        }
        .sakshi-lang-btn:hover {
          border-color: var(--brand-primary); background: rgba(99,102,241,0.1);
          transform: translateY(-2px);
        }
        .sakshi-lang-emoji { font-size: 24px; }
        .sakshi-lang-name { font-size: 16px; font-weight: 800; color: var(--text-primary); }
        .sakshi-lang-sub { font-size: 11px; color: var(--text-tertiary); }
        .sakshi-mode-buttons { display: flex; gap: 12px; }
        .sakshi-mode-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 20px 16px; border-radius: 14px; border: 1px solid;
          cursor: pointer; transition: all 0.2s; text-align: center;
        }
        .sakshi-mode-btn.talk {
          border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.08); color: var(--brand-primary);
        }
        .sakshi-mode-btn.talk:hover { background: rgba(99,102,241,0.18); transform: translateY(-2px); }
        .sakshi-mode-btn.record {
          border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); color: var(--danger);
        }
        .sakshi-mode-btn.record:hover { background: rgba(239,68,68,0.18); transform: translateY(-2px); }
        .sakshi-mode-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .sakshi-mode-desc { font-size: 11px; color: var(--text-tertiary); }

        /* Beep */
        .sakshi-beep-container { text-align: center; padding: 10px; }
        .sakshi-beep-waves {
          display: flex; align-items: center; justify-content: center; gap: 5px;
          height: 40px; margin-bottom: 10px;
        }
        .sakshi-wave {
          width: 4px; background: var(--danger); border-radius: 2px;
          animation: beep-wave 0.6s ease-in-out infinite;
        }
        .sakshi-wave:nth-child(1) { height: 24px; animation-delay: 0s; }
        .sakshi-wave:nth-child(2) { height: 40px; animation-delay: 0.1s; }
        .sakshi-wave:nth-child(3) { height: 24px; animation-delay: 0.2s; }
        .sakshi-beep-label { font-size: 20px; font-weight: 800; color: var(--danger); margin-bottom: 4px; }
        .sakshi-beep-sub { font-size: 12px; color: var(--text-tertiary); }

        /* Recording */
        .sakshi-recording-indicator {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 600; color: var(--danger); margin-bottom: 10px;
        }
        .sakshi-rec-dot {
          width: 8px; height: 8px; border-radius: 50%; background: var(--danger);
          animation: rec-blink 1s ease-in-out infinite;
        }
        .sakshi-voicemail-input-wrap { display: flex; gap: 10px; align-items: flex-end; }
        .sakshi-voicemail-textarea {
          flex: 1; background: rgba(255,255,255,0.06);
          border: 1px solid var(--card-border); border-radius: 10px;
          padding: 12px; color: var(--text-primary); font-size: 13px;
          line-height: 1.5; resize: none; font-family: inherit;
          transition: border-color 0.2s;
        }
        .sakshi-voicemail-textarea:focus { outline: none; border-color: var(--brand-primary); }
        .sakshi-voicemail-textarea::placeholder { color: var(--text-tertiary); }
        .sakshi-vm-submit {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--danger); color: white; border: none;
          padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .sakshi-vm-submit:hover:not(:disabled) { background: #dc2626; }
        .sakshi-vm-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Chat input */
        .sakshi-input-row { display: flex; gap: 10px; align-items: center; }
        .sakshi-chat-input {
          flex: 1; background: rgba(255,255,255,0.06);
          border: 1px solid var(--card-border); border-radius: 10px;
          padding: 12px 16px; color: var(--text-primary); font-size: 14px;
          font-family: inherit; transition: border-color 0.2s;
        }
        .sakshi-chat-input:focus { outline: none; border-color: var(--brand-primary); }
        .sakshi-chat-input::placeholder { color: var(--text-tertiary); }
        .sakshi-chat-input:disabled { opacity: 0.6; }
        .sakshi-send-btn {
          width: 44px; height: 44px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
          color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .sakshi-send-btn:hover:not(:disabled) { transform: scale(1.05); }
        .sakshi-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sakshi-input-hint { font-size: 11px; color: var(--text-tertiary); margin-top: 8px; text-align: center; }

        /* Summary */
        .sakshi-summary-panel {
          border-top: 1px solid var(--card-border);
          padding: 20px; background: rgba(0,0,0,0.1);
        }
        .sakshi-summary-header {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: var(--success); margin-bottom: 16px;
        }
        .sakshi-summary-grid {
          display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;
        }
        .sakshi-summary-item { display: flex; flex-direction: column; gap: 4px; }
        .sakshi-summary-label { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
        .sakshi-summary-value { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .sakshi-summary-text {
          font-size: 13px; color: var(--text-secondary); line-height: 1.6;
          background: rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 14px;
          margin-bottom: 16px;
        }
        .sakshi-summary-actions { display: flex; gap: 10px; }
      `}</style>
    </>
  );
}
