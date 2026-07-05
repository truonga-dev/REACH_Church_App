'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Send, Bell, Loader2, Link as LinkIcon, Edit3,
  Smartphone, Users, CheckCircle2, AlertCircle,
  Clock, BarChart2, Megaphone, X, ChevronRight,
  Zap, History
} from 'lucide-react';

interface SentLog {
  id: number;
  title: string;
  message: string;
  url?: string;
  sentAt: string;
  status: 'success' | 'error';
}

const QUICK_TEMPLATES = [
  { label: '📅 Nhắc nhóm nhỏ', title: 'Nhóm Nhỏ Tuần Này', message: 'Nhóm nhỏ diễn ra vào tối nay. Hãy chuẩn bị sẵn sàng và tham gia đúng giờ nhé!' },
  { label: '🙏 Mời thờ phượng', title: 'Thờ Phượng Chúa Nhật', message: 'Kính mời anh chị em đến dự buổi thờ phượng Chúa Nhật. Chúng ta cùng nhau tôn vinh Chúa!' },
  { label: '🎉 Sự kiện đặc biệt', title: 'Sự Kiện Đặc Biệt Sắp Tới', message: 'Có một sự kiện đặc biệt sắp diễn ra tại REACH Church. Đừng bỏ lỡ nhé!' },
  { label: '📖 Dưỡng linh', title: 'Dưỡng Linh Hằng Ngày', message: 'Hãy dành thời gian đọc Kinh Thánh và cầu nguyện hôm nay. Lời Chúa là ngọn đèn cho chân bạn!' },
];

const QUICK_LINKS = ['/events', '/bible', '/live', '/prayer', '/groups'];

export default function NotificationsManager() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [sentLog, setSentLog] = useState<SentLog[]>([]);
  const [sentCount, setSentCount] = useState(0);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('title')) setTitle(params.get('title')!);
    if (params.get('message')) setMessage(params.get('message')!);
    if (params.get('url')) setUrl(params.get('url')!);
    try {
      const saved = localStorage.getItem('reach_notif_log');
      if (saved) setSentLog(JSON.parse(saved));
      const count = localStorage.getItem('reach_notif_count');
      if (count) setSentCount(parseInt(count));
    } catch { /* ignore */ }
  }, []);

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setShowAllTemplates(false);
    titleRef.current?.focus();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setStatus('error');
      setFeedback('Vui lòng nhập tiêu đề và nội dung thông báo.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(JSON.stringify(data.error) || 'Gửi thất bại');

      const entry: SentLog = { id: Date.now(), title, message, url, sentAt: new Date().toISOString(), status: 'success' };
      const updated = [entry, ...sentLog].slice(0, 20);
      setSentLog(updated);
      const newCount = sentCount + 1;
      setSentCount(newCount);
      try { localStorage.setItem('reach_notif_log', JSON.stringify(updated)); localStorage.setItem('reach_notif_count', String(newCount)); } catch { /* ignore */ }

      setStatus('success');
      setFeedback('Đã gửi thành công đến tất cả thiết bị!');
      setTimeout(() => { setStatus('idle'); setFeedback(''); setTitle(''); setMessage(''); setUrl(''); }, 5000);
    } catch (err: any) {
      const entry: SentLog = { id: Date.now(), title, message, url, sentAt: new Date().toISOString(), status: 'error' };
      setSentLog(prev => [entry, ...prev].slice(0, 20));
      setStatus('error');
      setFeedback(err.message || 'Có lỗi xảy ra khi gửi.');
    }
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  const successCount = sentLog.filter(l => l.status === 'success').length;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,rgba(72,188,225,0.12),rgba(99,102,241,0.08))', border: '1px solid rgba(72,188,225,0.2)', borderRadius: '20px', padding: '24px 28px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg,#48BCE1,#6366f1)', padding: '12px', borderRadius: '14px', boxShadow: '0 4px 20px rgba(72,188,225,0.3)' }}>
            <Megaphone color="#fff" size={26} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff', fontWeight: 700 }}>Quản Lý Thông Báo Đẩy</h2>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Gửi push notification đến toàn bộ tín hữu dùng app</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[{ val: sentCount, label: 'Đã gửi', color: '#48BCE1' }, { val: successCount, label: 'Thành công', color: '#34d399' }].map(s => (
            <div key={s.label} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: s.color, fontSize: '1.4rem', fontWeight: 700 }}>{s.val}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {(['compose', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, background: activeTab === tab ? 'linear-gradient(135deg,#48BCE1,#6366f1)' : 'transparent', color: activeTab === tab ? '#fff' : '#64748b', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {tab === 'compose' ? <><Zap size={14} />Soạn thông báo</> : <><History size={14} />Lịch sử ({sentLog.length})</>}
          </button>
        ))}
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: '16px' }}>
          {/* Form */}
          <div style={{ background: 'linear-gradient(180deg,#1a2233,#141d2b)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
            {/* Audience */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                <Users size={13} /> Đối tượng nhận
              </label>
              <div style={{ background: 'rgba(72,188,225,0.08)', border: '1px solid rgba(72,188,225,0.25)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} color="#48BCE1" />
                <div>
                  <div style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>Tất cả tín hữu</div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Toàn bộ người dùng đã bật thông báo</div>
                </div>
                <CheckCircle2 size={16} color="#48BCE1" style={{ marginLeft: 'auto' }} />
              </div>
            </div>

            {/* Templates */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <BarChart2 size={13} /> Mẫu nhanh
                </label>
                <button onClick={() => setShowAllTemplates(!showAllTemplates)} style={{ background: 'none', border: 'none', color: '#48BCE1', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {showAllTemplates ? 'Ẩn' : 'Xem tất cả'} <ChevronRight size={13} />
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {QUICK_TEMPLATES.slice(0, showAllTemplates ? 99 : 2).map((tpl, i) => (
                  <button key={i} onClick={() => applyTemplate(tpl)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 12px', color: '#cbd5e1', fontSize: '0.8rem', cursor: 'pointer' }}>
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}><Edit3 size={13} /> Tiêu đề</span>
                  <span style={{ color: title.length > 60 ? '#f43f5e' : '#475569', fontSize: '0.72rem' }}>{title.length}/65</span>
                </label>
                <input ref={titleRef} type="text" value={title} maxLength={65} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Sự kiện đặc biệt Chúa Nhật này!" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}><Bell size={13} /> Nội dung</span>
                  <span style={{ color: message.length > 150 ? '#f43f5e' : '#475569', fontSize: '0.72rem' }}>{message.length}/180</span>
                </label>
                <textarea value={message} maxLength={180} onChange={e => setMessage(e.target.value)} placeholder="Nội dung chi tiết..." rows={4} style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '0.95rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              {/* URL */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  <LinkIcon size={13} /> Đường dẫn <span style={{ color: '#334155', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.75rem' }}>(tùy chọn)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="/events hoặc /bible" style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                  {url && <button type="button" onClick={() => setUrl('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={14} /></button>}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {QUICK_LINKS.map(link => (
                    <button key={link} type="button" onClick={() => setUrl(link)} style={{ background: url === link ? 'rgba(72,188,225,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${url === link ? 'rgba(72,188,225,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '6px', padding: '4px 10px', color: url === link ? '#48BCE1' : '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>
                      {link}
                    </button>
                  ))}
                </div>
              </div>

              {feedback && (
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: status === 'success' ? 'rgba(52,211,153,0.08)' : 'rgba(244,63,94,0.08)', color: status === 'success' ? '#34d399' : '#f43f5e', fontSize: '0.88rem', border: `1px solid ${status === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {feedback}
                </div>
              )}

              <button type="submit" disabled={status === 'loading' || !title || !message} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: (status === 'loading' || !title || !message) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#48BCE1,#6366f1)', color: (!title || !message) ? '#475569' : '#fff', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '0.95rem', fontWeight: 700, cursor: (status === 'loading' || !title || !message) ? 'not-allowed' : 'pointer', marginTop: '4px', boxShadow: (!title || !message) ? 'none' : '0 4px 20px rgba(72,188,225,0.3)', transition: 'all 0.2s' }}>
                {status === 'loading' ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={20} />}
                {status === 'loading' ? 'Đang gửi...' : 'Gửi Thông Báo'}
              </button>
            </form>
          </div>

          {/* Preview + Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Preview */}
            <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Smartphone size={13} color="#64748b" />
                <span style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Xem trước</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg,#48BCE1,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bell size={18} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>REACH Church</span>
                    <span style={{ color: '#64748b', fontSize: '0.68rem' }}>Vừa xong</span>
                  </div>
                  <p style={{ color: title ? '#e2e8f0' : '#475569', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {title || 'Tiêu đề thông báo...'}
                  </p>
                  <p style={{ color: message ? '#94a3b8' : '#334155', fontSize: '0.75rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                    {message || 'Nội dung thông báo sẽ hiện ở đây...'}
                  </p>
                </div>
              </div>
              {url && <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#48BCE1', fontSize: '0.73rem' }}><LinkIcon size={11} />{url}</div>}
            </div>

            {/* Tips */}
            <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ color: '#fbbf24', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={12} /> Mẹo hiệu quả
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.8 }}>
                <li>Tiêu đề ngắn gọn, dưới 60 ký tự</li>
                <li>Nội dung rõ ràng, có lời kêu gọi hành động</li>
                <li>Thêm đường dẫn để tăng tương tác</li>
                <li>Không gửi quá 2-3 lần mỗi ngày</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ background: 'linear-gradient(180deg,#1a2233,#141d2b)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
          {sentLog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <History size={48} color="#1e293b" style={{ marginBottom: '16px' }} />
              <p style={{ color: '#475569', margin: 0 }}>Chưa có thông báo nào được gửi trong phiên này.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sentLog.map(log => (
                <div key={log.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '14px 16px', border: `1px solid ${log.status === 'success' ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)'}`, display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ marginTop: '2px' }}>
                    {log.status === 'success' ? <CheckCircle2 size={16} color="#34d399" /> : <AlertCircle size={16} color="#f43f5e" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem', marginBottom: '2px' }}>{log.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</div>
                    {log.url && <div style={{ color: '#48BCE1', fontSize: '0.73rem', marginTop: '4px' }}>{log.url}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569', fontSize: '0.73rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <Clock size={11} />{formatTime(log.sentAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
