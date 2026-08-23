'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Phone,
  Users,
  Zap,
  Download,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Call Logs', href: '/calls', icon: Phone },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Simulator', href: '/simulate', icon: Zap },
  { label: 'Export', href: '/export', icon: Download },
];

export default function Sidebar() {
  const pathname = usePathname();
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'GJ SpaCes';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
          </svg>
        </div>
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">{brandName}</div>
          <div className="sidebar-brand-sub">CallBot CRM</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={i}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="sidebar-link-icon" size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">GJ</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{brandName}</div>
            <div className="sidebar-user-role">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
