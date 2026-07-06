'use client';
import { useState, useEffect } from 'react';
import { Users, Music, Heart, Baby, MessageCircle, ChevronRight, X, Search, Sparkles, BookOpen, Target, Activity } from 'lucide-react';
import { MinistryGridSkeleton } from '@/components/ui/Skeleton';
import { fetchMinistries } from '@/lib/ministries';
import type { Ministry } from '@/lib/ministries';
import { useLanguage } from '@/contexts/LanguageContext';
import './page.css';

const IconMap: Record<string, any> = {  
  Users,
  Heart,
  Baby,
  Music,
  MessageCircle,
  BookOpen,
  Target,
  Activity,
};

export default function MinistryPage() {
  const { t } = useLanguage();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNote, setFormNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadMinistries();
  }, []);

  const loadMinistries = async () => {
    setLoading(true);
    try {
      // By default fetchMinistries fetches the first 10. Here we fetch a large limit to show all in public page if no pagination is intended, or we can just extract data.
      const { data } = await fetchMinistries(100, 0);
      setMinistries(data);
    } catch {
      showToast(t('page_ministry.error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const displayedMinistries = ministries.filter(ministry => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return ministry.name.toLowerCase().includes(query) || 
           (ministry.desc || '').toLowerCase().includes(query) || 
           (ministry.details || '').toLowerCase().includes(query);
  });

  const handleJoin = () => {
    if (!formName.trim() || !formPhone.trim()) {
      showToast(t('page_ministry.toast_missing_info'));
      return;
    }

    setSubmitted(true);
    showToast(t('page_ministry.toast_success').replace('{{name}}', formName));

    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
      setFormName('');
      setFormPhone('');
      setFormNote('');
      setSelectedMinistry(null);
    }, 2000);
  };

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#48BCE1', color: '#111', padding: '12px 24px', borderRadius: '12px', zIndex: 9999, fontWeight: '700', boxShadow: '0 4px 24px rgba(72,188,225,0.4)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* MODAL */}
      {selectedMinistry && (
        <div className="modal-overlay" onClick={() => { setSelectedMinistry(null); setShowForm(false); }}>
          <div className="ministry-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => { setSelectedMinistry(null); setShowForm(false); }}>
              <X size={20} />
            </button>

            {selectedMinistry.image_url && (
              <img src={selectedMinistry.image_url} alt={selectedMinistry.name} className="ministry-hero-img" />
            )}

            <div className="modal-header-flex">
              <div style={{ background: 'rgba(72,188,225,0.1)', padding: '12px', borderRadius: '16px' }}>
                {(() => {
                  const Icon = IconMap[selectedMinistry.icon || 'Users'] || Users;
                  return <Icon size={32} color="#48BCE1" />;
                })()}
              </div>
              <div>
                <h2 className="modal-title">{selectedMinistry.name}</h2>
                <p className="modal-subtitle">{selectedMinistry.category} • {selectedMinistry.schedule}</p>
              </div>
            </div>

            <p className="modal-details">{selectedMinistry.details}</p>

            {/* Mission & Goal */}
            {(selectedMinistry.mission || selectedMinistry.goal) && (
              <>
                {selectedMinistry.mission && (
                  <div className="info-block mission">
                    <p className="info-block-title">{t('page_ministry.mission')}</p>
                    <p className="info-block-text">{selectedMinistry.mission}</p>
                  </div>
                )}
                {selectedMinistry.goal && (
                  <div className="info-block goal">
                    <p className="info-block-title">{t('page_ministry.goal')}</p>
                    <p className="info-block-text">{selectedMinistry.goal}</p>
                  </div>
                )}
              </>
            )}

            {/* Activities */}
            {selectedMinistry.activities && selectedMinistry.activities.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                {selectedMinistry.activities.map((activity: string, index: number) => (
                  <div key={index} className="activity-item">
                    <Sparkles size={18} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p>{activity}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Two columns: Leader & Location */}
            <div className="two-cols">
              <div className="col-card">
                <p className="col-card-title">{t('page_ministry.leader')}</p>
                <p className="col-card-text">{selectedMinistry.leader || t('page_ministry.updating')}</p>
              </div>
              <div className="col-card">
                <p className="col-card-title">{t('page_ministry.location')}</p>
                <p className="col-card-text">{selectedMinistry.location || t('page_ministry.updating')}</p>
              </div>
            </div>

            {/* Registration Form */}
            {!showForm ? (
              <button className="btn-main-join" onClick={() => setShowForm(true)}>
                {t('page_ministry.join_btn')}
              </button>
            ) : (
              <div className="register-block">
                <h3 className="register-title">{t('page_ministry.form_title')}</h3>
                {submitted ? (
                  <div className="success-msg">
                    <Heart size={40} color="#fb7185" fill="#fb7185" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                    <p dangerouslySetInnerHTML={{ __html: t('page_ministry.success_msg').replace('\\n', '<br/>') }}></p>
                  </div>
                ) : (
                  <div>
                    <input className="join-input" type="text" placeholder={t('page_ministry.form_name')} value={formName} onChange={e => setFormName(e.target.value)} />
                    <input className="join-input" type="tel" placeholder={t('page_ministry.form_phone')} value={formPhone} onChange={e => setFormPhone(e.target.value)} />
                    <textarea className="join-input" rows={3} placeholder={t('page_ministry.form_note')} value={formNote} onChange={e => setFormNote(e.target.value)} />
                    <div className="btn-actions">
                      <button className="btn-action btn-cancel" onClick={() => { setShowForm(false); setFormName(''); setFormPhone(''); setFormNote(''); }}>
                        {t('page_ministry.btn_cancel')}
                      </button>
                      <button className="btn-action btn-submit" onClick={handleJoin}>
                        {t('page_ministry.btn_submit')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="page-header">
        <h1 className="page-title">{t('page_ministry.title')}</h1>
        <p className="page-subtitle">{t('page_ministry.subtitle')}</p>
      </header>

      {/* SEARCH & LIST */}
      <div className="ministry-search-bar">
        <Search size={18} />
        <input type="search" placeholder={t('page_ministry.search_placeholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {loading ? (
        <MinistryGridSkeleton />
      ) : displayedMinistries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7a8599' }}>
          {t('page_ministry.no_data')}
        </div>
      ) : (
        <div className="ministry-list">
          {displayedMinistries.map(ministry => {
            const Icon = IconMap[ministry.icon || 'Users'] || Users;
            return (
              <div key={ministry.id} className="ministry-item" onClick={() => setSelectedMinistry(ministry)}>
                <div className="ministry-icon-wrapper" style={{ overflow: 'hidden' }}>
                  {ministry.image_url ? (
                    <img src={ministry.image_url} alt={ministry.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Icon size={24} className="ministry-icon" />
                  )}
                </div>
                <div className="ministry-info">
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <h3 className="ministry-name">{ministry.name}</h3>
                    <span className="ministry-cat-badge">{ministry.category}</span>
                  </div>
                  <p className="ministry-desc">{ministry.desc}</p>
                  <div className="ministry-meta">
                    <span>{t('page_ministry.leader')}: {ministry.leader || t('page_ministry.updating')}</span>
                    <span>{ministry.schedule}</span>
                  </div>
                </div>
                <ChevronRight className="arrow-icon" size={20} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
