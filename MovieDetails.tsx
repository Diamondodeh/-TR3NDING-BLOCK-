import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { DownloadOverlay } from '@/components/DownloadOverlay';
import { MovieDownloadDialog } from '@/components/MovieDownloadDialog';
import { SeriesDownloadDialog } from '@/components/SeriesDownloadDialog';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Star, Clock, Calendar, ArrowLeft, Share2, Heart, Trash2, Play, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DbMovie {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  video_url: string | null;
  trailer_url: string | null;
  category: string | null;
  genre: string[] | null;
  release_year: number | null;
  rating: number | null;
  duration: string | null;
  is_4k: boolean | null;
  cast_members: any;
}

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [showMovieDownload, setShowMovieDownload] = useState(false);
  const [showSeriesDownload, setShowSeriesDownload] = useState(false);
  const [showDownloadOverlay, setShowDownloadOverlay] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('');
  const [dbMovie, setDbMovie] = useState<DbMovie | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMovie();
      if (user) {
        checkFavorite();
        checkDownloaded();
      }
    }
  }, [id, user]);

  const fetchMovie = async () => {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDbMovie(data);
    } catch (error) {
      console.error('Error fetching movie:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!user || !id) return;
    
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', id)
      .maybeSingle();
    
    setIsFavorite(!!data);
  };

  const checkDownloaded = async () => {
    if (!user || !id) return;
    
    const { data } = await supabase
      .from('downloads')
      .select('id')
      .eq('user_id', user.id)
      .eq('movie_id', id)
      .eq('status', 'completed')
      .maybeSingle();
    
    setIsDownloaded(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add favorites.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', id);
        setIsFavorite(false);
        toast({ title: 'Removed from favorites' });
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, movie_id: id });
        setIsFavorite(true);
        toast({ title: 'Added to favorites' });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    const movieUrl = `${window.location.origin}/movie/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: dbMovie?.title || 'Check out this movie!',
          text: `Watch ${dbMovie?.title} on TR3NDING BLOCK!`,
          url: movieUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(movieUrl);
        toast({
          title: 'Link Copied',
          description: 'Movie link copied to clipboard!',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to copy link',
          variant: 'destructive',
        });
      }
    }
  };

  const deleteMovie = async () => {
    if (!isAdmin || !id) return;
    
    try {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Movie deleted' });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleWatchNow = () => {
    if (isDownloaded && dbMovie?.video_url) {
      // If downloaded, play the movie directly
      navigate(`/watch/${id}`, {
        state: {
          videoUrl: dbMovie.video_url,
          title: dbMovie.title,
          thumbnail: dbMovie.poster_url,
        }
      });
    } else if (dbMovie?.trailer_url) {
      // If not downloaded but has trailer, play trailer
      setIsTrailerPlaying(true);
    }
  };

  const handleTiltFullscreen = () => {
    navigate(`/watch/${id}`, {
      state: {
        videoUrl: isDownloaded ? dbMovie?.video_url : dbMovie?.trailer_url,
        title: dbMovie?.title,
        thumbnail: dbMovie?.poster_url,
      }
    });
  };

  if (isLoading) {
    return (
      <Layout showHeader={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!dbMovie) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Movie not found</p>
        </div>
      </Layout>
    );
  }

  const movie = {
    id: dbMovie.id,
    title: dbMovie.title,
    description: dbMovie.description || '',
    thumbnail: dbMovie.poster_url || '/placeholder.svg',
    videoUrl: dbMovie.video_url || undefined,
    trailerUrl: dbMovie.trailer_url || undefined,
    category: (dbMovie.category === 'series' ? 'series' : 'movie') as 'movie' | 'series',
    genre: dbMovie.genre || [],
    releaseYear: dbMovie.release_year || 2024,
    rating: dbMovie.rating || 0,
    duration: dbMovie.duration || undefined,
    is4K: dbMovie.is_4k || false,
  };

  const handleDownloadClick = () => {
    if (movie.category === 'series') {
      setShowSeriesDownload(true);
    } else {
      setShowMovieDownload(true);
    }
  };

  const handleMovieDownload = async (quality: string) => {
    setSelectedQuality(quality);
    setShowMovieDownload(false);
    setShowDownloadOverlay(true);
  };

  const handleSeriesDownload = async (episodes: any[], quality: string) => {
    setSelectedQuality(quality);
    setShowSeriesDownload(false);
    setShowDownloadOverlay(true);
  };

  const handleDownloadComplete = async () => {
    if (!user) return;

    try {
      await supabase
        .from('downloads')
        .insert({
          user_id: user.id,
          movie_id: dbMovie?.id || null,
          movie_title: movie.title,
          quality: selectedQuality,
          file_size: getFileSizeForQuality(selectedQuality),
          video_url: movie.videoUrl || null,
          poster_url: movie.thumbnail,
        });

      setIsDownloaded(true);
      toast({
        title: 'Download Complete',
        description: `${movie.title} has been saved to your library.`,
      });
    } catch (error) {
      console.error('Error saving download:', error);
    }
  };

  const getFileSizeForQuality = (quality: string) => {
    switch (quality) {
      case '1080p': return '~1.5 GB';
      case '720p': return '~800 MB';
      case '480p': return '~500 MB';
      case '360p': return '~250 MB';
      default: return '~1 GB';
    }
  };

  const castMembers = dbMovie?.cast_members || [];

  return (
    <Layout showHeader={false}>
      <div className="animate-fade-in pb-20">
        {/* Video/Trailer Preview Area */}
        <div className="relative aspect-video bg-black">
          {/* Back button - overlaid on video */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate(-1);
            }}
            className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background/70 transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          
          {/* Action buttons */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite();
              }}
              className="w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background/70 transition-colors"
            >
              <Heart 
                size={20} 
                className={isFavorite ? "text-destructive fill-destructive" : "text-foreground"} 
              />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background/70 transition-colors"
            >
              <Share2 size={20} className="text-foreground" />
            </button>
            {isAdmin && dbMovie && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMovie();
                }}
                className="w-10 h-10 rounded-full bg-destructive/50 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/70 transition-colors"
              >
                <Trash2 size={20} className="text-destructive-foreground" />
              </button>
            )}
          </div>
          
          {/* Video/Image Display */}
          {isTrailerPlaying && movie.trailerUrl ? (
            <video
              src={movie.trailerUrl}
              autoPlay
              controls
              className="w-full h-full object-contain"
              onEnded={() => setIsTrailerPlaying(false)}
            />
          ) : (
            <img 
              src={movie.thumbnail} 
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Play overlay - only show if not playing and has trailer or is downloaded */}
          {!isTrailerPlaying && (movie.trailerUrl || isDownloaded) && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <button 
                onClick={handleWatchNow}
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center gold-glow hover:scale-110 transition-transform"
              >
                <Play size={28} className="text-primary-foreground ml-1" fill="currentColor" />
              </button>
            </div>
          )}
          
          {/* Tilt Button - Semi-square design */}
          <button 
            onClick={handleTiltFullscreen}
            className={cn(
              'absolute bottom-3 right-3 w-12 h-10 rounded-lg bg-primary/90 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-primary',
              'gold-glow'
            )}
          >
            <Maximize2 size={18} className="text-primary-foreground" />
          </button>
          
          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-16 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-sm font-medium text-white truncate">
              {isDownloaded ? movie.title : (movie.trailerUrl ? `${movie.title} - Trailer` : movie.title)}
            </p>
          </div>
        </div>
        
        {/* Gradient below video */}
        <div className="h-8 bg-gradient-to-b from-black to-background" />

        {/* Content */}
        <div className="px-4 relative z-10">
          {/* Badges */}
          <div className="flex gap-2 mb-3">
            {movie.is4K && (
              <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-md">
                4K ULTRA HD
              </span>
            )}
            <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-md capitalize">
              {movie.category}
            </span>
            {isDownloaded && (
              <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-md">
                DOWNLOADED
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl text-foreground mb-2">
            {movie.title.toUpperCase()}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-primary fill-primary" />
              <span className="text-foreground font-medium">{movie.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{movie.releaseYear}</span>
            </div>
            {movie.duration && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{movie.duration}</span>
              </div>
            )}
          </div>

          {/* Genres */}
          <div className="flex gap-2 mb-6">
            {movie.genre.map((g) => (
              <span 
                key={g} 
                className="px-3 py-1 bg-secondary/50 text-secondary-foreground text-xs rounded-full"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed mb-6">
            {movie.description}
          </p>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <button 
              onClick={handleDownloadClick}
              className="flex-1 btn-gold flex items-center justify-center gap-2"
            >
              <Download size={20} />
              DOWNLOAD
            </button>
          </div>

          {/* Cast Section */}
          {castMembers.length > 0 && (
            <section className="mb-8">
              <h3 className="font-display text-xl text-foreground mb-4">CAST & CREW</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {castMembers.map((person: any, index: number) => (
                  <div key={index} className="flex flex-col items-center min-w-[70px]">
                    <div className="w-16 h-16 rounded-full bg-secondary border-2 border-primary/30 flex items-center justify-center overflow-hidden mb-2">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-display text-primary">
                          {person.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground text-center line-clamp-1">{person.name}</p>
                    <p className="text-xs text-muted-foreground text-center">{person.role}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Ad Banner */}
        <AdBanner />
      </div>

      {/* Movie Download Dialog */}
      <MovieDownloadDialog
        isOpen={showMovieDownload}
        onClose={() => setShowMovieDownload(false)}
        onDownload={handleMovieDownload}
        movieTitle={movie.title}
        duration={movie.duration}
      />

      {/* Series Download Dialog */}
      <SeriesDownloadDialog
        isOpen={showSeriesDownload}
        onClose={() => setShowSeriesDownload(false)}
        onDownload={handleSeriesDownload}
        movieId={movie.id}
        movieTitle={movie.title}
      />

      {/* Download Overlay */}
      <DownloadOverlay
        isOpen={showDownloadOverlay}
        onClose={() => setShowDownloadOverlay(false)}
        fileName={`${movie.title} (${selectedQuality})`}
        fileSize={getFileSizeForQuality(selectedQuality)}
        onComplete={handleDownloadComplete}
      />
    </Layout>
  );
};

export default MovieDetails;
