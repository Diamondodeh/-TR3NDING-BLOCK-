import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { Trash2, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DeletedMovie {
  id: string;
  movie_title: string;
  deleted_at: string;
}

const DeletedMovies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [deletedMovies, setDeletedMovies] = useState<DeletedMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDeletedMovies();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchDeletedMovies = async () => {
    try {
      const { data, error } = await supabase
        .from('deleted_movies')
        .select('*')
        .eq('user_id', user?.id)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletedMovies(data || []);
    } catch (error) {
      console.error('Error fetching deleted movies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromList = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deleted_movies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDeletedMovies(prev => prev.filter(m => m.id !== id));
      toast({
        title: 'Removed',
        description: 'Entry removed from history.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const clearAll = async () => {
    try {
      const { error } = await supabase
        .from('deleted_movies')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setDeletedMovies([]);
      toast({
        title: 'Cleared',
        description: 'All deleted movie records cleared.',
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
          <Trash2 size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            Please login to view deleted movies
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
        <div className="px-4 pt-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <div>
              <h1 className="font-display text-3xl text-foreground">DELETED</h1>
              <p className="text-sm text-muted-foreground">
                {deletedMovies.length} {deletedMovies.length === 1 ? 'record' : 'records'}
              </p>
            </div>
          </div>
          
          {deletedMovies.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-destructive font-semibold"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deletedMovies.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Trash2 size={32} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No deleted movies</p>
              <p className="text-xs text-muted-foreground mt-1">
                Movies you delete will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {deletedMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="glass-card p-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {movie.movie_title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Deleted on {format(new Date(movie.deleted_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromList(movie.id)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center ml-3"
                  >
                    <X size={14} className="text-muted-foreground" />
                  </button>
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

export default DeletedMovies;
