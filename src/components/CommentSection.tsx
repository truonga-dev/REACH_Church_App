'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, ThumbsUp, Trash2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchComments, createComment, deleteComment, likeComment } from '@/lib/comments';
import type { Comment } from '@/lib/comments';
import './CommentSection.css';

interface CommentSectionProps {
  postType: 'devotional' | 'news_post' | 'sermon';
  postId: string;
}

export default function CommentSection({ postType, postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [postId, postType]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await fetchComments(postType, postId);
      setComments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const added = await createComment(postType, postId, user.id, { content: newComment.trim() });
      if (added) {
        setComments([added, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi khi gửi bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      const success = await deleteComment(commentId);
      if (success) {
        setComments(comments.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thích bình luận');
      return;
    }
    try {
      const success = await likeComment(commentId);
      if (success) {
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, likes_count: (c.likes_count || 0) + 1 } : c
        ));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="comment-section">
      <h3 className="comment-header">Bình luận ({comments.length})</h3>

      {!user ? (
        <div className="auth-prompt">
          <p>Vui lòng <Link href="/login">đăng nhập</Link> để để lại bình luận.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            className="comment-input"
            placeholder="Chia sẻ suy nghĩ của bạn..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
          />
          <button type="submit" className="comment-submit" disabled={isSubmitting || !newComment.trim()}>
            <Send size={16} style={{ marginRight: '6px', display: 'inline' }} />
            {isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Đang tải bình luận...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                <User size={20} />
              </div>
              <div className="comment-content">
                <div className="comment-meta">
                  <span className="comment-author">User {comment.user_id.substring(0, 4)}</span>
                  <span>{new Date(comment.created_at).toLocaleString('vi-VN')}</span>
                </div>
                <div className="comment-text">{comment.content}</div>
                <div className="comment-actions">
                  <button className="comment-action-btn" onClick={() => handleLike(comment.id)}>
                    <ThumbsUp size={14} /> {comment.likes_count || 0} Thích
                  </button>
                  {user && user.id === comment.user_id && (
                    <button className="comment-action-btn delete" onClick={() => handleDelete(comment.id)}>
                      <Trash2 size={14} /> Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
