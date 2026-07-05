'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, BookOpen, Clock, Heart, Share2, X, Link2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { parseVerseReference } from '@/lib/bible-share';
import CommentSection from '@/components/CommentSection';
import SharePlatformIcon from '@/components/bible/SharePlatformIcon';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsFavorite, addFavorite, removeFavorite } from '@/lib/favorites';
import './page.css';

function DevotionalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [devotionalData, setDevotionalData] = useState<any>(null);  

  const title = searchParams.get('title') || 'Sống trong ân điển';
  const verse = searchParams.get('verse') || 'Giăng 1:16';
  const text = searchParams.get('text') || 'Vì từ sự đầy dẫy của Ngài, chúng ta đã nhận được ân sủng chồng chất ân sủng.';
  const day = searchParams.get('day') || 'Hôm nay';
  const duration = searchParams.get('duration') || '5 phút đọc';
  const id = searchParams.get('id') || btoa(encodeURIComponent(title));

  useEffect(() => {
    // Fetch devotional details to get author and published_at
    const fetchDevotional = async () => {
      try {
        const { data } = await supabase
          .from('devotionals')
          .select('author, published_at')
          .eq('id', id)
          .single();
        if (data) setDevotionalData(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (id && id.length > 20) { // Valid UUID check roughly
      fetchDevotional();
    }
  }, [id]);

  useEffect(() => {
    // Check if user has favorited
    if (user && id) {
      checkIsFavorite(user.id, 'devotional', id).then(isFav => setLiked(isFav));
    }
  }, [user, id]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleFavorite = async () => {
    if (!user) {
      showToastMsg('Vui lòng đăng nhập để lưu yêu thích');
      return;
    }
    if (liked) {
      const ok = await removeFavorite(user.id, 'devotional', id);
      if (ok) setLiked(false);
    } else {
      const ok = await addFavorite(user.id, 'devotional', id);
      if (ok) setLiked(true);
    }
  };

  const handleShareClick = async (platform: 'zalo' | 'facebook' | 'x' | 'instagram' | 'copy') => {
    const url = window.location.href;
    const shareTitle = `Dưỡng linh: ${title}`;

    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      showToastMsg('Đã sao chép liên kết');
      setShareOpen(false);
      return;
    }
    
    if (platform === 'instagram') {
      await navigator.clipboard.writeText(url);
      showToastMsg('Đã chép link. Mở Instagram để dán!');
      setTimeout(() => {
        window.open('https://instagram.com', '_blank');
      }, 1000);
      setShareOpen(false);
      return;
    }

    let shareUrl = '';
    if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === 'x') {
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareTitle)}`;
    } else if (platform === 'zalo') {
      shareUrl = `https://zalo.me/share?url=${encodeURIComponent(url)}`;
    }
    
    if (shareUrl) window.open(shareUrl, '_blank');
    setShareOpen(false);
  };

  const getFormattedDate = () => {
    if (devotionalData?.published_at) {
      const d = new Date(devotionalData.published_at);
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return `${days[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
    }
    return day;
  };

  return (
    <div className="devotional-reader-container">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#48BCE1', color: '#fff', padding: '10px 20px', borderRadius: '12px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <header className="devotional-reader-header">
        <button onClick={() => router.back()} className="back-btn">
          <ChevronLeft size={24} /> Quay lại
        </button>
        <div className="header-actions">
          <button className="action-btn" onClick={handleFavorite}>
            <Heart size={20} fill={liked ? "#F12D5C" : "none"} color={liked ? "#F12D5C" : "currentColor"} />
          </button>
          <button className="action-btn" onClick={() => setShareOpen(true)}>
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <main className="devotional-reader-main">
        <div className="dev-meta" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="dev-badge" style={{ textTransform: 'capitalize' }}>{getFormattedDate()}</span>
            <span className="dev-time"><Clock size={14} /> {duration}</span>
          </div>
          {devotionalData?.author && (
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
              Người đăng: {devotionalData.author}
            </span>
          )}
        </div>

        <h1 className="dev-reader-title">{title}</h1>

        <div className="dev-verse-box">
          <BookOpen size={24} className="verse-icon" />
          <p className="dev-verse-text">"{text}"</p>
          {(() => {
            const parsed = parseVerseReference(verse);
            if (parsed.book && parsed.chapter) {
              const href = `/bible?book=${parsed.book}&chapter=${parsed.chapter}${parsed.verse ? `&verse=${parsed.verse}` : ''}`;
              return (
                <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <p className="dev-verse-ref" style={{ textDecoration: 'underline', textDecorationStyle: 'dashed', textUnderlineOffset: '4px' }}>— {verse}</p>
                </Link>
              );
            }
            return <p className="dev-verse-ref">— {verse}</p>;
          })()}
        </div>

        <div className="dev-content">
          <p>
            Kính thưa Hội Thánh, câu Kinh Thánh hôm nay nhắc nhở chúng ta về ân điển dư dật mà Đức Chúa Trời ban cho mỗi người.
            Trong cuộc sống hằng ngày, chúng ta thường đối mặt với những áp lực và mệt mỏi, nhưng ân sủng của Ngài luôn đủ cho chúng ta.
          </p>
          <p>
            Hãy dành vài phút hôm nay để tĩnh lặng, suy ngẫm về những phước hạnh bạn đã nhận được. 
            Đôi khi, ân điển không phải là việc mọi khó khăn biến mất, mà là sự bình an và sức mạnh Chúa ban để chúng ta vượt qua chúng.
          </p>
          <p>
            <strong>Cầu nguyện:</strong><br/>
            Lạy Chúa, con cảm tạ Ngài vì ân sủng không kể xiết của Ngài. Xin giúp con luôn biết sống trong sự biết ơn và chia sẻ tình yêu thương đó cho những người xung quanh. Nhân danh Chúa Jesus Christ, Amen!
          </p>
        </div>
        
        <CommentSection postType="devotional" postId={id} />
      </main>

      {/* Share Modal Card */}
      {shareOpen && (
        <>
          <div className="share-overlay" onClick={() => setShareOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(4px)' }} />
          <div className="share-modal-card" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#1c2536', borderRadius: '16px', padding: '24px', zIndex: 1001, width: '90%', maxWidth: '360px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', animation: 'scaleIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 'bold' }}>Chia sẻ bài viết</h3>
              <button onClick={() => setShareOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem 1rem' }}>
              <button className="share-btn" onClick={() => handleShareClick('facebook')}>
                <div className="share-icon-wrap facebook">
                  <SharePlatformIcon id="facebook" className="w-6 h-6" />
                </div>
                <span>Facebook</span>
              </button>

              <button className="share-btn" onClick={() => handleShareClick('zalo')}>
                <div className="share-icon-wrap zalo">
                  <SharePlatformIcon id="zalo" className="w-6 h-6" />
                </div>
                <span>Zalo</span>
              </button>

              <button className="share-btn" onClick={() => handleShareClick('x')}>
                <div className="share-icon-wrap x">
                  <SharePlatformIcon id="x" className="w-5 h-5" />
                </div>
                <span>X</span>
              </button>

              <button className="share-btn" onClick={() => handleShareClick('instagram')}>
                <div className="share-icon-wrap instagram">
                  <SharePlatformIcon id="instagram" className="w-6 h-6" />
                </div>
                <span>Instagram</span>
              </button>

              <button className="share-btn" onClick={() => handleShareClick('copy')}>
                <div className="share-icon-wrap copy">
                  <Link2 size={22} color="#fff" />
                </div>
                <span>Sao chép</span>
              </button>
            </div>
            <style jsx>{`
              @keyframes scaleIn {
                from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              }
              .share-btn {
                background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; color: #fff;
              }
              .share-btn span {
                font-size: 0.8rem; font-weight: 500; color: #d1d5db; transition: color 0.2s;
              }
              .share-btn:hover span { color: #fff; }
              .share-icon-wrap {
                width: 52px; height: 52px; border-radius: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: #fff;
              }
              .share-btn:hover .share-icon-wrap { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
              .share-btn:hover .share-icon-wrap.facebook { background: #1877F2; border-color: #1877F2; }
              .share-btn:hover .share-icon-wrap.zalo { background: #0068FF; border-color: #0068FF; }
              .share-btn:hover .share-icon-wrap.x { background: #000; border-color: #333; }
              .share-btn:hover .share-icon-wrap.instagram { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); border-color: transparent; }
              .share-btn:hover .share-icon-wrap.copy { background: rgba(255,255,255,0.2); }
            `}</style>
          </div>
        </>
      )}
    </div>
  );
}

export default function DevotionalReader() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải bài đọc...</div>}>
      <DevotionalContent />
    </Suspense>
  );
}
