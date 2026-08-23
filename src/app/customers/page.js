'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Phone, Mail, MapPin, Calendar, Tag, ArrowRight } from 'lucide-react';
import TopBar from '@/components/TopBar';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, [search, tagFilter]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, tag: tagFilter, limit: '50' });
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers);
      setTotal(data.total);
    } catch (e) {
      console.error('Failed to fetch customers:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar title="Customers" subtitle={`${total} customers in database`} />
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Customer Database</h1>
            <p className="page-subtitle">All customers who have interacted with the CallBot</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-search">
            <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, phone, email, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
            <option value="all">All Tags</option>
            <option value="inquiry">Inquiry</option>
            <option value="booking">Booking</option>
            <option value="complaint">Complaint</option>
            <option value="support">Support</option>
          </select>
        </div>

        {/* Customer Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '70%', height: '16px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '50%', height: '12px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <Users className="empty-state-icon" size={64} />
              <h3 className="empty-state-title">No Customers Found</h3>
              <p className="empty-state-text">No customers match your search criteria.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="card"
                style={{ padding: '22px', cursor: 'pointer' }}
                onClick={() => router.push(`/customers/${customer.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'var(--accent-gradient)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: 700, color: 'white', flexShrink: 0
                  }}>
                    {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {customer.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                      <Phone size={12} /> {customer.phone}
                    </div>
                    {customer.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                        <Mail size={12} /> <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        <MapPin size={12} /> {customer.location}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-secondary)' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {customer.tags.map((tag, i) => (
                      <span key={i} className={`badge badge-${tag}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> {customer.totalCalls}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {formatDate(customer.lastCallDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
