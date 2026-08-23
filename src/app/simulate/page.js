'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
  RotateCcw, Send, User, Bot, Sparkles, CheckCircle2,
  Clock, Shield, ArrowRight, Loader2, MessageSquare, AlertCircle
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useNotifications } from '@/components/NotificationContext';
import {
  INDIAN_NAMES,
  PUNE_AREAS,
  getRandomItem,
  getRandomPhone,
} from '@/lib/gjspaces-knowledge';
import {
  getHonorific,
  getSakshiIntro,
  getSakshiModePrompt,
} from '@/lib/sakshi-persona';


// ==================== CONFIG ====================

const LANGUAGE_OPTIONS = [
  { key: 'english', label: 'English', emoji: '🇬🇧', sub: 'Clear Indian English' },
  { key: 'hindi',   label: 'हिंदी',   emoji: '🇮🇳', sub: 'Hindi' },
  { key: 'marathi', label: 'मराठी',   emoji: '🟠', sub: 'Marathi' },
];

function generateCallId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `CALL-${ts}-${rand}`;
}

function generateWaveform() {
  return Array.from({ length: 60 }, () => +(Math.random() * 0.8 + 0.2).toFixed(2));
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ==================== MAIN COMPONENT ====================

export default function SimulatePage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'GJ SpaCes';

  const [customer, setCustomer] = useState({
    name: 'Ghanashyam Auti',
    phone: '+91 93229 79345',
    email: 'ghanashyam@gjspaces.com',
    location: 'Koregaon Park, Pune',
  });

  const randomizeCaller = () => {
    const name = getRandomItem(INDIAN_NAMES);
    const phone = getRandomPhone();
    const email = name.toLowerCase().replace(/\s+/g, '.') + '@' + getRandomItem(['gmail.com', 'yahoo.com', 'outlook.com']);
    const location = getRandomItem(PUNE_AREAS) + ', Pune';
    setCustomer({ name, phone, email, location });
  };

  useEffect(() => {
    randomizeCaller();
  }, []);

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
  const isRecognitionActiveRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const micStreamRef = useRef(null);
  const recordedAudioDataUrlRef = useRef(null);

  const audioContextRef = useRef(null);
  const mixerDestinationRef = useRef(null);

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
      clearInterval(timerRef.current);
    };
  }, []);

  // Start Dual-Track Microphone & Bot Audio Mixer Recording
  async function startMicRecorder() {
    try {
      if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioContextClass();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const mixerDest = ctx.createMediaStreamDestination();
        mixerDestinationRef.current = mixerDest;

        // 1. Capture User's Real Microphone Voice
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = micStream;

        const micSource = ctx.createMediaStreamSource(micStream);
        micSource.connect(mixerDest); // Route real mic voice into master mixer

        audioChunksRef.current = [];

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

        const recorder = mimeType ? new MediaRecorder(mixerDest.stream, { mimeType }) : new MediaRecorder(mixerDest.stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
              recordedAudioDataUrlRef.current = reader.result;
            };
            reader.readAsDataURL(blob);
          }
        };

        recorder.start(500);
        mediaRecorderRef.current = recorder;
      }
    } catch (err) {
      console.warn('Dual-track recording initialization:', err);
    }
  }

  // Stop Real Microphone Recording
  function stopMicRecorder() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
  }

  function speakBrowserFemaleVoice(text, lang, onDone) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onDone) onDone();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v =>
      (v.name.includes('Female') || v.name.includes('Heera') || v.name.includes('Kalpana') || v.name.includes('Zira') || v.name.includes('Swara') || v.name.includes('Neerja') || v.name.includes('Aarohi') || v.name.includes('Google हिन्दी') || v.name.includes('Google मराठी'))
    ) || voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('woman'));

    if (femaleVoice) utter.voice = femaleVoice;
    utter.pitch = 1.15; // Set higher feminine pitch
    if (lang === 'hindi') utter.lang = 'hi-IN';
    else if (lang === 'marathi') utter.lang = 'mr-IN';
    else utter.lang = 'en-IN';

    utter.onend = () => { if (onDone) onDone(); };
    utter.onerror = () => { if (onDone) onDone(); };
    window.speechSynthesis.speak(utter);
  }

  // Play single speech audio stream with auto-mic muting to prevent double voice echo
  const playSpeech = useCallback((text, lang = 'english') => {
    if (isMuted || typeof window === 'undefined') return;

    // Pause recognition while Sakshi speaks — keep-alive loop will auto-resume after
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
    // Temporarily disable keep-alive loop during bot speech
    isRecognitionActiveRef.current = false;
    setIsListening(false);

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsBotSpeaking(true);

    const audioUrl = `/api/tts?language=${lang}&text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;

    const onFinishSpeaking = () => {
      setIsBotSpeaking(false);
    };

    audio.onended = onFinishSpeaking;
    audio.onerror = () => {
      speakBrowserFemaleVoice(text, lang, onFinishSpeaking);
    };

    audio.play().catch(() => {
      speakBrowserFemaleVoice(text, lang, onFinishSpeaking);
    });
  }, [isMuted]);

  // ─── MediaRecorder-based Push-to-Talk (Groq Whisper STT) ───────────────────
  // Replaces Web Speech API which fails with 'network' errors
  // Records mic locally → sends to /api/stt (Groq Whisper) for transcription

  async function startListening() {
    if (typeof window === 'undefined') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Microphone not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    // Stop any previous recording
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }

    // Interrupt Sakshi if she's speaking
    if (audioPlayerRef.current) { audioPlayerRef.current.pause(); }
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); }
    setIsBotSpeaking(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop mic stream tracks
        stream.getTracks().forEach(t => t.stop());

        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 1000) return; // too short, ignore

        // Show "Transcribing..." state
        setIsListening(false);
        setIsAiTyping(true);

        try {
          const formData = new FormData();
          formData.append('audio', blob, 'speech.webm');
          formData.append('language', language);

          const res = await fetch('/api/stt', { method: 'POST', body: formData });
          const data = await res.json();

          if (data.text && data.text.trim()) {
            setUserInput(data.text.trim());
          }
        } catch (err) {
          console.error('[STT] Transcription error:', err);
        } finally {
          setIsAiTyping(false);
        }
      };

      recorder.start();
      recognitionRef.current = recorder;
      isRecognitionActiveRef.current = true;
      setIsListening(true);
    } catch (err) {
      console.error('[STT] Microphone access error:', err);
      if (err.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access in browser settings.');
      }
      setIsListening(false);
    }
  }

  function stopListening() {
    isRecognitionActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    // Note: setIsListening(false) is handled inside recorder.onstop
  }

  function toggleSpeechRecognition() {
    if (isListening || isRecognitionActiveRef.current) {
      stopListening();
    } else {
      startListening();
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
    startMicRecorder();
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
      message: `${customer.name} started a simulated call in ${lang}`,
      priority: 'medium',
    });

    setTimeout(() => {
      setPhase('mode_select');
      const modePrompt = getSakshiModePrompt(lang);
      playSpeech(modePrompt, lang);
    }, 2200);
  }

  function selectTalkMode(mode) {
    if (mode === 'talk') {
      setPhase('talking');
      const greeting = language === 'hindi'
        ? `जी, मैं सुन रही हूं। आप GJ SpaCes के बारे में क्या जानना चाहते हैं?`
        : language === 'marathi'
        ? `हो, मी ऐकत आहे. आपण GJ SpaCes बद्दल काय माहिती जाणून घेऊ इच्छिता?`
        : `Yes, I am listening! What would you like to know about GJ SpaCes?`;

      setTranscript(prev => [...prev, { role: 'bot', text: greeting }]);
      setAiMessages([{ role: 'assistant', content: greeting }]);
      playSpeech(greeting, language);

      setTimeout(() => inputRef.current?.focus(), 500);
    } else {
      setPhase('voicemail');
      const vmPrompt = language === 'hindi'
        ? `कृपया बीप के बाद अपना संदेश रिकॉर्ड करें।`
        : language === 'marathi'
        ? `कृपया बीप नंतर आपला संदेश रेकॉर्ड करा.`
        : `Please record your message after the beep.`;

      setTranscript(prev => [...prev, { role: 'bot', text: vmPrompt }]);
      playSpeech(vmPrompt, language);

      setTimeout(() => setPhase('beep'), 1800);
    }
  }

  async function sendMessage() {
    const text = userInput.trim();
    if (!text || isAiTyping) return;

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const customerMsg = { role: 'customer', text };
    const updatedTranscript = [...transcript, customerMsg];
    setTranscript(updatedTranscript);
    setUserInput('');
    setIsAiTyping(true);

    const updatedAiMessages = [...aiMessages, { role: 'user', content: text }];
    setAiMessages(updatedAiMessages);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedAiMessages,
          language,
        }),
      });

      if (!res.ok) throw new Error('Failed to get AI response');

      const data = await res.json();
      const botReply = data.reply;

      setTranscript(prev => [...prev, { role: 'bot', text: botReply }]);
      setAiMessages(prev => [...prev, { role: 'assistant', content: botReply }]);
      playSpeech(botReply, language);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = language === 'hindi'
        ? 'माफ़ कीजिए, मुझे उत्तर देने में समस्या आ रही है।'
        : language === 'marathi'
        ? 'क्षमस्व, उत्तर देण्यात अडचण येत आहे.'
        : 'I apologize, I am having trouble responding. Please try again.';

      setTranscript(prev => [...prev, { role: 'bot', text: errorMsg }]);
      playSpeech(errorMsg, language);
    } finally {
      setIsAiTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function endCall() {
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    stopMicRecorder();
    await saveCallToCRM();
  }

  async function saveCallToCRM() {
    setIsSaving(true);
    const endTime = new Date();
    const duration = Math.max(callDuration, 15);

    let summary = `Customer ${customer.name} called GJ SpaCes in ${language}.`;
    let queryCategory = 'inquiry';
    let sentiment = 'positive';
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
      recordingUrl: recordedAudioDataUrlRef.current || null,
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
    stopMicRecorder();

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
    const duration = Math.max(callDuration, 10);

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
      recordingUrl: recordedAudioDataUrlRef.current || null,
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
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    stopMicRecorder();
    setPhase('idle');
    setTranscript([]);
    setAiMessages([]);
    setUserInput('');
    setVoicemailText('');
    setSavedCall(null);
    setCallDuration(0);
    setIsListening(false);
    setIsBotSpeaking(false);
    recordedAudioDataUrlRef.current = null;
  }

  return (
    <>
      <TopBar title="Interactive Call Simulator" subtitle="Experience Sakshi — Voice AI Assistant for GJ SpaCes" />

      <div className="page-container" style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* ---- IDLE / HERO ---- */}
        {phase === 'idle' && (
          <div className="sakshi-idle-container">
            <div className="sakshi-idle-hero">
              <div className="sakshi-avatar-lg">
                <Bot size={40} />
                <div className="sakshi-avatar-badge">● Online</div>
              </div>

              <h1 className="sakshi-hero-title">Experience Sakshi AI Voice Bot</h1>
              <p className="sakshi-hero-subtitle">
                Talk directly with Sakshi in <strong>Marathi</strong>, <strong>Hindi</strong>, or <strong>English</strong>.
                Ask about GJ SpaCes coworking desks, private cabins, pricing, amenities, or interior design.
              </p>

              <div className="sakshi-features">
                <div className="sakshi-feature">
                  <Volume2 size={18} style={{ color: 'var(--accent)' }} />
                  <span>Studio Neural TTS</span>
                </div>
                <div className="sakshi-feature">
                  <Mic size={18} style={{ color: 'var(--success)' }} />
                  <span>Real Mic Recording</span>
                </div>
                <div className="sakshi-feature">
                  <Sparkles size={18} style={{ color: '#8b5cf6' }} />
                  <span>Fast AI Replies</span>
                </div>
                <div className="sakshi-feature">
                  <Clock size={18} style={{ color: 'var(--warning)' }} />
                  <span>Auto CRM Sync</span>
                </div>
              </div>

              {/* Customer Info Preview & Randomize */}
              <div className="sakshi-customer-preview" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="sakshi-customer-avatar">{customer.name.charAt(0)}</div>
                  <div>
                    <div className="sakshi-customer-name">{customer.name}</div>
                    <div className="sakshi-customer-phone">{customer.phone} • {customer.location}</div>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={randomizeCaller}
                  title="Randomize Caller"
                  style={{ gap: '4px', fontSize: '11px', color: 'var(--accent)', border: '1px solid var(--border)' }}
                >
                  <RotateCcw size={12} /> Randomize
                </button>
              </div>

              <button className="sakshi-call-btn" onClick={startCall}>
                <Phone size={20} />
                <span>Start Voice Call</span>
              </button>
            </div>
          </div>
        )}

        {/* ---- RINGING SCREEN ---- */}
        {phase === 'ringing' && (
          <div className="sakshi-full-screen">
            <div className="sakshi-ringing-screen">
              <div className="sakshi-ring-outer">
                <div className="sakshi-ring-mid">
                  <div className="sakshi-ring-inner">
                    <Phone size={32} />
                  </div>
                </div>
              </div>
              <div className="sakshi-ringing-label">Incoming Call</div>
              <div className="sakshi-ringing-name">{customer.name}</div>
              <div className="sakshi-ringing-brand">{brandName} CallBot</div>
              <div className="sakshi-ringing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {/* ---- ACTIVE CALL LAYOUT ---- */}
        {phase !== 'idle' && phase !== 'ringing' && (
          <div className="sakshi-call-layout">

            {/* Header */}
            <div className="sakshi-call-header">
              <div className="sakshi-call-header-left">
                <div className={`sakshi-status-dot ${phase === 'done' ? 'done' : ''}`} />
                <span className="sakshi-call-status">
                  {phase === 'language_select' ? 'Select Language'
                    : phase === 'mode_select' ? 'Select Option'
                    : phase === 'talking' ? 'In Call — Speaking'
                    : phase === 'voicemail' || phase === 'beep' ? 'Voicemail'
                    : 'Call Ended'}
                </span>
                {isBotSpeaking && (
                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Volume2 size={12} /> Sakshi Speaking...
                  </span>
                )}
              </div>

              <div className="sakshi-call-header-center">
                <div className={`sakshi-call-avatar ${isBotSpeaking ? 'speaking-pulse' : ''}`}>
                  <Bot size={18} />
                </div>
                <div>
                  <div className="sakshi-call-customer-name">Sakshi AI ↔ {customer.name}</div>
                  <div className="sakshi-call-customer-phone">{customer.phone}</div>
                </div>
              </div>

              <div className="sakshi-call-header-right">
                <div className="sakshi-call-timer font-mono">
                  {formatDuration(callDuration)}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX size={16} style={{ color: 'var(--danger)' }} /> : <Volume2 size={16} />}
                </button>
                {phase !== 'done' && (
                  <button className="sakshi-hangup-btn" onClick={endCall} disabled={isSaving}>
                    {isSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <PhoneOff size={14} />}
                    <span>Hang Up</span>
                  </button>
                )}
              </div>
            </div>

            {/* Transcript / Conversation History */}
            <div className="sakshi-transcript-panel">
              {transcript.map((msg, i) => (
                <div key={i} className={`sakshi-bubble ${msg.role}`}>
                  <div className="sakshi-bubble-avatar">
                    {msg.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className="sakshi-bubble-content">
                    <div className="sakshi-bubble-label">
                      {msg.role === 'bot' ? 'Sakshi (AI Assistant)' : customer.name}
                    </div>
                    <div className="sakshi-bubble-text">{msg.text}</div>
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="sakshi-bubble bot">
                  <div className="sakshi-bubble-avatar"><Bot size={14} /></div>
                  <div className="sakshi-bubble-content">
                    <div className="sakshi-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* ---- PHASE: LANGUAGE SELECTION ---- */}
            {phase === 'language_select' && (
              <div className="sakshi-bottom-panel">
                <div className="sakshi-panel-label">
                  <Sparkles size={14} /> Choose Your Preferred Language:
                </div>
                <div className="sakshi-lang-buttons">
                  {LANGUAGE_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      className="sakshi-lang-btn"
                      onClick={() => selectLanguage(opt.key)}
                    >
                      <span className="sakshi-lang-emoji">{opt.emoji}</span>
                      <span className="sakshi-lang-name">{opt.label}</span>
                      <span className="sakshi-lang-sub">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---- PHASE: MODE SELECTION ---- */}
            {phase === 'mode_select' && (
              <div className="sakshi-bottom-panel">
                <div className="sakshi-panel-label">
                  <Sparkles size={14} /> How would you like to proceed?
                </div>
                <div className="sakshi-mode-buttons">
                  <button className="sakshi-mode-btn talk" onClick={() => selectTalkMode('talk')}>
                    <Phone size={22} />
                    <div className="sakshi-mode-title">Talk to Sakshi</div>
                    <div className="sakshi-mode-desc">Live natural voice conversation in {language}</div>
                  </button>
                  <button className="sakshi-mode-btn record" onClick={() => selectTalkMode('voicemail')}>
                    <MessageSquare size={22} />
                    <div className="sakshi-mode-title">Leave a Voicemail</div>
                    <div className="sakshi-mode-desc">Record a voice message for our team</div>
                  </button>
                </div>
              </div>
            )}

            {/* ---- PHASE: VOICEMAIL RECORDING ---- */}
            {(phase === 'voicemail' || phase === 'beep') && (
              <div className="sakshi-bottom-panel">
                <div className="sakshi-panel-label">
                  <Mic size={14} style={{ color: 'var(--danger)' }} /> Speak or type your message:
                </div>
                <div className="sakshi-input-row">
                  <button
                    className="btn btn-sm"
                    onClick={toggleSpeechRecognition}
                    style={{
                      background: isListening ? 'var(--danger)' : 'var(--bg-muted)',
                      color: isListening ? '#ffffff' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-full)',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    <span style={{ fontSize: '12px' }}>{isListening ? 'Listening...' : 'Voice Mic'}</span>
                  </button>
                  <input
                    ref={inputRef}
                    className="sakshi-chat-input"
                    placeholder="Speak into mic or type your voicemail message..."
                    value={voicemailText}
                    onChange={e => setVoicemailText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitVoicemail()}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={submitVoicemail}
                    disabled={!voicemailText.trim() || isSaving}
                    style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px' }}
                  >
                    {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit'}
                  </button>
                </div>
              </div>
            )}

            {/* ---- PHASE: LIVE TALKING ---- */}
            {phase === 'talking' && (
              <div className="sakshi-bottom-panel">
                <div className="sakshi-input-row">
                  {/* Push-to-Talk Mic Button (Groq Whisper) */}
                  <button
                    className="btn btn-sm"
                    onClick={toggleSpeechRecognition}
                    disabled={isAiTyping}
                    title={isListening ? 'Click to stop — Groq AI will transcribe your voice' : 'Click to record your voice (Groq Whisper AI)'}
                    style={{
                      background: isListening ? '#ef4444' : isAiTyping ? '#8b5cf6' : '#6366f1',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-full)',
                      padding: '10px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isListening
                        ? '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.3)'
                        : isAiTyping
                        ? '0 0 12px rgba(139, 92, 246, 0.6)'
                        : '0 2px 8px rgba(99, 102, 241, 0.35)',
                      animation: isListening ? 'pulse 1s ease-in-out infinite' : 'none',
                      transition: 'all 0.2s ease',
                      cursor: isAiTyping ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isAiTyping ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>
                      {isAiTyping ? 'Processing...' : isListening ? '● Stop Recording' : 'Speak'}
                    </span>
                  </button>

                  <input
                    ref={inputRef}
                    className="sakshi-chat-input"
                    placeholder={
                      isBotSpeaking
                        ? 'Sakshi is speaking...'
                        : isListening
                        ? 'Listening to your voice...'
                        : language === 'hindi' ? 'बोलें या टाइप करें...'
                        : language === 'marathi' ? 'बोला किंवा टाइप करा...'
                        : 'Click mic to speak, or type here...'
                    }
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={isAiTyping || isBotSpeaking}
                  />
                  <button
                    className="sakshi-send-btn"
                    onClick={sendMessage}
                    disabled={!userInput.trim() || isAiTyping || isBotSpeaking}
                  >
                    {isAiTyping ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
                  </button>
                </div>
                <div className="sakshi-input-hint" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span>🎙️ Real Microphone Audio is recorded during the call</span>
                  <span>Neural Voice: {language === 'hindi' ? 'Swara (Hindi)' : language === 'marathi' ? 'Aarohi (Marathi)' : 'Neerja (English)'}</span>
                </div>
              </div>
            )}

            {/* ---- DONE / SUMMARY ---- */}
            {phase === 'done' && savedCall && (
              <div className="sakshi-summary-panel">
                <div className="sakshi-summary-header">
                  <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                  <span>Call & Real Microphone Audio Saved to CRM</span>
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
