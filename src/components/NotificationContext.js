'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);

    // Browser notification (if permitted)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'CallBot CRM', {
        body: notification.message,
        icon: '/favicon.ico',
      });
    }

    return newNotif;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllRead,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
