import { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrailerPreviewProps {
  thumbnail: string;
  title: string;
  isPlaying: boolean;
  onPlay: () => void;
  onTilt: () => void;
}

export const TrailerPreview = ({
  thumbnail,
  title,
  isPlaying,
  onPlay,
  onTilt
}: TrailerPreviewProps) => {
  const [showPlayButton, setShowPlayButton] = useState(true);

  return (
    <div 
      className="relative w-full aspect-video bg-black"
      onClick={() => setShowPlayButton(prev => !prev)}
    >
      {/* Video/Thumbnail */}
      <img 
        src={thumbnail} 
        alt={title}
        className="w-full h-full object-cover"
      />
      
      {/* Play overlay */}
      <div 
        className={cn(
          'absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300',
          showPlayButton && !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center gold-glow hover:scale-110 transition-transform"
        >
          <Play size={28} className="text-primary-foreground ml-1" fill="currentColor" />
        </button>
      </div>
      
      {/* Tilt Button - Bottom Right */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onTilt();
        }}
        className={cn(
          'absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-primary',
          'gold-glow'
        )}
      >
        <RotateCcw size={18} className="text-primary-foreground" />
      </button>
      
      {/* Title overlay */}
      <div className="absolute bottom-0 left-0 right-12 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-sm font-medium text-white truncate">{title} - Trailer</p>
      </div>
    </div>
  );
};
