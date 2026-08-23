'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Clock, Tag, Smile, AlertCircle,
  Play, Pause, User, Bot, MapPin, Mail, Calendar,
  CheckCircle2, XCircle, AlertTriangle, PhoneIncoming, PhoneOutgoing
} from 'lucide-react';
import TopBar from '@/components/TopBar';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
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
  const [playProgress, setPlayProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('transcript');
  const router = useRouter();

  useEffect(() => {
    fetchCall();
  }, [id]);

  async function fetchCall() {
    try {
      const res = await fetch(`/api/calls/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setCall(data);
    } catch (e) {
      console.error('Failed to load call:', e);
    } finally {
      setLoading(false);
    }
  }

  // Simulate audio playback
  useEffect(() => {
    let interval;
    if (isPlaying && call) {
      interval = setInterval(() => {
        setPlayProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + (100 / (call.duration || 60)) * 0.5;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, call]);

  if (loading) {
    return (
      <>
        <TopBar title="Call Details" subtitle="Loading..." />
        <div className="page-container">
          <div className="skeleton" style={{ height: '200px', marginBottom: '20px' }} />
          <div className="skeleton" style={{ height: '400px' }} />
        </div>
      </>
    );
  }

  if (!call) {
    return (
      <>
        <TopBar title="Call Not Found" />
        <div className="page-container">
          <div className="empty-state">
            <AlertCircle className="empty-state-icon" size={64} />
            <h3 className="empty-state-title">Call Not Found</h3>
            <p className="empty-state-text">This call record doesn&apos;t exist or has been deleted.</p>
            <button className="btn btn-primary" onClick={() => router.push('/calls')} style={{ marginTop: '16px' }}>
              <ArrowLeft size={16} /> Back to Call Logs
            </button>
          </div>
        </div>
      </>
    );
  }

  const sentimentIcon = {
    positive: <Smile size={16} style={{ color: 'var(--success)' }} />,
    neutral: <AlertCircle size={16} style={{ color: 'var(--text-tertiary)' }} />,
    negative: <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />,
  };

  const resolutionIcon = {
    resolved: <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />,
    pending: <Clock size={16} style={{ color: 'var(--warning)' }} />,
    escalated: <XCircle size={16} style={{ color: 'var(--danger)' }} />,
  };

  return (
    <>
      <TopBar title="Call Details" subtitle={call.callId} />
      <div className="page-container">
        {/* Back Button */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.push('/calls')}
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
            <span className={`badge badge-${call.queryCategory}`}>
              <Tag size={12} /> {call.queryCategory}
            </span>
            <span className={`badge badge-${call.sentiment}`}>
              {sentimentIcon[call.sentiment]} {call.sentiment}
            </span>
            <span className={`badge badge-${call.status}`}>
              {call.status}
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
              {resolutionIcon[call.resolution]}
              {call.resolution}
            </div>
          </div>
        </div>

        {/* Audio Player */}
        {call.waveformData && call.waveformData.length > 0 && (
          <div className="audio-player" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Call Recording</span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Demo — Simulated Audio</span>
            </div>
            <div className="audio-waveform">
              {call.waveformData.map((h, i) => {
                const isActive = (i / call.waveformData.length) * 100 <= playProgress;
                return (
                  <div
                    key={i}
                    className={`audio-waveform-bar ${isActive ? 'active' : ''}`}
                    style={{ height: `${h * 100}%` }}
                    onClick={() => setPlayProgress((i / call.waveformData.length) * 100)}
                  />
                );
              })}
            </div>
            <div className="audio-controls">
              <button className="audio-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
              </button>
              <span className="audio-time">
                {formatDuration(Math.floor(call.duration * playProgress / 100))}
              </span>
              <div className="audio-progress" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPlayProgress(((e.clientX - rect.left) / rect.width) * 100);
              }}>
                <div className="audio-progress-fill" style={{ width: `${playProgress}%` }} />
              </div>
              <span className="audio-time">{formatDuration(call.duration)}</span>
            </div>
          </div>
        )}

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
                    <div key={i} className={`transcript-bubble ${msg.role === 'bot' ? 'bot' : 'customer'}`}>
                      <div className="transcript-bubble-label">
                        {msg.role === 'bot' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bot size={12} /> CallBot AI</span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {call.customerName}</span>
                        )}
                      </div>
                      <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                      {msg.timestamp && (
                        <div className="transcript-bubble-time">{formatDuration(msg.timestamp)}</div>
                      )}
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
    </>
  );
}
