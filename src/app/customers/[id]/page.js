'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Tag,
  Clock, AlertCircle, Eye
} from 'lucide-react';
import TopBar from '@/components/TopBar';

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function CustomerProfilePage({ params }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  async function fetchCustomer() {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setCustomer(data);
    } catch (e) {
      console.error('Failed to load customer:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="Customer Profile" subtitle="Loading..." />
        <div className="page-container">
          <div className="skeleton" style={{ height: '120px', marginBottom: '20px' }} />
          <div className="skeleton" style={{ height: '300px' }} />
        </div>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <TopBar title="Customer Not Found" />
        <div className="page-container">
          <div className="empty-state">
            <AlertCircle className="empty-state-icon" size={64} />
            <h3 className="empty-state-title">Customer Not Found</h3>
            <p className="empty-state-text">This customer profile doesn&apos;t exist.</p>
            <button className="btn btn-primary" onClick={() => router.push('/customers')} style={{ marginTop: '16px' }}>
              <ArrowLeft size={16} /> Back to Customers
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Customer Profile" subtitle={customer.name} />
      <div className="page-container">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.push('/customers')}
          style={{ marginBottom: '16px', gap: '6px' }}
        >
          <ArrowLeft size={16} /> Back to Customers
        </button>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="profile-info">
            <div className="profile-name">{customer.name}</div>
            <div className="profile-meta">
              <span className="profile-meta-item">
                <Phone size={14} /> {customer.phone}
              </span>
              {customer.email && (
                <span className="profile-meta-item">
                  <Mail size={14} /> {customer.email}
                </span>
              )}
              {customer.location && (
                <span className="profile-meta-item">
                  <MapPin size={14} /> {customer.location}
                </span>
              )}
              <span className="profile-meta-item">
                <Calendar size={14} /> Joined {formatDate(customer.createdAt)}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{customer.totalCalls}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Calls</div>
          </div>
        </div>

        {/* Tags */}
        {customer.tags && customer.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={14} /> Tags:
            </span>
            {customer.tags.map((tag, i) => (
              <span key={i} className={`badge badge-${tag}`}>{tag}</span>
            ))}
          </div>
        )}

        {/* Call History */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Call History ({customer.calls ? customer.calls.length : 0})</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Call ID</th>
                  <th>Category</th>
                  <th>Sentiment</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Resolution</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customer.calls && customer.calls.length > 0 ? (
                  customer.calls.map((call) => (
                    <tr key={call.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/calls/${call.id}`)}>
                      <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{call.callId}</td>
                      <td><span className={`badge badge-${call.queryCategory}`}>{call.queryCategory}</span></td>
                      <td><span className={`badge badge-${call.sentiment}`}>{call.sentiment}</span></td>
                      <td className="font-mono">{formatDuration(call.duration)}</td>
                      <td><span className={`badge badge-${call.status}`}>{call.status}</span></td>
                      <td><span className={`badge badge-${call.resolution}`}>{call.resolution}</span></td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{formatDate(call.startTime)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTime(call.startTime)}</div>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); router.push(`/calls/${call.id}`); }}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      No call records found for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
