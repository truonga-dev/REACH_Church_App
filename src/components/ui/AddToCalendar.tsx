import React, { useState } from 'react';
import { CalendarPlus, Download, X } from 'lucide-react';

interface AddToCalendarProps {
  event: {
    title: string;
    description: string;
    startDate: string; // ISO date string
    endDate?: string; // ISO date string
    location?: string;
  };
  buttonLabel?: string;
  style?: React.CSSProperties;
}

export default function AddToCalendar({ event, buttonLabel = 'Thêm vào lịch', style }: AddToCalendarProps) {
  const [showOptions, setShowOptions] = useState(false);

  const formatDateForGoogle = (dateStr: string) => {
    return dateStr.replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // format YYYYMMDDTHHMMSSZ
  };

  const getGoogleCalendarUrl = () => {
    const start = formatDateForGoogle(new Date(event.startDate).toISOString());
    // if no endDate, default to 1 hour later
    const end = event.endDate 
      ? formatDateForGoogle(new Date(event.endDate).toISOString())
      : formatDateForGoogle(new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000).toISOString());

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description || '',
      location: event.location || 'Reach Church',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const downloadICS = () => {
    const start = formatDateForGoogle(new Date(event.startDate).toISOString());
    const end = event.endDate 
      ? formatDateForGoogle(new Date(event.endDate).toISOString())
      : formatDateForGoogle(new Date(new Date(event.startDate).getTime() + 60 * 60 * 1000).toISOString());

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Reach Church//App//VI
BEGIN:VEVENT
UID:${new Date().getTime()}@reachchurch.vn
DTSTAMP:${start}
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reach-church-event.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowOptions(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      <button 
        onClick={() => setShowOptions(!showOptions)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(72,188,225,0.1)', color: '#48BCE1',
          border: '1px solid rgba(72,188,225,0.2)', padding: '8px 12px',
          borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
          fontWeight: 600, width: '100%'
        }}
      >
        <CalendarPlus size={16} />
        {buttonLabel}
      </button>

      {showOptions && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '8px',
          background: '#1a2233', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', padding: '8px', zIndex: 100, width: '200px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, paddingLeft: '8px' }}>Thêm vào lịch</span>
            <button onClick={() => setShowOptions(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>
          
          <a 
            href={getGoogleCalendarUrl()} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => setShowOptions(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px', color: '#fff', textDecoration: 'none',
              borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer',
              background: 'transparent'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <CalendarPlus size={16} />
            Google Calendar
          </a>

          <button 
            onClick={downloadICS}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px', color: '#fff', textDecoration: 'none',
              borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer',
              background: 'transparent', border: 'none', width: '100%',
              textAlign: 'left'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Download size={16} />
            Apple/Outlook (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
