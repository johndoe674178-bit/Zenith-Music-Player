
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Song } from '../types';
import SleepTimer from './SleepTimer';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onShuffleChange?: (shuffle: boolean) => void;
  onRepeatChange?: (mode: RepeatMode) => void;
  onQueueToggle?: () => void;
  queueCount?: number;
  showQueue?: boolean;
  onSleepTimerEnd?: () => void;
  onNowPlayingClick?: () => void;
}

const Player: React.FC<PlayerProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onShuffleChange,
  onRepeatChange,
  onQueueToggle,
  queueCount = 0,
  showQueue = false,
  onSleepTimerEnd,
  onNowPlayingClick,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [isDragging, setIsDragging] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onTogglePlay();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            // Skip 10 seconds forward
            if (audioRef.current) {
              audioRef.current.currentTime = Math.min(
                audioRef.current.duration,
                audioRef.current.currentTime + 10
              );
            }
          } else {
            onNext();
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            // Skip 10 seconds back
            if (audioRef.current) {
              audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
            }
          } else {
            onPrev();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => {
            const newVol = Math.min(1, v + 0.1);
            if (audioRef.current) audioRef.current.volume = newVol;
            return newVol;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => {
            const newVol = Math.max(0, v - 0.1);
            if (audioRef.current) audioRef.current.volume = newVol;
            return newVol;
          });
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyS':
          toggleShuffle();
          break;
        case 'KeyR':
          cycleRepeat();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onNext, onPrev]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.volume = newMuted ? 0 : volume;
      }
      return newMuted;
    });
  }, [volume]);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const newValue = !prev;
      onShuffleChange?.(newValue);
      return newValue;
    });
  }, [onShuffleChange]);

  const cycleRepeat = useCallback(() => {
    setRepeat(prev => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(prev);
      const newMode = modes[(currentIndex + 1) % 3];
      onRepeatChange?.(newMode);
      return newMode;
    });
  }, [onRepeatChange]);

  // Handle song end based on repeat mode
  const handleSongEnd = useCallback(() => {
    if (repeat === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      onNext();
    }
  }, [repeat, onNext]);

  // Initialize Visualizer and Web Audio Graph
  useEffect(() => {
    if (audioRef.current && !audioCtxRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;

        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;
      } catch (err) {
        console.error("Visualizer initialization failed:", err);
      }
    }

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      const sum = dataArray.reduce((a, b) => a + b, 0);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        if (sum === 0 && isPlaying) {
          const time = Date.now() / 200;
          barHeight = (Math.sin(time + i * 0.5) * 0.4 + 0.6) * (canvas.height * 0.8);
          barHeight += Math.random() * 5;
        } else {
          barHeight = (dataArray[i] / 255) * canvas.height;
        }

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#1DB954');
        gradient.addColorStop(1, '#1ed760');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 4);
        } else {
          ctx.rect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        }
        ctx.fill();
        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      draw();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (audio.src !== currentSong.audioUrl) {
      audio.src = currentSong.audioUrl;
      audio.load();
    }

    if (isPlaying) {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      audio.play().catch(error => console.warn("Playback prevented:", error));
    } else {
      audio.pause();
    }
  }, [currentSong, isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && audioRef.current.duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = x / rect.width;
      audioRef.current.currentTime = pct * audioRef.current.duration;
    }
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const vol = Math.max(0, Math.min(1, x / rect.width));
    setVolume(vol);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <div className="h-24 bg-black border-t border-[#282828] px-4 flex items-center justify-between z-50">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleSongEnd}
      />

      {/* Song Info */}
      <div className="flex items-center w-[30%] min-w-[240px] space-x-4">
        <div
          className="relative group cursor-pointer"
          onClick={onNowPlayingClick}
          title="Open Now Playing"
        >
          <img src={currentSong.coverUrl} alt="" className="w-14 h-14 rounded shadow-lg object-cover group-hover:opacity-80 transition-opacity" />
          {isPlaying ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
              <div className="flex items-end space-x-0.5 h-4">
                <div className="w-1 bg-[#1DB954] animate-[bounce_0.5s_infinite_alternate]" style={{ height: '60%' }}></div>
                <div className="w-1 bg-[#1DB954] animate-[bounce_0.6s_infinite_alternate]" style={{ height: '100%', animationDelay: '0.1s' }}></div>
                <div className="w-1 bg-[#1DB954] animate-[bounce_0.4s_infinite_alternate]" style={{ height: '40%', animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="fas fa-expand text-white text-sm"></i>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-sm font-semibold hover:underline cursor-pointer truncate text-white">{currentSong.title}</h4>
          <p className="text-xs text-gray-400 hover:underline cursor-pointer truncate">{currentSong.artist}</p>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors ml-2">
          <i className="far fa-heart text-sm"></i>
        </button>
      </div>

      {/* Main Controls & Large Visualizer */}
      <div className="flex flex-col items-center w-[40%] max-w-[600px]">
        <div className="flex items-center space-x-6 mb-2">
          <button
            onClick={toggleShuffle}
            className={`transition-colors text-lg relative ${shuffle ? 'text-[#1DB954]' : 'text-gray-400 hover:text-white'}`}
            title="Shuffle (S)"
          >
            <i className="fas fa-random text-sm"></i>
            {shuffle && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1DB954] rounded-full"></span>}
          </button>
          <button onClick={onPrev} className="text-gray-400 hover:text-white transition-colors text-xl" title="Previous (←)">
            <i className="fas fa-step-backward text-base"></i>
          </button>
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 flex items-center justify-center bg-white rounded-full text-black hover:scale-110 transition-transform shadow-lg"
            title="Play/Pause (Space)"
          >
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-sm ${!isPlaying ? 'ml-0.5' : ''}`}></i>
          </button>
          <button onClick={onNext} className="text-gray-400 hover:text-white transition-colors text-xl" title="Next (→)">
            <i className="fas fa-step-forward text-base"></i>
          </button>
          <button
            onClick={cycleRepeat}
            className={`transition-colors text-lg relative ${repeat !== 'off' ? 'text-[#1DB954]' : 'text-gray-400 hover:text-white'}`}
            title="Repeat (R)"
          >
            <i className={`fas ${repeat === 'one' ? 'fa-redo' : 'fa-redo'} text-sm`}></i>
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
            {repeat !== 'off' && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#1DB954] rounded-full"></span>}
          </button>
        </div>

        {/* Progress Section with Integrated Visualizer */}
        <div className="w-full flex flex-col items-center space-y-1">
          <div className="w-full h-8 flex items-center justify-center relative">
            <canvas
              ref={canvasRef}
              width={400}
              height={30}
              className="w-full h-full opacity-60"
            />
          </div>
          <div className="flex items-center w-full space-x-2 group">
            <span className="text-[10px] text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
            <div
              className="flex-1 h-1 bg-[#4d4d4d] rounded-full relative cursor-pointer group"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-white group-hover:bg-[#1DB954] transition-colors rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity" />
              </div>
            </div>
            <span className="text-[10px] text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className="flex items-center justify-end w-[30%] space-x-3">
        {/* Mini Player toggle - only in Electron */}
        {typeof window !== 'undefined' && window.electronAPI?.isElectron && (
          <button
            onClick={async () => {
              if (window.electronAPI) {
                await window.electronAPI.toggleMiniPlayer();
              }
            }}
            className="text-gray-400 hover:text-white transition-colors"
            title="Mini Player"
          >
            <i className="fas fa-compress-alt text-sm"></i>
          </button>
        )}

        {/* Sleep Timer */}
        {onSleepTimerEnd && (
          <SleepTimer onTimerEnd={onSleepTimerEnd} isPlaying={isPlaying} />
        )}

        {/* Queue Toggle */}
        {onQueueToggle && (
          <button
            onClick={onQueueToggle}
            className={`relative text-sm transition-colors ${showQueue ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
            title="Queue"
          >
            <i className="fas fa-list"></i>
            {queueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {queueCount > 9 ? '9+' : queueCount}
              </span>
            )}
          </button>
        )}

        <button className="text-gray-400 hover:text-white transition-colors" title="Devices">
          <i className="fas fa-desktop text-sm"></i>
        </button>
        <div className="flex items-center space-x-2 group w-28">
          <button
            onClick={toggleMute}
            className="text-gray-400 group-hover:text-white transition-colors"
            title="Mute (M)"
          >
            <i className={`fas ${isMuted || volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'} text-sm`}></i>
          </button>
          <div
            className="flex-1 h-1 bg-[#4d4d4d] rounded-full relative cursor-pointer"
            onClick={handleVolumeChange}
          >
            <div
              className="h-full bg-white group-hover:bg-[#1DB954] transition-colors rounded-full relative"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
