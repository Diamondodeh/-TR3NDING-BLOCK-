import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { ArrowLeft, Search, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import logoImage from '@/assets/logo.jpg';

interface Movie {
  id: string;
  title: string;
  poster_url: string | null;
  rating: number | null;
  release_year: number | null;
  category: string | null;
  genre: string[] | null;
}

const CategoryList = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (category === 'anime') {
      setIsLoading(false);
      return;
    }
    fetchMovies();
  }, [category]);

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('movies')
        .select('id, title, poster_url, rating, release_year, category, genre')
        .order('created_at', { ascending: false });

      if (category === 'movies') {
        query = query.eq('category', 'movie');
      } else if (category === 'series') {
        query = query.eq('category', 'series');
      }

      const { data, error } = await query;

      if (error) throw error;
      setMovies(data || []);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movie.genre?.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryTitle = () => {
    switch (category) {
      case 'movies': return 'MOVIES';
      case 'series': return 'SERIES';
      case 'anime': return 'ANIME';
      default: return 'ALL';
    }
  };

  // Anime Coming Soon Page
  if (category === 'anime') {
    return (
      <Layout>
        <div className="animate-fade-in min-h-screen flex flex-col">
          {/* Header */}
          <div className="px-4 pt-4 mb-4 flex items-center gap-4">
            <button
              onClick={() => navigate('/categories')}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <h1 className="font-display text-2xl text-foreground">ANIME</h1>
          </div>

          {/* Coming Soon Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            {/* Faint Logo */}
            <div className="w-40 h-40 rounded-3xl overflow-hidden opacity-20 mb-8">
              <img 
                src={logoImage} 
                alt="TR3NDING BLOCK" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Coming Soon Message */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles size={24} className="text-primary animate-pulse" />
                <h2 className="font-display text-3xl gold-gradient-text">
                  COMING SOON!
                </h2>
                <Sparkles size={24} className="text-primary animate-pulse" />
              </div>
              
              <p className="text-muted-foreground text-lg mb-2">
                🎌 Anime Section Under Construction 🎌
              </p>
              
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                We're working hard to bring you the best anime content. Stay tuned for epic adventures!
              </p>

              {/* Fun animated elements */}
              <div className="mt-8 flex justify-center gap-4">
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0ms' }}>🌸</span>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '100ms' }}>⚔️</span>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '200ms' }}>🔥</span>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '300ms' }}>✨</span>
              </div>
            </div>
          </div>

          <AdBanner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in pb-20">
        {/* Header */}
        <div className="px-4 pt-4 mb-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/categories')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="font-display text-2xl text-foreground">{getCategoryTitle()}</h1>
        </div>

        {/* Search */}
        <div className="px-4 mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH CATEGORIES..."
              className="bg-secondary pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No {category} found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredMovies.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary"
                >
                  {movie.poster_url ? (
                    <img 
                      src={movie.poster_url} 
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-muted-foreground text-center px-2">
                        {movie.title}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs font-medium text-foreground line-clamp-2">
                      {movie.title}
                    </p>
                    {movie.rating && (
                      <p className="text-xs text-primary">★ {movie.rating}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <AdBanner />
      </div>
    </Layout>
  );
};

export default CategoryList;
