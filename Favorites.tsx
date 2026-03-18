import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { Heart, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FavoriteMovie {
  id: string;
  movie_id: string;
  created_at: string;
  movie: {
    id: string;
    title: string;
    poster_url: string | null;
    rating: number | null;
    release_year: number | null;
    category: string | null;
  } | null;
}

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          movie_id,
          created_at,
          movie:movies(id, title, poster_url, rating, release_year, category)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion for the joined data
      const typedData = (data || []).map(item => ({
        ...item,
        movie: Array.isArray(item.movie) ? item.movie[0] : item.movie
      })) as FavoriteMovie[];

      setFavorites(typedData);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
      toast({
        title: 'Removed',
        description: 'Movie removed from favorites.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Heart size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            Please login to view your favorites
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-gold px-8"
          >
            LOGIN
          </button>
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
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-3xl text-foreground">FAVORITES</h1>
            <p className="text-sm text-muted-foreground">
              {favorites.length} saved {favorites.length === 1 ? 'movie' : 'movies'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Heart size={32} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No favorites yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start adding movies to your favorites!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="glass-card p-4 flex gap-4"
                >
                  {/* Thumbnail */}
                  <button
                    onClick={() => fav.movie && navigate(`/movie/${fav.movie.id}`)}
                    className="w-20 h-28 rounded-lg bg-secondary overflow-hidden flex-shrink-0"
                  >
                    {fav.movie?.poster_url ? (
                      <img 
                        src={fav.movie.poster_url} 
                        alt={fav.movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart size={24} className="text-muted-foreground" />
                      </div>
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {fav.movie?.title || 'Unknown Movie'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {fav.movie?.rating && (
                        <span className="text-xs text-primary font-semibold">
                          ★ {fav.movie.rating}
                        </span>
                      )}
                      {fav.movie?.release_year && (
                        <span className="text-xs text-muted-foreground">
                          {fav.movie.release_year}
                        </span>
                      )}
                      {fav.movie?.category && (
                        <span className="text-xs text-muted-foreground capitalize">
                          • {fav.movie.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => fav.movie && navigate(`/movie/${fav.movie.id}`)}
                        className="text-xs text-primary font-semibold"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => removeFavorite(fav.id)}
                        className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center"
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AdBanner />
      </div>
    </Layout>
  );
};

export default Favorites;
