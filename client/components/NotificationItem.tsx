import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LucideAtSign, LucideMessageCircle, LucideZap, LucideCircle } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  notification: any;
  onPress: (notificationId: string) => void;
}

const NotificationItem = ({ notification, onPress }: Props) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'MENTION':
        return <LucideAtSign size={22} color="#4F46E5" />;
      case 'REPLY':
        return <LucideMessageCircle size={22} color="#10B981" />;
      case 'NEW_QUIZ':
        return <LucideZap size={22} color="#F59E0B" />;
      default:
        return <LucideCircle size={22} color="#94A3B8" />;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, !notification.isRead && styles.unread]} 
      onPress={() => onPress(notification.id)}
    >
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{notification.title}</Text>
          {!notification.isRead && <View style={styles.dot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.time}>
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  unread: {
    backgroundColor: '#1E293B',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default NotificationItem;
