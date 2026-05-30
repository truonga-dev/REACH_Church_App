'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, BookOpen, Clock, Heart, Share2 } from 'lucide-react';
import './page.css';

function DevotionalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState('');

  const title = searchParams.get('title') || 'Sống trong ân điển';
  const verse = searchParams.get('verse') || 'Giăng 1:16';
  const text = searchParams.get('text') || 'Vì từ sự đầy dẫy của Ngài, chúng ta đã nhận được ân sủng chồng chất ân sủng.';
  const day = searchParams.get('day') || 'Hôm nay';
  const duration = searchParams.get('duration') || '5 phút đọc';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Dưỡng linh: ${title}`,
          text: text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToast('Đã sao chép liên kết!');
        setTimeout(() => setToast(''), 2000);
      }
    } catch (e) {
      console.log('Share failed', e);
    }
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
          <button className="action-btn" onClick={() => setLiked(!liked)}>
            <Heart size={20} fill={liked ? "#F12D5C" : "none"} color={liked ? "#F12D5C" : "currentColor"} />
          </button>
          <button className="action-btn" onClick={handleShare}>
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <main className="devotional-reader-main">
        <div className="dev-meta">
          <span className="dev-badge">{day}</span>
          <span className="dev-time"><Clock size={14} /> {duration}</span>
        </div>

        <h1 className="dev-reader-title">{title}</h1>

        <div className="dev-verse-box">
          <BookOpen size={24} className="verse-icon" />
          <p className="dev-verse-text">"{text}"</p>
          <p className="dev-verse-ref">— {verse}</p>
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
      </main>
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
