import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Minimize2, Lock, Unlock, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoControls } from './VideoControls';
import { VideoGestureOverlay } from './VideoGestureOverlay';

interface FullscreenPlayerProps {
  thumbnail: string;
  title: string;
  videoUrl?: string;
  onClose: () => void;
}

export const FullscreenPlayer = ({
  thumbnail,
  title,
  videoUrl,
  onClose
}: FullscreenPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(7200);
  const [quality, setQuality] = useState('1080p');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [isLocked, setIsLocked] = useState(false);
  const [showSkipIndicator, setShowSkipIndicator] = useState<'left' | 'right' | null>(null);
  
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying && showControls && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls, showSettings]);

  // Lock to landscape on mount
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape');
        }
      } catch (e) {
        console.log('Orientation lock not supported');
      }
    };
    
    // Enter fullscreen
    const enterFullscreen = async () => {
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } catch (e) {
        console.log('Fullscreen not supported');
      }
    };
    
    lockOrientation();
    enterFullscreen();
    
    return () => {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as any).unlock();
        }
      } catch (e) {
        console.log('Cleanup error');
      }
    };
  }, []);

  // Handle double-tap to skip
  const handleDoubleTap = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const isLeftSide = clientX < rect.left + rect.width / 2;
    
    if (isLeftSide) {
      skip(-10);
      setShowSkipIndicator('left');
    } else {
      skip(10);
      setShowSkipIndicator('right');
    }
    
    setTimeout(() => setShowSkipIndicator(null), 500);
  }, []);

  const handleScreenClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked) {
      setShowControls(true);
      return;
    }

    const now = Date.now();
    let clientX: number;
    
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || (e as React.TouchEvent).changedTouches[0]?.clientX || 0;
    } else {
      clientX = e.clientX;
    }

    // Check for double-tap (within 300ms)
    if (now - lastTapRef.current.time < 300) {
      handleDoubleTap(clientX);
      lastTapRef.current = { time: 0, x: 0 };
      return;
    }

    lastTapRef.current = { time: now, x: clientX };

    // Single tap - toggle controls after delay
    setTimeout(() => {
      if (lastTapRef.current.time === now) {
        setShowControls(prev => !prev);
      }
    }, 300);
  }, [isLocked, handleDoubleTap]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
    }
    setCurrentTime(value[0]);
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    } else {
      setCurrentTime(prev => Math.max(0, Math.min(duration, prev + seconds)));
    }
  };

  const handleBrightnessChange = useCallback((delta: number) => {
    setBrightness(prev => Math.max(10, Math.min(100, prev + delta)));
  }, []);

  const handleVolumeGesture = useCallback((delta: number) => {
    setVolume(prev => Math.max(0, Math.min(100, prev + delta)));
  }, []);

  const handleClose = useCallback(async () => {
    try {
      // Pause video first
      if (videoRef.current) {
        videoRef.current.pause();
      }
      
      // Exit fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      // Unlock orientation
      if (screen.orientation && 'unlock' in screen.orientation) {
        (screen.orientation as any).unlock();
      }
    } catch (e) {
      console.log('Exit error:', e);
    }
    
    // Call onClose callback
    onClose();
  }, [onClose]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50"
      style={{ filter: `brightness(${brightness / 100})` }}
      onClick={handleScreenClick}
    >
      <VideoGestureOverlay
        onBrightnessChange={handleBrightnessChange}
        onVolumeChange={handleVolumeGesture}
        brightness={brightness}
        volume={volume}
      >
        {/* Video/Image */}
        <div className="absolute inset-0 flex items-center justify-center">
          {videoUrl ? (
            <video 
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              playsInline
              muted={isMuted}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 7200)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          ) : (
            <img 
              src={thumbnail} 
              alt={title}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Double-tap skip indicators */}
        <div 
          className={cn(
            'absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-3 rounded-full bg-white/20 backdrop-blur-sm transition-opacity duration-200',
            showSkipIndicator === 'left' ? 'opacity-100' : 'opacity-0'
          )}
        >
          <SkipBack size={24} className="text-white" />
          <span className="text-white font-bold">10s</span>
        </div>
        <div 
          className={cn(
            'absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-3 rounded-full bg-white/20 backdrop-blur-sm transition-opacity duration-200',
            showSkipIndicator === 'right' ? 'opacity-100' : 'opacity-0'
          )}
        >
          <span className="text-white font-bold">10s</span>
          <SkipForward size={24} className="text-white" />
        </div>

        {/* Controls Overlay */}
        <div 
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors z-50"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
            
            <div className="text-center flex-1 mx-4">
              <h2 className="font-display text-lg text-white truncate">{title}</h2>
              <p className="text-xs text-white/60">{quality} • {playbackSpeed}x</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLocked(!isLocked);
                }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors z-50"
              >
                {isLocked ? (
                  <Lock size={20} className="text-primary" />
                ) : (
                  <Unlock size={20} className="text-white" />
                )}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors z-50"
              >
                <Minimize2 size={20} className="text-white" />
              </button>
            </div>
          </div>

          {!isLocked && (
            <VideoControls
              isPlaying={isPlaying}
              isMuted={isMuted}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              quality={quality}
              playbackSpeed={playbackSpeed}
              showSettings={showSettings}
              onTogglePlay={togglePlay}
              onToggleMute={toggleMute}
              onSeek={handleSeek}
              onSkip={skip}
              onVolumeChange={(v) => setVolume(v[0])}
              onQualityChange={setQuality}
              onSpeedChange={setPlaybackSpeed}
              onToggleSettings={() => setShowSettings(!showSettings)}
            />
          )}

          {/* Lock indicator */}
          {isLocked && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
              <Lock size={16} className="text-primary" />
              <span className="text-sm text-white">Screen Locked - Tap unlock to control</span>
            </div>
          )}
        </div>
      </VideoGestureOverlay>
    </div>
  );
};
