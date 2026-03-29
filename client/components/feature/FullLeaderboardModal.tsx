import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  FlatList,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { LeaderboardItem } from './LeaderboardItem';

interface FullLeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
  data: any[];
  currentUserId?: string;
}

export function FullLeaderboardModal({ visible, onClose, data, currentUserId }: FullLeaderboardModalProps) {
  const [displayedData, setDisplayedData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const slideAnim = useRef(new Animated.Value(1000)).current;

  useEffect(() => {
    if (visible) {
      setPage(1);
      setDisplayedData(data.slice(0, ITEMS_PER_PAGE));
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, data]);

  const loadMore = () => {
    if (displayedData.length >= data.length || isLoadingMore) return;
    setIsLoadingMore(true);

    setTimeout(() => {
      const nextPage = page + 1;
      const nextData = data.slice(0, nextPage * ITEMS_PER_PAGE);
      setDisplayedData(nextData);
      setPage(nextPage);
      setIsLoadingMore(false);
    }, 500); // Simulate network latency for smooth transition
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View style={{ opacity: 1, transform: [{ translateY: 0 }] }}>
      <LeaderboardItem
        rank={index + 1}
        username={item.username}
        avatar={item.avatar || '👤'}
        xp={item.xp || 0}
        level={item.level || 1}
        quizzes={item.quizzesCompleted || 0}
        country={item.country || '🌍'}
        isCurrentUser={item.id === currentUserId}
      />
    </Animated.View>
  );

  if (!visible && slideAnim.valueOf() === 1000) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient
            colors={[Colors.bgSecondary, Colors.bg]}
            style={styles.gradientBg}
          />
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          <View style={styles.header}>
            <MaterialIcons name="emoji-events" size={24} color={Colors.primaryLight} />
            <Text style={styles.title}>All Players</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.textMuted} />
            </Pressable>
          </View>

          <FlatList
            data={displayedData}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id || index.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => 
              isLoadingMore ? (
                <View style={styles.loader}>
                  <ActivityIndicator color={Colors.primaryLight} />
                  <Text style={styles.loaderText}>Loading more...</Text>
                </View>
              ) : displayedData.length >= data.length ? (
                <View style={styles.footer}>
                  <Text style={styles.footerText}>End of Leaderboard</Text>
                </View>
              ) : null
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: '85%',
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    ...Shadow.purple,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  title: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  loader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  loaderText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    color: Colors.textSubtle,
    fontSize: FontSize.sm,
  },
});
