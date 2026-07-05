'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

type MediaPlayerProps = {
  item: {
    id: string;
    title: string;
    url: string;
    type: 'audio' | 'video';
    author?: string;
  } | null;
  onClose: () => void;
};

export default function MediaPlayer({ item, onClose }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (item && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio autoplay blocked:', e));
      setIsPlaying(true);
    }
  }, [item]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !muted;
    setMuted(!muted);
  };

  if (!item) return null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="media-player-dock">
      {item.type === 'audio' && (
        <audio 
          ref={audioRef} 
          src={item.url} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={handleTimeUpdate}
        />
      )}
      
      <div className="mp-info">
        <p className="mp-title">{item.title}</p>
        {item.author && <p className="mp-author">{item.author}</p>}
      </div>

      <div className="mp-controls">
        <div className="mp-buttons">
          <button onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10; }} className="mp-btn"><SkipBack size={20} /></button>
          <button onClick={togglePlay} className="mp-btn mp-play-btn">
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={() => { if(audioRef.current) audioRef.current.currentTime += 10; }} className="mp-btn"><SkipForward size={20} /></button>
        </div>
        
        <div className="mp-progress">
          <span>{formatTime(progress)}</span>
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            value={progress} 
            onChange={handleSeek}
            className="mp-slider"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="mp-actions">
        <button onClick={toggleMute} className="mp-btn">
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <button onClick={onClose} className="mp-btn mp-close">
          <X size={20} />
        </button>
      </div>
      
      <style jsx>{`
        .media-player-dock {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 800px;
          background: rgba(20, 25, 40, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 9999;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          color: white;
          gap: 20px;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes slideUp {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        .mp-info {
          flex: 1;
          min-width: 0;
        }

        .mp-title {
          font-weight: 600;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }

        .mp-author {
          font-size: 0.8rem;
          color: #9ca3af;
          margin: 0;
        }

        .mp-controls {
          flex: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .mp-buttons {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mp-btn {
          background: none;
          border: none;
          color: #d1d5db;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s, transform 0.1s;
        }

        .mp-btn:hover {
          color: white;
          transform: scale(1.1);
        }

        .mp-play-btn {
          width: 40px;
          height: 40px;
          background: white;
          color: black;
          border-radius: 50%;
        }

        .mp-play-btn:hover {
          background: #e5e7eb;
          color: black;
        }

        .mp-progress {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .mp-slider {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
          outline: none;
        }

        .mp-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
        }

        .mp-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mp-close {
          color: #ef4444;
        }
        .mp-close:hover {
          color: #f87171;
        }

        @media (max-width: 600px) {
          .media-player-dock {
            border-radius: 24px;
            padding: 16px;
            flex-direction: column;
            bottom: 10px;
            width: 95%;
          }
          .mp-info {
            text-align: center;
            width: 100%;
          }
          .mp-controls {
            width: 100%;
          }
          .mp-actions {
            position: absolute;
            right: 16px;
            top: 16px;
          }
        }
      `}</style>
    </div>
  );
}
