'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, FileText,
  Heart, Plus, Trash2, Video, Newspaper,
  Upload, File, CheckCircle, Edit, Headphones, BookOpen, X, LogOut,
  ArrowLeft, Lock, Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './page.css';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    setIsAuthenticated(sessionStorage.getItem('adminAuth') === 'true');
    setAuthReady(true);
  }, []);

  const [activeTab, setActiveTab] = useState('overview');

  const tabLabelMap: Record<string, string> = {
    overview: 'Tổng quan',
    sermons: 'Bài giảng',
    audiobooks: 'Sách Nói',
    pdfs: 'Sách PDF',
    devotionals: 'Dưỡng Linh',
    events: 'Sự kiện & Bản tin',
    users: 'Hồ sơ tín hữu',
    prayers: 'Đề mục cầu nguyện',
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123')) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
  };

  // Stats
  const [stats, setStats] = useState({ prayers: 0, sermons: 0, news: 0, profiles: 0 });

  type Sermon = {
    id?: string;
    title: string;
    speaker?: string;
    series?: string;
    date?: string;
    youtube_url?: string;
    youtube_id?: string;
  };

  type NewsItem = {
    id?: string;
    title: string;
    type: string;
    content: string;
    image_url?: string;
    pdf_url?: string;
    audio_url?: string;
  };

  type Prayer = {
    id?: string;
    title?: string;
    description?: string;
    status?: string;
    created_at?: string;
  };

  type Profile = {
    id?: string;
    full_name?: string;
    username?: string;
    role?: string;
    created_at?: string;
  };

  // Data states
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [recentPosts, setRecentPosts] = useState<Array<{
    id?: string;
    title?: string;
    type?: string;
    author?: string;
    created_at?: string;
    source: string;
    excerpt?: string;
    date?: string;
  }>>([]);
  const [roleUpdating, setRoleUpdating] = useState(false);

  // Forms
  const defaultSermon = { title: '', speaker: '', series: '', date: '', youtube_url: '' };
  const defaultNews = { title: '', type: 'Sự kiện', content: '', image_url: '', pdf_url: '', audio_url: '' };
  
  const [newSermon, setNewSermon] = useState<Sermon>(defaultSermon);
  const [newNews, setNewNews] = useState<NewsItem>(defaultNews);
  const [uploading, setUploading] = useState(false);

  // Edit states
  const [editingItem, setEditingItem] = useState<Sermon | NewsItem | null>(null);
  const [editType, setEditType] = useState<'sermon' | 'news' | null>(null);

  const fetchStats = async () => {
    const { count: prayerCount } = await supabase.from('prayers').select('*', { count: 'exact', head: true });
    const { count: sermonCount } = await supabase.from('sermons').select('*', { count: 'exact', head: true });
    const { count: newsCount } = await supabase.from('news').select('*', { count: 'exact', head: true });
    const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    setStats({
      prayers: prayerCount || 0,
      sermons: sermonCount || 0,
      news: newsCount || 0,
      profiles: profileCount || 0
    });
  };

  const fetchSermons = async () => {
    const { data } = await supabase.from('sermons').select('*').order('created_at', { ascending: false });
    if (data) setSermons(data.filter(Boolean));
  };

  const fetchNews = async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (data) setNews(data.filter(Boolean));
  };

  const fetchPrayers = async () => {
    const { data } = await supabase.from('prayers').select('*').order('created_at', { ascending: false });
    if (data) setPrayers(data.filter(Boolean));
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProfiles(data.filter(Boolean));
  };

  const fetchRecentPosts = async () => {
    const [{ data: newsData }, { data: sermonData }] = await Promise.all([
      supabase.from('news').select('*').order('created_at', { ascending: false }).limit(4),
      supabase.from('sermons').select('*').order('created_at', { ascending: false }).limit(4)
    ]);

    const posts = [
      ...(newsData || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type || 'Bản tin',
        author: item.author || item.created_by || item.username || 'REACH',
        created_at: item.created_at,
        excerpt: item.content ? item.content.replace(/<[^>]+>/g, '').slice(0, 120) : '',
        source: 'Tin tức'
      })),
      ...(sermonData || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        type: 'Bài giảng',
        author: item.speaker || 'Chưa rõ',
        created_at: item.created_at || item.date,
        excerpt: item.series ? `Loạt: ${item.series}` : '',
        source: 'Bài giảng',
        date: item.date
      }))
    ]
      .sort((a, b) => (new Date(b.created_at || '').getTime()) - (new Date(a.created_at || '').getTime()))
      .slice(0, 5);

    setRecentPosts(posts);
  };

  const formatDateTime = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleUpdateRole = async (id?: string, newRole?: string) => {
    if (!id || !newRole) return;
    setRoleUpdating(true);
    try {
      const { error, data } = await supabase.from('profiles').update({ role: newRole }).eq('id', id).select();
      if (error) {
        throw error;
      }
      if (data) {
        setProfiles(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Lỗi cập nhật quyền:', message);
      alert('Không thể cập nhật quyền: ' + message);
    } finally {
      setRoleUpdating(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadAdminData = async () => {
      await Promise.all([
        fetchStats(),
        fetchRecentPosts(),
        activeTab === 'sermons' ? fetchSermons() : Promise.resolve(),
        ['audiobooks', 'pdfs', 'devotionals', 'events'].includes(activeTab) ? fetchNews() : Promise.resolve(),
        activeTab === 'prayers' ? fetchPrayers() : Promise.resolve(),
        activeTab === 'users' ? fetchProfiles() : Promise.resolve(),
      ]);
    };

    void Promise.resolve().then(loadAdminData);
  }, [activeTab, isAuthenticated]);

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  // Add Handlers
  const handleAddSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const youtube_id = extractYoutubeId(newSermon.youtube_url || '');
      const { data, error } = await supabase.from('sermons').insert([{
        title: newSermon.title,
        speaker: newSermon.speaker,
        series: newSermon.series,
        date: newSermon.date,
        youtube_url: newSermon.youtube_url,
        youtube_id
      }]).select();

      if (error) {
        console.error('Lỗi thêm bài giảng:', error);
        alert('Lỗi thêm bài giảng: ' + error.message);
        return;
      }

      if (!data || !data.length) {
        alert('Không có dữ liệu trả về sau khi thêm bài giảng.');
        return;
      }

      setSermons([data[0], ...sermons]);
      setNewSermon(defaultSermon);
      fetchStats();
      alert('Đã thêm bài giảng thành công!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Lỗi mạng khi thêm bài giảng:', error);
      alert('Lỗi mạng khi thêm bài giảng: ' + message);
    }
  };

  const handleAddNews = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    try {
      const itemType = type;
      const { data, error } = await supabase.from('news').insert([{
        title: newNews.title,
        type: itemType,
        content: newNews.content,
        image_url: newNews.image_url,
        pdf_url: newNews.pdf_url,
        audio_url: newNews.audio_url
      }]).select();

      if (error) {
        console.error('Lỗi thêm bài viết:', error);
        alert('Lỗi thêm bài viết: ' + error.message);
        return;
      }

      if (!data || !data.length) {
        alert('Không có dữ liệu trả về sau khi thêm bài viết.');
        return;
      }

      setNews([data[0], ...news]);
      setNewNews(defaultNews);
      fetchStats();
      alert('Đã đăng bài thành công!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Lỗi mạng khi thêm bài viết:', error);
      alert('Lỗi mạng khi thêm bài viết: ' + message);
    }
  };

  // Delete Handlers
  const handleDeleteSermon = async (id?: string) => {
    if (!id || !confirm('Bạn có chắc muốn xóa bài giảng này?')) return;
    try {
      const { error } = await supabase.from('sermons').delete().eq('id', id);
      if (error) {
        console.error('Lỗi xóa bài giảng:', error);
        alert('Lỗi xóa bài giảng: ' + error.message);
        return;
      }
      setSermons(sermons.filter(s => s.id !== id));
      fetchStats();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Lỗi mạng khi xóa bài giảng:', error);
      alert('Lỗi mạng khi xóa bài giảng: ' + message);
    }
  };

  const handleDeleteNews = async (id?: string) => {
    if (!id || !confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) {
        console.error('Lỗi xóa bài viết:', error);
        alert('Lỗi xóa bài viết: ' + error.message);
        return;
      }
      setNews(news.filter(n => n.id !== id));
      fetchStats();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Lỗi mạng khi xóa bài viết:', error);
      alert('Lỗi mạng khi xóa bài viết: ' + message);
    }
  };

  // Edit Handlers
  const handleOpenEdit = (item: Sermon | NewsItem, type: 'sermon' | 'news') => {
    setEditingItem({ ...item });
    setEditType(type);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      if (editType === 'sermon') {
        const sermonEdit = editingItem as Sermon;
        let youtube_id = sermonEdit.youtube_id;
        if (sermonEdit.youtube_url) {
          youtube_id = extractYoutubeId(sermonEdit.youtube_url);
        }
        const { data, error } = await supabase.from('sermons').update({
          title: sermonEdit.title,
          speaker: sermonEdit.speaker,
          series: sermonEdit.series,
          date: sermonEdit.date,
          youtube_url: sermonEdit.youtube_url,
          youtube_id
        }).eq('id', sermonEdit.id).select();

        if (error) {
          console.error('Lỗi cập nhật bài giảng:', error);
          alert('Lỗi cập nhật bài giảng: ' + error.message);
          return;
        }

        if (!data || !data.length) {
          alert('Không có dữ liệu trả về sau khi cập nhật bài giảng.');
          return;
        }

        setSermons(sermons.map(s => s.id === editingItem.id ? data[0] : s));
        setEditingItem(null);
        fetchStats();
        alert('Cập nhật bài giảng thành công!');
      } else {
        const newsEdit = editingItem as NewsItem;
        const { data, error } = await supabase.from('news').update({
          title: newsEdit.title,
          type: newsEdit.type,
          content: newsEdit.content,
          image_url: newsEdit.image_url,
          pdf_url: newsEdit.pdf_url,
          audio_url: newsEdit.audio_url
        }).eq('id', newsEdit.id).select();

        if (error) {
          console.error('Lỗi cập nhật bài viết:', error);
          alert('Lỗi cập nhật bài viết: ' + error.message);
          return;
        }

        if (!data || !data.length) {
          alert('Không có dữ liệu trả về sau khi cập nhật bài viết.');
          return;
        }

        setNews(news.map(n => n.id === editingItem.id ? data[0] : n));
        setEditingItem(null);
        fetchStats();
        alert('Cập nhật bài viết thành công!');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Lỗi mạng khi cập nhật:', error);
      alert('Lỗi mạng khi cập nhật: ' + message);
    }
  };

  const handleDeletePrayer = async (id?: string) => {
    if (!id || !confirm('Bạn có chắc muốn xóa lời cầu nguyện này?')) return;
    const { error } = await supabase.from('prayers').delete().eq('id', id);
    if (error) {
      console.error('Lỗi xóa lời cầu nguyện:', error);
      alert('Lỗi xóa lời cầu nguyện: ' + error.message);
      return;
    }
    setPrayers(prayers.filter(p => p.id !== id));
    fetchStats();
  };

  const handleCompletePrayer = async (id?: string) => {
    if (!id) return;
    const { error } = await supabase.from('prayers').update({ status: 'completed' }).eq('id', id);
    if (error) {
      console.error('Lỗi cập nhật trạng thái lời cầu nguyện:', error);
      alert('Lỗi cập nhật trạng thái lời cầu nguyện: ' + error.message);
      return;
    }
    setPrayers(prayers.map(p => p.id === id ? { ...p, status: 'completed' } : p));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf' | 'audio', isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File vượt quá 5MB! Vui lòng chọn file nhẹ hơn.');
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error } = await supabase.storage.from('uploads').upload(filePath, file);
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      if (isEdit) {
        if (type === 'image') setEditingItem((prev) => prev ? {...prev, image_url: publicUrl} : prev);
        if (type === 'pdf') setEditingItem((prev) => prev ? {...prev, pdf_url: publicUrl} : prev);
        if (type === 'audio') setEditingItem((prev) => prev ? {...prev, audio_url: publicUrl} : prev);
      } else {
        if (type === 'image') setNewNews((prev) => ({...prev, image_url: publicUrl}));
        if (type === 'pdf') setNewNews((prev) => ({...prev, pdf_url: publicUrl}));
        if (type === 'audio') setNewNews((prev) => ({...prev, audio_url: publicUrl}));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Lỗi upload file:', error);
      alert('Lỗi tải file: ' + message);
    } finally {
      setUploading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="admin-login-container">
        <div className="admin-auth-loading">
          <div className="admin-auth-spinner" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-topbar">
          <Link href="/" className="admin-login-back">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
        </div>
        <div className="login-card">
          <div className="admin-login-logo-ring">
            <Image src="/logo.png" alt="REACH Admin" width={72} height={72} />
          </div>
          <span className="admin-login-badge">
            <Shield size={14} /> Ban điều hành
          </span>
          <h2>REACH Admin</h2>
          <p>Đăng nhập hệ thống quản trị nội dung hội thánh</p>
          <form onSubmit={handleLogin} className="login-form">
            <label className="admin-login-label" htmlFor="admin-password">Mật khẩu quản trị</label>
            <div className="admin-login-input-wrap">
              <Lock size={18} className="admin-login-input-icon" />
              <input
                id="admin-password"
                type="password"
                placeholder="Nhập mật khẩu admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={loginError ? 'error' : ''}
                required
              />
            </div>
            {loginError && <p className="error-msg">Mật khẩu không chính xác!</p>}
            <button type="submit" className="btn-primary w-full">Vào bảng điều khiển</button>
          </form>
        </div>
      </div>
    );
  }

  // Lọc dữ liệu theo tab
  const getFilteredNews = (types: string[]) => news.filter((n): n is NewsItem => Boolean(n && n.type && types.includes(n.type)));
  const editingSermon = editingItem as Sermon;
  const editingNews = editingItem as NewsItem;

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Image src="/logo.png" alt="REACH Logo" width={40} height={40} style={{ borderRadius: 8, objectFit: 'contain' }} />
          <div className="sidebar-brand">
            <h2>REACH Admin</h2>
            <p>Hệ thống quản trị</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <LayoutDashboard size={20} /> Tổng quan
          </button>
          
          <div className="nav-section-title">QUẢN LÝ THƯ VIỆN</div>
          <button className={`nav-item ${activeTab === 'sermons' ? 'active' : ''}`} onClick={() => setActiveTab('sermons')}>
            <Video size={20} /> Bài Giảng
          </button>
          <button className={`nav-item ${activeTab === 'audiobooks' ? 'active' : ''}`} onClick={() => setActiveTab('audiobooks')}>
            <Headphones size={20} /> Sách Nói
          </button>
          <button className={`nav-item ${activeTab === 'pdfs' ? 'active' : ''}`} onClick={() => setActiveTab('pdfs')}>
            <FileText size={20} /> Sách PDF
          </button>
          <button className={`nav-item ${activeTab === 'devotionals' ? 'active' : ''}`} onClick={() => setActiveTab('devotionals')}>
            <BookOpen size={20} /> Dưỡng Linh
          </button>

          <div className="nav-section-title">THÔNG TIN KHÁC</div>
          <button className={`nav-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
            <Newspaper size={20} /> Sự kiện & Bản tin
          </button>

          <div className="nav-section-title">THÀNH VIÊN</div>
          <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={20} /> Hồ sơ tín hữu
          </button>
          <button className={`nav-item ${activeTab === 'prayers' ? 'active' : ''}`} onClick={() => setActiveTab('prayers')}>
            <Heart size={20} /> Lời cầu nguyện
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout-sidebar">
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <div>
              <h1 className="page-title">{tabLabelMap[activeTab]}</h1>
              <div className="topbar-breadcrumb">Bảng điều khiển / {tabLabelMap[activeTab]}</div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-search">
              <input type="text" placeholder="Tìm bài, người dùng, bài giảng..." />
            </div>
            <div className="topbar-user">
              <span>Admin</span>
              <div className="avatar-circle">A</div>
            </div>
          </div>
        </header>

        <div className="admin-content-scroll">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrap bg-blue"><Users size={24} /></div>
                  <div className="stat-info"><span className="stat-label">Hồ sơ tín hữu</span><span className="stat-value">{stats.profiles}</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrap bg-yellow"><Video size={24} /></div>
                  <div className="stat-info"><span className="stat-label">Tổng bài giảng</span><span className="stat-value">{stats.sermons}</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrap bg-red"><Heart size={24} /></div>
                  <div className="stat-info"><span className="stat-label">Đề mục cầu nguyện</span><span className="stat-value">{stats.prayers}</span></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrap bg-green"><FileText size={24} /></div>
                  <div className="stat-info"><span className="stat-label">Tài liệu & Bản tin</span><span className="stat-value">{stats.news}</span></div>
                </div>
              </div>

              <div className="overview-section">
                <div className="section-header">
                  <div>
                    <h2>Bài đăng mới nhất</h2>
                    <p className="section-subtitle">Xem nhanh nội dung, thời gian và người đăng.</p>
                  </div>
                </div>
                <div className="recent-posts-list">
                  {recentPosts.length > 0 ? recentPosts.map(post => (
                    <div key={post.id} className="recent-post-item">
                      <div className="recent-post-top">
                        <span className="badge">{post.source}</span>
                        <span>{formatDateTime(post.created_at)}</span>
                      </div>
                      <h3>{post.title}</h3>
                      <p className="recent-post-author">Đăng bởi {post.author}</p>
                      {post.excerpt && <p className="recent-post-excerpt">{post.excerpt}</p>}
                    </div>
                  )) : (
                    <p>Không có bài đăng mới.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SERMONS */}
          {activeTab === 'sermons' && (
            <div className="admin-panel-grid">
              <div className="admin-panel-card">
                <div className="panel-header"><h3>Thêm Bài Giảng Mới</h3></div>
                <form onSubmit={handleAddSermon} className="cms-form">
                  <div className="form-group"><label>Tiêu đề bài giảng</label><input required placeholder="VD: Chúa Jesus là câu trả lời" value={newSermon.title} onChange={e => setNewSermon({...newSermon, title: e.target.value})} /></div>
                  <div className="form-row">
                    <div className="form-group"><label>Người giảng</label><input required placeholder="VD: Mục sư Tín" value={newSermon.speaker} onChange={e => setNewSermon({...newSermon, speaker: e.target.value})} /></div>
                    <div className="form-group"><label>Loạt bài</label><input placeholder="VD: Tin Lành Giăng" value={newSermon.series} onChange={e => setNewSermon({...newSermon, series: e.target.value})} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Ngày giảng</label><input required type="date" value={newSermon.date} onChange={e => setNewSermon({...newSermon, date: e.target.value})} /></div>
                    <div className="form-group"><label>Đường dẫn YouTube</label><input required placeholder="https://youtube.com/watch?v=..." value={newSermon.youtube_url} onChange={e => setNewSermon({...newSermon, youtube_url: e.target.value})} /></div>
                  </div>
                  <button type="submit" className="btn-primary-solid"><Plus size={18} /> Đăng bài giảng</button>
                </form>
              </div>

              <div className="admin-panel-card">
                <div className="panel-header"><h3>Danh sách Bài giảng ({sermons.length})</h3></div>
                <div className="data-list">
                  {sermons.filter(Boolean).map(s => (
                    <div key={s.id} className="data-item">
                      <div className="data-item-content"><strong>{s.title}</strong><span>{s.speaker} • {s.date}</span></div>
                      <div style={{display:'flex', gap: '8px'}}>
                        <button onClick={() => handleOpenEdit(s, 'sermon')} className="btn-icon-edit" title="Sửa"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteSermon(s.id)} className="btn-icon-danger" title="Xóa"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AUDIOBOOKS */}
          {activeTab === 'audiobooks' && (
            <div className="admin-panel-grid">
              <div className="admin-panel-card">
                <div className="panel-header"><h3>Thêm Sách Nói Mới</h3></div>
                <form onSubmit={e => handleAddNews(e, 'Sách Nói')} className="cms-form">
                  <div className="form-group"><label>Tiêu đề sách / Bài nghe</label><input required placeholder="Nhập tiêu đề..." value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} /></div>
                  <div className="form-group"><label>Mô tả ngắn</label><ReactQuill theme="snow" modules={quillModules} value={newNews.content} onChange={val => setNewNews({...newNews, content: val})} className="quill-editor" /></div>
                  <div className="upload-box">
                    <Upload size={24} className="upload-icon text-yellow" />
                    <div className="upload-info"><strong>File Audio (MP3)</strong><span>{newNews.audio_url ? 'Đã đính kèm Audio' : 'Chưa có file'}</span></div>
                    <label className="btn-upload">{uploading ? 'Đang tải...' : 'Chọn File'}<input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} disabled={uploading} hidden /></label>
                  </div>
                  <button type="submit" className="btn-primary-solid"><Plus size={18} /> Đăng Sách Nói</button>
                </form>
              </div>
              <div className="admin-panel-card">
                <div className="panel-header"><h3>Danh sách ({getFilteredNews(['Sách Nói']).length})</h3></div>
                <div className="data-list">
                  {getFilteredNews(['Sách Nói']).filter(Boolean).map(n => (
                    <div key={n.id} className="data-item">
                      <div className="data-item-content"><strong>{n.title}</strong></div>
                      <div style={{display:'flex', gap: '8px'}}>
                        <button onClick={() => handleOpenEdit(n, 'news')} className="btn-icon-edit"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteNews(n.id)} className="btn-icon-danger"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PDFS */}
          {activeTab === 'pdfs' && (
            <div className="admin-panel-grid">
              <div className="admin-panel-card">
                <div className="panel-header"><h3>Thêm Sách PDF / Tài liệu</h3></div>
                <form onSubmit={e => handleAddNews(e, 'Tài liệu')} className="cms-form">
                  <div className="form-group"><label>Tên sách / Tài liệu</label><input required placeholder="Nhập tiêu đề..." value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} /></div>
                  <div className="form-group"><label>Mô tả nội dung</label><ReactQuill theme="snow" modules={quillModules} value={newNews.content} onChange={val => setNewNews({...newNews, content: val})} className="quill-editor" /></div>
                  <div className="upload-box">
                    <File size={24} className="upload-icon text-red" />
                    <div className="upload-info"><strong>File PDF</strong><span>{newNews.pdf_url ? 'Đã đính kèm PDF' : 'Chưa có file'}</span></div>
                    <label className="btn-upload">{uploading ? 'Đang tải...' : 'Chọn File'}<input type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdf')} disabled={uploading} hidden /></label>
                  </div>
                  <button type="submit" className="btn-primary-solid"><Plus size={18} /> Đăng Sách PDF</button>
                </form>
              </div>
              <div className="admin-panel-card">
                <div className="panel-header"><h3>Danh sách ({getFilteredNews(['Tài liệu']).length})</h3></div>
                <div className="data-list">
                  {getFilteredNews(['Tài liệu']).filter(Boolean).map(n => (
                    <div key={n.id} className="data-item">
                      <div className="data-item-content"><strong>{n.title}</strong></div>
                      <div style={{display:'flex', gap: '8px'}}>
                        <button onClick={() => handleOpenEdit(n, 'news')} className="btn-icon-edit"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteNews(n.id)} className="btn-icon-danger"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DEVOTIONALS */}
          {activeTab === 'devotionals' && (
            <div className="admin-panel-grid">
              <div className="admin-panel-card">
                <div className="panel-header"><h3>Thêm Bài Dưỡng Linh</h3></div>
                <form onSubmit={e => handleAddNews(e, 'Dưỡng linh')} className="cms-form">
                  <div className="form-group"><label>Chủ đề dưỡng linh</label><input required placeholder="Nhập tiêu đề..." value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} /></div>
                  <div className="form-group"><label>Nội dung bài học / Lời Chúa</label><ReactQuill theme="snow" modules={quillModules} value={newNews.content} onChange={val => setNewNews({...newNews, content: val})} className="quill-editor" placeholder="Nhập nội dung bài tĩnh nguyện hoặc đoạn Kinh Thánh..." /></div>
                  <button type="submit" className="btn-primary-solid"><Plus size={18} /> Đăng bài Dưỡng linh</button>
                </form>
              </div>
              <div className="admin-panel-card">
                <div className="panel-header"><h3>Danh sách ({getFilteredNews(['Dưỡng linh']).length})</h3></div>
                <div className="data-list">
                  {getFilteredNews(['Dưỡng linh']).filter(Boolean).map(n => (
                    <div key={n.id} className="data-item">
                      <div className="data-item-content"><strong>{n.title}</strong></div>
                      <div style={{display:'flex', gap: '8px'}}>
                        <button onClick={() => handleOpenEdit(n, 'news')} className="btn-icon-edit"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteNews(n.id)} className="btn-icon-danger"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EVENTS & NEWS */}
          {activeTab === 'events' && (
            <div className="admin-panel-grid">
              <div className="admin-panel-card">
                <div className="panel-header"><h3>Đăng Sự Kiện / Thông Báo</h3></div>
                <form onSubmit={e => handleAddNews(e, newNews.type || 'Sự kiện')} className="cms-form">
                  <div className="form-row">
                    <div className="form-group flex-2"><label>Tiêu đề</label><input required placeholder="Nhập tiêu đề..." value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} /></div>
                    <div className="form-group"><label>Loại</label>
                      <select value={newNews.type} onChange={e => setNewNews({...newNews, type: e.target.value})}>
                        <option value="Sự kiện">Sự kiện</option>
                        <option value="Thông báo">Thông báo</option>
                        <option value="Bản tin">Bản tin chung</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label>Nội dung chi tiết</label><ReactQuill theme="snow" modules={quillModules} value={newNews.content} onChange={val => setNewNews({...newNews, content: val})} className="quill-editor" /></div>
                  <div className="upload-box" style={{ flexWrap: 'wrap' }}>
                    <File size={24} className="upload-icon text-blue" />
                    <div className="upload-info"><strong>Ảnh đính kèm (URL)</strong><span>{newNews.image_url ? 'Đã có ảnh' : 'Chưa có ảnh'}</span></div>
                    <label className="btn-upload">{uploading ? 'Đang tải...' : 'Chọn File'}<input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} disabled={uploading} hidden /></label>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {newNews.image_url && <img src={newNews.image_url} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' }} />}
                  </div>
                  <button type="submit" className="btn-primary-solid"><Plus size={18} /> Đăng bài</button>
                </form>
              </div>
              <div className="admin-panel-card">
                <div className="panel-header"><h3>Danh sách ({getFilteredNews(['Sự kiện', 'Thông báo', 'Bản tin']).length})</h3></div>
                <div className="data-list">
                  {getFilteredNews(['Sự kiện', 'Thông báo', 'Bản tin']).filter(Boolean).map(n => (
                    <div key={n.id} className="data-item">
                      <div className="data-item-content"><strong><span className="badge">{n.type}</span> {n.title}</strong></div>
                      <div style={{display:'flex', gap: '8px'}}>
                        <button onClick={() => handleOpenEdit(n, 'news')} className="btn-icon-edit"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteNews(n.id)} className="btn-icon-danger"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRAYERS & USERS */}
          {activeTab === 'prayers' && (
            <div className="admin-panel-card">
              <div className="panel-header"><h3>Danh sách Đề mục cầu nguyện</h3></div>
              <div className="prayer-grid">
                {prayers.filter(Boolean).map(p => (
                  <div key={p.id} className={`prayer-card-admin ${p.status === 'completed' ? 'completed' : ''}`}>
                    <div className="prayer-status">
                      {p.status === 'completed' ? <CheckCircle size={16} className="text-green" /> : <Heart size={16} className="text-red" />}
                      <span>{p.status === 'completed' ? 'Đã nhậm lời' : 'Đang cầu nguyện'}</span>
                    </div>
                    <h4>{p.title}</h4>
                    <p>{p.description}</p>
                    <div className="prayer-actions">
                      {p.status !== 'completed' && <button onClick={() => handleCompletePrayer(p.id)} className="btn-action success">Đánh dấu Hoàn tất</button>}
                      <button onClick={() => handleDeletePrayer(p.id)} className="btn-action danger">Xóa</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'users' && (
            <div className="admin-panel-card">
              <div className="panel-header"><h3>Danh sách Hồ sơ tín hữu</h3></div>
              <div className="table-container">
                <table className="admin-table">
                  <thead><tr><th>Họ và tên</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Ngày tham gia</th></tr></thead>
                  <tbody>
                    {profiles.map(u => (
                      <tr key={u.id}>
                        <td>{u.full_name}</td>
                        <td>{u.username || 'N/A'}</td>
                        <td>
                          <select value={u.role || 'Thành viên'} onChange={(e) => handleUpdateRole(u.id, e.target.value)} disabled={roleUpdating} className="role-select">
                            <option value="Thành viên">Thành viên</option>
                            <option value="Ban điều hành">Ban điều hành</option>
                            <option value="Quản trị">Quản trị</option>
                          </select>
                        </td>
                        <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Edit Modal Overlay */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Sửa bài viết</h2>
              <button onClick={() => setEditingItem(null)} className="btn-close"><X size={24} /></button>
            </div>
            <form onSubmit={handleUpdate} className="cms-form">
              <div className="form-group">
                <label>Tiêu đề</label>
                <input required value={editingItem?.title || ''} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
              </div>

              {editType === 'sermon' ? (
                <>
                  <div className="form-row">
                    <div className="form-group"><label>Người giảng</label><input required value={editingSermon.speaker || ''} onChange={e => setEditingItem({...editingSermon, speaker: e.target.value})} /></div>
                    <div className="form-group"><label>Loạt bài</label><input value={editingSermon.series || ''} onChange={e => setEditingItem({...editingSermon, series: e.target.value})} /></div>
                  </div>
                  <div className="form-group"><label>YouTube Link (chỉ sửa nếu đổi video)</label><input placeholder="Nhập đường dẫn YouTube mới..." value={editingSermon.youtube_url || ''} onChange={e => setEditingItem({...editingSermon, youtube_url: e.target.value})} /></div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Nội dung</label>
                    <ReactQuill theme="snow" modules={quillModules} value={editingNews.content || ''} onChange={val => setEditingItem({...editingNews, content: val})} className="quill-editor" />
                  </div>
                  {(editingNews.type === 'Sách Nói') && (
                    <div className="upload-box">
                      <div className="upload-info"><strong>Cập nhật Audio</strong><span>{editingNews.audio_url ? 'Đã có Audio' : 'Chưa có'}</span></div>
                      <label className="btn-upload">{uploading ? 'Đang tải...' : 'Tải File Mới'}<input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio', true)} disabled={uploading} hidden /></label>
                    </div>
                  )}
                  {(editingNews.type === 'Tài liệu') && (
                    <div className="upload-box">
                      <div className="upload-info"><strong>Cập nhật PDF</strong><span>{editingNews.pdf_url ? 'Đã có PDF' : 'Chưa có'}</span></div>
                      <label className="btn-upload">{uploading ? 'Đang tải...' : 'Tải File Mới'}<input type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdf', true)} disabled={uploading} hidden /></label>
                    </div>
                  )}
                  {(!['Sách Nói', 'Tài liệu', 'Dưỡng linh'].includes(editingNews.type)) && (
                    <div className="upload-box" style={{ flexWrap: 'wrap' }}>
                      <div className="upload-info"><strong>Cập nhật Ảnh</strong><span>{editingNews.image_url ? 'Đã có ảnh' : 'Chưa có'}</span></div>
                      <label className="btn-upload">{uploading ? 'Đang tải...' : 'Tải Ảnh Mới'}<input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image', true)} disabled={uploading} hidden /></label>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {editingNews.image_url && <img src={editingNews.image_url} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' }} />}
                    </div>
                  )}
                </>
              )}

              <button type="submit" className="btn-primary-solid" style={{ background: '#10B981', color: '#fff' }}><CheckCircle size={18} /> Lưu cập nhật</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
