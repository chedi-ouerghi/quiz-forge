import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  SafeAreaView, 
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LucideBell, LucideCheckCheck } from 'lucide-react-native';
import { notificationService, Notification } from '@/services/notificationService';
import NotificationItem from '@/components/NotificationItem';
import { useRouter } from 'expo-router';

/**
 * Screen pour afficher les notifications de l'utilisateur
 */
export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (id: string) => {
    // Marquer comme lue
    await notificationService.markAsRead(id);
    
    // Mettre à jour l'état local
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );

    // Navigation facultative basée sur le type
    const notif = notifications.find(n => n.id === id);
    if (notif?.data?.quizId) {
      router.push(`/quiz/${notif.data.quizId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
          <LucideCheckCheck size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationItem 
            notification={item} 
            onPress={handleNotificationPress} 
          />
        )}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#4F46E5" 
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.bellIconContainer}>
              <LucideBell size={48} color="#475569" />
            </View>
            <Text style={styles.emptyTitle}>Rien à signaler</Text>
            <Text style={styles.emptySubtitle}>
              Vous n'avez aucune notification pour le moment.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  markAllButton: {
    padding: 8,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  bellIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
