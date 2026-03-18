import { useState, useRef, useCallback } from 'react';
import { Sun, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoGestureOverlayProps {
  onBrightnessChange: (delta: number) => void;
  onVolumeChange: (delta: number) => void;
  brightness: number;
  volume: number;
  children: React.ReactNode;
}

export const VideoGestureOverlay = ({
  onBrightnessChange,
  onVolumeChange,
  brightness,
  volume,
  children
}: VideoGestureOverlayProps) => {
  const [activeGesture, setActiveGesture] = useState<'brightness' | 'volume' | null>(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; side: 'left' | 'right' } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    const side = relativeX < rect.width / 2 ? 'left' : 'right';
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      side
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaY = touchStartRef.current.y - touch.clientY;
    const sensitivity = 0.5;
    
    if (Math.abs(deltaY) > 10) {
      setShowIndicator(true);
      
      if (touchStartRef.current.side === 'left') {
        setActiveGesture('brightness');
        onBrightnessChange(deltaY * sensitivity);
      } else {
        setActiveGesture('volume');
        onVolumeChange(deltaY * sensitivity);
      }
      
      touchStartRef.current.y = touch.clientY;
    }
  }, [onBrightnessChange, onVolumeChange]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    setTimeout(() => {
      setShowIndicator(false);
      setActiveGesture(null);
    }, 500);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      
      {/* Brightness Indicator - Left Side */}
      <div 
        className={cn(
          'absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-opacity duration-300',
          showIndicator && activeGesture === 'brightness' ? 'opacity-100' : 'opacity-0'
        )}
      >
        <Sun size={24} className="text-primary" />
        <div className="w-1 h-32 bg-secondary rounded-full overflow-hidden">
          <div 
            className="w-full bg-primary transition-all duration-100 rounded-full"
            style={{ height: `${brightness}%`, marginTop: `${100 - brightness}%` }}
          />
        </div>
        <span className="text-xs text-foreground font-medium">{Math.round(brightness)}%</span>
      </div>
      
      {/* Volume Indicator - Right Side */}
      <div 
        className={cn(
          'absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-opacity duration-300',
          showIndicator && activeGesture === 'volume' ? 'opacity-100' : 'opacity-0'
        )}
      >
        <Volume2 size={24} className="text-primary" />
        <div className="w-1 h-32 bg-secondary rounded-full overflow-hidden">
          <div 
            className="w-full bg-primary transition-all duration-100 rounded-full"
            style={{ height: `${volume}%`, marginTop: `${100 - volume}%` }}
          />
        </div>
        <span className="text-xs text-foreground font-medium">{Math.round(volume)}%</span>
      </div>
    </div>
  );
};
