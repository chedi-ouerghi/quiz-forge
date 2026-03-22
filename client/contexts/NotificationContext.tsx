import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '@/services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  }, [user]);

  // Polling toutes les 60 secondes pour les nouvelles notifications (non temps réel mais solide)
  useEffect(() => {
    if (user) {
      refresh();
      const interval = setInterval(refresh, 60000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user, refresh]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
