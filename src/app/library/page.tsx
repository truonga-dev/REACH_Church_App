'use client';
import { useState, useEffect } from 'react';
import { FileText, Headphones, Video, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './page.css';

export default function Library() {
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const { data } = await supabase
        .from('news')
        .select('*')
        .not('pdf_url', 'is', null)
        .order('created_at', { ascending: false });
      if (data) setPdfs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadPdf = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert("Tài liệu này chưa có file PDF đính kèm.");
    }
  };

  const handleFeatureClick = () => {
    alert("Tính năng đang được phát triển, bạn sẽ sớm trải nghiệm được!");
  };
  return (
    <div className="library-container">
      <header className="page-header">
        <h1 className="page-title">Thư viện</h1>
        <p className="page-subtitle">Tài nguyên thuộc linh của REACH Church</p>
      </header>

      <div className="library-grid">
        <div className="lib-category-card" onClick={handleFeatureClick} style={{ cursor: 'pointer' }}>
          <div className="lib-icon-wrapper video-bg">
            <Video className="lib-icon" size={32} />
          </div>
          <h3 className="lib-category-title">Bài Giảng</h3>
          <p className="lib-category-desc">Video & Audio</p>
        </div>

        <div className="lib-category-card" onClick={handleFeatureClick} style={{ cursor: 'pointer' }}>
          <div className="lib-icon-wrapper audio-bg">
            <Headphones className="lib-icon" size={32} />
          </div>
          <h3 className="lib-category-title">Sách Nói</h3>
          <p className="lib-category-desc">Sách bồi linh</p>
        </div>

        <div className="lib-category-card" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('pdf-section')?.scrollIntoView({ behavior: 'smooth' })}>
          <div className="lib-icon-wrapper text-bg">
            <FileText className="lib-icon" size={32} />
          </div>
          <h3 className="lib-category-title">Sách PDF</h3>
          <p className="lib-category-desc">Tài liệu học</p>
        </div>
        
        <div className="lib-category-card" onClick={() => window.location.href = '/devotional'} style={{ cursor: 'pointer' }}>
          <div className="lib-icon-wrapper dev-bg">
            <BookOpen className="lib-icon" size={32} />
          </div>
          <h3 className="lib-category-title">Dưỡng Linh</h3>
          <p className="lib-category-desc">Bài tĩnh nguyện</p>
        </div>
      </div>

      <section className="recent-section" id="pdf-section">
        <h2 className="section-title">Sách PDF Mới Nhất</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader2 size={24} className="spin" style={{ margin: '0 auto', color: '#48BCE1' }} />
          </div>
        ) : pdfs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '2rem', background: '#1a1d24', borderRadius: '12px' }}>
            Chưa có tài liệu PDF nào. Ban điều hành có thể tải lên qua trang Admin.
          </div>
        ) : (
          <div className="pdf-list">
            {pdfs.map(pdf => (
              <div key={pdf.id} className="pdf-item">
                <div className="pdf-icon">
                  <FileText size={24} />
                </div>
                <div className="pdf-info">
                  <h4 className="pdf-title">{pdf.title}</h4>
                  <p className="pdf-meta">{pdf.type || 'Tài liệu'}</p>
                </div>
                <button className="btn-read" onClick={() => handleReadPdf(pdf.pdf_url)}>Đọc</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
