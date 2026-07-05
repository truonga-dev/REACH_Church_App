'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Calendar, User, FileText, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { htmlExcerpt } from '@/lib/html-utils';
import { POST_CONTENT_TYPES } from '@/lib/post-categories';
import CommentSection from '@/components/CommentSection';
import { useDraggableScroll } from '@/hooks/useDraggableScroll';
import './page.css';
import { NewsSkeleton } from '@/components/ui/Skeleton';

const TABS = ['Tất cả', ...POST_CONTENT_TYPES];

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNews, setSelectedNews] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const tabsScroll = useDraggableScroll<HTMLDivElement>();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        const posts = data.filter(
          (n) => (POST_CONTENT_TYPES as readonly string[]).includes(n.type) && n.status !== 'draft'
        );
        setNews(posts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter((n) => {
    if (activeTab !== 'Tất cả' && n.type !== activeTab) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(query) ||
        (n.content && n.content.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const featured = filteredNews.length > 0 ? filteredNews[0] : null;
  const listItems = filteredNews.length > 1 ? filteredNews.slice(1) : [];

  const getBadgeClass = (type: string) => {
    const cls = `badge-${type.toLowerCase().replace(/ /g, '-')}`;
    return ['Bản tin', 'Thông báo', 'Sự kiện', 'Bài viết'].includes(type) ? cls : 'badge-default';
  };



  return (
    <div className="news-page">
      {selectedNews && (
        <div className="news-modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="news-modal" onClick={(e) => e.stopPropagation()}>
            <div className="news-modal-handle d-block d-sm-none" />
            <div className="news-modal-header">
              <div className={`news-type-badge ${getBadgeClass(selectedNews.type)}`}>
                {selectedNews.type}
              </div>
              <button className="news-modal-close" onClick={() => setSelectedNews(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="news-modal-body">
              {selectedNews.image_url && (
                <img src={selectedNews.image_url} alt={selectedNews.title} className="news-modal-hero-img" />
              )}
              <div className="news-modal-content">
                <div className="news-modal-meta">
                  <span>
                    <Calendar size={14} />
                    {new Date(selectedNews.created_at).toLocaleDateString('vi-VN')}
                  </span>
                  {selectedNews.author && (
                    <span>
                      <User size={14} />
                      {selectedNews.author}
                    </span>
                  )}
                </div>
                <h2 className="news-modal-title">{selectedNews.title}</h2>
                <div className="rich-content" dangerouslySetInnerHTML={{ __html: selectedNews.content || '' }} />
                
                {selectedNews.pdf_url && (
                  <a href={selectedNews.pdf_url} target="_blank" rel="noopener noreferrer" className="news-modal-pdf-btn">
                    <FileText size={18} /> Xem tài liệu đính kèm (PDF)
                  </a>
                )}
                {selectedNews.audio_url && (
                  <audio controls src={selectedNews.audio_url} className="news-modal-audio" />
                )}
                
                <CommentSection postType="news_post" postId={selectedNews.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="news-header">
        <div className="news-header-top">
          <Link href="/" className="news-back-btn">
            <ArrowLeft size={20} />
          </Link>
          <div className="news-header-title-wrap">
            <h1 className="news-page-title">Bản tin Hội Thánh</h1>
            <p className="news-page-sub">Tin tức, thông báo & sự kiện mới nhất</p>
          </div>
        </div>

        <div 
          className="news-filter-tabs"
          ref={tabsScroll.ref}
          onMouseDown={tabsScroll.onMouseDown}
          onMouseLeave={tabsScroll.onMouseLeave}
          onMouseUp={tabsScroll.onMouseUp}
          onMouseMove={tabsScroll.onMouseMove}
          style={tabsScroll.style}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`news-filter-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="news-search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm tin tức..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <NewsSkeleton />
      ) : filteredNews.length === 0 ? (
        <div className="news-empty">
          <div className="news-empty-icon">
            <FileText size={24} />
          </div>
          <div>
            <h3>Không tìm thấy tin tức</h3>
            <p>Không có bài viết nào khớp với tìm kiếm của bạn.</p>
          </div>
        </div>
      ) : (
        <>
          {featured && (
            <div className="news-featured" onClick={() => setSelectedNews(featured)}>
              {featured.image_url && (
                <img src={featured.image_url} alt="" className="news-featured-img" />
              )}
              {featured.image_url && <div className="news-featured-overlay" />}
              <div className={`news-featured-body ${!featured.image_url ? 'no-img' : ''}`}>
                <div className={`news-featured-badge ${getBadgeClass(featured.type)}`}>
                  {featured.type}
                </div>
                <h2 className="news-featured-title">{featured.title}</h2>
                <div className="news-featured-meta">
                  <span>{new Date(featured.created_at).toLocaleDateString('vi-VN')}</span>
                  {featured.author && <span>• {featured.author}</span>}
                </div>
              </div>
            </div>
          )}

          <div className="news-list">
            {listItems.map((item) => (
              <div key={item.id} className="news-card" onClick={() => setSelectedNews(item)}>
                {item.image_url && <img src={item.image_url} alt="" className="news-card-img" />}
                <div className="news-card-body">
                  <div className="news-card-top">
                    <span className={`news-type-badge ${getBadgeClass(item.type)}`}>
                      {item.type}
                    </span>
                    <span className="news-date">
                      <Calendar size={12} style={{ marginBottom: '1px' }} />
                      {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="news-card-title">{item.title}</h3>
                  <div className="news-card-excerpt">
                    {htmlExcerpt(item.content || '', 120)}
                  </div>
                  <div className="news-card-footer">
                    <span className="news-card-author">
                      <User size={12} /> {item.author || 'Admin'}
                    </span>
                    <span className="news-read-btn">Đọc tiếp</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
