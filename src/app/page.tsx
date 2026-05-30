'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, PlayCircle, BookOpen, Heart,
  Newspaper, ChevronRight, Bell, Sun, Music,
  ArrowRight, FileText, X, ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './page.css';

const bulletins = [
  {
    id: 1,
    title: 'Bản Tin Hội Thánh – Tháng 11/2024',
    summary: 'Thông báo lịch nhóm nhỏ tháng 12, chiến dịch Giáng Sinh và chương trình từ thiện cuối năm.',
    content: 'Hội thánh REACH xin gửi đến quý ân nhân và Dân sự thông tin về lịch sinh hoạt tháng 12, chương trình từ thiện tại huyện Bình Chánh và buổi truyền giảng vào ngày lễ Giáng Sinh.',
    date: '28/11/2024',
    tag: 'Bản tin',
    author: 'Ban Truyền Thông REACH',
    location: 'Hội trường chính',
    pdf_url: '/docs/lich-nhom-nho-thang-12.pdf',
  },
  {
    id: 2,
    title: 'Thông Báo: Lớp Báp-têm Tháng 12',
    summary: 'Hội thánh sẽ tổ chức lớp học Báp-têm vào ngày 7-8/12. Đăng ký trước ngày 5/12.',
    content: 'Xin ưu tiên đăng ký sớm để ban tổ chức sắp xếp chỗ ngồi. Lớp báp-têm sẽ do mục sư Nguyễn Hòa giảng dạy và bao gồm phần học, cầu nguyện và chia sẻ chứng đạo.',
    date: '25/11/2024',
    tag: 'Thông báo',
    author: 'Ban Tông Đồ',
    location: 'Phòng học hội thánh',
  },
  {
    id: 3,
    title: 'Chương Trình Giáng Sinh 2024',
    summary: 'REACH Church trân trọng mời toàn thể Dân sự và thân hữu tham dự buổi lễ Giáng Sinh 22/12.',
    content: 'Đêm Giáng Sinh sẽ có chương trình thờ phượng, diễn nguyện và phục vụ cộng đồng. Xin mời quý anh chị cùng tham dự và đem theo người thân để chia sẻ niềm vui Phúc Âm.',
    date: '20/11/2024',
    tag: 'Sự kiện',
    author: 'Ban Sự Kiện',
    location: 'Hội trường chính',
  },
];

const devotionals = [
  { day: 'Hôm nay', title: 'Sống trong ân điển', verse: 'Giăng 1:16', verseBook: 43, verseChapter: 1, text: 'Vả, bởi sự đầy dẫy của Ngài mà chúng ta đều có nhận được, và ơn càng thêm ơn.', duration: '5 phút đọc', color: '#48BCE1' },
  { day: 'Hôm qua', title: 'Bình an từ Đức Chúa Trời', verse: 'Phi-líp 4:7', verseBook: 50, verseChapter: 4, text: 'Sự bình an của Ðức Chúa Trời vượt quá mọi sự hiểu biết, sẽ gìn giữ lòng và ý tưởng anh em trong Ðức Chúa Jêsus Christ.', duration: '4 phút đọc', color: '#F4CC30' },
];

const sermons = [
  { id: 1, title: 'Chúa Jesus là câu trả lời', speaker: 'MS. Quản nhiệm', date: '26/11/2024', duration: '45 phút', series: 'Tin Lành Giăng', youtube_url: '' },
  { id: 2, title: 'Đức Tin Vượt Qua Thử Thách', speaker: 'MS. Hội thánh', date: '19/11/2024', duration: '50 phút', series: 'Hê-bơ-rơ', youtube_url: '' },
];

const upcomingEvents = [
  { day: '01', month: 'Th.12', title: 'Thờ phượng Chúa Nhật', time: '09:00 – 11:00', loc: 'Hội trường chính', mapUrl: 'https://maps.google.com' },
  { day: '03', month: 'Th.12', title: 'Nhóm Nhỏ Thứ Ba', time: '19:30 – 21:00', loc: 'Nhà thành viên', mapUrl: 'https://maps.google.com' },
  { day: '07', month: 'Th.12', title: 'Lớp Báp-têm', time: '08:00 – 16:00', loc: 'Phòng học hội thánh', mapUrl: 'https://maps.google.com' },
  { day: '22', month: 'Th.12', title: '🎄 Đêm Giáng Sinh', time: '18:00 – 21:00', loc: 'Hội trường chính', mapUrl: 'https://maps.google.com' },
];

const tagColors: Record<string, string> = {
  'Bản tin': '#48BCE1', 'Thông báo': '#F4CC30', 'Sự kiện': '#F12D5C',
};

const notifications = [
  { id: 1, icon: '🔔', title: 'Nhóm Nhỏ tối nay lúc 19:30', time: '2 giờ trước', read: false },
  { id: 2, icon: '📖', title: 'Bài dưỡng linh mới đã được thêm vào', time: '5 giờ trước', read: false },
  { id: 3, icon: '🙏', title: 'Nhớ dành thời gian cầu nguyện hôm nay!', time: 'Hôm qua', read: true },
];

export default function Home() {
  const [greeting, setGreeting] = useState('Chào mừng bạn đến với REACH 🙏');
  const [dbNews, setDbNews] = useState<any[]>([]);
  const [dbSermons, setDbSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prayerCount, setPrayerCount] = useState(0);

  // UI state
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifs, setNotifs] = useState(notifications);
  const [playingSermon, setPlayingSermon] = useState<any>(null);
  const [toast, setToast] = useState('');
  const [selectedNews, setSelectedNews] = useState<any>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chúc buổi sáng bình an ☀️');
    else if (hour < 18) setGreeting('Chúc buổi chiều tốt lành 🌤️');
    else setGreeting('Chúc buổi tối bình an 🌙');
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [newsRes, sermonsRes, prayerRes] = await Promise.all([
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('sermons').select('*').order('created_at', { ascending: false }).limit(2),
        supabase.from('prayers').select('id', { count: 'exact' }).eq('status', 'ongoing'),
      ]);
      if (newsRes.data) setDbNews(newsRes.data);
      if (sermonsRes.data) setDbSermons(sermonsRes.data);
      if (prayerRes.count !== null) setPrayerCount(prayerRes.count);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifs(notifs.map(n => ({ ...n, read: true })));
  };

  const getYoutubeEmbedId = (source: string | null | undefined) => {
    if (!source) return null;
    if (source.length === 11 && /^[A-Za-z0-9_-]+$/.test(source)) return source;
    const match = source.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
    return match ? match[1] : null;
  };

  const handleSermonClick = (sermon: any) => {
    const source = sermon.youtube_url || sermon.youtube_id;
    const embedId = getYoutubeEmbedId(source);
    if (embedId) {
      setPlayingSermon({ ...sermon, youtube_url: sermon.youtube_url || `https://youtu.be/${embedId}` });
    } else {
      showToast('🎵 Bài giảng này chưa có video hợp lệ. Vui lòng liên hệ Admin!');
    }
  };

  const displayNews = dbNews.length > 0 ? dbNews : bulletins;
  const displaySermons = dbSermons.length > 0 ? dbSermons : sermons;

  return (
    <div className="home-container">

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#48BCE1', color: '#fff', padding: '10px 20px', borderRadius: '12px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Sermon Video Modal */}
      {playingSermon && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '560px', background: '#1a1d24', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#48BCE1', fontSize: '0.8rem', fontWeight: 'bold' }}>{playingSermon.series}</p>
                <h3 style={{ color: '#fff', fontSize: '1rem' }}>{playingSermon.title}</h3>
              </div>
              <button onClick={() => setPlayingSermon(null)} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>
            {getYoutubeEmbedId(playingSermon.youtube_url) ? (
              <iframe width="100%" height="280" src={`https://www.youtube.com/embed/${getYoutubeEmbedId(playingSermon.youtube_url)}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen style={{ display: 'block', border: 'none' }} />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Không tìm thấy video.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="home-header">
        <div className="logo-container">
          <Image src="/logo.png" alt="R.E.A.C.H Church Logo" width={44} height={44} className="app-logo" />
          <div>
            <h1 className="logo-text">R.E.A.C.H Church</h1>
            <p className="greeting">{greeting}</p>
          </div>
        </div>
        <div className="header-actions">
          {/* Bell Button + Notification Dropdown */}
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" aria-label="Thông báo" onClick={() => setShowNotifPanel(!showNotifPanel)}>
              <Bell size={22} />
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>
            {showNotifPanel && (
              <div style={{ position: 'absolute', top: '44px', right: 0, width: '300px', background: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 1000, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>Thông báo</span>
                  <button onClick={markAllRead} style={{ color: '#48BCE1', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Đọc tất cả</button>
                </div>
                {notifs.map(n => (
                  <div key={n.id} style={{ display: 'flex', gap: '10px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: n.read ? 'transparent' : 'rgba(72,188,225,0.06)', cursor: 'pointer' }}
                    onClick={() => setNotifs(notifs.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                    <span style={{ fontSize: '1.4rem' }}>{n.icon}</span>
                    <div>
                      <p style={{ color: '#fff', fontSize: '0.88rem', fontWeight: n.read ? 400 : 600 }}>{n.title}</p>
                      <p style={{ color: '#666', fontSize: '0.75rem' }}>{n.time}</p>
                    </div>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#48BCE1', flexShrink: 0, marginLeft: 'auto', alignSelf: 'center' }} />}
                  </div>
                ))}
                <button onClick={() => setShowNotifPanel(false)} style={{ width: '100%', padding: '10px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Đóng</button>
              </div>
            )}
          </div>
          <Link href="/profile" className="avatar-link" aria-label="Hồ sơ">
            <div className="header-avatar">DS</div>
          </Link>
        </div>
      </header>

      {/* ── Daily Verse ── */}
      <Link href="/bible" style={{ textDecoration: 'none' }}>
        <section className="verse-card" style={{ cursor: 'pointer' }}>
          <div className="verse-top">
            <BookOpen size={18} className="verse-icon" />
            <span className="verse-label">Câu Kinh Thánh hôm nay — Chạm để đọc</span>
          </div>
          <blockquote className="verse-text">
            "Vì Ðức Chúa Trời yêu thương thế gian, đến nỗi đã ban Con một của Ngài, hầu cho hễ ai tin Con ấy không bị hư mất mà được sự sống đời đời."
          </blockquote>
          <p className="verse-ref">— Giăng 3:16</p>
        </section>
      </Link>

      {/* ── Daily Devotional ── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <Sun size={18} style={{ marginRight: 6, color: '#F4CC30', verticalAlign: 'middle' }} />
            Dưỡng Linh Hằng Ngày
          </h2>
          <Link href="/bible" className="see-all">Xem thêm <ArrowRight size={14} /></Link>
        </div>
        <div className="devotional-list">
          {devotionals.map((d, i) => (
            <Link key={i} href={`/devotional?title=${encodeURIComponent(d.title)}&verse=${encodeURIComponent(d.verse)}&text=${encodeURIComponent(d.text)}&day=${encodeURIComponent(d.day)}&duration=${encodeURIComponent(d.duration)}`} style={{ textDecoration: 'none' }}>
              <div className="devotional-card" style={{ borderLeftColor: d.color, cursor: 'pointer' }}>
                <div className="dev-day-badge" style={{ backgroundColor: d.color }}>{d.day}</div>
                <h3 className="dev-title">{d.title}</h3>
                <p className="dev-verse-ref">{d.verse}</p>
                <p className="dev-text">"{d.text}"</p>
                <div className="dev-footer">
                  <span className="dev-duration">{d.duration}</span>
                  <span className="dev-read-btn">Đọc bài →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Sermon ── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <Music size={18} style={{ marginRight: 6, color: '#48BCE1', verticalAlign: 'middle' }} />
            Bài Giảng Mới Nhất
          </h2>
          <Link href="/library" className="see-all">Xem thêm <ArrowRight size={14} /></Link>
        </div>
        <div className="sermons-list">
          {loading ? <p>Đang tải...</p> : displaySermons.map(sermon => (
            <div key={sermon.id} className="sermon-item" onClick={() => handleSermonClick(sermon)} style={{ cursor: 'pointer' }}>
              <div className="sermon-thumb">
                <PlayCircle size={30} className="play-icon" />
              </div>
              <div className="sermon-info">
                <span className="sermon-series">{sermon.series}</span>
                <h3 className="sermon-title">{sermon.title}</h3>
                <p className="sermon-meta">{sermon.speaker} • {sermon.created_at ? new Date(sermon.created_at).toLocaleDateString('vi-VN') : sermon.date}</p>
              </div>
              <div style={{ paddingRight: '12px', color: '#48BCE1' }}>
                <PlayCircle size={18} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bản Tin & Thông Báo */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title"><Newspaper size={20} className="mr-xs text-primary" /> Bản tin & Thông báo</h2>
          <Link href="/news" className="see-all">Xem tất cả <ChevronRight size={14} /></Link>
        </div>
        {/* News Detail Modal */}
        {selectedNews && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9997, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
            onClick={() => setSelectedNews(null)}>
            <div style={{ background: '#1a1d24', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ padding: '4px 12px', borderRadius: '8px', background: '#48BCE122', color: '#48BCE1', fontWeight: 'bold', fontSize: '0.8rem' }}>{selectedNews.type || selectedNews.tag}</span>
                <button onClick={() => setSelectedNews(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16}/></button>
              </div>
              {selectedNews.image_url && <img src={selectedNews.image_url} alt="" style={{ width: '100%', borderRadius: '12px', marginBottom: '1rem', objectFit: 'cover', maxHeight: '220px' }} />}
              <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.2rem', lineHeight: '1.4' }}>{selectedNews.title}</h2>
              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{selectedNews.created_at ? new Date(selectedNews.created_at).toLocaleDateString('vi-VN') : selectedNews.date}</p>
              {selectedNews.author && <p style={{ color: '#ccc', fontSize: '0.85rem', marginBottom: '1rem' }}>Bởi {selectedNews.author}{selectedNews.location ? ` • ${selectedNews.location}` : ''}</p>}
              <div className="rich-text-content" style={{ color: '#ccc', lineHeight: '1.7', whiteSpace: 'normal', fontSize: '1rem', marginBottom: '1rem' }} dangerouslySetInnerHTML={{ __html: selectedNews.content || selectedNews.summary }}></div>
              {selectedNews.audio_url && <audio controls style={{ width: '100%', marginBottom: '1rem' }} src={selectedNews.audio_url} />}
              {selectedNews.pdf_url && (
                <a href={selectedNews.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: '#F12D5C', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>
                  <FileText size={18}/> Mở PDF đính kèm
                </a>
              )}
            </div>
          </div>
        )}

        <div className="bulletin-list">
          {loading ? <p>Đang tải...</p> : displayNews.map(item => (
            <div key={item.id} className="bulletin-card" onClick={() => {
              // Nếu là DB item (có uuid dạng dài), điều hướng tới trang chi tiết
              if (item.created_at) {
                setSelectedNews(item);
              } else {
                setSelectedNews(item);
              }
            }} style={{ cursor: 'pointer' }}>
              {item.image_url && (
                <div style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: '12px 12px 0 0', marginBottom: '12px' }}>
                  <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div className="bulletin-top" style={item.image_url ? { marginTop: 0 } : {}}>
                <span className="bulletin-tag" style={{ backgroundColor: `${tagColors[item.type || item.tag] || '#48BCE1'}22`, color: tagColors[item.type || item.tag] || '#48BCE1' }}>
                  {item.type || item.tag}
                </span>
                <span className="bulletin-date">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : item.date}
                </span>
              </div>
              <h3 className="bulletin-title">{item.title}</h3>
              {item.author && <p className="bulletin-meta" style={{ marginBottom: '0.35rem' }}>Bởi {item.author} • {item.location || 'REACH Church'}</p>}
              <p className="bulletin-summary">{item.content ? `${item.content.slice(0, 110)}...` : item.summary}</p>
              {item.audio_url && (
                <div style={{ marginTop: '12px' }} onClick={e => e.stopPropagation()}>
                  <audio controls style={{ width: '100%', height: '40px' }} src={item.audio_url}></audio>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <span style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px', borderRadius: '8px', background: 'rgba(72,188,225,0.1)', color: '#48BCE1', fontSize: '0.9rem' }}>
                  Đọc thêm <ChevronRight size={14} />
                </span>
                {item.pdf_url && (
                  <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ flex: 1, color: '#F12D5C', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px', borderRadius: '8px', background: 'rgba(241,45,92,0.08)' }}>
                    <FileText size={14} /> Xem PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Prayer Quick Access ── */}
      <Link href="/profile?tab=prayer" style={{ textDecoration: 'none' }}>
        <section className="prayer-banner" style={{ cursor: 'pointer' }}>
          <Heart size={28} className="prayer-banner-icon" />
          <div>
            <p className="prayer-banner-title">Đề mục cầu nguyện của bạn</p>
            <p className="prayer-banner-sub">
              {prayerCount > 0 ? `Bạn đang có ${prayerCount} đề mục đang cầu nguyện` : 'Chạm để thêm đề mục cầu nguyện mới'}
            </p>
          </div>
          <span className="prayer-banner-btn">Xem</span>
        </section>
      </Link>

      {/* ── Upcoming Events ── */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <Calendar size={18} style={{ marginRight: 6, color: '#48BCE1', verticalAlign: 'middle' }} />
            Sự Kiện Sắp Tới
          </h2>
        </div>
        <div className="events-list">
          {upcomingEvents.map((ev, i) => (
            <a key={i} href={ev.mapUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="event-item" style={{ cursor: 'pointer' }}>
                <div className="event-date">
                  <span className="date-day">{ev.day}</span>
                  <span className="date-month">{ev.month}</span>
                </div>
                <div className="event-details">
                  <h4 className="event-title">{ev.title}</h4>
                  <p className="event-time">{ev.time}</p>
                  <p className="event-loc">📍 {ev.loc}</p>
                </div>
                <ExternalLink size={14} style={{ color: '#48BCE1', flexShrink: 0, alignSelf: 'center' }} />
              </div>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}
