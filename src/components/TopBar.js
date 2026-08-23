'use client';

import { Search, Bell, Zap, Phone, X, Check, CheckCheck, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from './NotificationContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function TopBar({ title, subtitle, onMenuToggle }) {
  const router = useRouter();
  const [simulating, setSimulating] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const { notifications, unreadCount, addNotification, markAsRead, markAllRead, clearAll } = useNotifications();

  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'GJ SpaCes';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleQuickSimulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const call = await res.json();
        // Add notification
        addNotification({
          type: 'call',
          title: '📞 New Call Received',
          message: `${call.customerName} called about ${call.queryType || call.queryCategory}`,
          callId: call.id,
          customerName: call.customerName,
          category: call.queryCategory,
          sentiment: call.sentiment,
        });
        router.push(`/calls/${call.id}`);
      }
    } catch (e) {
      console.error('Simulation failed:', e);
    } finally {
      setSimulating(false);
    }
  };

  const handleNotifClick = (notif) => {
    markAsRead(notif.id);
    if (notif.callId) {
      router.push(`/calls/${notif.callId}`);
    }
    setShowNotifs(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={() => {
            if (onMenuToggle) onMenuToggle();
            else if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toggle-sidebar'));
          }}
          title="Open Menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <div className="topbar-title">{title || 'Dashboard'}</div>
          {subtitle && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{subtitle}</div>}
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <Search className="topbar-search-icon" size={15} />
          <input type="text" placeholder="Search calls, customers..." />
        </div>

        <button
          className="btn btn-brand btn-sm"
          onClick={handleQuickSimulate}
          disabled={simulating}
          style={{ gap: '5px' }}
        >
          <Phone size={13} />
          {simulating ? 'Calling...' : 'Simulate Call'}
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            onClick={() => setShowNotifs(!showNotifs)}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                width: unreadCount > 9 ? '18px' : '16px', height: '16px',
                background: 'var(--danger)', color: 'white',
                borderRadius: 'var(--radius-full)', fontSize: '9px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white', fontFamily: 'var(--font-display)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifs && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              width: '360px', maxHeight: '480px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden', zIndex: 200,
              animation: 'fadeInUp 0.15s ease-out',
            }}>
              {/* Header */}
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: '13px',
                  fontWeight: 700, color: 'var(--text-primary)',
                }}>
                  Notifications {unreadCount > 0 && <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>({unreadCount})</span>}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {unreadCount > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ fontSize: '10px', padding: '3px 8px' }}>
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ fontSize: '10px', padding: '3px 8px', color: 'var(--text-muted)' }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{
                    padding: '32px 16px', textAlign: 'center',
                    color: 'var(--text-muted)', fontSize: '12px',
                  }}>
                    <Bell size={28} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                    No notifications yet.<br />
                    Simulate a call to see notifications here.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        background: notif.read ? 'transparent' : 'var(--accent-light)',
                        transition: 'background 150ms ease',
                        display: 'flex', gap: '10px', alignItems: 'flex-start',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-muted)'}
                      onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'var(--accent-light)'}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
                        background: notif.type === 'call' ? 'var(--accent-light)' : 'var(--bg-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: '2px',
                      }}>
                        <Phone size={14} style={{ color: 'var(--accent)' }} />
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '12px', fontWeight: notif.read ? 500 : 600,
                          color: 'var(--text-primary)', marginBottom: '2px',
                          lineHeight: 1.3,
                        }}>
                          {notif.title}
                        </div>
                        <div style={{
                          fontSize: '11px', color: 'var(--text-tertiary)',
                          lineHeight: 1.4,
                        }}>
                          {notif.message}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          {notif.category && (
                            <span className={`badge badge-${notif.category}`} style={{ fontSize: '8px', padding: '1px 6px' }}>
                              {notif.category}
                            </span>
                          )}
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {timeAgo(notif.timestamp)}
                          </span>
                        </div>
                      </div>
                      {/* Unread dot */}
                      {!notif.read && (
                        <div style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: 'var(--accent)', flexShrink: 0, marginTop: '6px',
                        }} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
