'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toggleFavorite, isFavorited } from '@/lib/favorites-service';
import { useAuth } from '@/contexts/AuthContext';
import './VerseLikeButton.css';

interface VerseLikeButtonProps {
  book: number;
  chapter: number;
  verse: number;
  size?: number;
}

export default function VerseLikeButton({ book, chapter, verse, size = 18 }: VerseLikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const verseId = `${book}:${chapter}:${verse}`;

  useEffect(() => {
    if (!user?.id) return;

    const checkLiked = async () => {
      const isFav = await isFavorited(user.id, 'verse', verseId);
      setLiked(isFav);
    };

    checkLiked();
  }, [user?.id, verseId]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user?.id) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    setLoading(true);
    try {
      const success = await toggleFavorite(user.id, 'verse', verseId);
      if (success) {
        setLiked(!liked);
      }
    } catch (error) {
      console.error('Like error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className={`verse-like-btn ${liked ? 'liked' : ''} ${loading ? 'loading' : ''}`}
        onClick={handleToggleLike}
        disabled={loading}
        aria-label={liked ? 'Bỏ thích' : 'Thích'}
        title={liked ? 'Bỏ thích câu Kinh Thánh' : 'Thích câu Kinh Thánh'}
      >
        <Heart size={size} fill={liked ? 'currentColor' : 'none'} />
      </button>

      {showToast && (
        <div className="verse-like-toast">
          Vui lòng đăng nhập để thích câu Kinh Thánh
        </div>
      )}
    </>
  );
}
