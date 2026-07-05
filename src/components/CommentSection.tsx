'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { User, ThumbsUp, Trash2, Send, MessageCircle } from 'lucide-react';
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const added = await createComment(postType, postId, user.id, { 
        content: newComment.trim(),
        parent_id: parentId
      });
      if (added) {
        setComments([...comments, added]);
        setNewComment('');
        setReplyingTo(null);
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
        setComments(comments.filter(c => c.id !== commentId && c.parent_id !== commentId));
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

  // Group comments into root comments and replies
  const { rootComments, repliesMap } = useMemo(() => {
    const roots: Comment[] = [];
    const map: Record<string, Comment[]> = {};

    comments.forEach(c => {
      if (!c.parent_id) {
        roots.push(c);
      } else {
        if (!map[c.parent_id]) map[c.parent_id] = [];
        map[c.parent_id].push(c);
      }
    });

    return { rootComments: roots.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), repliesMap: map };
  }, [comments]);

  const renderComment = (comment: Comment, isReply = false) => {
    const hasReplies = !isReply && repliesMap[comment.id] && repliesMap[comment.id].length > 0;

    return (
      <div key={comment.id} className={`comment-item ${isReply ? 'comment-reply' : ''}`}>
        <div className="comment-avatar">
          {comment.profile?.avatar_url ? (
            <img src={comment.profile.avatar_url} alt="Avatar" className="comment-avatar-img" />
          ) : (
            <User size={20} />
          )}
        </div>
        <div className="comment-content-wrap">
          <div className="comment-bubble">
            <div className="comment-meta">
              <span className="comment-author">
                {comment.profile?.full_name || comment.profile?.username || `User ${comment.user_id.substring(0, 4)}`}
              </span>
            </div>
            <div className="comment-text">{comment.content}</div>
          </div>
          
          <div className="comment-actions">
            <span>{new Date(comment.created_at).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit'})}</span>
            <button className="comment-action-btn" onClick={() => handleLike(comment.id)}>
              Thích {comment.likes_count > 0 ? `(${comment.likes_count})` : ''}
            </button>
            {!isReply && (
              <button className="comment-action-btn" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
                Trả lời
              </button>
            )}
            {user && user.id === comment.user_id && (
              <button className="comment-action-btn delete" onClick={() => handleDelete(comment.id)}>
                Xóa
              </button>
            )}
          </div>

          {replyingTo === comment.id && (
            <form onSubmit={(e) => handleSubmit(e, comment.id)} className="comment-form reply-form">
              <textarea
                className="comment-input"
                placeholder={`Trả lời ${comment.profile?.full_name || 'bình luận'}...`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              <button type="submit" className="comment-submit" disabled={isSubmitting || !newComment.trim()}>
                <Send size={14} />
              </button>
            </form>
          )}

          {hasReplies && (
            <div className="comment-replies-list">
              {repliesMap[comment.id].map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="comment-section">
      <h3 className="comment-header">Bình luận ({comments.length})</h3>

      {!user ? (
        <div className="auth-prompt">
          <p>Vui lòng <Link href="/login">đăng nhập</Link> để để lại bình luận.</p>
        </div>
      ) : (
        !replyingTo && (
          <form onSubmit={(e) => handleSubmit(e)} className="comment-form">
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
        )
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Đang tải bình luận...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
      ) : (
        <div className="comments-list">
          {rootComments.map(c => renderComment(c))}
        </div>
      )}
    </div>
  );
}
