'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone, PhoneIncoming, PhoneMissed, Clock, CheckCircle2, Smile,
  Users, TrendingUp, TrendingDown, ArrowRight, Zap, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import TopBar from '@/components/TopBar';

const CATEGORY_COLORS = {
  inquiry: '#3b82f6',
  booking: '#10b981',
  complaint: '#ef4444',
  support: '#f59e0b',
  other: '#8b5cf6',
};

const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral: '#6b7280',
  negative: '#ef4444',
};

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(17, 22, 49, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '10px 14px',
        backdropFilter: 'blur(10px)',
      }}>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#f1f5f9', fontSize: '14px', fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Loading analytics..." />
        <div className="page-container">
          <div className="stat-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="stat-card">
                <div className="skeleton" style={{ width: '40px', height: '40px', marginBottom: '12px' }} />
                <div className="skeleton" style={{ width: '60%', height: '12px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '40%', height: '28px' }} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!analytics) return null;

  // Empty state — no data yet
  if (analytics.totalCalls === 0) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="Welcome to CallBot CRM" />
        <div className="page-container">
          <div className="stat-grid">
            {[
              { icon: <Phone size={20} />, label: 'Total Calls', value: '0', cls: 'blue' },
              { icon: <Activity size={20} />, label: 'Active Now', value: '0', cls: 'green' },
              { icon: <Clock size={20} />, label: 'Avg Duration', value: '0m', cls: 'purple' },
              { icon: <CheckCircle2 size={20} />, label: 'Resolution', value: '0%', cls: 'amber' },
              { icon: <Smile size={20} />, label: 'Satisfaction', value: '—', cls: 'cyan' },
              { icon: <Users size={20} />, label: 'Customers', value: '0', cls: 'orange' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-card-header">
                  <div className={`stat-card-icon ${s.cls}`}>{s.icon}</div>
                  <span className="stat-card-label">{s.label}</span>
                </div>
                <div className="stat-card-value">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginTop: '10px' }}>
            <div className="empty-state" style={{ padding: '48px 24px' }}>
              <Zap size={48} style={{ color: 'var(--brand-secondary)', opacity: 0.6, marginBottom: '12px' }} />
              <h3 className="empty-state-title">No call data yet</h3>
              <p className="empty-state-text" style={{ marginBottom: '16px' }}>
                Start by simulating a call to see your dashboard come alive with analytics, charts, and customer insights.
              </p>
              <button className="btn btn-brand btn-lg" onClick={() => router.push('/simulate')}>
                <Zap size={16} /> Go to Call Simulator
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const categoryData = Object.entries(analytics.categoryBreakdown).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: CATEGORY_COLORS[key] || '#8b5cf6',
  }));


  const sentimentData = Object.entries(analytics.sentimentBreakdown).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: SENTIMENT_COLORS[key],
  }));

  return (
    <>
      <TopBar title="Dashboard" subtitle="Real-time call center overview" />
      <div className="page-container">
        {/* KPI Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon blue"><Phone size={20} /></div>
              <span className="stat-card-label">Total Calls</span>
            </div>
            <div className="stat-card-value">{analytics.totalCalls}</div>
            <div className="stat-card-trend up"><TrendingUp size={14} /> +12% this week</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon green"><Activity size={20} /></div>
              <span className="stat-card-label">Active Now</span>
            </div>
            <div className="stat-card-value">{analytics.activeCalls}</div>
            {analytics.activeCalls > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <span className="live-dot" />
                <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>Live</span>
              </div>
            )}
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon purple"><Clock size={20} /></div>
              <span className="stat-card-label">Avg Duration</span>
            </div>
            <div className="stat-card-value">{formatDuration(analytics.avgDuration)}</div>
            <div className="stat-card-trend up"><TrendingUp size={14} /> Optimal</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon amber"><CheckCircle2 size={20} /></div>
              <span className="stat-card-label">Resolution Rate</span>
            </div>
            <div className="stat-card-value">{analytics.resolutionRate}%</div>
            <div className="stat-card-trend up"><TrendingUp size={14} /> Above target</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon cyan"><Smile size={20} /></div>
              <span className="stat-card-label">Satisfaction</span>
            </div>
            <div className="stat-card-value">{analytics.satisfactionScore}%</div>
            <div className="stat-card-trend up"><TrendingUp size={14} /> Great</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon red"><PhoneMissed size={20} /></div>
              <span className="stat-card-label">Missed Calls</span>
            </div>
            <div className="stat-card-value">{analytics.missedCalls}</div>
            <div className="stat-card-trend down"><TrendingDown size={14} /> {analytics.missedCalls > 3 ? 'Needs attention' : 'Low'}</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-grid">
          {/* Call Volume Trend */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Call Volume Trend</div>
                <div className="chart-card-subtitle">Last 14 days</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analytics.dailyVolume}>
                <defs>
                  <linearGradient id="callGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} fill="url(#callGradient)" name="Calls" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Call Categories</div>
                <div className="chart-card-subtitle">Distribution by type</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categoryData.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1 }}>{item.name}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Second Charts Row */}
        <div className="charts-grid">
          {/* Sentiment Analysis */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Sentiment Analysis</div>
                <div className="chart-card-subtitle">Customer mood breakdown</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sentimentData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Calls" radius={[6, 6, 0, 0]}>
                  {sentimentData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Distribution */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <div className="chart-card-title">Peak Hours</div>
                <div className="chart-card-subtitle">Call volume by hour</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.hourlyDistribution} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="calls" name="Calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Calls */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Calls</span>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/calls')} style={{ gap: '4px' }}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Category</th>
                  <th>Sentiment</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentCalls.map((call) => (
                  <tr key={call.id} onClick={() => router.push(`/calls/${call.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{call.customerName}</td>
                    <td className="font-mono" style={{ fontSize: '12px' }}>{call.customerPhone}</td>
                    <td><span className={`badge badge-${call.queryCategory}`}>{call.queryCategory}</span></td>
                    <td><span className={`badge badge-${call.sentiment}`}>{call.sentiment}</span></td>
                    <td className="font-mono">{call.duration > 0 ? formatDuration(call.duration) : '—'}</td>
                    <td><span className={`badge badge-${call.status}`}>{call.status}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{formatTimeAgo(call.startTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
