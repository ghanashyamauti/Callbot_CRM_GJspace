import './globals.css';
import Sidebar from '@/components/Sidebar';
import { NotificationProvider } from '@/components/NotificationContext';

export const metadata = {
  title: 'CallBot CRM — GJ SpaCes',
  description: 'AI-Powered Call Center & Customer Relationship Management for GJ SpaCes. Manage calls, track customer interactions, and analyze performance.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
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
