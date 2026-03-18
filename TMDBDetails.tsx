import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { MovieDownloadDialog } from '@/components/MovieDownloadDialog';
import { DownloadOverlay } from '@/components/DownloadOverlay';
import { ArrowLeft, Star, Clock, Calendar, Play, Share2, Download, Plus, Edit3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getMovieDetails, getTVDetails, posterUrl, backdropUrl, TMDBMovieDetail, TMDBMovie, IMG_BASE } from '@/lib/tmdb';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const TMDBDetails = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [movie, setMovie] = useState<TMDBMovieDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showDownloadOverlay, setShowDownloadOverlay] = useState(false);
  const [downloadQuality, setDownloadQuality] = useState('');
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [showEditFields, setShowEditFields] = useState(false);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    const fetcher = type === 'tv' ? getTVDetails : getMovieDetails;
    fetcher(parseInt(id))
      .then((data) => {
        setMovie(data);
        setEditDescription(data.overview || '');
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id, type]);

  // Check if already in library
  useEffect(() => {
    if (!movie || !user) return;
    const title = movie.title || movie.name || '';
    supabase
      .from('movies')
      .select('id')
      .eq('title', title)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setIsInLibrary(true);
      });
  }, [movie, user]);

  const hasDownloadSource = editVideoUrl.trim().length > 0;

  const handleAddToLibrary = async () => {
    if (!user || !movie) return;
    setIsAddingToLibrary(true);
    try {
      const title = movie.title || movie.name || '';
      const releaseDate = movie.release_date || movie.first_air_date || '';
      const year = releaseDate ? parseInt(releaseDate.split('-')[0]) : new Date().getFullYear();
      const genres = movie.genres?.map(g => g.name) || [];

      const { error } = await supabase.from('movies').insert({
        title,
        description: editDescription || movie.overview || '',
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        video_url: editVideoUrl || null,
        genre: genres,
        release_year: year,
        rating: movie.vote_average,
        category: type === 'tv' ? 'series' : 'movie',
        created_by: user.id,
      });

      if (error) throw error;

      setIsInLibrary(true);
      toast({
        title: 'Added to Library',
        description: `${title} has been added to your library.`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Add',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAddingToLibrary(false);
    }
  };

  const handleDownload = (quality: string) => {
    setDownloadQuality(quality);
    setShowDownloadDialog(false);
    setShowDownloadOverlay(true);
  };

  const handleDownloadComplete = () => {
    toast({
      title: 'Download Complete',
      description: `${movie?.title || movie?.name} (${downloadQuality}) has been saved.`,
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!movie) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">Movie not found</p>
          <button onClick={() => navigate('/')} className="btn-gold px-4 py-2">Go Home</button>
        </div>
      </Layout>
    );
  }

  const title = movie.title || movie.name || '';
  const releaseDate = movie.release_date || movie.first_air_date || '';
  const year = releaseDate ? releaseDate.split('-')[0] : '';
  const genres = movie.genres?.map(g => g.name) || [];
  const trailer = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const cast = movie.credits?.cast?.slice(0, 10) || [];
  const similar = movie.similar?.results?.slice(0, 10) || [];
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}:${String(movie.runtime % 60).padStart(2, '0')}:00` : '2:00:00';

  return (
    <Layout>
      <div className="animate-fade-in pb-24">
        {/* Backdrop */}
        <div className="relative">
          <img
            src={backdropUrl(movie.backdrop_path)}
            alt={title}
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

          {/* Back button */}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(-1); }}
            className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 -mt-20 relative z-10">
          <div className="flex gap-4">
            <img
              src={posterUrl(movie.poster_path, 'w342')}
              alt={title}
              className="w-28 rounded-xl shadow-lg flex-shrink-0"
            />
            <div className="flex-1 pt-8">
              <h1 className="font-display text-2xl text-foreground leading-tight">{title}</h1>
              {movie.tagline && (
                <p className="text-xs text-muted-foreground italic mt-1">{movie.tagline}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                {year && <span className="flex items-center gap-1"><Calendar size={12} />{year}</span>}
                {movie.runtime && <span className="flex items-center gap-1"><Clock size={12} />{movie.runtime}m</span>}
                <span className="flex items-center gap-1"><Star size={12} className="text-primary fill-primary" />{movie.vote_average.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 mt-4">
            {genres.map(g => (
              <span key={g} className="px-3 py-1 rounded-full bg-secondary text-xs text-secondary-foreground">{g}</span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold flex items-center gap-2 px-4 py-2"
              >
                <Play size={16} fill="currentColor" />
                <span className="font-semibold text-sm">WATCH TRAILER</span>
              </a>
            )}

            {/* Download Button */}
            <button
              onClick={() => {
                if (hasDownloadSource) {
                  setShowDownloadDialog(true);
                } else {
                  toast({
                    title: 'Download Unavailable',
                    description: 'No download source available for this title.',
                    variant: 'destructive',
                  });
                }
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all',
                hasDownloadSource
                  ? 'btn-glass hover:border-primary/50'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
              )}
              disabled={!hasDownloadSource}
            >
              <Download size={16} />
              <span>DOWNLOAD</span>
            </button>

            <button
              onClick={() => {
                navigator.share?.({ title, url: window.location.href }).catch(() => {});
              }}
              className="btn-glass flex items-center gap-2 px-4 py-2"
            >
              <Share2 size={16} />
              <span className="text-sm">SHARE</span>
            </button>

            {/* Add to Library / Edit Button (Admin only) */}
            {isAdmin && (
              <button
                onClick={() => {
                  if (isInLibrary) {
                    toast({ title: 'Already in Library', description: `${title} is already in your library.` });
                  } else {
                    setShowEditFields(!showEditFields);
                  }
                }}
                disabled={isInLibrary || isAddingToLibrary}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all',
                  isInLibrary
                    ? 'bg-primary/20 text-primary cursor-default'
                    : 'btn-glass hover:border-primary/50'
                )}
              >
                {isInLibrary ? (
                  <><Edit3 size={16} /><span>IN LIBRARY</span></>
                ) : (
                  <><Plus size={16} /><span>ADD TO LIBRARY</span></>
                )}
              </button>
            )}
          </div>

          {/* Edit Fields for Adding to Library */}
          {showEditFields && !isInLibrary && isAdmin && (
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
              <h3 className="font-display text-sm text-foreground">CUSTOMIZE BEFORE ADDING</h3>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Video URL (optional)</label>
                <input
                  type="text"
                  value={editVideoUrl}
                  onChange={(e) => setEditVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Add a direct video link to enable downloads</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <button
                onClick={handleAddToLibrary}
                disabled={isAddingToLibrary}
                className="w-full btn-gold flex items-center justify-center gap-2 py-3"
              >
                {isAddingToLibrary ? (
                  <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Adding...</>
                ) : (
                  <><Plus size={16} /> ADD TO MY LIBRARY</>
                )}
              </button>
            </div>
          )}

          {/* Overview */}
          <div className="mt-6">
            <h2 className="font-display text-lg text-foreground mb-2">OVERVIEW</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{movie.overview}</p>
          </div>

          {/* Ad */}
          <div className="mt-6">
            <AdBanner />
          </div>

          {/* Cast */}
          {cast.length > 0 && (
            <div className="mt-6">
              <h2 className="font-display text-lg text-foreground mb-3">CAST</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {cast.map(c => (
                  <div key={c.id} className="flex-shrink-0 w-20 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-secondary">
                      {c.profile_path ? (
                        <img src={`${IMG_BASE}/w185${c.profile_path}`} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">N/A</div>
                      )}
                    </div>
                    <p className="text-xs text-foreground mt-1 line-clamp-1">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{c.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar */}
          {similar.length > 0 && (
            <div className="mt-6">
              <h2 className="font-display text-lg text-foreground mb-3">SIMILAR</h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3">
                {similar.map(s => (
                  <div
                    key={s.id}
                    className="flex-shrink-0 w-36 cursor-pointer group"
                    onClick={() => navigate(`/tmdb/${type || 'movie'}/${s.id}`)}
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden">
                      <img
                        src={posterUrl(s.poster_path)}
                        alt={s.title || s.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <Star size={12} className="text-primary fill-primary" />
                        <span className="text-xs font-semibold text-foreground">{s.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-foreground line-clamp-1 mt-2 px-1">{s.title || s.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Download Dialog with ad countdown */}
      <MovieDownloadDialog
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
        onDownload={handleDownload}
        movieTitle={title}
        duration={runtime}
      />

      {/* Download Overlay */}
      <DownloadOverlay
        isOpen={showDownloadOverlay}
        onClose={() => setShowDownloadOverlay(false)}
        fileName={`${title} (${downloadQuality}).mp4`}
        fileSize={downloadQuality === '1080p' ? '~1.5 GB' : downloadQuality === '720p' ? '~800 MB' : downloadQuality === '480p' ? '~500 MB' : '~250 MB'}
        onComplete={handleDownloadComplete}
      />
    </Layout>
  );
};

export default TMDBDetails;
