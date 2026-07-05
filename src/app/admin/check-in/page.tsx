'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CheckInPage() {
  const router = useRouter();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date(Date.now() - 86400000).toISOString())
      .order('event_date', { ascending: true });
    
    if (data && data.length > 0) {
      setEvents(data);
      setSelectedEvent(data[0].id);
    }
  };

  const handleScan = async (result: any) => {
    if (!result || !result[0]) return;
    const userId = result[0].rawValue;
    
    if (userId === scannedData && status === 'success') return;
    if (status === 'loading') return;
    
    setScannedData(userId);
    setStatus('loading');
    
    try {
      if (!selectedEvent) throw new Error('Vui lòng chọn sự kiện trước khi điểm danh');

      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
      const userName = profile?.full_name || 'Tín hữu';

      const { error } = await supabase
        .from('event_registrations')
        .upsert({
          event_id: selectedEvent,
          user_id: userId,
          status: 'attended',
          check_in_time: new Date().toISOString()
        }, {
          onConflict: 'event_id, user_id'
        });

      if (error) throw error;

      setStatus('success');
      setMessage(`Điểm danh thành công cho ${userName}!`);
      
      setTimeout(() => {
        setStatus('idle');
        setScannedData(null);
      }, 3000);
      
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Có lỗi xảy ra');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', background: '#0f1520', minHeight: '100vh', color: '#fff' }}>
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#48BCE1', cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={20} /> Quay lại
      </button>
      
      <h1 style={{ fontSize: '1.5rem', marginBottom: '20px', fontWeight: 'bold' }}>Quét Mã QR Điểm Danh</h1>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#aaa' }}>Chọn sự kiện:</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1a2233', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Calendar size={20} color="#48BCE1" />
          <select 
            value={selectedEvent} 
            onChange={(e) => setSelectedEvent(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '1rem' }}
          >
            {events.length === 0 ? <option value="">Không có sự kiện sắp tới</option> : null}
            {events.map(ev => (
              <option key={ev.id} value={ev.id} style={{ color: '#fff', background: '#1a2233' }}>
                {ev.title} - {new Date(ev.event_date).toLocaleDateString('vi-VN')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ background: '#000', borderRadius: '16px', overflow: 'hidden', border: '2px solid #48BCE1', position: 'relative' }}>
        <Scanner onScan={handleScan} />
        
        {status === 'loading' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="spin" size={48} color="#48BCE1" />
            <p style={{ marginTop: '10px' }}>Đang xử lý...</p>
          </div>
        )}
      </div>

      {status === 'success' && (
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid #34d399', borderRadius: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={24} />
          <span style={{ fontWeight: 'bold' }}>{message}</span>
        </div>
      )}

      {status === 'error' && (
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', borderRadius: '12px', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <XCircle size={24} />
          <span style={{ fontWeight: 'bold' }}>{message}</span>
        </div>
      )}
    </div>
  );
}
