import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  quality: string;
  playbackSpeed: number;
  showSettings: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSeek: (value: number[]) => void;
  onSkip: (seconds: number) => void;
  onVolumeChange: (value: number[]) => void;
  onQualityChange: (quality: string) => void;
  onSpeedChange: (speed: number) => void;
  onToggleSettings: () => void;
}

const qualityOptions = ['4K', '1080p', '720p', '360p'];
const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const VideoControls = ({
  isPlaying,
  isMuted,
  currentTime,
  duration,
  volume,
  quality,
  playbackSpeed,
  showSettings,
  onTogglePlay,
  onToggleMute,
  onSeek,
  onSkip,
  onVolumeChange,
  onQualityChange,
  onSpeedChange,
  onToggleSettings
}: VideoControlsProps) => {
  return (
    <>
      {/* Center Play Controls */}
      <div className="absolute inset-0 flex items-center justify-center gap-8">
        <button 
          onClick={() => onSkip(-10)}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95"
        >
          <SkipBack size={24} className="text-white" />
        </button>
        
        <button 
          onClick={onTogglePlay}
          className="w-20 h-20 rounded-full bg-primary flex items-center justify-center gold-glow hover:scale-110 transition-transform active:scale-95"
        >
          {isPlaying ? (
            <Pause size={36} className="text-primary-foreground" />
          ) : (
            <Play size={36} className="text-primary-foreground ml-1" fill="currentColor" />
          )}
        </button>
        
        <button 
          onClick={() => onSkip(10)}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95"
        >
          <SkipForward size={24} className="text-white" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/80 w-12">{formatTime(currentTime)}</span>
          <Slider
            value={[currentTime]}
            max={duration || 7200}
            step={1}
            onValueChange={onSeek}
            className="flex-1"
          />
          <span className="text-xs text-white/80 w-12 text-right">{formatTime(duration || 7200)}</span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={onToggleMute}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMuted ? (
                <VolumeX size={20} className="text-white" />
              ) : (
                <Volume2 size={20} className="text-white" />
              )}
            </button>
            <div className="w-20">
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={onVolumeChange}
              />
            </div>
          </div>

          <button 
            onClick={onToggleSettings}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Settings size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div 
          className="absolute right-4 bottom-24 w-56 glass-card p-3 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quality */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Quality</p>
            <div className="space-y-1">
              {qualityOptions.map((q) => (
                <button
                  key={q}
                  onClick={() => onQualityChange(q)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    quality === q 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-secondary text-foreground'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Playback Speed</p>
            <div className="flex items-center justify-between bg-secondary rounded-lg p-2">
              <button 
                onClick={() => {
                  const idx = speedOptions.indexOf(playbackSpeed);
                  if (idx > 0) onSpeedChange(speedOptions[idx - 1]);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <ChevronDown size={16} />
              </button>
              <span className="font-medium">{playbackSpeed}x</span>
              <button 
                onClick={() => {
                  const idx = speedOptions.indexOf(playbackSpeed);
                  if (idx < speedOptions.length - 1) onSpeedChange(speedOptions[idx + 1]);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
