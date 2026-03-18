import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FullscreenPlayer } from '@/components/VideoPlayer';
import { supabase } from '@/integrations/supabase/client';

interface MovieData {
  title: string;
  thumbnail: string;
  videoUrl?: string;
}

const WatchPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState<MovieData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMovieData = async () => {
      // Check if passed via location state (from downloads or movie details)
      if (location.state?.videoUrl) {
        setMovie({
          title: location.state.title || 'Movie',
          thumbnail: location.state.thumbnail || '/placeholder.svg',
          videoUrl: location.state.videoUrl,
        });
        setIsLoading(false);
        return;
      }

      // Fetch from database
      try {
        const { data, error } = await supabase
          .from('movies')
          .select('title, poster_url, video_url, trailer_url')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setMovie({
            title: data.title,
            thumbnail: data.poster_url || '/placeholder.svg',
            videoUrl: data.video_url || data.trailer_url || undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching movie:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieData();
  }, [id, location.state]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Movie not found</p>
      </div>
    );
  }

  return (
    <FullscreenPlayer
      thumbnail={movie.thumbnail}
      title={movie.title}
      videoUrl={movie.videoUrl}
      onClose={() => navigate(-1)}
    />
  );
};

export default WatchPlayer;
