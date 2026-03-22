import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export interface Comment {
  id: string;
  user: string;
  userId?: string;
  avatar: string;
  text: string;
  time: string;
  createdAt?: string;
  parentId?: string | null;
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
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [quizId]);

  const fetchComments = async () => {
    try {
      const data: any = await api.get(`/comments/${quizId}`);
      setComments(data);
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
    const parentId = replyingTo?.id || null;
    setNewComment('');
    setReplyingTo(null);
    
    // Optimistic UI
    const optimisticId = Date.now().toString();
    const optimisticComment: Comment = {
      id: optimisticId,
      user: currentUsername,
      userId: user.id,
      text: txt,
      avatar: user.avatar || '👤',
      time: 'Just now',
      parentId: parentId,
      createdAt: new Date().toISOString()
    };
    setComments([optimisticComment, ...comments]);

    try {
      await api.post('/comments', { 
        quizId, 
        text: txt, 
        avatar: user.avatar || '👤',
        parentId: parentId
      });
      fetchComments();
    } catch (e) {
      Alert.alert('Error', 'Failed to add comment');
      fetchComments(); // revert optimistic
    }
  };

  const deleteApiCall = async (id: string) => {
    try {
      await api.delete(`/comments/${id}`);
      fetchComments();
    } catch (e) {
      Alert.alert('Error', 'Network error');
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

  const handleEditSave = async (id: string) => {
    if (!editCommentTxt.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await api.put(`/comments/${id}`, { text: editCommentTxt.trim() });
      setEditingId(null);
      fetchComments();
    } catch (e) {
      Alert.alert('Error', 'Network error');
    }
  };

  const formatDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return timeStr || 'Just now';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Just now';
    
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString();
  };

  // Group comments by parent
  const { rootComments, repliesMap } = useMemo(() => {
    const root: Comment[] = [];
    const replies: Record<string, Comment[]> = {};
    
    // Sort by date ASC so oldest replies are first in their group
    const sorted = [...comments].sort((a, b) => 
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

    sorted.forEach(c => {
      if (!c.parentId) {
        root.push(c);
      } else {
        if (!replies[c.parentId]) replies[c.parentId] = [];
        replies[c.parentId].push(c);
      }
    });

    // Root comments should be DESC (newest on top)
    root.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return { rootComments: root, repliesMap: replies };
  }, [comments]);

  const renderComment = (comment: Comment, isReply = false) => {
    const isMine = user && (comment.userId === user.id || comment.user === currentUsername);
    const isEditing = editingId === comment.id;
    const replies = repliesMap[comment.id] || [];

    return (
      <View key={comment.id}>
        <GlassCard 
          style={[styles.commentCard, isReply ? styles.replyCard : {}]} 
          variant={isReply ? 'default' : 'strong'}
        >
          <View style={styles.commentHeader}>
            <View style={[styles.avatar, isReply && styles.avatarSmall]}>
              <Text style={[styles.avatarEmoji, isReply && { fontSize: 16 }]}>{comment.avatar}</Text>
            </View>
            <View style={styles.commentMeta}>
              <Text style={styles.username}>{comment.user}</Text>
              <Text style={styles.time}>{formatDate(comment.createdAt, comment.time)}</Text>
            </View>
            
            <View style={styles.actions}>
              {!isEditing && !isReply && (
                <Pressable onPress={() => { setReplyingTo(comment); setNewComment(`@${comment.user} `); }} style={styles.iconBtn}>
                  <MaterialIcons name="reply" size={16} color={Colors.primaryLight} />
                </Pressable>
              )}
              {isMine && !isEditing && (
                <>
                  <Pressable onPress={() => { setEditingId(comment.id); setEditCommentTxt(comment.text); }} style={styles.iconBtn}>
                    <MaterialIcons name="edit" size={16} color={Colors.textSubtle} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(comment.id)} style={styles.iconBtn}>
                    <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {isEditing ? (
            <View style={styles.editSection}>
              <TextInput
                style={styles.editInput}
                value={editCommentTxt}
                onChangeText={setEditCommentTxt}
                multiline
                autoFocus
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
        
        {/* Render child replies */}
        {replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {replies.map(r => renderComment(r, true))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <MaterialIcons name="forum" size={20} color={Colors.primaryLight} />
        {' '}Community Discussion ({comments.length})
      </Text>

      {/* Input Section */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {replyingTo && (
           <View style={styles.replyingToBar}>
              <Text style={styles.replyingToText}>Replying to <Text style={{fontWeight: 'bold'}}>{replyingTo.user}</Text></Text>
              <Pressable onPress={() => {setReplyingTo(null); setNewComment(''); }}>
                 <MaterialIcons name="close" size={16} color={Colors.textSubtle} />
              </Pressable>
           </View>
        )}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder={replyingTo ? "Write a reply..." : "Share your thoughts..."}
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
              <MaterialIcons name={replyingTo ? "reply" : "send"} size={18} color="white" />
              <Text style={styles.sendText}>{replyingTo ? "Reply" : "Post"}</Text>
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
      {!loading && rootComments.map(c => renderComment(c))}

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
  replyingToBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(124,58,237,0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  replyingToText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
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
  replyCard: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    marginLeft: 0,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  repliesContainer: {
    marginLeft: Spacing.lg,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(124,58,237,0.2)',
    paddingLeft: Spacing.sm,
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
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
