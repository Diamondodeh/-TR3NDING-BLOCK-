import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Flame, Zap, Tv, Film, Clock, Star, ChevronLeft, ChevronRight, Play, Info, Sparkles, Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Movie } from '@/types/movie';
import { cn } from '@/lib/utils';
import {
  getTrending, getPopularMovies, getTopRated, getNowPlaying,
  getPopularTV, getActionMovies, getAnime, searchMulti,
  TMDBMovie, posterUrl, backdropUrl, getGenreNames
} from '@/lib/tmdb';

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Supabase movies
  const [dbMovies, setDbMovies] = useState<Movie[]>([]);
  const [todaysPicks, setTodaysPicks] = useState<Movie[]>([]);

  // TMDB sections
  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [popular, setPopular] = useState<TMDBMovie[]>([]);
  const [topRated, setTopRated] = useState<TMDBMovie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TMDBMovie[]>([]);
  const [popularTV, setPopularTV] = useState<TMDBMovie[]>([]);
  const [actionList, setActionList] = useState<TMDBMovie[]>([]);
  const [animeList, setAnimeList] = useState<TMDBMovie[]>([]);

  const [heroIndex, setHeroIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch everything on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [t, p, tr, np, ptv, act, ani] = await Promise.all([
          getTrending(), getPopularMovies(), getTopRated(), getNowPlaying(),
          getPopularTV(), getActionMovies(), getAnime()
        ]);
        setTrending(t);
        setPopular(p);
        setTopRated(tr);
        setNowPlaying(np);
        setPopularTV(ptv);
        setActionList(act);
        setAnimeList(ani);

        // Also fetch Supabase movies
        const { data: movies } = await supabase
          .from('movies')
          .select('*')
          .order('created_at', { ascending: false });

        if (movies?.length) {
          const mapped: Movie[] = movies.map((m) => ({
            id: m.id, title: m.title, description: m.description || '',
            thumbnail: m.poster_url || '/placeholder.svg',
            videoUrl: m.video_url || undefined, trailerUrl: m.trailer_url || undefined,
            category: (m.category === 'series' ? 'series' : 'movie') as 'movie' | 'series',
            genre: m.genre || [], releaseYear: m.release_year || 2024,
            rating: m.rating || 0, duration: m.duration || undefined, is4K: m.is_4k || false,
          }));
          setDbMovies(mapped);
          setTodaysPicks(movies.filter(m => m.is_todays_pick).slice(0, 5).map(pick => ({
            id: pick.id, title: pick.title, description: pick.description || '',
            thumbnail: pick.poster_url || '/placeholder.svg',
            videoUrl: pick.video_url || undefined, trailerUrl: pick.trailer_url || undefined,
            category: (pick.category === 'series' ? 'series' : 'movie') as 'movie' | 'series',
            genre: pick.genre || [], releaseYear: pick.release_year || 2024,
            rating: pick.rating || 0, duration: pick.duration || undefined, is4K: pick.is_4k || false,
          })));
        }
      } catch (err) {
        console.error('Error loading content:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Hero rotation
  const heroMovies = trending.slice(0, 5);
  useEffect(() => {
    if (heroMovies.length > 1) {
      const interval = setInterval(() => setHeroIndex(p => (p + 1) % heroMovies.length), 6000);
      return () => clearInterval(interval);
    }
  }, [heroMovies.length]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    const timer = setTimeout(() => {
      searchMulti(searchQuery).then(setSearchResults).finally(() => setIsSearching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const goToTMDB = (m: TMDBMovie) => {
    const mediaType = m.media_type || (m.first_air_date ? 'tv' : 'movie');
    navigate(`/tmdb/${mediaType}/${m.id}`);
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

  const currentHero = heroMovies[heroIndex];

  return (
    <Layout>
      <div className="animate-fade-in pb-24">
        {/* FOR YOU Hero Banner */}
        {currentHero && (
          <div className="relative">
            <section className="relative mx-4 mt-4 rounded-2xl overflow-hidden">
              <div className="relative aspect-[4/3] md:aspect-video">
                <img
                  src={backdropUrl(currentHero.backdrop_path)}
                  alt={currentHero.title || currentHero.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5 bg-primary/20 backdrop-blur-sm px-3 py-1 rounded-full border border-primary/30">
                    <Sparkles size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-primary tracking-wide">FOR YOU</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary/50 backdrop-blur-sm rounded-full">
                    <Star size={12} className="text-primary fill-primary" />
                    <span className="text-xs font-semibold text-foreground">{currentHero.vote_average.toFixed(1)}</span>
                  </div>
                </div>
                <h1 className="font-display text-3xl md:text-5xl text-foreground leading-tight mb-1">
                  {(currentHero.title || currentHero.name || '').toUpperCase()}
                </h1>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 max-w-md">
                  {currentHero.overview}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => goToTMDB(currentHero)} className="btn-gold flex items-center gap-2">
                    <Play size={18} fill="currentColor" />
                    <span className="font-semibold">VIEW NOW</span>
                  </button>
                  <button onClick={() => goToTMDB(currentHero)} className="btn-glass flex items-center gap-2">
                    <Info size={18} />
                    <span>DETAILS</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Carousel dots */}
            {heroMovies.length > 1 && (
              <>
                <button onClick={() => setHeroIndex(p => (p - 1 + heroMovies.length) % heroMovies.length)}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center">
                  <ChevronLeft size={24} className="text-foreground" />
                </button>
                <button onClick={() => setHeroIndex(p => (p + 1) % heroMovies.length)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center">
                  <ChevronRight size={24} className="text-foreground" />
                </button>
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {heroMovies.map((_, i) => (
                    <button key={i} onClick={() => setHeroIndex(i)}
                      className={cn("w-2 h-2 rounded-full transition-all",
                        i === heroIndex ? "bg-primary w-6" : "bg-foreground/30 hover:bg-foreground/50")} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Search */}
        <div className="px-4 mt-4 mb-2">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search movies & TV shows..."
              className="w-full pl-11 pr-10 py-3 bg-secondary rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                <X size={16} className="text-muted-foreground" />
              </button>
            )}
            {isSearching && <Loader2 size={16} className="absolute right-10 top-1/2 -translate-y-1/2 animate-spin text-primary" />}
          </div>
        </div>

        {/* Search Results or Content */}
        {searchQuery && searchResults.length > 0 ? (
          <TMDBRow title={`Results for "${searchQuery}"`} movies={searchResults} onMovieClick={goToTMDB} />
        ) : (
          <>
            {/* Your Library (Supabase) */}
            {dbMovies.length > 0 && (
              <MovieRowSection
                title="YOUR LIBRARY"
                icon={<Film size={16} className="text-primary" />}
                movies={dbMovies}
                onMovieClick={(m) => navigate(`/movie/${m.id}`)}
              />
            )}

            {/* Sponsored Ad */}
            <SponsoredAd />

            {/* TMDB Categories */}
            <TMDBRow title="🔥 TRENDING NOW" movies={trending} onMovieClick={goToTMDB} icon={<Flame size={16} className="text-primary" />} />
            <TMDBRow title="🎬 POPULAR MOVIES" movies={popular} onMovieClick={goToTMDB} icon={<Film size={16} className="text-primary" />} />
            <TMDBRow title="⭐ TOP RATED" movies={topRated} onMovieClick={goToTMDB} icon={<Star size={16} className="text-primary" />} />

            <SponsoredAd />

            <TMDBRow title="🎞️ NOW PLAYING" movies={nowPlaying} onMovieClick={goToTMDB} icon={<Clock size={16} className="text-primary" />} />
            <TMDBRow title="📺 POPULAR TV SHOWS" movies={popularTV} onMovieClick={goToTMDB} icon={<Tv size={16} className="text-primary" />} />
            <TMDBRow title="💥 ACTION MOVIES" movies={actionList} onMovieClick={goToTMDB} icon={<Zap size={16} className="text-primary" />} />
            <TMDBRow title="🎌 ANIME" movies={animeList} onMovieClick={goToTMDB} icon={<LayoutGrid size={16} className="text-primary" />} />
          </>
        )}

        <AdBanner />
      </div>
    </Layout>
  );
};

/* ---- Sub-components ---- */

const SponsoredAd = () => (
  <div className="px-4 mb-6">
    <div className="w-full py-3 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-lg pointer-events-none">
      <div className="flex items-center justify-center gap-2">
        <Star size={14} className="text-primary" />
        <span className="text-xs text-primary font-semibold tracking-wider">SPONSORED CONTENT</span>
        <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded">AD</span>
      </div>
    </div>
  </div>
);

const TMDBRow = ({ title, movies, onMovieClick, icon }: {
  title: string; movies: TMDBMovie[]; onMovieClick: (m: TMDBMovie) => void; icon?: React.ReactNode;
}) => {
  if (!movies.length) return null;
  return (
    <section className="py-4">
      <div className="flex items-center gap-2 px-4 mb-3">
        {icon && <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">{icon}</div>}
        <h2 className="font-display text-lg tracking-wide text-foreground">{title}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-3">
        {movies.map(m => (
          <div key={m.id} className="flex-shrink-0 w-36 md:w-44 cursor-pointer group" onClick={() => onMovieClick(m)}>
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden">
              <img src={posterUrl(m.poster_path)} alt={m.title || m.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <Star size={12} className="text-primary fill-primary" />
                <span className="text-xs font-semibold text-foreground">{m.vote_average.toFixed(1)}</span>
              </div>
            </div>
            <div className="mt-2 px-1">
              <h3 className="text-sm font-medium text-foreground line-clamp-1">{m.title || m.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(m.release_date || m.first_air_date || '').split('-')[0]} • {getGenreNames(m.genre_ids)[0] || 'N/A'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const MovieRowSection = ({ title, icon, movies, onMovieClick }: {
  title: string; icon?: React.ReactNode; movies: Movie[]; onMovieClick: (m: Movie) => void;
}) => {
  const navigate = useNavigate();
  return (
    <section className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          {icon && <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">{icon}</div>}
          <h2 className="font-display text-lg tracking-wide text-foreground">{title}</h2>
        </div>
        <button onClick={() => navigate('/categories')} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          VIEW ALL <ChevronRight size={14} />
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-3">
        {movies.map(m => (
          <div key={m.id} className="flex-shrink-0 w-36 md:w-44 cursor-pointer group" onClick={() => onMovieClick(m)}>
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden">
              <img src={m.thumbnail} alt={m.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
              {m.is4K && <span className="badge-4k">4K</span>}
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                <Star size={12} className="text-primary fill-primary" />
                <span className="text-xs font-semibold text-foreground">{m.rating}</span>
              </div>
            </div>
            <div className="mt-2 px-1">
              <h3 className="text-sm font-medium text-foreground line-clamp-1">{m.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{m.releaseYear} • {m.genre[0]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Index;
