import './globals.css';
import Sidebar from '@/components/Sidebar';
import { NotificationProvider } from '@/components/NotificationContext';

export const metadata = {
  title: 'CallBot CRM — GJ SpaCes',
  description: 'AI-Powered Call Center & Customer Relationship Management for GJ SpaCes. Manage calls, track customer interactions, and analyze performance.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <NotificationProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </NotificationProvider>
      </body>
    </html>
  );
}
