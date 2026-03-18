import { useState } from 'react';
import { TrailerPreview } from './TrailerPreview';
import { FullscreenPlayer } from './FullscreenPlayer';

interface VideoPlayerProps {
  thumbnail: string;
  title: string;
}

export const VideoPlayer = ({ thumbnail, title }: VideoPlayerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleTilt = () => {
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setIsPlaying(false);
  };

  return (
    <>
      <TrailerPreview
        thumbnail={thumbnail}
        title={title}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onTilt={handleTilt}
      />
      
      {isFullscreen && (
        <FullscreenPlayer
          thumbnail={thumbnail}
          title={title}
          onClose={handleCloseFullscreen}
        />
      )}
    </>
  );
};

export { TrailerPreview } from './TrailerPreview';
export { FullscreenPlayer } from './FullscreenPlayer';
export { VideoControls } from './VideoControls';
export { VideoGestureOverlay } from './VideoGestureOverlay';
