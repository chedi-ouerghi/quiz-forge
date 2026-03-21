import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { authFetch } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://localhost:3001/api';

export interface Comment {
  id: string;
  user: string;
  userId?: string;
  avatar: string;
  text: string;
  time: string;
  createdAt?: string;
}

interface CommentSectionProps {
  quizId: string;
  currentUsername: string;
}

export function CommentSection({ quizId, currentUsername }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCommentTxt, setEditCommentTxt] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [quizId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}/comments/${quizId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.log('Error fetching comments', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      Alert.alert('Auth Required', 'Please log in to leave a comment.');
      return;
    }
    const txt = newComment.trim();
    setNewComment('');
    
    // Optimistic UI
    const optimisticId = Date.now().toString();
    setComments([{
      id: optimisticId,
      user: currentUsername,
      userId: user.id,
      text: txt,
      avatar: user.avatar || '👤',
      time: 'Just now'
    }, ...comments]);

    try {
      const res = await authFetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, text: txt, avatar: user.avatar || '👤' })
      });
      if (res.ok) {
        fetchComments();
      } else {
        Alert.alert('Error', 'Failed to add comment');
        fetchComments(); // revert optimistic
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
      fetchComments(); // revert optimistic
    }
  };

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('Are you sure you want to delete this comment?');
      if (!ok) return;
      deleteApiCall(id);
      return;
    }

    Alert.alert('Delete', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteApiCall(id) }
    ]);
  };

  const deleteApiCall = async (id: string) => {
    try {
      const res = await authFetch(`${API_URL}/comments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchComments();
      } else {
        Alert.alert('Error', 'Failed to delete');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editCommentTxt.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const res = await authFetch(`${API_URL}/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editCommentTxt.trim() })
      });
      if (res.ok) {
        setEditingId(null);
        fetchComments();
      } else {
        Alert.alert('Error', 'Failed to update');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    }
  };

  const formatDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return timeStr || 'Just now';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Just now' : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <MaterialIcons name="forum" size={20} color={Colors.primaryLight} />
        {' '}Community Discussion ({comments.length})
      </Text>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Share your thoughts..."
            placeholderTextColor={Colors.textSubtle}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={300}
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>{newComment.length}/300</Text>
            <Pressable
              onPress={handleAddComment}
              style={({ pressed }) => [
                styles.sendBtn, 
                (!newComment.trim() || !user) && styles.sendBtnDisabled,
                pressed && { opacity: 0.8 }
              ]}
              disabled={!newComment.trim() || !user}
            >
              <MaterialIcons name="send" size={18} color="white" />
              <Text style={styles.sendText}>Post</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Loading state */}
      {loading && (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={Colors.primaryLight} />
        </View>
      )}

      {/* Comments list */}
      {!loading && comments.map((comment) => {
        const isMine = user && (comment.userId === user.id || comment.user === currentUsername);
        const isEditing = editingId === comment.id;

        return (
          <GlassCard key={comment.id} style={styles.commentCard} variant="default">
            <View style={styles.commentHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>{comment.avatar}</Text>
              </View>
              <View style={styles.commentMeta}>
                <Text style={styles.username}>{comment.user}</Text>
                <Text style={styles.time}>{formatDate(comment.createdAt, comment.time)}</Text>
              </View>
              
              {isMine && !isEditing && (
                <View style={styles.actions}>
                  <Pressable onPress={() => { setEditingId(comment.id); setEditCommentTxt(comment.text); }} style={styles.iconBtn}>
                    <MaterialIcons name="edit" size={16} color={Colors.textSubtle} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(comment.id)} style={styles.iconBtn}>
                    <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
                  </Pressable>
                </View>
              )}
            </View>

            {isEditing ? (
              <View style={styles.editSection}>
                <TextInput
                  style={styles.editInput}
                  value={editCommentTxt}
                  onChangeText={setEditCommentTxt}
                  multiline
                />
                <View style={styles.editActions}>
                  <Pressable onPress={() => setEditingId(null)} style={styles.editBtnCancel}>
                    <Text style={styles.editBtnTextCancel}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={() => handleEditSave(comment.id)} style={styles.editBtnSave}>
                    <Text style={styles.editBtnTextSave}>Save</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text style={styles.commentText}>{comment.text}</Text>
            )}
          </GlassCard>
        );
      })}

      {!loading && comments.length === 0 && (
        <View style={styles.empty}>
          <MaterialIcons name="chat" size={40} color={Colors.glassBorder} />
          <Text style={styles.emptyText}>No comments yet.</Text>
          <Text style={styles.emptySubText}>Be the first to share your thoughts!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  input: {
    color: Colors.text,
    fontSize: FontSize.base,
    minHeight: 60,
    maxHeight: 120,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: Spacing.sm,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.glassBorder,
    opacity: 0.5,
  },
  sendText: {
    color: 'white',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  commentCard: {
    marginBottom: Spacing.xs,
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  commentMeta: {
    flex: 1,
  },
  username: {
    fontSize: FontSize.base,
    color: Colors.text,
    fontWeight: FontWeight.bold,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textSubtle,
  },
  commentText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    padding: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  editSection: {
    gap: Spacing.sm,
  },
  editInput: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.md,
    color: Colors.text,
    padding: Spacing.sm,
    fontSize: FontSize.base,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  editBtnCancel: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  editBtnTextCancel: {
    color: Colors.textSubtle,
    fontSize: FontSize.sm,
  },
  editBtnSave: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  editBtnTextSave: {
    color: 'white',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.md,
  },
  emptySubText: {
    fontSize: FontSize.sm,
    color: Colors.textSubtle,
    marginTop: 4,
  },
});
