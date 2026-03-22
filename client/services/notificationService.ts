import { api } from './api';

export interface Notification {
  id: string;
  userId: string;
  type: 'MENTION' | 'REPLY' | 'NEW_QUIZ';
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

/**
 * Service pour la gestion des notifications utilisateur
 */
export const notificationService = {
  /**
   * Récupère toutes les notifications de l'utilisateur connecté
   */
  async getMyNotifications(): Promise<Notification[]> {
    try {
      const response: any = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  /**
   * Marque une notification comme lue
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      await api.put(`/notifications/${id}/read`);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      await api.put('/notifications/read-all');
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
};
