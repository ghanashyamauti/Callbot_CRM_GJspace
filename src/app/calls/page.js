'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Phone, PhoneIncoming, PhoneOutgoing,
  ChevronLeft, ChevronRight, Download, Eye
} from 'lucide-react';
import TopBar from '@/components/TopBar';

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [sentiment, setSentiment] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchCalls();
  }, [page, search, category, status, sentiment]);

  async function fetchCalls() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        category,
        status,
        sentiment,
      });
      const res = await fetch(`/api/calls?${params}`);
      const data = await res.json();
      setCalls(data.calls);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error('Failed to fetch calls:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <>
      <TopBar title="Call Logs" subtitle={`${total} total calls recorded`} />
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Call History</h1>
            <p className="page-subtitle">View, search, and analyze all call recordings and transcripts</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => window.open('/api/export?format=csv', '_blank')}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-search">
            <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, phone, or call ID..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          <select className="filter-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
            <option value="all">All Categories</option>
            <option value="inquiry">Inquiry</option>
            <option value="booking">Booking</option>
            <option value="complaint">Complaint</option>
            <option value="support">Support</option>
          </select>

          <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
            <option value="in-progress">In Progress</option>
            <option value="failed">Failed</option>
          </select>

          <select className="filter-select" value={sentiment} onChange={e => { setSentiment(e.target.value); setPage(1); }}>
            <option value="all">All Sentiment</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        {/* Call Table */}
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Call ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Category</th>
                  <th>Sentiment</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j}><div className="skeleton" style={{ height: '16px', width: j === 2 ? '120px' : '80px' }} /></td>
                      ))}
                    </tr>
                  ))
                ) : calls.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      No calls found matching your filters.
                    </td>
                  </tr>
                ) : (
                  calls.map((call) => (
                    <tr key={call.id} onClick={() => router.push(`/calls/${call.id}`)} style={{ cursor: 'pointer' }}>
                      <td>
                        {call.direction === 'inbound'
                          ? <PhoneIncoming size={16} style={{ color: 'var(--success)' }} />
                          : <PhoneOutgoing size={16} style={{ color: 'var(--accent-primary)' }} />
                        }
                      </td>
                      <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{call.callId}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{call.customerName}</td>
                      <td className="font-mono" style={{ fontSize: '12px' }}>{call.customerPhone}</td>
                      <td><span className={`badge badge-${call.queryCategory}`}>{call.queryCategory}</span></td>
                      <td><span className={`badge badge-${call.sentiment}`}>{call.sentiment}</span></td>
                      <td className="font-mono">{formatDuration(call.duration)}</td>
                      <td><span className={`badge badge-${call.status}`}>{call.status}</span></td>
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
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 3),
                Math.min(totalPages, page + 2)
              ).map(p => (
                <button
                  key={p}
                  className={`pagination-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
