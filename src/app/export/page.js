'use client';

import { useState, useEffect } from 'react';
import {
  Download, FileText, FileSpreadsheet, FileJson,
  Calendar, Filter, CheckCircle2, Loader2
} from 'lucide-react';
import TopBar from '@/components/TopBar';

export default function ExportPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [sentiment, setSentiment] = useState('all');
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [callCount, setCallCount] = useState(0);
  const [previewData, setPreviewData] = useState([]);

  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'GJ SpaCes';

  // Set default dates (last 30 days)
  useEffect(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setDateTo(now.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Fetch preview when filters change
  useEffect(() => {
    fetchPreview();
  }, [dateFrom, dateTo, category, status, sentiment]);

  async function fetchPreview() {
    try {
      const params = new URLSearchParams({
        limit: '1000',
        category,
        status,
        sentiment,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const res = await fetch(`/api/calls?${params}`);
      const data = await res.json();
      setCallCount(data.total);
      setPreviewData(data.calls.slice(0, 5));
    } catch (e) {
      console.error('Preview fetch failed:', e);
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function handleExport() {
    setExporting(true);
    try {
      // Fetch all matching data
      const params = new URLSearchParams({
        limit: '10000',
        category,
        status,
        sentiment,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const res = await fetch(`/api/calls?${params}`);
      const data = await res.json();
      const calls = data.calls;

      if (calls.length === 0) {
        alert('No data to export. Try adjusting your filters or simulate some calls first.');
        setExporting(false);
        return;
      }

      if (format === 'csv') {
        exportCSV(calls);
      } else if (format === 'json') {
        exportJSON(calls);
      } else if (format === 'pdf') {
        await exportPDF(calls);
      }
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  function exportCSV(calls) {
    const headers = ['Call ID', 'Customer Name', 'Phone', 'Email', 'Location', 'Category', 'Query Type', 'Status', 'Sentiment', 'Resolution', 'Duration (min)', 'Date', 'Time', 'Summary'];
    const rows = calls.map(c => [
      c.callId,
      c.customerName,
      c.customerPhone,
      c.customerEmail || '',
      c.customerLocation || '',
      c.queryCategory,
      c.queryType || c.queryCategory,
      c.status,
      c.sentiment,
      c.resolution,
      (c.duration / 60).toFixed(1),
      new Date(c.startTime).toLocaleDateString('en-IN'),
      new Date(c.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      `"${(c.summary || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csv, `${brandName.replace(/\s+/g, '-')}-calls-export-${dateFrom}-to-${dateTo}.csv`, 'text/csv');
  }

  function exportJSON(calls) {
    const exportData = {
      brand: brandName,
      exportDate: new Date().toISOString(),
      dateRange: { from: dateFrom, to: dateTo },
      filters: { category, status, sentiment },
      totalRecords: calls.length,
      calls: calls.map(c => ({
        callId: c.callId,
        customerName: c.customerName,
        customerPhone: c.customerPhone,
        customerEmail: c.customerEmail,
        customerLocation: c.customerLocation,
        queryCategory: c.queryCategory,
        queryType: c.queryType,
        status: c.status,
        sentiment: c.sentiment,
        resolution: c.resolution,
        duration: c.duration,
        startTime: c.startTime,
        endTime: c.endTime,
        summary: c.summary,
        transcript: c.transcript,
      })),
    };

    const json = JSON.stringify(exportData, null, 2);
    downloadFile(json, `${brandName.replace(/\s+/g, '-')}-calls-export-${dateFrom}-to-${dateTo}.json`, 'application/json');
  }

  async function exportPDF(calls) {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${brandName} — Call Report`, 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Date Range: ${dateFrom} to ${dateTo}`, 14, 28);
    doc.text(`Total Records: ${calls.length}  |  Exported: ${new Date().toLocaleString('en-IN')}`, 14, 34);
    doc.text(`Filters: Category=${category}, Status=${status}, Sentiment=${sentiment}`, 14, 40);

    // Table
    const tableData = calls.map(c => [
      c.callId,
      c.customerName,
      c.customerPhone,
      c.queryCategory,
      c.queryType || '-',
      c.status,
      c.sentiment,
      c.resolution,
      formatDuration(c.duration),
      new Date(c.startTime).toLocaleDateString('en-IN'),
    ]);

    doc.autoTable({
      startY: 46,
      head: [['Call ID', 'Customer', 'Phone', 'Category', 'Query Type', 'Status', 'Sentiment', 'Resolution', 'Duration', 'Date']],
      body: tableData,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [47, 124, 255], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      margin: { left: 14, right: 14 },
    });

    // Summary page
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Call Summaries', 14, 20);

    let yPos = 30;
    calls.slice(0, 30).forEach((c, i) => {
      if (yPos > 180) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(47, 124, 255);
      doc.text(`${c.callId} — ${c.customerName} (${c.customerPhone})`, 14, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      const summaryLines = doc.splitTextToSize(c.summary || 'No summary', 260);
      doc.text(summaryLines, 14, yPos);
      yPos += summaryLines.length * 4 + 6;
    });

    doc.save(`${brandName.replace(/\s+/g, '-')}-calls-export-${dateFrom}-to-${dateTo}.pdf`);
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const formatOptions = [
    { key: 'csv', label: 'CSV', desc: 'Spreadsheet format — open in Excel or Google Sheets', icon: FileSpreadsheet, color: 'var(--success)' },
    { key: 'pdf', label: 'PDF', desc: 'Professional report with tables and summaries', icon: FileText, color: 'var(--danger)' },
    { key: 'json', label: 'JSON', desc: 'Raw data with full transcripts for developers', icon: FileJson, color: 'var(--warning)' },
  ];

  return (
    <>
      <TopBar title="Export Data" subtitle="Download call records and reports" />
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Export Call Data</h1>
            <p className="page-subtitle">Select date range, apply filters, and download in your preferred format</p>
          </div>
        </div>

        <div className="export-grid" style={{ marginBottom: '20px' }}>
          {/* Date Range */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> Date Range
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">From</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">To</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Today', days: 0 },
                  { label: 'Last 7 Days', days: 7 },
                  { label: 'Last 30 Days', days: 30 },
                  { label: 'Last 90 Days', days: 90 },
                  { label: 'All Time', days: 365 },
                ].map(preset => (
                  <button
                    key={preset.label}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '10px', padding: '3px 8px' }}
                    onClick={() => {
                      const now = new Date();
                      const from = new Date(now);
                      from.setDate(from.getDate() - preset.days);
                      setDateTo(now.toISOString().split('T')[0]);
                      setDateFrom(from.toISOString().split('T')[0]);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} /> Filters
              </span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  <option value="inquiry">Inquiry</option>
                  <option value="booking">Booking</option>
                  <option value="complaint">Complaint</option>
                  <option value="support">Support</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Sentiment</label>
                  <select className="form-select" value={sentiment} onChange={e => setSentiment(e.target.value)}>
                    <option value="all">All</option>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <span className="card-title">Export Format</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {formatOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    className={`scenario-card ${format === opt.key ? 'selected' : ''}`}
                    onClick={() => setFormat(opt.key)}
                    style={{ padding: '16px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <Icon size={20} style={{ color: opt.color }} />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700 }}>{opt.label}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preview & Download */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Preview — {callCount} record{callCount !== 1 ? 's' : ''} match your filters
            </span>
            <button
              className="btn btn-brand"
              onClick={handleExport}
              disabled={exporting || callCount === 0}
            >
              {exporting ? (
                <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Exporting...</>
              ) : (
                <><Download size={14} /> Export as {format.toUpperCase()}</>
              )}
            </button>
          </div>
          {callCount > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Call ID</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Sentiment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map(call => (
                    <tr key={call.id}>
                      <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{call.callId}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{call.customerName}</td>
                      <td className="font-mono" style={{ fontSize: '11px' }}>{call.customerPhone}</td>
                      <td><span className={`badge badge-${call.queryCategory}`}>{call.queryCategory}</span></td>
                      <td><span className={`badge badge-${call.status}`}>{call.status}</span></td>
                      <td><span className={`badge badge-${call.sentiment}`}>{call.sentiment}</span></td>
                      <td style={{ fontSize: '12px' }}>{formatDate(call.startTime)}</td>
                    </tr>
                  ))}
                  {callCount > 5 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        ...and {callCount - 5} more records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '32px' }}>
              <Download className="empty-state-icon" size={40} />
              <h3 className="empty-state-title">No Data to Export</h3>
              <p className="empty-state-text">No calls match your filter criteria. Try adjusting the date range or simulate some calls first.</p>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </>
  );
}
