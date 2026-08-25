'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ArrowLeft, Phone, Clock, Tag, Smile, AlertCircle,
  Play, Pause, User, Bot, MapPin, Mail, Calendar,
  CheckCircle2, XCircle, AlertTriangle, PhoneIncoming, PhoneOutgoing,
  Volume2, VolumeX, Download
} from 'lucide-react';
import TopBar from '@/components/TopBar';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

export default function CallDetailPage({ params }) {
  const { id } = use(params);
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState('transcript');
  const [activeBubbleIndex, setActiveBubbleIndex] = useState(-1);
  const activeAudioRef = useRef(null);
  const progressTimerRef = useRef(null);
  const isCancelledRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchCall();
  }, [id]);

  async function fetchCall() {
    try {
      const res = await fetch(`/api/calls/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setCall(data);
      setDuration(data.duration || 60);
    } catch (e) {
      console.error('Failed to load call:', e);
    } finally {
      setLoading(false);
    }
  }

  // Stop all audio on unmount or navigation
  useEffect(() => {
    const handleStop = () => stopAllAudio();
    window.addEventListener('beforeunload', handleStop);
    window.addEventListener('popstate', handleStop);

    return () => {
      stopAllAudio();
      window.removeEventListener('beforeunload', handleStop);
      window.removeEventListener('popstate', handleStop);
    };
  }, []);

  // Stop audio when navigating to a different page (back button fix)
  useEffect(() => {
    stopAllAudio();
  }, [pathname]);

  function stopAllAudio() {
    isCancelledRef.current = true;
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current.src = '';
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    clearInterval(progressTimerRef.current);
    setIsPlaying(false);
    setActiveBubbleIndex(-1);
  }

  // Play Neural Voice dialogue sequence from any starting index
  function playNeuralTranscriptSequence(transcript, lang, startIndex = 0) {
    if (!transcript || transcript.length === 0) {
      setIsPlaying(false);
      return;
    }

    isCancelledRef.current = false;
    setIsPlaying(true);
    let index = startIndex;
    const totalLines = transcript.length;
    const totalDuration = duration || call?.duration || (totalLines * 4) || 60;

    const initialTime = (startIndex / totalLines) * totalDuration;
    setCurrentTime(initialTime);
    setActiveBubbleIndex(startIndex);

    let turnStartTime = Date.now();
    let turnBaseTime = initialTime;

    // Progress timer
    clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      if (isCancelledRef.current) return;
      const turnElapsed = (Date.now() - turnStartTime) / 1000;
      const nextTurnBase = ((index + 1) / totalLines) * totalDuration;
      const currentTurnTime = Math.min(turnBaseTime + turnElapsed, nextTurnBase);
      setCurrentTime(Math.min(currentTurnTime, totalDuration));
    }, 100);

    function playNextTurn() {
      if (isCancelledRef.current) {
        stopAllAudio();
        return;
      }

      if (index >= transcript.length) {
        stopAllAudio();
        setCurrentTime(totalDuration);
        setActiveBubbleIndex(-1);
        return;
      }

      setActiveBubbleIndex(index);
      turnStartTime = Date.now();
      turnBaseTime = (index / totalLines) * totalDuration;
      setCurrentTime(turnBaseTime);

      const msg = transcript[index];
      const ttsUrl = `/api/tts?language=${lang}&text=${encodeURIComponent(msg.text.substring(0, 500))}`;
      const audio = new Audio(ttsUrl);
      activeAudioRef.current = audio;

      audio.onended = () => {
        if (!isCancelledRef.current) {
          index++;
          playNextTurn();
        }
      };

      audio.onerror = () => {
        if (isCancelledRef.current) return;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(msg.text);
          if (lang === 'hindi') utter.lang = 'hi-IN';
          else if (lang === 'marathi') utter.lang = 'mr-IN';
          else utter.lang = 'en-IN';
          utter.onend = () => {
            if (!isCancelledRef.current) {
              index++;
              playNextTurn();
            }
          };
          utter.onerror = () => {
            if (!isCancelledRef.current) {
              index++;
              playNextTurn();
            }
          };
          window.speechSynthesis.speak(utter);
        } else {
          index++;
          playNextTurn();
        }
      };

      audio.play().catch(() => {
        if (isCancelledRef.current) return;
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(msg.text);
          if (lang === 'hindi') utter.lang = 'hi-IN';
          else if (lang === 'marathi') utter.lang = 'mr-IN';
          else utter.lang = 'en-IN';
          utter.onend = () => {
            if (!isCancelledRef.current) {
              index++;
              playNextTurn();
            }
          };
          utter.onerror = () => {
            if (!isCancelledRef.current) {
              index++;
              playNextTurn();
            }
          };
          window.speechSynthesis.speak(utter);
        } else {
          index++;
          playNextTurn();
        }
      });
    }

    playNextTurn();
  }

  function startRecordingPlayback(seekTime = 0) {
    stopAllAudio();
    isCancelledRef.current = false;
    setIsPlaying(true);

    let audioSrc = call.recordingUrl;
    if (audioSrc.includes('twilio.com') || audioSrc.includes('api.twilio.com')) {
      audioSrc = `/api/recording?url=${encodeURIComponent(audioSrc)}`;
    }

    const audio = new Audio(audioSrc);
    activeAudioRef.current = audio;
    const totalLines = call?.transcript?.length || 1;
    const totalDuration = duration || call?.duration || 60;

    audio.ontimeupdate = () => {
      if (!isCancelledRef.current) {
        setCurrentTime(audio.currentTime);
        const lineIdx = Math.min(
          Math.floor((audio.currentTime / (audio.duration || totalDuration)) * totalLines),
          totalLines - 1
        );
        setActiveBubbleIndex(lineIdx);
      }
    };
    audio.onloadedmetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
        if (seekTime > 0) {
          audio.currentTime = Math.min(seekTime, audio.duration);
          setCurrentTime(audio.currentTime);
        }
      }
    };
    if (seekTime > 0) {
      audio.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
    audio.onended = () => stopAllAudio();
    audio.onerror = () => {
      if (!isCancelledRef.current) {
        const lang = call?.language || 'english';
        const transcript = call?.transcript || [];
        const targetIndex = Math.min(Math.floor((seekTime / totalDuration) * totalLines), totalLines - 1);
        playNeuralTranscriptSequence(transcript, lang, targetIndex);
      }
    };
    audio.play().catch(() => {
      if (!isCancelledRef.current) {
        const lang = call?.language || 'english';
        const transcript = call?.transcript || [];
        const targetIndex = Math.min(Math.floor((seekTime / totalDuration) * totalLines), totalLines - 1);
        playNeuralTranscriptSequence(transcript, lang, targetIndex);
      }
    });
  }

  // Click on transcript line → play from that line onwards
  function playTranscriptLine(clickedIndex) {
    if (!call?.transcript?.[clickedIndex]) return;
    const lang = call?.language || 'english';
    const transcript = call.transcript;
    const totalLines = transcript.length;
    const totalDuration = duration || call.duration || 60;
    const seekTime = (clickedIndex / totalLines) * totalDuration;

    if (call?.recordingUrl) {
      if (activeAudioRef.current && isPlaying) {
        activeAudioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
        setActiveBubbleIndex(clickedIndex);
      } else {
        startRecordingPlayback(seekTime);
      }
      return;
    }

    // TTS Dialogue mode:
    stopAllAudio();
    setTimeout(() => {
      playNeuralTranscriptSequence(transcript, lang, clickedIndex);
    }, 50);
  }

  function handleSeek(percent) {
    const totalDuration = duration || call?.duration || 60;
    const newTime = (percent / 100) * totalDuration;
    setCurrentTime(newTime);

    const lang = call?.language || 'english';
    const transcript = call?.transcript || [];
    const totalLines = transcript.length || 1;

    // Case 1: Call has a recording file
    if (call?.recordingUrl) {
      if (activeAudioRef.current && isPlaying) {
        activeAudioRef.current.currentTime = newTime;
      } else {
        startRecordingPlayback(newTime);
      }
      return;
    }

    // Case 2: TTS dialogue mode
    const targetIndex = Math.min(Math.floor((percent / 100) * totalLines), totalLines - 1);
    stopAllAudio();
    setTimeout(() => {
      playNeuralTranscriptSequence(transcript, lang, targetIndex);
    }, 50);
  }

  function togglePlay() {
    if (isPlaying) {
      stopAllAudio();
    } else {
      const lang = call?.language || 'english';
      const transcript = call?.transcript || [
        { role: 'bot', text: call?.summary || 'Thank you for calling GJ SpaCes.' }
      ];

      if (call?.recordingUrl) {
        startRecordingPlayback(currentTime > 0 ? currentTime : 0);
      } else {
        const totalLines = transcript.length || 1;
        const totalDuration = duration || call?.duration || 60;
        const targetIndex = currentTime > 0
          ? Math.min(Math.floor((currentTime / totalDuration) * totalLines), totalLines - 1)
          : 0;
        stopAllAudio();
        setTimeout(() => {
          playNeuralTranscriptSequence(transcript, lang, targetIndex);
        }, 50);
      }
    }
  }

  const handleBack = () => {
    stopAllAudio();
    router.push('/calls');
  };

  if (loading) {
    return (
      <>
        <TopBar title="Call Details" subtitle="Loading call details..." />
        <div className="page-container">
          <div className="skeleton" style={{ height: '140px', marginBottom: '20px' }} />
          <div className="skeleton" style={{ height: '300px' }} />
        </div>
      </>
    );
  }

  if (!call) {
    return (
      <>
        <TopBar title="Call Details" />
        <div className="page-container">
          <div className="empty-state">
            <AlertCircle className="empty-state-icon" size={48} />
            <h3 className="empty-state-title">Call Not Found</h3>
            <p className="empty-state-text">The call you are looking for does not exist.</p>
            <button className="btn btn-primary" onClick={handleBack}>
              Back to Call Logs
            </button>
          </div>
        </div>
      </>
    );
  }

  const playProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const sentimentIcon = {
    positive: '😊',
    neutral: '😐',
    negative: '😟'
  };

  const resolutionIcon = {
    resolved: <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />,
    pending: <Clock size={16} style={{ color: 'var(--warning)' }} />,
    escalated: <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />,
    voicemail: <Mail size={16} style={{ color: 'var(--accent-primary)' }} />
  };

  return (
    <>
      <TopBar title={`Call: ${call.callId}`} subtitle={`with ${call.customerName}`} />
      <div className="page-container">
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleBack}
          style={{ marginBottom: '16px', gap: '6px' }}
        >
          <ArrowLeft size={16} /> Back to Call Logs
        </button>

        {/* Call Info Header */}
        <div className="profile-header" style={{ marginBottom: '20px' }}>
          <div className="profile-avatar">
            {call.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="profile-info" style={{ flex: 1 }}>
            <div className="profile-name">{call.customerName}</div>
            <div className="profile-meta">
              <span className="profile-meta-item">
                <Phone size={14} /> {call.customerPhone}
              </span>
              {call.customerEmail && (
                <span className="profile-meta-item">
                  <Mail size={14} /> {call.customerEmail}
                </span>
              )}
              {call.customerLocation && (
                <span className="profile-meta-item">
                  <MapPin size={14} /> {call.customerLocation}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`badge badge-${call.queryCategory || 'inquiry'}`}>
              <Tag size={12} /> {call.queryCategory || 'inquiry'}
            </span>
            <span className={`badge badge-${call.sentiment || 'neutral'}`}>
              {sentimentIcon[call.sentiment || 'neutral']} {call.sentiment || 'neutral'}
            </span>
            <span className={`badge badge-${call.status || 'completed'}`}>
              {call.status || 'completed'}
            </span>
          </div>
        </div>

        {/* Call Meta Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Direction</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600 }}>
              {call.direction === 'inbound' ? <PhoneIncoming size={18} style={{ color: 'var(--success)' }} /> : <PhoneOutgoing size={18} style={{ color: 'var(--accent-primary)' }} />}
              {call.direction}
            </div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Duration</div>
            <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{formatDuration(call.duration)}</div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Date</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{formatFullDate(call.startTime)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{formatTime(call.startTime)}</div>
          </div>
          <div className="stat-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Resolution</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600 }}>
              {resolutionIcon[call.resolution || 'resolved']}
              {call.resolution || 'resolved'}
            </div>
          </div>
        </div>

        {/* Audio Recording Player */}
        <div className="audio-player" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} style={{ color: 'var(--accent-primary)' }} />
              {call.recordingUrl ? '🎙️ Real Microphone Audio Recording' : '🔊 Voice Dialogue Playback'}
            </span>
            <span style={{ fontSize: '12px', color: isPlaying ? 'var(--success)' : 'var(--accent-primary)', fontWeight: 600 }}>
              {isPlaying ? '▶ Playing Audio...' : 'Click Waveform or Play to Listen'}
            </span>
          </div>

          <div
            className="audio-waveform"
            style={{ cursor: 'pointer' }}
            title="Click anywhere to jump and play from here"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
              handleSeek(percent);
            }}
          >
            {(call.waveformData && call.waveformData.length > 0 ? call.waveformData : Array.from({ length: 45 }, () => Math.random() * 0.7 + 0.3)).map((h, i) => {
              const isActive = (i / 45) * 100 <= playProgress;
              return (
                <div
                  key={i}
                  className={`audio-waveform-bar ${isActive ? 'active' : ''}`}
                  style={{ height: `${Math.max(h * 100, 15)}%` }}
                />
              );
            })}
          </div>

          <div className="audio-controls">
            <button
              className="audio-play-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play Audio'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
            </button>
            <span className="audio-time">
              {formatDuration(currentTime)}
            </span>
            <div
              className="audio-progress"
              style={{ cursor: 'pointer' }}
              title="Click anywhere to seek"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                handleSeek(percent);
              }}
            >
              <div className="audio-progress-fill" style={{ width: `${playProgress}%` }} />
            </div>
            <span className="audio-time">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'transcript' ? 'active' : ''}`} onClick={() => setActiveTab('transcript')}>
            Transcript
          </button>
          <button className={`tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
            Summary
          </button>
        </div>

        {/* Transcript View */}
        {activeTab === 'transcript' && (
          <div className="card">
            <div className="card-body">
              {call.transcript && call.transcript.length > 0 ? (
                <div className="transcript-container" style={{ maxHeight: '600px' }}>
                  {call.transcript.map((msg, i) => (
                    <div
                      key={i}
                      className={`transcript-bubble ${msg.role === 'bot' ? 'bot' : 'customer'} ${activeBubbleIndex === i ? 'active-speaking' : ''}`}
                      onClick={() => playTranscriptLine(i)}
                      style={{ cursor: 'pointer' }}
                      title="Click to play this line"
                    >
                      <div className="transcript-bubble-label">
                        {msg.role === 'bot' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bot size={12} /> Sakshi (AI Assistant)</span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {call.customerName}</span>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-tertiary)', opacity: 0.7 }}>
                          {activeBubbleIndex === i ? '🔊 Playing...' : '▶ Click to play'}
                        </span>
                      </div>
                      <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '40px' }}>
                  <Phone className="empty-state-icon" size={48} />
                  <h3 className="empty-state-title">No Transcript Available</h3>
                  <p className="empty-state-text">This call was {call.status === 'missed' ? 'missed' : 'not completed'}.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary View */}
        {activeTab === 'summary' && (
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                AI-Generated Summary
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                {call.summary || 'No summary available.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .active-speaking {
          border: 2px solid var(--accent-primary) !important;
          box-shadow: 0 0 16px rgba(47, 124, 255, 0.35) !important;
        }
      `}</style>
    </>
  );
}
