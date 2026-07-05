'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Loader2, Clock, CheckCircle2, Search, ChevronLeft, ArrowRight, List as ListIcon, CalendarDays } from 'lucide-react';
import { EventsSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUpcomingEvents, fetchPastEvents, registerForEvent, cancelEventRegistration, isUserRegisteredForEvent, getVolunteerRolesForUser, registerVolunteer, cancelVolunteer } from '@/lib/events';
import type { Event } from '@/lib/events';
import Link from 'next/link';

const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  
  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const updateTime = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const isExpired = timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0;
  if (isExpired) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} style={{ background: 'rgba(72,188,225,0.1)', border: '1px solid rgba(72,188,225,0.2)', padding: '6px 10px', borderRadius: '8px', textAlign: 'center', minWidth: '45px' }}>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem', lineHeight: 1 }}>{value.toString().padStart(2, '0')}</div>
          <div style={{ fontSize: '0.65rem', color: '#48bce1', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700 }}>{unit === 'd' ? 'Ngày' : unit === 'h' ? 'Giờ' : unit === 'm' ? 'Phút' : 'Giây'}</div>
        </div>
      ))}
    </div>
  );
};

export default function EventsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [registrations, setRegistrations] = useState<Record<string, boolean>>({});
  const [volunteerRoles, setVolunteerRoles] = useState<Record<string, any>>({});  
  const [registering, setRegistering] = useState<string | null>(null);
  const [volunteeringModal, setVolunteeringModal] = useState<Event | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('Tiếp tân');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadEvents();
   
  }, [activeTab]);

  useEffect(() => {
    if (user && events.length > 0) {
      checkRegistrations();
    }
   
  }, [user, events]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = activeTab === 'upcoming' ? await fetchUpcomingEvents(50) : await fetchPastEvents(50);
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrations = async () => {
    if (!user) return;
    const regStatus: Record<string, boolean> = {};
    for (const event of events) {
      regStatus[event.id] = await isUserRegisteredForEvent(event.id, user.id);
    }
    setRegistrations(regStatus);

    const roles = await getVolunteerRolesForUser(user.id);
    setVolunteerRoles(roles);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRegister = async (eventId: string) => {
    if (!user) {
      showToast('Vui lòng đăng nhập để đăng ký!');
      return;
    }
    setRegistering(eventId);
    const success = await registerForEvent(eventId, user.id);
    if (success) {
      setRegistrations(prev => ({ ...prev, [eventId]: true }));
      setEvents(events.map(e => e.id === eventId ? { ...e, registrations_count: e.registrations_count + 1 } : e));
      showToast('✅ Đăng ký thành công!');
    } else {
      showToast('❌ Đăng ký thất bại, vui lòng thử lại');
    }
    setRegistering(null);
  };

  const handleCancel = async (eventId: string) => {
    if (!user) return;
    if (!confirm('Bạn có chắc muốn hủy đăng ký?')) return;
    setRegistering(eventId);
    const success = await cancelEventRegistration(eventId, user.id);
    if (success) {
      setRegistrations(prev => ({ ...prev, [eventId]: false }));
      setEvents(events.map(e => e.id === eventId ? { ...e, registrations_count: Math.max(0, e.registrations_count - 1) } : e));
      showToast('Đã hủy đăng ký');
    }
    setRegistering(null);
  };

  const handleRegisterVolunteer = async () => {
    if (!user || !volunteeringModal) return;
    setRegistering(volunteeringModal.id);
    const res = await registerVolunteer(volunteeringModal.id, user.id, selectedRole);
    if (res) {
      setVolunteerRoles(prev => ({ ...prev, [volunteeringModal.id]: res }));
      showToast('✅ Đăng ký phục vụ thành công! Đang chờ duyệt.');
    } else {
      showToast('❌ Đăng ký thất bại, thử lại.');
    }
    setRegistering(null);
    setVolunteeringModal(null);
  };

  const handleCancelVolunteer = async (eventId: string) => {
    if (!user) return;
    if (!confirm('Bạn có chắc muốn hủy đăng ký phục vụ?')) return;
    setRegistering(eventId);
    const success = await cancelVolunteer(eventId, user.id);
    if (success) {
      setVolunteerRoles(prev => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });
      showToast('Đã hủy phục vụ');
    }
    setRegistering(null);
  };

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      day: d.getDate().toString().padStart(2, '0'),
      month: `Th.${d.getMonth() + 1}`,
      weekday: d.toLocaleDateString('vi-VN', { weekday: 'long' }),
      full: d.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }),
    };
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    return { daysInMonth, firstDayIndex, year, month };
  };

  const renderCalendarGrid = () => {
    const { daysInMonth, firstDayIndex, year, month } = getDaysInMonth(currentMonth);
    const days = [];
    
    // Empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} style={{ minHeight: 40 }}></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasEvent = filteredEvents.some(e => e.event_date.startsWith(dateStr));
      const isSelected = selectedDate && selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
      
      days.push(
        <div
          key={d}
          onClick={() => setSelectedDate(isSelected ? null : new Date(year, month, d))}
          style={{
            padding: '8px 4px', minHeight: 48,
            background: isSelected ? 'rgba(72,188,225,0.2)' : 'rgba(255,255,255,0.03)',
            border: isSelected ? '1px solid #48bce1' : '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8, cursor: 'pointer', position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.85rem', color: isSelected ? '#fff' : '#9ca3af', fontWeight: isSelected ? 700 : 400 }}>{d}</span>
          {hasEvent && (
            <div style={{ marginTop: 4, width: 6, height: 6, borderRadius: '50%', background: '#48bce1' }} />
          )}
        </div>
      );
    }

    return (
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16}/></button>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 700 }}>Tháng {month + 1}, {year}</h3>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowRight size={16}/></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center', marginBottom: 8 }}>
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
            <div key={d} style={{ fontSize: '0.75rem', color: '#7a8599', fontWeight: 700 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {days}
        </div>
      </div>
    );
  };

  const displayedEvents = viewMode === 'list' || !selectedDate 
    ? filteredEvents 
    : filteredEvents.filter(e => {
        const d = new Date(e.event_date);
        return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
      });

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1d24', color: '#fff', padding: '10px 20px', borderRadius: 12,
          zIndex: 9999, fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          border: '1px solid rgba(72,188,225,0.3)', whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f1520 0%, #1a2640 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '1.25rem 1.25rem 1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none',
          }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 style={{ color: '#fff', fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Sự Kiện Hội Thánh
            </h1>
            <p style={{ color: 'var(--color-text-muted, #7a8599)', fontSize: '0.8rem', margin: '2px 0 0' }}>
              Tham gia và đăng ký các hoạt động
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '0 0.9rem', height: 44,
        }}>
          <Search size={16} style={{ color: '#7a8599', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: '0.9rem', width: '100%', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Tabs and View Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: 200 }}>
            {(['upcoming', 'past'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '0.6rem', borderRadius: 10, border: 'none',
                  fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                  background: activeTab === tab ? '#48bce1' : 'rgba(255,255,255,0.06)',
                  color: activeTab === tab ? '#fff' : '#7a8599',
                  boxShadow: activeTab === tab ? '0 4px 12px rgba(72,188,225,0.35)' : 'none',
                }}
              >
                {tab === 'upcoming' ? '📅 Sắp diễn ra' : '📋 Đã qua'}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem 0.75rem', border: 'none', cursor: 'pointer',
                background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : '#7a8599',
              }}
            >
              <ListIcon size={18} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '0.5rem 0.75rem', border: 'none', cursor: 'pointer',
                background: viewMode === 'calendar' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: viewMode === 'calendar' ? '#fff' : '#7a8599',
              }}
            >
              <CalendarDays size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem' }}>
        {viewMode === 'calendar' && renderCalendarGrid()}

        {loading ? (
          <EventsSkeleton />
        ) : displayedEvents.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '0.75rem', padding: '3.5rem 1.5rem', textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(72,188,225,0.08)', border: '1px solid rgba(72,188,225,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Calendar size={28} style={{ color: '#48bce1' }} />
            </div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
              {searchQuery ? 'Không tìm thấy sự kiện' : activeTab === 'upcoming' ? 'Chưa có sự kiện sắp tới' : 'Chưa có sự kiện đã qua'}
            </p>
            <p style={{ color: '#7a8599', fontSize: '0.85rem', margin: 0 }}>
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Hội thánh sẽ cập nhật sớm nhé!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {viewMode === 'calendar' && selectedDate && (
              <h3 style={{ color: '#fff', fontSize: '1rem', marginTop: 0, marginBottom: '0.5rem' }}>
                Sự kiện ngày {selectedDate.toLocaleDateString('vi-VN')}
              </h3>
            )}
            {displayedEvents.map(event => {
              const isReg = registrations[event.id];
              const volRole = volunteerRoles[event.id];
              const isFull = event.max_attendees ? event.registrations_count >= event.max_attendees : false;
              const dateInfo = formatDate(event.event_date);
              const fillPct = event.max_attendees
                ? Math.round((event.registrations_count / event.max_attendees) * 100)
                : null;

              return (
                <div key={event.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isReg ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 16, overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}>
                  {/* Card Header with Date */}
                  <div style={{
                    display: 'flex', alignItems: 'stretch',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {/* Date Block */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', minWidth: 72,
                      background: isReg
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'
                        : 'linear-gradient(135deg, rgba(72,188,225,0.15), rgba(72,188,225,0.06))',
                      padding: '1rem 0.5rem',
                      borderRight: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <span style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: isReg ? '#10b981' : '#48bce1' }}>
                        {dateInfo.day}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#7a8599', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {dateInfo.month}
                      </span>
                    </div>

                    {/* Title + Status */}
                    <div style={{ flex: 1, padding: '0.85rem 1rem', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <h3 style={{
                          color: '#fff', fontWeight: 700, fontSize: '1rem',
                          margin: 0, lineHeight: 1.35, flex: 1,
                        }}>
                          {event.title}
                        </h3>
                        {isReg && (
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '2px 8px', borderRadius: 999, flexShrink: 0,
                            fontSize: '0.65rem', fontWeight: 700,
                            background: 'rgba(16,185,129,0.12)', color: '#10b981',
                            border: '1px solid rgba(16,185,129,0.25)',
                          }}>
                            <CheckCircle2 size={10} /> Đã đăng ký
                          </span>
                        )}
                        {isFull && !isReg && (
                          <span style={{
                            padding: '2px 8px', borderRadius: 999, flexShrink: 0,
                            fontSize: '0.65rem', fontWeight: 700,
                            background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                            border: '1px solid rgba(245,158,11,0.25)',
                          }}>
                            Đã đầy
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#7a8599', fontSize: '0.75rem', margin: '4px 0 0', fontStyle: 'italic' }}>
                        {dateInfo.weekday}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.83rem' }}>
                      <Clock size={13} style={{ color: '#48bce1', flexShrink: 0 }} />
                      {dateInfo.full}
                    </div>
                    {event.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.83rem' }}>
                        <MapPin size={13} style={{ color: '#f4cc30', flexShrink: 0 }} />
                        {event.location}
                      </div>
                    )}
                    {event.description && (
                      <p style={{
                        color: '#7a8599', fontSize: '0.85rem', lineHeight: 1.55,
                        margin: '0.25rem 0 0', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {event.description}
                      </p>
                    )}
                    
                    {/* Countdown for Upcoming Events (first event or within 7 days) */}
                    {activeTab === 'upcoming' && (new Date(event.event_date).getTime() - new Date().getTime() > 0) && (
                       <Countdown targetDate={event.event_date} />
                    )}

                    {/* Registrations Progress */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
                      <Users size={13} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                        {event.registrations_count} người đăng ký
                        {event.max_attendees && ` / ${event.max_attendees}`}
                      </span>
                      {fillPct !== null && (
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                          <div style={{
                            height: '100%', borderRadius: 99, transition: 'width 0.3s',
                            width: `${Math.min(fillPct, 100)}%`,
                            background: fillPct >= 90 ? '#ef4444' : fillPct >= 70 ? '#f59e0b' : '#10b981',
                          }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {activeTab === 'upcoming' && (
                    <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Tham gia */}
                      {isReg ? (
                        <button
                          onClick={() => handleCancel(event.id)}
                          disabled={registering === event.id}
                          style={{
                            width: '100%', padding: '0.7rem', borderRadius: 10,
                            border: '1px solid rgba(239,68,68,0.35)',
                            background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                          }}
                        >
                          {registering === event.id ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                          Hủy đăng ký tham gia
                        </button>
                      ) : isFull ? (
                        <div style={{
                          width: '100%', padding: '0.7rem', borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.04)', color: '#7a8599',
                          fontWeight: 700, fontSize: '0.88rem', textAlign: 'center',
                          boxSizing: 'border-box',
                        }}>
                          Đã đủ số lượng
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegister(event.id)}
                          disabled={registering === event.id}
                          style={{
                            width: '100%', padding: '0.7rem', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg, #48bce1, #2a9fc4)',
                            color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                            boxShadow: '0 4px 12px rgba(72,188,225,0.35)',
                          }}
                        >
                          {registering === event.id ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={15} />}
                          Đăng ký tham gia
                        </button>
                      )}

                      {/* Phục vụ */}
                      {volRole ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div style={{
                            flex: 1, padding: '0.7rem', borderRadius: 10,
                            border: '1px solid rgba(244, 204, 48, 0.35)',
                            background: 'rgba(244, 204, 48, 0.08)', color: '#f4cc30',
                            fontWeight: 700, fontSize: '0.88rem', textAlign: 'center'
                          }}>
                            Vai trò: {volRole.role} ({volRole.status === 'pending' ? 'Chờ duyệt' : volRole.status === 'approved' ? 'Đã duyệt' : 'Từ chối'})
                          </div>
                          <button
                            onClick={() => handleCancelVolunteer(event.id)}
                            disabled={registering === event.id}
                            style={{
                              padding: '0.7rem', borderRadius: 10,
                              border: '1px solid rgba(239,68,68,0.35)',
                              background: 'transparent', color: '#ef4444',
                              cursor: 'pointer',
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                         <button
                           onClick={() => setVolunteeringModal(event)}
                           disabled={registering === event.id}
                           style={{
                             width: '100%', padding: '0.7rem', borderRadius: 10,
                             border: '1px solid rgba(244, 204, 48, 0.4)',
                             background: 'transparent', color: '#f4cc30',
                             fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                           }}
                         >
                           Đăng ký phục vụ
                         </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && displayedEvents.length > 0 && (
          <p style={{ textAlign: 'center', color: '#7a8599', fontSize: '0.78rem', marginTop: '1.5rem' }}>
            Hiển thị {displayedEvents.length} sự kiện
          </p>
        )}
      </div>

      {/* Volunteer Modal */}
      {volunteeringModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem'
        }}>
          <div style={{
            background: '#1a1d24', borderRadius: 20, width: '100%', maxWidth: 400,
            overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>Đăng ký phục vụ</h3>
              <p style={{ margin: '0.25rem 0 0', color: '#9ca3af', fontSize: '0.85rem' }}>{volunteeringModal.title}</p>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <label style={{ display: 'block', color: '#fff', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Chọn vai trò / Ban ngành:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: '100%', padding: '0.85rem', borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '1rem', outline: 'none',
                  WebkitAppearance: 'none', appearance: 'none',
                }}
              >
                <option value="Tiếp tân" style={{ color: '#000' }}>Ban Tiếp tân</option>
                <option value="Thờ phượng" style={{ color: '#000' }}>Ban Thờ phượng</option>
                <option value="Kỹ thuật / Truyền thông" style={{ color: '#000' }}>Kỹ thuật / Truyền thông</option>
                <option value="Hậu cần" style={{ color: '#000' }}>Hậu cần</option>
                <option value="Khác" style={{ color: '#000' }}>Khác</option>
              </select>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
              <button
                onClick={() => setVolunteeringModal(null)}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleRegisterVolunteer}
                disabled={registering === volunteeringModal.id}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: 12, border: 'none',
                  background: '#f4cc30', color: '#000', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                {registering === volunteeringModal.id ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
