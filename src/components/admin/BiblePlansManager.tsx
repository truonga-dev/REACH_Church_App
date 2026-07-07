'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit2, Save, X, Loader2, Book, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { BibleReadingPlan, BiblePlanDay } from '@/types';

interface EditingPlanState {
  id: string | null;
  data: Partial<BibleReadingPlan>;
}

const emptyPlan = (): Partial<BibleReadingPlan> => ({
  title: '',
  title_en: '',
  title_ko: '',
  description: '',
  description_en: '',
  description_ko: '',
  duration_days: 0
});

export default function BiblePlansManager() {
  const [plans, setPlans] = useState<BibleReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingPlanState>({ id: null, data: emptyPlan() });
  
  const [toast, setToast] = useState('');
  const [formLang, setFormLang] = useState<'vi' | 'en' | 'ko'>('vi');

  // For Days management
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [planDays, setPlanDays] = useState<Record<string, BiblePlanDay[]>>({});
  const [loadingDays, setLoadingDays] = useState<Record<string, boolean>>({});

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('bible_reading_plans').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi tải danh sách kế hoạch');
    } finally {
      setLoading(false);
    }
  };

  const loadPlanDays = async (planId: string) => {
    if (planDays[planId]) return; // Already loaded
    setLoadingDays(prev => ({ ...prev, [planId]: true }));
    try {
      const { data, error } = await supabase.from('bible_plan_days').select('*').eq('plan_id', planId).order('day_number', { ascending: true });
      if (error) throw error;
      setPlanDays(prev => ({ ...prev, [planId]: data || [] }));
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi tải danh sách ngày đọc');
    } finally {
      setLoadingDays(prev => ({ ...prev, [planId]: false }));
    }
  };

  const togglePlanExpand = (planId: string) => {
    if (expandedPlanId === planId) {
      setExpandedPlanId(null);
    } else {
      setExpandedPlanId(planId);
      loadPlanDays(planId);
    }
  };

  const handleSavePlan = async () => {
    if (!editing.data.title) {
      showToast('Vui lòng nhập tiêu đề tiếng Việt');
      return;
    }

    setSaving(true);
    try {
      if (editing.id) {
        // Cập nhật
        const { error } = await supabase.from('bible_reading_plans').update(editing.data).eq('id', editing.id);
        if (error) throw error;
        showToast('Đã cập nhật kế hoạch');
      } else {
        // Thêm mới
        const { error } = await supabase.from('bible_reading_plans').insert([editing.data]);
        if (error) throw error;
        showToast('Đã thêm kế hoạch mới');
      }
      setShowForm(false);
      setEditing({ id: null, data: emptyPlan() });
      loadPlans();
    } catch (error) {
      console.error(error);
      showToast('Có lỗi xảy ra khi lưu kế hoạch');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa kế hoạch này? Các ngày đọc thuộc kế hoạch này cũng sẽ bị xóa.')) return;
    try {
      const { error } = await supabase.from('bible_reading_plans').delete().eq('id', id);
      if (error) throw error;
      showToast('Đã xóa kế hoạch');
      loadPlans();
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi xóa kế hoạch');
    }
  };

  const handleSaveDay = async (planId: string, dayNumber: number, verses: string) => {
    if (!verses.trim()) {
      // If empty, delete the day if it exists
      const existing = planDays[planId]?.find(d => d.day_number === dayNumber);
      if (existing) {
        await handleDeleteDay(planId, existing.id);
      }
      return;
    }

    try {
      // Check if day exists
      const existing = planDays[planId]?.find(d => d.day_number === dayNumber);
      if (existing) {
        const { error } = await supabase.from('bible_plan_days').update({ verses }).eq('id', existing.id);
        if (error) throw error;
        showToast(`Đã lưu Ngày ${dayNumber}`);
      } else {
        const { error } = await supabase.from('bible_plan_days').insert([{ plan_id: planId, day_number: dayNumber, verses }]);
        if (error) throw error;
        showToast(`Đã thêm Ngày ${dayNumber}`);
      }
      
      // Update local state by forcing reload of days
      setPlanDays(prev => ({ ...prev, [planId]: [] })); // Clear cache to reload
      loadPlanDays(planId);
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi lưu ngày đọc');
    }
  };

  const handleDeleteDay = async (planId: string, dayId: string) => {
    try {
      const { error } = await supabase.from('bible_plan_days').delete().eq('id', dayId);
      if (error) throw error;
      setPlanDays(prev => ({
        ...prev,
        [planId]: prev[planId].filter(d => d.id !== dayId)
      }));
      showToast('Đã xóa phân đoạn');
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi xóa phân đoạn');
    }
  };

  return (
    <div className="admin-sub-manager">
      <div className="header-actions">
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Book size={24} /> Quản lý Kế hoạch Kinh Thánh
        </h2>
        <button className="primary-btn" onClick={() => {
          setEditing({ id: null, data: emptyPlan() });
          setShowForm(true);
        }}>
          <Plus size={18} /> Thêm kế hoạch mới
        </button>
      </div>

      {toast && <div className="toast-message" style={{ margin: '16px 0', padding: '12px', background: '#e0f7fa', color: '#006064', borderRadius: '8px', border: '1px solid #b2ebf2' }}>{toast}</div>}

      {showForm && (
        <div className="admin-form-card" style={{ marginBottom: '24px', padding: '24px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ marginTop: 0 }}>{editing.id ? 'Chỉnh sửa kế hoạch' : 'Thêm kế hoạch mới'}</h3>
          
          <div className="lang-tabs" style={{ marginBottom: '16px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            <button type="button" className={`lang-tab ${formLang === 'vi' ? 'active' : ''}`} onClick={() => setFormLang('vi')} style={{ padding: '8px 16px', borderRadius: '8px', background: formLang === 'vi' ? 'var(--color-primary)' : 'transparent', color: formLang === 'vi' ? 'white' : 'inherit', border: 'none', cursor: 'pointer' }}>Tiếng Việt</button>
            <button type="button" className={`lang-tab ${formLang === 'en' ? 'active' : ''}`} onClick={() => setFormLang('en')} style={{ padding: '8px 16px', borderRadius: '8px', background: formLang === 'en' ? 'var(--color-primary)' : 'transparent', color: formLang === 'en' ? 'white' : 'inherit', border: 'none', cursor: 'pointer' }}>English</button>
            <button type="button" className={`lang-tab ${formLang === 'ko' ? 'active' : ''}`} onClick={() => setFormLang('ko')} style={{ padding: '8px 16px', borderRadius: '8px', background: formLang === 'ko' ? 'var(--color-primary)' : 'transparent', color: formLang === 'ko' ? 'white' : 'inherit', border: 'none', cursor: 'pointer' }}>한국어</button>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Tiêu đề ({formLang})</label>
            <input 
              type="text" 
              value={formLang === 'vi' ? editing.data.title || '' : formLang === 'en' ? editing.data.title_en || '' : editing.data.title_ko || ''}
              onChange={(e) => {
                if (formLang === 'vi') setEditing({ ...editing, data: { ...editing.data, title: e.target.value } });
                if (formLang === 'en') setEditing({ ...editing, data: { ...editing.data, title_en: e.target.value } });
                if (formLang === 'ko') setEditing({ ...editing, data: { ...editing.data, title_ko: e.target.value } });
              }}
              placeholder={`Nhập tiêu đề bằng ${formLang === 'vi' ? 'Tiếng Việt' : formLang === 'en' ? 'English' : '한국어'}...`}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'inherit' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Mô tả ngắn ({formLang})</label>
            <textarea 
              rows={3}
              value={formLang === 'vi' ? editing.data.description || '' : formLang === 'en' ? editing.data.description_en || '' : editing.data.description_ko || ''}
              onChange={(e) => {
                if (formLang === 'vi') setEditing({ ...editing, data: { ...editing.data, description: e.target.value } });
                if (formLang === 'en') setEditing({ ...editing, data: { ...editing.data, description_en: e.target.value } });
                if (formLang === 'ko') setEditing({ ...editing, data: { ...editing.data, description_ko: e.target.value } });
              }}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'inherit' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Tổng số ngày (Khoảng thời gian)</label>
            <input 
              type="number" 
              value={editing.data.duration_days}
              onChange={(e) => setEditing({ ...editing, data: { ...editing.data, duration_days: parseInt(e.target.value) || 0 } })}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'inherit' }}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button className="primary-btn" onClick={handleSavePlan} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>
              {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />} Lưu thông tin
            </button>
            <button className="secondary-btn" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--color-border)', color: 'inherit', cursor: 'pointer' }}>
              Hủy
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={32} className="spin" /></div>
      ) : plans.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>Chưa có kế hoạch nào. Nhấn "Thêm kế hoạch mới" để tạo.</div>
      ) : (
        <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {plans.map((plan) => (
            <div key={plan.id} className="admin-card" style={{ padding: '20px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px' }}>{plan.title} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' }}>{plan.duration_days} ngày</span></h3>
                  <p style={{ margin: '0 0 16px', color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>{plan.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="icon-btn edit-btn" title="Chỉnh sửa" onClick={() => {
                    setEditing({ id: plan.id, data: plan });
                    setShowForm(true);
                  }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-main)' }}><Edit2 size={18} /></button>
                  <button className="icon-btn delete-btn" title="Xóa" onClick={() => handleDeletePlan(plan.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}><Trash2 size={18} /></button>
                </div>
              </div>

              {/* Lộ trình từng ngày (Days Management) */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
                <button 
                  onClick={() => togglePlanExpand(plan.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, padding: '8px 0' }}
                >
                  <Calendar size={18} color="var(--color-primary)" /> Quản lý lộ trình đọc ({plan.duration_days} ngày)
                  {expandedPlanId === plan.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expandedPlanId === plan.id && (
                  <div style={{ marginTop: '16px', background: 'var(--color-background)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    {loadingDays[plan.id] ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Loader2 size={20} className="spin" /> Đang tải...</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(72,188,225,0.1)', borderRadius: '8px', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                          <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--color-primary)' }}>Hướng dẫn nhập liệu:</p>
                          Nhập theo mảng JSON để hỗ trợ nhiều phân đoạn đọc trong 1 ngày.<br/>
                          Ví dụ 1: <code>["Sáng thế 1-3"]</code><br/>
                          Ví dụ 2: <code>["Sáng thế 1", "Thi Thiên 2:1-5"]</code><br/>
                          <em>(Bỏ trống và nhấp ra ngoài để xóa một ngày đọc)</em>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {Array.from({ length: plan.duration_days }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const existingDay = planDays[plan.id]?.find(d => d.day_number === dayNum);
                          return (
                            <div key={dayNum} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                              <span style={{ minWidth: '65px', fontWeight: 'bold', color: existingDay ? 'var(--color-primary)' : 'inherit' }}>
                                Ngày {dayNum}
                              </span>
                              <input 
                                type="text" 
                                placeholder='["Tên Sách Chương:Câu"]' 
                                defaultValue={existingDay?.verses || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== (existingDay?.verses || '')) {
                                    handleSaveDay(plan.id, dayNum, e.target.value);
                                  }
                                }}
                                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: `1px solid ${existingDay ? 'var(--color-primary)' : 'var(--color-border)'}`, background: 'transparent', color: 'var(--color-text-main)' }}
                              />
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
