import { useState, useEffect } from 'react';
import { Edit, Trash2, Search, Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Movie {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  video_url: string | null;
  genre: string[];
  release_year: number | null;
  duration: string | null;
  is_4k: boolean | null;
  is_todays_pick: boolean | null;
  category: string | null;
  cast_members: any;
  rating: number | null;
}

interface MovieListProps {
  onEdit: (movie: Movie) => void;
}

export const MovieList = ({ onEdit }: MovieListProps) => {
  const { toast } = useToast();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovies(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Asset Deleted',
        description: 'Movie has been removed from the grid.',
      });

      fetchMovies();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search movies..."
          className="bg-secondary pl-10"
        />
      </div>

      {/* Movie List */}
      <div className="space-y-2">
        {filteredMovies.map((movie) => (
          <div
            key={movie.id}
            className="glass-card p-3 flex items-center gap-4"
          >
            {/* Poster */}
            <div className="w-16 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film size={24} className="text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{movie.title}</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground capitalize">
                  {movie.category}
                </span>
                {movie.is_4k && (
                  <span className="px-2 py-0.5 bg-primary/20 rounded text-xs text-primary font-bold">
                    4K
                  </span>
                )}
                {movie.release_year && (
                  <span className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground">
                    {movie.release_year}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {movie.genre?.join(', ') || 'No genres'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(movie)}
              >
                <Edit size={14} />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 size={14} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Movie</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{movie.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(movie.id)}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}

        {filteredMovies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {movies.length === 0 
              ? 'No movies uploaded yet'
              : 'No movies found matching your search'
            }
          </div>
        )}
      </div>
    </div>
  );
};
