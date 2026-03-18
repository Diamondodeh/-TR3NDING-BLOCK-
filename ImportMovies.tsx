import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { ArrowLeft, Link, Loader2, Check, Download, Film, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TMDBSearch } from '@/components/TMDBSearch';

// Top public domain movies from Archive.org
const PUBLIC_DOMAIN_MOVIES = [
  { title: "Night of the Living Dead", year: 1968, url: "https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4", poster: "https://image.tmdb.org/t/p/w500/u9UFPQ8cKUVCKnGbNB1lDOIHv6Y.jpg", genre: ["Horror"], rating: 7.9 },
  { title: "Nosferatu", year: 1922, url: "https://archive.org/download/nosferatu_1922/nosferatu.mp4", poster: "https://image.tmdb.org/t/p/w500/bHj9VfSfLFQoJx2Qr8l9D4DlQvv.jpg", genre: ["Horror"], rating: 7.9 },
  { title: "The Cabinet of Dr. Caligari", year: 1920, url: "https://archive.org/download/thecabinetofdr.caligari/thecabinetofdr.caligari.mp4", poster: "https://image.tmdb.org/t/p/w500/pgSIxLSB6y2bNVq8bV9S1kEjQx5.jpg", genre: ["Horror", "Drama"], rating: 8.0 },
  { title: "His Girl Friday", year: 1940, url: "https://archive.org/download/his_girl_friday/his_girl_friday_512kb.mp4", poster: "https://image.tmdb.org/t/p/w500/fHdDAu7kJhFUvtpPQ1g5h3M8K4S.jpg", genre: ["Comedy", "Romance"], rating: 7.9 },
  { title: "The General", year: 1926, url: "https://archive.org/download/TheGeneral/The_General.mp4", poster: "https://image.tmdb.org/t/p/w500/r5gV1CHME7MwJLt3YJKK4s7tCyb.jpg", genre: ["Action", "Comedy"], rating: 8.1 },
  { title: "Charade", year: 1963, url: "https://archive.org/download/Charade1963/Charade%20%281963%29.mp4", poster: "https://image.tmdb.org/t/p/w500/eLq4Q2e6x6fXH2PEr9RAYGFqkh1.jpg", genre: ["Mystery", "Romance", "Thriller"], rating: 7.9 },
  { title: "D.O.A.", year: 1950, url: "https://archive.org/download/doa_1950/doa_1950.mp4", poster: "https://image.tmdb.org/t/p/w500/1ePjZvGgL8uNIQJ97n8I7PAw3VJ.jpg", genre: ["Mystery", "Thriller"], rating: 7.3 },
  { title: "Detour", year: 1945, url: "https://archive.org/download/detour1945/detour1945.mp4", poster: "https://image.tmdb.org/t/p/w500/f4LKz6h9GCRhElVPj4mvFQHPVQl.jpg", genre: ["Drama", "Thriller"], rating: 7.4 },
  { title: "The Little Shop of Horrors", year: 1960, url: "https://archive.org/download/TheLittleShopOfHorrors1960_201601/The%20Little%20Shop%20of%20Horrors%20%281960%29.mp4", poster: "https://image.tmdb.org/t/p/w500/7zzfwYvE9HNxoUYzEk8dUvBqZ1v.jpg", genre: ["Comedy", "Horror"], rating: 6.3 },
  { title: "Carnival of Souls", year: 1962, url: "https://archive.org/download/CarnivalOfSouls/Carnival_of_Souls.mp4", poster: "https://image.tmdb.org/t/p/w500/gzaVOfxcqA85p0qjG2ufxw2T7rQ.jpg", genre: ["Horror"], rating: 7.1 },
  { title: "House on Haunted Hill", year: 1959, url: "https://archive.org/download/house_on_haunted_hill_1959/house_on_haunted_hill.mp4", poster: "https://image.tmdb.org/t/p/w500/oQuBoqkiGvxRbXzP6Dw1N9iW9ub.jpg", genre: ["Horror", "Mystery"], rating: 6.9 },
  { title: "The Last Man on Earth", year: 1964, url: "https://archive.org/download/TheLastManOnEarth1964_201512/The%20Last%20Man%20on%20Earth%20%281964%29.mp4", poster: "https://image.tmdb.org/t/p/w500/xY8JFTR8j2uRPH7pDvUCYTUdPr.jpg", genre: ["Horror", "Sci-Fi"], rating: 6.9 },
  { title: "Plan 9 from Outer Space", year: 1959, url: "https://archive.org/download/Plan9FromOuterSpace_201512/Plan%209%20from%20Outer%20Space.mp4", poster: "https://image.tmdb.org/t/p/w500/iH0aXPQKQJHJnZr1jv4EqE7t2R9.jpg", genre: ["Horror", "Sci-Fi"], rating: 4.0 },
  { title: "The Phantom of the Opera", year: 1925, url: "https://archive.org/download/ThePhantomOfTheOpera1925/The%20Phantom%20of%20the%20Opera%20%281925%29.mp4", poster: "https://image.tmdb.org/t/p/w500/7NrJLJ7Q3m4Uiy0t1S0qjWPYYo7.jpg", genre: ["Horror", "Drama"], rating: 7.6 },
  { title: "Metropolis", year: 1927, url: "https://archive.org/download/Metropolis1927/Metropolis%20%281927%29.mp4", poster: "https://image.tmdb.org/t/p/w500/hUK9rewffKGqtXynH0Mg9EKQkR2.jpg", genre: ["Drama", "Sci-Fi"], rating: 8.3 },
  { title: "The 39 Steps", year: 1935, url: "https://archive.org/download/the_39_steps/the_39_steps.mp4", poster: "https://image.tmdb.org/t/p/w500/fhfLVY2rX2r1CxUQDNRjPdXoM5l.jpg", genre: ["Mystery", "Thriller"], rating: 7.6 },
  { title: "Suddenly", year: 1954, url: "https://archive.org/download/suddenly1954/suddenly1954.mp4", poster: "https://image.tmdb.org/t/p/w500/2pQaNhXLxUwKB0V9C9aT9VLdQMV.jpg", genre: ["Crime", "Thriller"], rating: 6.8 },
  { title: "Reefer Madness", year: 1936, url: "https://archive.org/download/reefer_madness1938/reefer_madness1938.mp4", poster: "https://image.tmdb.org/t/p/w500/nV4jSyXwQSBmjGhFu4j2yHnCvQC.jpg", genre: ["Drama"], rating: 3.8 },
  { title: "The Strange Love of Martha Ivers", year: 1946, url: "https://archive.org/download/TheStrangeLoveOfMarthaIvers1946_703/The_Strange_Love_of_Martha_Ivers_1946.mp4", poster: "https://image.tmdb.org/t/p/w500/5l9z2rQvmETJLvwAqKRXvZHGXzz.jpg", genre: ["Drama", "Romance"], rating: 7.4 },
  { title: "Scarlet Street", year: 1945, url: "https://archive.org/download/ScarletStreet1945/Scarlet%20Street%20%281945%29.mp4", poster: "https://image.tmdb.org/t/p/w500/6UhX5fN1Kx3j6lHZEPMxUeV0Rke.jpg", genre: ["Drama", "Thriller"], rating: 7.8 },
];

const ImportMovies = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedMovies, setImportedMovies] = useState<Set<string>>(new Set());
  
  // Manual URL import state
  const [manualUrl, setManualUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualPosterUrl, setManualPosterUrl] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [isManualImporting, setIsManualImporting] = useState(false);

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Admin access required</p>
          </div>
        </div>
      </Layout>
    );
  }

  const importSingleMovie = async (movie: typeof PUBLIC_DOMAIN_MOVIES[0]) => {
    if (!user) return false;
    
    try {
      // Check if movie already exists
      const { data: existing } = await supabase
        .from('movies')
        .select('id')
        .eq('title', movie.title)
        .maybeSingle();
      
      if (existing) {
        setImportedMovies(prev => new Set([...prev, movie.title]));
        return true;
      }

      const { error } = await supabase
        .from('movies')
        .insert({
          title: movie.title,
          video_url: movie.url,
          poster_url: movie.poster,
          genre: movie.genre,
          release_year: movie.year,
          rating: movie.rating,
          category: 'movie',
          description: `Classic public domain film from ${movie.year}.`,
          created_by: user.id,
        });

      if (error) throw error;
      
      setImportedMovies(prev => new Set([...prev, movie.title]));
      return true;
    } catch (error) {
      console.error(`Failed to import ${movie.title}:`, error);
      return false;
    }
  };

  const importAllMovies = async () => {
    setIsImporting(true);
    setImportProgress(0);
    
    let successCount = 0;
    
    for (let i = 0; i < PUBLIC_DOMAIN_MOVIES.length; i++) {
      const success = await importSingleMovie(PUBLIC_DOMAIN_MOVIES[i]);
      if (success) successCount++;
      setImportProgress(Math.round(((i + 1) / PUBLIC_DOMAIN_MOVIES.length) * 100));
    }
    
    setIsImporting(false);
    toast({
      title: 'Import Complete',
      description: `Successfully imported ${successCount} movies.`,
    });
  };

  const handleManualImport = async () => {
    if (!user || !manualUrl || !manualTitle) return;
    
    setIsManualImporting(true);
    try {
      const { error } = await supabase
        .from('movies')
        .insert({
          title: manualTitle,
          video_url: manualUrl,
          poster_url: manualPosterUrl || null,
          description: manualDescription || null,
          category: 'movie',
          created_by: user.id,
        });

      if (error) throw error;
      
      toast({
        title: 'Movie Imported',
        description: `${manualTitle} has been added to your library.`,
      });
      
      // Clear form
      setManualUrl('');
      setManualTitle('');
      setManualPosterUrl('');
      setManualDescription('');
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsManualImporting(false);
    }
  };

  const handleTMDBSelect = (movie: { title: string; description: string; posterUrl: string; releaseYear: number; rating: number }) => {
    setManualTitle(movie.title);
    setManualDescription(movie.description);
    setManualPosterUrl(movie.posterUrl);
  };

  return (
    <Layout>
      <div className="animate-fade-in pb-20">
        {/* Header */}
        <div className="px-4 pt-4 mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-2xl text-foreground">IMPORT MOVIES</h1>
            <p className="text-xs text-muted-foreground">Add movies via URL</p>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {/* Manual URL Import Section */}
          <section className="glass-card p-6">
            <h2 className="font-display text-lg text-foreground mb-4 flex items-center gap-2">
              <Link size={20} className="text-primary" />
              IMPORT BY URL
            </h2>
            
            {/* TMDB Search */}
            <div className="mb-4">
              <Label className="text-foreground mb-2 block">Search TMDB for movie info</Label>
              <TMDBSearch 
                onSelectMovie={handleTMDBSelect}
                placeholder="Search TMDB for movie details..."
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Title *</Label>
                <Input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Enter movie title"
                  className="bg-secondary mt-1"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Video URL *</Label>
                <Input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="bg-secondary mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Direct link to video file (MP4, WebM, etc.)
                </p>
              </div>
              
              <div>
                <Label className="text-foreground">Poster URL</Label>
                <Input
                  value={manualPosterUrl}
                  onChange={(e) => setManualPosterUrl(e.target.value)}
                  placeholder="https://example.com/poster.jpg"
                  className="bg-secondary mt-1"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Description</Label>
                <Textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Enter movie description"
                  className="bg-secondary mt-1"
                  rows={3}
                />
              </div>
              
              <Button
                onClick={handleManualImport}
                disabled={isManualImporting || !manualUrl || !manualTitle}
                className="w-full btn-gold"
              >
                {isManualImporting ? (
                  <><Loader2 size={18} className="animate-spin mr-2" /> Importing...</>
                ) : (
                  <><Download size={18} className="mr-2" /> Import Movie</>
                )}
              </Button>
            </div>
          </section>

          {/* Public Domain Movies Section */}
          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-foreground flex items-center gap-2">
                <Film size={20} className="text-primary" />
                PUBLIC DOMAIN CLASSICS
              </h2>
              <Button
                onClick={importAllMovies}
                disabled={isImporting}
                size="sm"
                className="btn-gold"
              >
                {isImporting ? (
                  <><Loader2 size={14} className="animate-spin mr-1" /> {importProgress}%</>
                ) : (
                  <>Import All ({PUBLIC_DOMAIN_MOVIES.length})</>
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              These are classic public domain movies from Archive.org. Click to import individually or use "Import All" to add them all at once.
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {PUBLIC_DOMAIN_MOVIES.map((movie) => (
                <button
                  key={movie.title}
                  onClick={() => importSingleMovie(movie)}
                  disabled={importedMovies.has(movie.title)}
                  className="glass-card p-3 text-left hover:bg-secondary/50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-14 rounded bg-secondary overflow-hidden flex-shrink-0">
                      {movie.poster ? (
                        <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={16} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground line-clamp-2">
                        {movie.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{movie.year}</p>
                      {importedMovies.has(movie.title) && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-1">
                          <Check size={10} /> Imported
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <AdBanner />
      </div>
    </Layout>
  );
};

export default ImportMovies;
