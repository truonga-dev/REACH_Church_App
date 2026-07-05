'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard, Users, FileText, Heart, Plus, Trash2, Video,
  File, CheckCircle, Edit2, Headphones, BookOpen, X, LogOut,
  ArrowLeft, Lock, Shield, Search, Bell, RefreshCw, Newspaper,
  AlertTriangle, ChevronRight, TrendingUp, Eye, Calendar, Zap,
  Clock, Activity, Mail,
  Church, BookHeart, HandCoins, AudioLines, HeartHandshake, UsersRound, QrCode,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { POST_CONTENT_TYPES, POST_CATEGORIES } from '@/lib/post-categories';
import { parseCategories } from '@/lib/html-utils';
import PrayerReviewManager from '@/components/admin/PrayerReviewManager';
import DonationsManager from '@/components/admin/DonationsManager';
import SermonManager from '@/components/admin/SermonManager';
import DevotionalManager from '@/components/admin/DevotionalManager';
import EventsManager from '@/components/admin/EventsManager';
import MinistryManager from '@/components/admin/MinistryManager';
import UserManager from '@/components/admin/UserManager';
import CellGroupsManager from '@/components/admin/CellGroupsManager';
import StatsManager from '@/components/admin/StatsManager';
import LivestreamManager from '@/components/admin/LivestreamManager';
import NotificationsManager from '@/components/admin/NotificationsManager';
import Pagination from '@/components/ui/Pagination';
import { AdminPanelSkeleton, AdminTableSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessAdmin, hasPermission, TAB_PERMISSIONS, ROLE_DESCRIPTIONS, type UserRole } from '@/lib/permissions';
import './page.css';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
};

/* ── Types ── */
type Sermon = {
  id?: string;
  title: string;
  speaker?: string;
  series?: string;
  date?: string;
  youtube_url?: string;
  youtube_id?: string;
  content?: string;
  created_at?: string;
};

type NewsItem = {
  id?: string;
  title: string;
  type: string;
  content: string;
  image_url?: string;
  pdf_url?: string;
  audio_url?: string;
  categories?: string[] | string;
  status?: string;
  created_at?: string;
  author?: string;
};

type Prayer = {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  created_at?: string;
  author_name?: string;
  topic?: string;
  pray_count?: number;
};

type Profile = {
  id?: string;
  full_name?: string;
  username?: string;
  role?: string;
  email?: string;
  created_at?: string;
};

type ToastType = 'success' | 'error' | 'info' | 'warning';
type Toast = { id: string; type: ToastType; title: string; msg?: string };
type ConfirmState = { open: boolean; title: string; msg: string; onConfirm: () => void };

const TABS = [
  { id: 'overview',    label: 'Tổng quan',       icon: LayoutDashboard, group: null },
  { id: 'stats',       label: 'Thống kê',         icon: TrendingUp,      group: null },
  { id: 'news',        label: 'Tin tức',          icon: Newspaper,       group: 'NỘI DUNG' },
  { id: 'posts',       label: 'Bài viết',         icon: FileText,        group: 'NỘI DUNG' },
  { id: 'events',      label: 'Sự kiện',          icon: Calendar,        group: 'NỘI DUNG' },
  { id: 'livestreams', label: 'Livestream',       icon: Video,           group: 'NỘI DUNG' },
  { id: 'ministries',  label: 'Mục vụ',           icon: Church,          group: 'NỘI DUNG' },
  { id: 'cell_groups', label: 'Nhóm nhỏ',         icon: Users,           group: 'NỘI DUNG' },
  { id: 'sermons',     label: 'Bài giảng',        icon: Video,           group: 'THƯ VIỆN' },
  { id: 'audiobooks',  label: 'Sách Nói',         icon: AudioLines,      group: 'THƯ VIỆN' },
  { id: 'pdfs',        label: 'Sách PDF',         icon: File,            group: 'THƯ VIỆN' },
  { id: 'devotionals', label: 'Dưỡng Linh',       icon: BookHeart,       group: 'THƯ VIỆN' },
  { id: 'donations',   label: 'Dâng hiến',        icon: HandCoins,       group: 'CỘNG ĐỒNG' },
  { id: 'prayers',     label: 'Cầu nguyện',       icon: HeartHandshake,  group: 'CỘNG ĐỒNG' },
  { id: 'users',       label: 'Tín hữu',          icon: UsersRound,      group: 'CỘNG ĐỒNG' },
  { id: 'checkin',     label: 'Điểm danh QR',     icon: QrCode,          group: 'CỘNG ĐỒNG' },
  { id: 'notifications', label: 'Thông báo',      icon: Bell,            group: 'CỘNG ĐỒNG' },
];

const LIBRARY_TYPE_MAP: Record<string, string> = {
  audiobooks: 'Sách Nói',
  pdfs: 'Tài liệu',
  devotionals: 'Dưỡng linh',
};

const NEWS_TYPES = ['Bản tin', 'Thông báo', 'Sự kiện'];

const defaultSermon: Sermon = { title: '', speaker: '', series: '', date: '', youtube_url: '', content: '' };
const defaultNews: NewsItem = {
  title: '', type: 'Bài viết', content: '',
  image_url: '', pdf_url: '', audio_url: '',
  categories: [], status: 'published',
};

/* ════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════ */
export default function AdminPanel() {
  const { user, profile, loading: authLoading, signIn, signOut } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, []);

  /* Data */
  const [stats, setStats] = useState({ prayers: 0, sermons: 0, news: 0, profiles: 0, devotionals: 0, donations: 0 });
  const [, setSermons] = useState<Sermon[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [, setProfiles] = useState<Profile[]>([]);
  const [profilesPage, setProfilesPage] = useState(1);
  const [, setProfilesTotalPages] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const [newsTotalPages, setNewsTotalPages] = useState(1);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);  

  /* Forms */
  const [newSermon, setNewSermon] = useState<Sermon>({ ...defaultSermon });
  const [newNews, setNewNews] = useState<NewsItem>({ ...defaultNews });
  const [quillKey, setQuillKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Edit */
  const [editItem, setEditItem] = useState<Sermon | NewsItem | null>(null);
  const [editType, setEditType] = useState<'sermon' | 'news' | null>(null);
  
  /* Layout forms */
  const [showAudioForm, setShowAudioForm] = useState(false);
  const [showPdfForm, setShowPdfForm] = useState(false);

  /* UI */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: '', msg: '', onConfirm: () => {} });
  const [searchQuery, setSearchQuery] = useState('');
  const [panelSearch, setPanelSearch] = useState('');
  const [tabLoading, setTabLoading] = useState(false);

  /* ── Tab Switch Loading Effect ── */
  useEffect(() => {
    if (!authReady || !isAuth) return;
    setTabLoading(true);
    const t = setTimeout(() => setTabLoading(false), 400);
    return () => clearTimeout(t);
  }, [activeTab, authReady, isAuth]);

  /* ── Auth ── */
  useEffect(() => {
    if (!authLoading) {
      if (user && profile?.role && canAccessAdmin(profile.role)) {
        setIsAuth(true);
        setLoginError(false);
        setLoginErrorMsg('');
      } else if (user && profile && !canAccessAdmin(profile.role)) {
        // Logged in but insufficient role — reject and sign out
        setIsAuth(false);
        setLoginError(true);
        setLoginErrorMsg('Tài khoản không có quyền quản trị');
        signOut();
      } else {
        setIsAuth(false);
      }
      setAuthReady(true);
    }
  }, [user, profile, authLoading, signOut]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    setLoginErrorMsg('');

    const { error } = await signIn(email, password);
    if (error) {
      setLoginError(true);
      setLoginErrorMsg(error);
    }
    // Role check happens automatically in useEffect via AuthContext
    // canAccessAdmin(profile.role) gates setIsAuth(true)
  };

  const handleLogout = async () => {
    await signOut();
    setIsAuth(false);
  };

  /* ── Toast ── */
  const toast = useCallback((type: ToastType, title: string, msg?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  /* ── Confirm Dialog ── */
  const showConfirm = (title: string, msg: string, onConfirm: () => void) => {
    setConfirm({ open: true, title, msg, onConfirm });
  };

  /* ── Data fetchers ── */
  const fetchStats = useCallback(async () => {
    const [p, s, n, u, d, do_] = await Promise.all([
      supabase.from('prayers').select('*', { count: 'exact', head: true }),
      supabase.from('sermons').select('*', { count: 'exact', head: true }),
      supabase.from('news').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('devotionals').select('*', { count: 'exact', head: true }),
      supabase.from('donations').select('*', { count: 'exact', head: true }),
    ]);
    setStats({
      prayers: p.count || 0,
      sermons: s.count || 0,
      news: n.count || 0,
      profiles: u.count || 0,
      devotionals: d.count || 0,
      donations: do_.count || 0,
    });
  }, []);

  const fetchSermons = useCallback(async () => {
    const { data } = await supabase.from('sermons').select('*').order('created_at', { ascending: false });
    if (data) setSermons(data);
  }, []);

  const fetchNews = useCallback(async () => {
    const limit = 10;
    const offset = (newsPage - 1) * limit;
    
    let typeFilter = 'Bản tin';
    if (activeTab === 'posts') typeFilter = 'Bài viết';
    else if (activeTab === 'audiobooks') typeFilter = 'Sách Nói';
    else if (activeTab === 'pdfs') typeFilter = 'Tài liệu';

    const { data, count } = await supabase.from('news')
      .select('*', { count: 'exact' })
      .eq('type', typeFilter)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (data) {
      setNews(data.map(n => ({ ...n, categories: parseCategories(n.categories) })));
      setNewsTotalPages(Math.ceil((count || 0) / limit));
    }
  }, [newsPage, activeTab]);

  const fetchPrayers = useCallback(async () => {
    const { data } = await supabase.from('prayers').select('*').order('created_at', { ascending: false });
    if (data) setPrayers(data);
  }, []);

  const fetchProfiles = useCallback(async () => {
    const limit = 10;
    const offset = (profilesPage - 1) * limit;
    const { data, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (data) {
      setProfiles(data);
      setProfilesTotalPages(Math.ceil((count || 0) / limit));
    }
  }, [profilesPage]);

  const fetchRecentPosts = useCallback(async () => {
    const [{ data: nd }, { data: sd }] = await Promise.all([
      supabase.from('news').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('sermons').select('*').order('created_at', { ascending: false }).limit(3),
    ]);
    const combined = [
      ...(nd || []).map((i: any) => ({ ...i, _source: 'news' })),  
      ...(sd || []).map((i: any) => ({ ...i, _source: 'sermon' })),  
    ].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).slice(0, 6);
    setRecentPosts(combined);
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    fetchStats();
    fetchRecentPosts();
  }, [isAuth, fetchStats, fetchRecentPosts]);

  useEffect(() => {
    if (!isAuth) return;
    setPanelSearch('');
    if (['audiobooks', 'pdfs', 'devotionals', 'posts', 'news'].includes(activeTab)) {
      setNewsPage(1);
    }
    if (activeTab === 'users') {
      setProfilesPage(1);
    }
  }, [activeTab, isAuth]);

  useEffect(() => {
    if (!isAuth) return;
    if (activeTab === 'sermons') fetchSermons();
    else if (['audiobooks', 'pdfs', 'devotionals', 'posts', 'news'].includes(activeTab)) {
      fetchNews();
    }
    else if (activeTab === 'prayers') fetchPrayers();
    else if (activeTab === 'users') fetchProfiles();
  }, [activeTab, isAuth, profilesPage, newsPage, fetchProfiles, fetchNews, fetchSermons, fetchPrayers]);

  useEffect(() => {
    if (!isAuth) return;
    setNewSermon({ ...defaultSermon });
    const libType = LIBRARY_TYPE_MAP[activeTab];
    if (activeTab === 'posts') setNewNews({ ...defaultNews, type: 'Bài viết' });
    else if (activeTab === 'news') setNewNews({ ...defaultNews, type: 'Bản tin' });
    else if (libType) setNewNews({ ...defaultNews, type: libType });
    setQuillKey(k => k + 1);
  }, [activeTab, isAuth]);

  /* ── Helpers ── */
  const extractYtId = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|v\/|watch\?v=|&v=)([^#&?]{11})/);
    return m ? m[1] : url;
  };

  const fmtDate = (v?: string) => {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filterBySearch = <T extends { title?: string }>(list: T[], q: string) =>
    q ? list.filter(i => i.title?.toLowerCase().includes(q.toLowerCase())) : list;

  const getNewsForTab = (types: string[]) => news.filter(n => n?.type && types.includes(n.type));

  /* ── File Upload ── */
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'image_url' | 'pdf_url' | 'audio_url',
    isEdit = false,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast('error', 'File quá lớn', 'Tối đa 10MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    try {
      const { error } = await supabase.storage.from('uploads').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
      if (isEdit) setEditItem(prev => prev ? { ...prev, [field]: publicUrl } : prev);
      else setNewNews(prev => ({ ...prev, [field]: publicUrl }));
      toast('success', 'Tải lên thành công');
    } catch (err: any) {  
      toast('error', 'Lỗi upload', err.message);
    } finally {
      setUploading(false);
    }
  };

  /* ── CRUD: Sermon ── */

  /* ── CRUD: News ── */
  const handleAddNews = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: newNews.title,
        type,
        content: newNews.content,
        image_url: newNews.image_url || '',
        pdf_url: type === 'Tài liệu' ? newNews.pdf_url : '',
        audio_url: type === 'Sách Nói' ? newNews.audio_url : '',
        categories: JSON.stringify(newNews.categories || []),
        status: newNews.status || 'published',
      };
      const { error } = await supabase.from('news').insert([payload]);
      
      if (!error && payload.status === 'published') {
        try {
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `REACH: ${payload.type}`,
              message: payload.title,
              url: `${window.location.origin}/news`,
            }),
          });
        } catch (e) {
          console.error('Failed to trigger notification', e);
        }
      }
      if (error) throw error;

      if (payload.status === 'published') {
        fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `REACH Church: ${type} mới`,
            message: payload.title,
            url: `${window.location.origin}/news`,
          })
        }).catch(e => console.error('Push notification failed:', e));
      }

      toast('success', 'Đã đăng bài thành công');
      setNewNews({ ...defaultNews, type });
      setQuillKey(k => k + 1);
      fetchNews();
      fetchStats();
      fetchRecentPosts();
    } catch (err: any) { toast('error', 'Lỗi đăng bài', err.message); }  
    finally { setSaving(false); }
  };

  const handleDeleteNews = (id?: string) => {
    if (!id) return;
    showConfirm('Xóa bài viết?', 'Thao tác này không thể hoàn tác.', async () => {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) { toast('error', 'Lỗi xóa', error.message); return; }
      setNews(prev => prev.filter(n => n.id !== id));
      toast('success', 'Đã xóa bài viết');
      fetchStats();
    });
  };

  /* ── CRUD: Edit (both) ── */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    try {
      if (editType === 'sermon') {
        const s = editItem as Sermon;
        const { error } = await supabase.from('sermons').update({
          title: s.title, speaker: s.speaker, series: s.series, date: s.date,
          youtube_url: s.youtube_url, youtube_id: extractYtId(s.youtube_url || ''),
          content: s.content || '',
        }).eq('id', s.id);
        if (error) throw error;
        setSermons(prev => prev.map(x => x.id === s.id ? { ...x, ...s } : x));
      } else {
        const n = editItem as NewsItem;
        const { error } = await supabase.from('news').update({
          title: n.title, type: n.type, content: n.content,
          image_url: n.image_url, pdf_url: n.pdf_url, audio_url: n.audio_url,
          categories: JSON.stringify(parseCategories(n.categories)),
          status: n.status || 'published',
        }).eq('id', n.id);
        
        if (!error && n.status === 'published') {
          try {
            fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: `REACH: ${n.type}`,
                message: n.title,
                url: `${window.location.origin}/news`,
              }),
            });
          } catch (e) {
            console.error('Failed to trigger notification', e);
          }
        }
        if (error) throw error;
        setNews(prev => prev.map(x => x.id === n.id ? { ...x, ...n } : x));
      }
      toast('success', 'Cập nhật thành công');
      setEditItem(null);
      fetchRecentPosts();
      fetchStats();
    } catch (err: any) { toast('error', 'Lỗi cập nhật', err.message); }  
    finally { setSaving(false); }
  };

  /* ── CRUD: Role ── */
/* ════════════════════════════════════════
   RENDER HELPERS (OUTSIDE)
   ════════════════════════════════════════ */

const StatusBadge = ({ status }: { status?: string }) => (
  <span className={`data-item-badge ${status === 'draft' ? 'badge-draft' : 'badge-published'}`}>
    {status === 'draft' ? '📝 Nháp' : '✅ Xuất bản'}
  </span>
);

const DataItem = ({
  title, sub, status, onEdit, onDelete, thumb,
}: {
  title: string; sub?: string; status?: string;
  onEdit?: () => void; onDelete?: () => void; thumb?: string;
}) => (
  <div className="data-item">
    {thumb && <Image src={thumb} alt="" className="news-thumb" width={100} height={100} unoptimized />}
    <div className="data-item-info">
      <p className="data-item-title">{title}</p>
      {sub && <p className="data-item-sub">{sub}</p>}
    </div>
    {status !== undefined && <StatusBadge status={status} />}
    <div className="data-item-actions">
      {onEdit && (
        <button className="btn-icon edit" onClick={onEdit} title="Sửa">
          <Edit2 size={14} />
        </button>
      )}
      {onDelete && (
        <button className="btn-icon danger" onClick={onDelete} title="Xóa">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  </div>
);

  /* ── Sermon form ── */
  const renderSermonForm = ({ isEdit = false }: { isEdit?: boolean } = {}) => {
    const data = isEdit ? (editItem as Sermon) : newSermon;
    const set = isEdit
      ? (k: string, v: string) => setEditItem(prev => prev ? { ...prev, [k]: v } : prev)
      : (k: string, v: string) => setNewSermon(prev => ({ ...prev, [k]: v }));

    return (
      <>
        <div className="form-group">
          <label className="form-label">Tiêu đề bài giảng *</label>
          <input className="form-input" required placeholder="VD: Chúa Jesus là câu trả lời"
            value={data?.title || ''} onChange={e => set('title', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Người giảng *</label>
            <input className="form-input" required placeholder="Mục sư Tín"
              value={(data as Sermon)?.speaker || ''} onChange={e => set('speaker', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Loạt bài</label>
            <input className="form-input" placeholder="Tin Lành Giăng"
              value={(data as Sermon)?.series || ''} onChange={e => set('series', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ngày giảng *</label>
            <input className="form-input" type="date"
              value={(data as Sermon)?.date || ''} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Link YouTube</label>
            <input className="form-input" placeholder="https://youtube.com/watch?v=..."
              value={(data as Sermon)?.youtube_url || ''} onChange={e => set('youtube_url', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Nội dung / Tóm tắt</label>
          <ReactQuill key={`sermon-${quillKey}-${isEdit}`} theme="snow" modules={quillModules}
            value={(data as Sermon)?.content || ''}
            onChange={val => set('content', val)}
            placeholder="Tóm tắt bài giảng..." />
        </div>
      </>
    );
  };

  /* ── News/Library form ── */
  const renderNewsForm = ({
    type, isEdit = false, showImg = false, showPdf = false, showAudio = false,
    showCats = false, showCustomCats = false, showTypeSelect = false,
  }: {
    type: string; isEdit?: boolean; showImg?: boolean; showPdf?: boolean;
    showAudio?: boolean; showCats?: boolean; showCustomCats?: boolean; showTypeSelect?: boolean;
  }) => {
    const data = isEdit ? (editItem as NewsItem) : newNews;
    const set = isEdit
      ? (k: string, v: any) => setEditItem(prev => prev ? { ...prev, [k]: v } : prev)  
      : (k: string, v: any) => setNewNews(prev => ({ ...prev, [k]: v }));  
    const cats = parseCategories(data?.categories);

    return (
      <>
        <div className="form-group">
          <label className="form-label">Tiêu đề *</label>
          <input className="form-input" required placeholder="Nhập tiêu đề..."
            value={data?.title || ''} onChange={e => set('title', e.target.value)} />
        </div>

        {showTypeSelect && (
          <div className="form-group">
            <label className="form-label">Loại bài viết</label>
            <select className="form-select" value={data?.type || type}
              onChange={e => set('type', e.target.value)}>
              {NEWS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Trạng thái</label>
          <div className="status-toggle">
            <button type="button" className={`status-btn ${data?.status !== 'draft' ? 'active-published' : ''}`}
              onClick={() => set('status', 'published')}>
              <CheckCircle size={14} /> Xuất bản
            </button>
            <button type="button" className={`status-btn ${data?.status === 'draft' ? 'active-draft' : ''}`}
              onClick={() => set('status', 'draft')}>
              <Clock size={14} /> Lưu nháp
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nội dung *</label>
          <ReactQuill key={`news-${quillKey}-${type}-${isEdit}`} theme="snow" modules={quillModules}
            value={data?.content || ''}
            onChange={val => set('content', val)}
            placeholder="Nhập nội dung bài viết..." />
        </div>

        {showImg && (
          <div>
            <div className="upload-box">
              <div className="upload-box-icon"><Eye size={20} style={{ color: '#48bce1' }} /></div>
              <div className="upload-box-info">
                <strong>Ảnh đại diện</strong>
                <span>{data?.image_url ? '✅ Đã tải lên' : 'Chưa có ảnh'}</span>
              </div>
              <label className="btn-upload">
                {uploading ? 'Đang tải...' : 'Chọn ảnh'}
                <input type="file" accept="image/*" hidden
                  onChange={e => handleFileUpload(e, 'image_url', isEdit)} disabled={uploading} />
              </label>
            </div>
            {data?.image_url && (
               
              <img src={data.image_url} alt="Preview" className="img-preview" />
            )}
          </div>
        )}

        {showAudio && (
          <div className="upload-box">
            <div className="upload-box-icon"><Headphones size={20} style={{ color: '#f4cc30' }} /></div>
            <div className="upload-box-info">
              <strong>File Audio (MP3)</strong>
              <span>{data?.audio_url ? '✅ Đã tải lên' : 'Chưa có audio'}</span>
            </div>
            <label className="btn-upload">
              {uploading ? 'Đang tải...' : 'Chọn audio'}
              <input type="file" accept="audio/*" hidden
                onChange={e => handleFileUpload(e, 'audio_url', isEdit)} disabled={uploading} />
            </label>
          </div>
        )}

        {showPdf && (
          <div className="upload-box">
            <div className="upload-box-icon"><FileText size={20} style={{ color: '#ef4444' }} /></div>
            <div className="upload-box-info">
              <strong>File PDF</strong>
              <span>{data?.pdf_url ? '✅ Đã tải lên' : 'Chưa có PDF'}</span>
            </div>
            <label className="btn-upload">
              {uploading ? 'Đang tải...' : 'Chọn PDF'}
              <input type="file" accept="application/pdf" hidden
                onChange={e => handleFileUpload(e, 'pdf_url', isEdit)} disabled={uploading} />
            </label>
          </div>
        )}

        {showCats && (
          <div className="form-group">
            <label className="form-label">Danh mục</label>
            <div className="category-grid">
              {POST_CATEGORIES.map(cat => {
                const checked = cats.includes(cat);
                return (
                  <label key={cat} className={`cat-check-label ${checked ? 'checked' : ''}`}>
                    <input type="checkbox" checked={checked}
                      onChange={() => {
                        const next = checked ? cats.filter(c => c !== cat) : [...cats, cat];
                        set('categories', next);
                      }} />
                    {cat}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {showCustomCats && (
          <div className="form-group">
            <label className="form-label">Chủ đề (cách nhau bởi dấu phẩy)</label>
            <input className="form-input" placeholder="VD: Gia đình, Đức tin, Tình yêu..."
              value={Array.isArray(data?.categories) ? data.categories.join(', ') : (data?.categories || '')}
              onChange={e => {
                const parts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                set('categories', parts);
              }} />
          </div>
        )}
      </>
    );
  };

  /* ════════════════════════════════════════
     LOADING / LOGIN
     ════════════════════════════════════════ */
  if (!authReady) {
    return <AdminPanelSkeleton />;
  }

  if (!isAuth) {
    return (
      <div className="admin-root">
        <div className="admin-login-wrap">
          <Link href="/" className="admin-login-back">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
          <div className="login-card">
            <div className="login-logo-ring">
              <Image src="/logo.png" alt="REACH Admin" width={70} height={70} />
            </div>
            <span className="login-badge"><Shield size={13} /> Ban điều hành</span>
            <h2>REACH Admin</h2>
            <p>Đăng nhập hệ thống quản trị nội dung hội thánh</p>
            <div className="login-divider" />
            <form onSubmit={handleLogin} className="login-form">
              <div>
                <label className="login-form-label" htmlFor="email">Email</label>
                <div className="login-input-wrap">
                  <Mail size={16} className="login-input-icon" />
                  <input id="email" type="email" placeholder="reachchurch2017@gmail.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className={loginError ? 'input-error' : ''} required />
                </div>
              </div>
              <div>
                <label className="login-form-label" htmlFor="pwd">Mật khẩu</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input id="pwd" type="password" placeholder="••••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className={loginError ? 'input-error' : ''} required />
                </div>
              </div>
              {loginError && (
                <p className="login-error-msg"><AlertTriangle size={14} /> {loginErrorMsg || 'Email hoặc mật khẩu không chính xác!'}</p>
              )}
              <button type="submit" className="btn-login">
                <Shield size={17} /> Vào bảng điều khiển
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── Filter helpers ── */


  const tabBadge = (id: string) => {
    const m: Record<string, number> = {
      sermons: stats.sermons, news: stats.news, prayers: stats.prayers,
      users: stats.profiles, posts: stats.news, audiobooks: stats.news,
      devotionals: stats.devotionals, donations: stats.donations,
    };
    return m[id] || 0;
  };

  const getPosts = () => getNewsForTab([...POST_CONTENT_TYPES]);
  const newsItems = getNewsForTab(NEWS_TYPES);
  const audioItems = getNewsForTab(['Sách Nói']);
  const pdfItems = getNewsForTab(['Tài liệu']);
  /* group nav */
  const groups = ['NỘI DUNG', 'THƯ VIỆN', 'CỘNG ĐỒNG'];

  /**
   * effectiveRole: nếu đã xác thực mà profile chưa load hoặc role chưa set
   * (bypass login bằng env credentials), mặc định coi là Quản trị viên
   */
  const effectiveRole: string = profile?.role || (isAuth ? 'Quản trị viên' : '');

  const toastIcons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} />,
    error: <AlertTriangle size={18} />,
    info: <Bell size={18} />,
    warning: <AlertTriangle size={18} />,
  };

  /* ════════════════════════════════════════
     MAIN RENDER
     ════════════════════════════════════════ */
  return (
    <div className="admin-root">
      {/* ── Toast Container ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-icon">{toastIcons[t.type]}</span>
            <div className="toast-body">
              <p className="toast-title">{t.title}</p>
              {t.msg && <p className="toast-msg">{t.msg}</p>}
            </div>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Confirm Modal ── */}
      {confirm.open && (
        <div className="confirm-overlay" onClick={() => setConfirm(c => ({ ...c, open: false }))}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon-wrap"><AlertTriangle size={26} /></div>
            <h3>{confirm.title}</h3>
            <p>{confirm.msg}</p>
            <div className="confirm-actions">
              <button className="btn-confirm-cancel"
                onClick={() => setConfirm(c => ({ ...c, open: false }))}>
                Hủy
              </button>
              <button className="btn-confirm-ok" onClick={() => {
                confirm.onConfirm();
                setConfirm(c => ({ ...c, open: false }));
              }}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="admin-modal">
            <div className="admin-modal-content">
              <div className="modal-header">
                <h3>Sửa {editType === 'sermon' ? 'Bài giảng' : 'Bài viết'}</h3>
                <button className="btn-close" onClick={() => setEditItem(null)}><X size={20} /></button>
              </div>
              <form className="cms-form modal-body" onSubmit={handleUpdate}>
                {editType === 'sermon' ? (
                  renderSermonForm({ isEdit: true })
                ) : (
                  renderNewsForm({
                    type: (editItem as NewsItem).type || 'Bài viết',
                    isEdit: true,
                    showImg: ['Bài viết', 'Tin tức', 'Bản tin', 'Thông báo', 'Sự kiện'].includes((editItem as NewsItem).type || ''),
                    showCats: ['Bài viết', 'Tin tức', 'Bản tin', 'Thông báo', 'Sự kiện'].includes((editItem as NewsItem).type || ''),
                    showTypeSelect: ['Bài viết', 'Tin tức', 'Bản tin', 'Thông báo', 'Sự kiện'].includes((editItem as NewsItem).type || ''),
                    showPdf: (editItem as NewsItem).type === 'Tài liệu',
                    showAudio: (editItem as NewsItem).type === 'Sách Nói',
                    showCustomCats: ['Tài liệu', 'Sách Nói'].includes((editItem as NewsItem).type || ''),
                  })
                )}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditItem(null)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn-submit" disabled={saving || uploading}>
                    <CheckCircle size={16} /> Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="admin-layout">
        {/* ════════════════ SIDEBAR ════════════════ */}
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo-ring">
              <Image src="/logo.png" alt="REACH" width={36} height={36} />
            </div>
            <div>
              <p className="sidebar-brand-name">REACH Admin</p>
              <p className="sidebar-brand-sub">Hệ thống quản trị</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {/* Overview & Stats - luôn hiện nếu đã xác thực */}
            {hasPermission(effectiveRole, 'stats:view') && (
              <>
                <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}>
                  <LayoutDashboard size={18} /> Tổng quan
                </button>
                <button className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}>
                  <TrendingUp size={18} /> Thống kê
                </button>
              </>
            )}

            {groups.map(group => {
              const visibleTabs = TABS.filter(t =>
                t.group === group &&
                hasPermission(effectiveRole, TAB_PERMISSIONS[t.id])
              );
              if (visibleTabs.length === 0) return null;
              return (
                <div key={group}>
                  <div className="nav-group-label">{group}</div>
                  {visibleTabs.map(t => (
                    <button key={t.id}
                      className={`nav-item ${activeTab === t.id ? 'active' : ''}`}
                      onClick={() => {
                        if (t.id === 'checkin') {
                          window.location.href = '/admin/check-in';
                        } else {
                          setActiveTab(t.id);
                        }
                      }}>
                      <t.icon size={18} />
                      {t.label}
                      {tabBadge(t.id) > 0 && (
                        <span className="nav-badge">{tabBadge(t.id)}</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            {/* Role badge */}
            {profile?.role && (() => {
              const rd = ROLE_DESCRIPTIONS[profile.role as UserRole];
              return rd ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '8px',
                  background: rd.bg, marginBottom: '10px',
                }}>
                  <span style={{ fontSize: '1rem' }}>{rd.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: rd.color, fontWeight: 700 }}>{rd.label}</p>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile.full_name || 'Admin'}
                    </p>
                  </div>
                </div>
              ) : null;
            })()}
            <button className="btn-sidebar-logout" onClick={handleLogout}>
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </aside>

        {/* ════════════════ MAIN ════════════════ */}
        <main className="admin-main">
          {/* Topbar */}
          <header className="admin-topbar">
            <div className="topbar-left">
              <h1>{TABS.find(t => t.id === activeTab)?.label || 'Tổng quan'}</h1>
              <div className="topbar-breadcrumb">
                Dashboard / {TABS.find(t => t.id === activeTab)?.label || 'Tổng quan'}
              </div>
            </div>
            <div className="topbar-search">
              <Search size={15} />
              <input placeholder="Tìm bài viết, bài giảng..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="topbar-right">
              <button className="topbar-icon-btn" title="Làm mới" onClick={() => {
                fetchStats(); fetchRecentPosts();
                toast('info', 'Đã làm mới dữ liệu');
              }}>
                <RefreshCw size={16} />
              </button>
              <div className="topbar-admin-pill">
                <div className="avatar-dot">
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : 'A'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                    {profile?.full_name || 'Admin'}
                  </span>
                  {effectiveRole && ROLE_DESCRIPTIONS[effectiveRole as UserRole] && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: ROLE_DESCRIPTIONS[effectiveRole as UserRole].color,
                      fontWeight: 600,
                    }}>
                      {ROLE_DESCRIPTIONS[effectiveRole as UserRole].icon} {effectiveRole}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="admin-content">
            {tabLoading ? (
              <div style={{ padding: '0 10px' }}>
                <AdminTableSkeleton rows={6} />
              </div>
            ) : (
              <>
                {/* ─── OVERVIEW ─── */}
                {activeTab === 'overview' && (
              <div className="tab-page">
                {/* Stats */}
                <div className="stats-grid">
                  {[
                    { icon: <Users size={22} />, label: 'Tín hữu', value: stats.profiles, color: 'blue', trend: '+2 tuần này' },
                    { icon: <Video size={22} />,  label: 'Bài giảng', value: stats.sermons,  color: 'yellow' },
                    { icon: <Heart size={22} />,  label: 'Cầu nguyện', value: stats.prayers, color: 'red' },
                    { icon: <Newspaper size={22} />, label: 'Tin tức & Nội dung', value: stats.news, color: 'green' },
                    { icon: <BookOpen size={22} />, label: 'Dưỡng linh', value: stats.devotionals, color: 'purple' },
                  ].map(s => (
                    <div key={s.label} className={`stat-card ${s.color}`}>
                      <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                      <div className="stat-info">
                        <span className="stat-label">{s.label}</span>
                        <span className="stat-value">{s.value}</span>
                        {s.trend && <span className="stat-trend"><TrendingUp size={11} /> {s.trend}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                  {[
                    { icon: '🎤', label: 'Thêm bài giảng', tab: 'sermons', color: '#f4cc30' },
                    { icon: '📰', label: 'Đăng tin tức',  tab: 'news',    color: '#48bce1' },
                    { icon: '✍️', label: 'Bài viết mới',  tab: 'posts',   color: '#8b5cf6' },
                    { icon: '📖', label: 'Thêm dưỡng linh', tab: 'devotionals', color: '#10b981' },
                    { icon: '🙏', label: 'Xem cầu nguyện', tab: 'prayers', color: '#ef4444' },
                    { icon: '👥', label: 'Quản lý tín hữu', tab: 'users',  color: '#f59e0b' },
                  ].map(a => (
                    <button key={a.tab} className="quick-action-btn" onClick={() => setActiveTab(a.tab)}>
                      <div className="qa-icon" style={{ background: `${a.color}18`, fontSize: '1.4rem' }}>
                        {a.icon}
                      </div>
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>

                {/* Grid: recent + quick stats */}
                <div className="overview-grid">
                  <div className="section-card">
                    <div className="section-card-header">
                      <h3><Activity size={16} /> Nội dung mới nhất</h3>
                      <button className="see-all-link" onClick={() => setActiveTab('news')}>
                        Xem tất cả <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="recent-list">
                      {recentPosts.length === 0 ? (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>
                          <p>Chưa có nội dung nào</p>
                        </div>
                      ) : recentPosts.map((p, i) => {
                        const isSermon = p._source === 'sermon';
                        const dotColor = isSermon ? '#f4cc30' : '#48bce1';
                        return (
                          <div key={i} className="recent-post-row">
                            <div className="rp-type-dot" style={{ background: dotColor }} />
                            <div className="rp-info">
                              <p className="rp-title">{p.title}</p>
                              <p className="rp-meta">
                                <span className="rp-badge" style={{
                                  background: isSermon ? 'rgba(244,204,48,0.12)' : 'rgba(72,188,225,0.12)',
                                  color: dotColor,
                                }}>
                                  {isSermon ? 'Bài giảng' : p.type}
                                </span>
                                {fmtDate(p.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="section-card">
                    <div className="section-card-header">
                      <h3><Zap size={16} /> Thống kê nhanh</h3>
                    </div>
                    <div className="quick-stats-list">
                      {[
                        { icon: <Video size={15} />, label: 'Bài giảng', val: stats.sermons },
                        { icon: <Heart size={15} />, label: 'Cầu nguyện đang mở', val: prayers.filter(p => p.status !== 'answered').length || stats.prayers },
                        { icon: <Users size={15} />, label: 'Tín hữu đăng ký', val: stats.profiles },
                        { icon: <BookOpen size={15} />, label: 'Bài dưỡng linh', val: stats.devotionals },
                        { icon: <Newspaper size={15} />, label: 'Tổng nội dung', val: stats.news },
                      ].map(s => (
                        <div key={s.label} className="qs-row">
                          <span className="qs-label">{s.icon} {s.label}</span>
                          <span className="qs-value">{s.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STATS TAB ─── */}
            {activeTab === 'stats' && (
              <div className="tab-page">
                <StatsManager />
              </div>
            )}

            {/* ─── NEWS TAB ─── */}
            {activeTab === 'news' && (
              <div className="panel-grid tab-page">
                <div className="panel-card">
                  <div className="panel-card-header">
                    <h3>Đăng tin tức mới</h3>
                  </div>
                  <form className="cms-form" onSubmit={e => handleAddNews(e, newNews.type || 'Bản tin')}>
                    {renderNewsForm({ type: newNews.type || 'Bản tin', showImg: true, showCats: true, showTypeSelect: true })}
                    <button type="submit" className="btn-submit" disabled={saving || uploading}>
                      <Plus size={17} /> {saving ? 'Đang đăng...' : 'Xuất bản tin tức'}
                    </button>
                  </form>
                </div>
                <div className="panel-card">
                  <div className="panel-card-header">
                    <h3>Danh sách tin tức</h3>
                    <span className="panel-card-count">{newsItems.length}</span>
                  </div>
                  <div className="panel-search">
                    <Search size={14} />
                    <input placeholder="Tìm tin tức..." value={panelSearch}
                      onChange={e => setPanelSearch(e.target.value)} />
                  </div>
                  <div className="data-list">
                    {filterBySearch(newsItems, panelSearch).length === 0 ? (
                      <div className="empty-state"><p>Không tìm thấy</p></div>
                    ) : filterBySearch(newsItems, panelSearch).map(n => (
                      <DataItem key={n.id} title={n.title} sub={`${n.type} • ${fmtDate(n.created_at)}`}
                        status={n.status} thumb={n.image_url}
                        onEdit={() => { setEditItem({ ...n }); setEditType('news'); }}
                        onDelete={() => handleDeleteNews(n.id)} />
                    ))}
                  </div>
                  {newsTotalPages > 0 && (
                    <Pagination 
                      currentPage={newsPage} 
                      totalPages={newsTotalPages} 
                      onPageChange={setNewsPage} 
                    />
                  )}
                </div>
              </div>
            )}

            {/* ─── POSTS TAB ─── */}
            {activeTab === 'posts' && (
              <div className="panel-grid tab-page">
                <div className="panel-card">
                  <div className="panel-card-header"><h3>Thêm bài viết mới</h3></div>
                  <form className="cms-form" onSubmit={e => handleAddNews(e, newNews.type || 'Bài viết')}>
                    {renderNewsForm({ type: newNews.type || 'Bài viết', showImg: true, showCats: true, showTypeSelect: true })}
                    <button type="submit" className="btn-submit" disabled={saving || uploading}>
                      <Plus size={17} /> {saving ? 'Đang đăng...' : 'Xuất bản bài viết'}
                    </button>
                  </form>
                </div>
                <div className="panel-card">
                  <div className="panel-card-header">
                    <h3>Danh sách bài viết</h3>
                    <span className="panel-card-count">{getPosts().length}</span>
                  </div>
                  <div className="panel-search">
                    <Search size={14} />
                    <input placeholder="Tìm bài viết..." value={panelSearch}
                      onChange={e => setPanelSearch(e.target.value)} />
                  </div>
                  <div className="data-list">
                    {filterBySearch(getPosts(), panelSearch).map(n => (
                      <DataItem key={n.id} title={n.title}
                        sub={`${n.type} • ${fmtDate(n.created_at)}`}
                        status={n.status} thumb={n.image_url}
                        onEdit={() => { setEditItem({ ...n }); setEditType('news'); }}
                        onDelete={() => handleDeleteNews(n.id)} />
                    ))}
                  </div>
                  {newsTotalPages > 0 && (
                    <Pagination 
                      currentPage={newsPage} 
                      totalPages={newsTotalPages} 
                      onPageChange={setNewsPage} 
                    />
                  )}
                </div>
              </div>
            )}

            {/* ─── EVENTS TAB ─── */}
            {activeTab === 'events' && (
              <div className="tab-page">
                <EventsManager />
              </div>
            )}

            {/* ─── LIVESTREAMS TAB ─── */}
            {activeTab === 'livestreams' && (
              <div className="tab-page">
                <LivestreamManager />
              </div>
            )}

            {/* ─── MINISTRIES TAB ─── */}
            {activeTab === 'ministries' && (
              <div className="tab-page">
                <MinistryManager />
              </div>
            )}

            {/* ─── CELL GROUPS TAB ─── */}
            {activeTab === 'cell_groups' && (
              <div className="tab-page">
                <CellGroupsManager />
              </div>
            )}

            {/* ─── SERMONS TAB ─── */}
            {activeTab === 'sermons' && (
              <div className="tab-page">
                <SermonManager />
              </div>
            )}

            {/* ─── AUDIOBOOKS ─── */}
            {activeTab === 'audiobooks' && (
              <div className="tab-page">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                      Quản lý Sách Nói
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
                      Thêm, sửa và quản lý thư viện sách nói
                    </p>
                  </div>
                  {!showAudioForm && (
                    <button
                      className="btn-submit"
                      style={{ width: 'auto', padding: '0.6rem 1.1rem' }}
                      onClick={() => { setShowAudioForm(true); setNewNews({ type: 'Sách Nói' } as NewsItem); }}
                    >
                      <Plus size={17} /> Thêm sách nói
                    </button>
                  )}
                </div>

                {showAudioForm && (
                  <div className="section-card" style={{ marginBottom: '1.25rem' }}>
                    <div className="section-card-header">
                      <h3>{editItem ? <><Edit2 size={15} /> Sửa Sách Nói</> : <><Plus size={15} /> Thêm Sách Nói</>}</h3>
                      <button onClick={() => { setShowAudioForm(false); setEditItem(null); setEditType(null); }} className="btn-icon danger" title="Đóng">
                        <X size={16} />
                      </button>
                    </div>
                    <form className="cms-form" onSubmit={async e => {
                      await handleAddNews(e, 'Sách Nói');
                      if (!saving && !uploading) setShowAudioForm(false);
                    }}>
                      {renderNewsForm({ type: 'Sách Nói', showAudio: true, showCustomCats: true })}
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn-submit" style={{ width: 'auto', padding: '0.65rem 1.5rem' }} disabled={saving || uploading}>
                          <Plus size={17} /> {saving ? 'Đang lưu...' : 'Lưu sách nói'}
                        </button>
                        <button type="button" onClick={() => { setShowAudioForm(false); setEditItem(null); setEditType(null); }} style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.65rem 1.1rem', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600
                        }}>
                          <X size={16} /> Hủy
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="section-card">
                  <div className="section-card-header">
                    <h3>Danh sách sách nói</h3>
                    <span className="panel-card-count">{audioItems.length}</span>
                  </div>
                  <div className="panel-search">
                    <Search size={14} />
                    <input placeholder="Tìm kiếm sách nói..." value={panelSearch}
                      onChange={e => setPanelSearch(e.target.value)} />
                  </div>
                  <div className="data-list">
                    {filterBySearch(audioItems, panelSearch).map(n => (
                      <DataItem key={n.id} title={n.title} sub={fmtDate(n.created_at)}
                        onEdit={() => { setEditItem({ ...n }); setEditType('news'); setShowAudioForm(true); }}
                        onDelete={() => handleDeleteNews(n.id)} />
                    ))}
                  </div>
                  {newsTotalPages > 0 && (
                    <Pagination 
                      currentPage={newsPage} 
                      totalPages={newsTotalPages} 
                      onPageChange={setNewsPage} 
                    />
                  )}
                </div>
              </div>
            )}

            {/* ─── PDFS ─── */}
            {activeTab === 'pdfs' && (
              <div className="tab-page">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                      Quản lý Sách PDF
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
                      Thêm, sửa và quản lý thư viện tài liệu PDF
                    </p>
                  </div>
                  {!showPdfForm && (
                    <button
                      className="btn-submit"
                      style={{ width: 'auto', padding: '0.6rem 1.1rem' }}
                      onClick={() => { setShowPdfForm(true); setNewNews({ type: 'Tài liệu' } as NewsItem); }}
                    >
                      <Plus size={17} /> Thêm tài liệu
                    </button>
                  )}
                </div>

                {showPdfForm && (
                  <div className="section-card" style={{ marginBottom: '1.25rem' }}>
                    <div className="section-card-header">
                      <h3>{editItem ? <><Edit2 size={15} /> Sửa Sách PDF</> : <><Plus size={15} /> Thêm Sách PDF</>}</h3>
                      <button onClick={() => { setShowPdfForm(false); setEditItem(null); setEditType(null); }} className="btn-icon danger" title="Đóng">
                        <X size={16} />
                      </button>
                    </div>
                    <form className="cms-form" onSubmit={async e => {
                      await handleAddNews(e, 'Tài liệu');
                      if (!saving && !uploading) setShowPdfForm(false);
                    }}>
                      {renderNewsForm({ type: 'Tài liệu', showPdf: true, showCustomCats: true })}
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn-submit" style={{ width: 'auto', padding: '0.65rem 1.5rem' }} disabled={saving || uploading}>
                          <Plus size={17} /> {saving ? 'Đang lưu...' : 'Lưu tài liệu'}
                        </button>
                        <button type="button" onClick={() => { setShowPdfForm(false); setEditItem(null); setEditType(null); }} style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.65rem 1.1rem', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600
                        }}>
                          <X size={16} /> Hủy
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="section-card">
                  <div className="section-card-header">
                    <h3>Danh sách PDF</h3>
                    <span className="panel-card-count">{pdfItems.length}</span>
                  </div>
                  <div className="panel-search">
                    <Search size={14} />
                    <input placeholder="Tìm kiếm tài liệu PDF..." value={panelSearch}
                      onChange={e => setPanelSearch(e.target.value)} />
                  </div>
                  <div className="data-list">
                    {filterBySearch(pdfItems, panelSearch).map(n => (
                      <DataItem key={n.id} title={n.title} sub={fmtDate(n.created_at)}
                        onEdit={() => { setEditItem({ ...n }); setEditType('news'); setShowPdfForm(true); }}
                        onDelete={() => handleDeleteNews(n.id)} />
                    ))}
                  </div>
                  {newsTotalPages > 0 && (
                    <Pagination 
                      currentPage={newsPage} 
                      totalPages={newsTotalPages} 
                      onPageChange={setNewsPage} 
                    />
                  )}
                </div>
              </div>
            )}

            {/* ─── DEVOTIONALS ─── */}
            {activeTab === 'devotionals' && (
              <div className="tab-page">
                <DevotionalManager />
              </div>
            )}

            {/* ─── PRAYERS ─── */}
            {activeTab === 'prayers' && (
              <div className="tab-page">
                <PrayerReviewManager />
              </div>
            )}

            {/* ─── DONATIONS ─── */}
            {activeTab === 'donations' && (
              <div className="tab-page">
                <DonationsManager />
              </div>
            )}

            {/* ─── USERS ─── */}
            {activeTab === 'users' && (
              <div className="tab-page">
                <UserManager />
              </div>
            )}

            {/* ─── NOTIFICATIONS ─── */}
            {activeTab === 'notifications' && (
              <div className="tab-page">
                <NotificationsManager />
              </div>
            )}
              </>
            )}

          </div>{/* end admin-content */}
        </main>
      </div>
    </div>
  );
}
