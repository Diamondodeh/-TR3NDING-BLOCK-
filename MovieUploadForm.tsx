import { useState, useRef } from 'react';
import { Upload, X, Plus, Image, Film, Users, Video, Tv, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi',
  'Thriller', 'War', 'Western', 'Anime'
];

interface CastMember {
  name: string;
  role: string;
  avatar_url?: string;
}

interface Episode {
  season: number;
  episode: number;
  title: string;
  videoFile: File | null;
  videoFileName: string;
  uploadProgress: number;
  isUploading: boolean;
  uploadedUrl?: string;
}

interface UploadTask {
  id: string;
  type: 'poster' | 'video' | 'trailer' | 'episode';
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  episodeIndex?: number;
}

interface MovieUploadFormProps {
  onSuccess?: () => void;
  editMovie?: {
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
    cast_members: CastMember[];
    rating: number | null;
  };
}

export const MovieUploadForm = ({ onSuccess, editMovie }: MovieUploadFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState(editMovie?.title || '');
  const [description, setDescription] = useState(editMovie?.description || '');
  const [category, setCategory] = useState(editMovie?.category || 'movie');
  const [releaseYear, setReleaseYear] = useState(editMovie?.release_year?.toString() || '');
  const [duration, setDuration] = useState(editMovie?.duration || '');
  const [rating, setRating] = useState(editMovie?.rating?.toString() || '');
  const [is4K, setIs4K] = useState(editMovie?.is_4k || false);
  const [isTodaysPick, setIsTodaysPick] = useState(editMovie?.is_todays_pick || false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(editMovie?.genre || []);
  const [castMembers, setCastMembers] = useState<CastMember[]>(
    editMovie?.cast_members || [{ name: '', role: '' }]
  );
  
  // Direct URL inputs
  const [videoUrlInput, setVideoUrlInput] = useState(editMovie?.video_url || '');
  const [trailerUrlInput, setTrailerUrlInput] = useState(editMovie?.trailer_url || '');
  const [posterUrlInput, setPosterUrlInput] = useState(editMovie?.poster_url || '');
  
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState(editMovie?.poster_url || '');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState(editMovie?.video_url ? 'Current video' : '');
  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [trailerFileName, setTrailerFileName] = useState(editMovie?.trailer_url ? 'Current trailer' : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Upload queue for concurrent uploads
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const uploadingRef = useRef<Set<string>>(new Set());

  // Series-specific state
  const [episodes, setEpisodes] = useState<Episode[]>([
    { season: 1, episode: 1, title: '', videoFile: null, videoFileName: '', uploadProgress: 0, isUploading: false }
  ]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
      // Start upload immediately
      startFileUpload(file, 'poster', 'posters');
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoFileName(file.name);
      // Start upload immediately
      startFileUpload(file, 'video', 'videos');
    }
  };

  const handleTrailerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTrailerFile(file);
      setTrailerFileName(file.name);
      // Start upload immediately
      startFileUpload(file, 'trailer', 'trailers');
    }
  };

  // Start file upload immediately (concurrent upload support)
  const startFileUpload = async (file: File, type: UploadTask['type'], folder: string, episodeIndex?: number) => {
    const taskId = `${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Add to upload tasks
    setUploadTasks(prev => [...prev, {
      id: taskId,
      type,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
      episodeIndex,
    }]);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media-assets')
        .upload(`${folder}/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media-assets')
        .getPublicUrl(`${folder}/${fileName}`);
      
      // Update task status
      setUploadTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: 'completed' as const, progress: 100, url: publicUrl }
          : t
      ));

      // Update episode if applicable
      if (type === 'episode' && episodeIndex !== undefined) {
        setEpisodes(prev => prev.map((ep, i) => 
          i === episodeIndex 
            ? { ...ep, uploadProgress: 100, isUploading: false, uploadedUrl: publicUrl }
            : ep
        ));
      }

      return publicUrl;
    } catch (error: any) {
      setUploadTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: 'error' as const }
          : t
      ));
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const addCastMember = () => {
    setCastMembers([...castMembers, { name: '', role: '', avatar_url: '' }]);
  };

  const removeCastMember = (index: number) => {
    setCastMembers(castMembers.filter((_, i) => i !== index));
  };

  const updateCastMember = (index: number, field: 'name' | 'role' | 'avatar_url', value: string) => {
    const updated = [...castMembers];
    updated[index][field] = value;
    setCastMembers(updated);
  };

  const handleCastPhotoChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const photoUrl = await uploadFile(file, 'cast-photos');
        updateCastMember(index, 'avatar_url', photoUrl);
        toast({ title: 'Photo uploaded', description: 'Cast member photo added.' });
      } catch (error: any) {
        toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      }
    }
  };

  // Episode handling
  const addEpisode = () => {
    const lastEp = episodes[episodes.length - 1];
    setEpisodes([...episodes, { 
      season: lastEp.season, 
      episode: lastEp.episode + 1, 
      title: '', 
      videoFile: null, 
      videoFileName: '',
      uploadProgress: 0,
      isUploading: false,
    }]);
  };

  const removeEpisode = (index: number) => {
    if (episodes.length > 1) {
      setEpisodes(episodes.filter((_, i) => i !== index));
    }
  };

  const updateEpisode = (index: number, field: keyof Episode, value: any) => {
    const updated = [...episodes];
    (updated[index] as any)[field] = value;
    setEpisodes(updated);
  };

  const handleEpisodeVideoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const updated = [...episodes];
      updated[index].videoFile = file;
      updated[index].videoFileName = file.name;
      updated[index].isUploading = true;
      setEpisodes(updated);
      
      // Start upload immediately (concurrent)
      startFileUpload(file, 'episode', 'episodes', index);
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('media-assets')
      .upload(`${folder}/${fileName}`, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('media-assets')
      .getPublicUrl(`${folder}/${fileName}`);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);

    try {
      // Get uploaded URLs from tasks OR from direct URL inputs
      const posterTask = uploadTasks.find(t => t.type === 'poster' && t.status === 'completed');
      const videoTask = uploadTasks.find(t => t.type === 'video' && t.status === 'completed');
      const trailerTask = uploadTasks.find(t => t.type === 'trailer' && t.status === 'completed');

      // Priority: uploaded file > URL input > existing
      let posterUrl = posterTask?.url || posterUrlInput || editMovie?.poster_url || '';
      let videoUrl = videoTask?.url || videoUrlInput || editMovie?.video_url || '';
      let trailerUrl = trailerTask?.url || trailerUrlInput || editMovie?.trailer_url || '';

      // If files exist but weren't pre-uploaded, upload now
      if (posterFile && !posterTask) {
        setUploadProgress('Uploading poster...');
        posterUrl = await uploadFile(posterFile, 'posters');
      }

      if (videoFile && category === 'movie' && !videoTask) {
        setUploadProgress('Uploading video...');
        videoUrl = await uploadFile(videoFile, 'videos');
      }

      if (trailerFile && !trailerTask) {
        setUploadProgress('Uploading trailer...');
        trailerUrl = await uploadFile(trailerFile, 'trailers');
      }

      setUploadProgress('Saving movie...');

      // Filter out empty cast members and convert to JSON-compatible format
      const filteredCast = castMembers
        .filter(m => m.name.trim() !== '')
        .map(m => ({ name: m.name, role: m.role, avatar_url: m.avatar_url || '' }));

      const movieData = {
        title,
        description,
        category,
        genre: selectedGenres,
        release_year: releaseYear ? parseInt(releaseYear) : null,
        duration,
        rating: rating ? parseFloat(rating) : null,
        is_4k: is4K,
        is_todays_pick: isTodaysPick,
        video_url: videoUrl || null,
        trailer_url: trailerUrl || null,
        poster_url: posterUrl || null,
        cast_members: filteredCast as any,
        created_by: user.id,
      };

      let movieId = editMovie?.id;

      if (editMovie?.id) {
        const { error } = await supabase
          .from('movies')
          .update(movieData)
          .eq('id', editMovie.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('movies')
          .insert(movieData)
          .select()
          .single();
        
        if (error) throw error;
        movieId = data.id;
      }

      // Handle episodes for series
      if (category === 'series' && movieId) {
        setUploadProgress('Saving episodes...');
        
        for (let i = 0; i < episodes.length; i++) {
          const ep = episodes[i];
          let epVideoUrl = ep.uploadedUrl;
          
          // If not pre-uploaded, upload now
          if (ep.videoFile && !epVideoUrl) {
            setUploadProgress(`Uploading episode S${ep.season}E${ep.episode}...`);
            epVideoUrl = await uploadFile(ep.videoFile, 'episodes');
          }
          
          if (epVideoUrl) {
            await supabase
              .from('episodes')
              .upsert({
                movie_id: movieId,
                season_number: ep.season,
                episode_number: ep.episode,
                title: ep.title || `Episode ${ep.episode}`,
                video_url: epVideoUrl,
              }, {
                onConflict: 'movie_id,season_number,episode_number'
              });
          }
        }
      }

      toast({
        title: editMovie ? 'Asset Updated' : 'Asset Uploaded',
        description: `${title} has been ${editMovie ? 'updated' : 'added to the grid'}.`,
      });

      // Clear upload tasks
      setUploadTasks([]);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  const activeUploads = uploadTasks.filter(t => t.status === 'uploading');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Active Uploads Indicator */}
      {activeUploads.length > 0 && (
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Loader2 size={16} className="animate-spin" />
            <span>{activeUploads.length} file(s) uploading in background...</span>
          </div>
          {activeUploads.map(task => (
            <div key={task.id} className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="truncate flex-1">{task.fileName}</span>
              <span className="text-primary">Uploading...</span>
            </div>
          ))}
        </div>
      )}

      {/* Poster Upload */}
      <div className="space-y-2">
        <Label className="text-foreground">Poster Image</Label>
        <div className="flex gap-4 items-start">
          <div className="relative w-32 h-48 rounded-lg overflow-hidden bg-secondary border-2 border-dashed border-border flex items-center justify-center">
            {posterPreview ? (
              <img src={posterPreview} alt="Poster preview" className="w-full h-full object-cover" />
            ) : (
              <Image size={32} className="text-muted-foreground" />
            )}
            {uploadTasks.find(t => t.type === 'poster' && t.status === 'uploading') && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handlePosterChange}
              className="bg-secondary"
            />
            <p className="text-xs text-muted-foreground">Recommended: 300x450px, JPG or PNG</p>
          </div>
        </div>
      </div>

      {/* Title & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            required
            className="bg-secondary"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-secondary">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="movie">Movie</SelectItem>
              <SelectItem value="series">Series</SelectItem>
              <SelectItem value="anime">Anime</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          rows={3}
          className="bg-secondary"
        />
      </div>

      {/* Year, Duration, Rating, 4K */}
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year" className="text-foreground">Year</Label>
          <Input
            id="year"
            type="number"
            value={releaseYear}
            onChange={(e) => setReleaseYear(e.target.value)}
            placeholder="2024"
            min="1900"
            max="2100"
            className="bg-secondary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-foreground">Duration</Label>
          <Input
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="2h 15m"
            className="bg-secondary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rating" className="text-foreground">Rating</Label>
          <Input
            id="rating"
            type="number"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="8.5"
            min="0"
            max="10"
            step="0.1"
            className="bg-secondary"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Quality</Label>
          <div className="flex items-center gap-2 h-10">
            <Checkbox
              id="is4k"
              checked={is4K}
              onCheckedChange={(checked) => setIs4K(checked as boolean)}
            />
            <Label htmlFor="is4k" className="text-sm text-foreground cursor-pointer">4K Available</Label>
          </div>
        </div>
      </div>

      {/* Today's Pick */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
        <Checkbox
          id="isTodaysPick"
          checked={isTodaysPick}
          onCheckedChange={(checked) => setIsTodaysPick(checked as boolean)}
        />
        <Label htmlFor="isTodaysPick" className="text-sm text-foreground cursor-pointer font-medium">
          Set as Today's Pick (Featured on Home Page - Max 5)
        </Label>
      </div>

      {/* Genres */}
      <div className="space-y-2">
        <Label className="text-foreground">Genres (select multiple)</Label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => handleGenreToggle(genre)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedGenres.includes(genre)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Video File Upload - Only for Movies */}
      {category === 'movie' && (
        <div className="space-y-2">
          <Label className="text-foreground flex items-center gap-2">
            <Video size={16} /> Main Video
          </Label>
          
          {/* URL Input */}
          <Input
            type="url"
            value={videoUrlInput}
            onChange={(e) => setVideoUrlInput(e.target.value)}
            placeholder="Paste video URL (e.g., https://example.com/video.mp4)"
            className="bg-secondary"
          />
          
          <p className="text-xs text-muted-foreground">Or upload a file:</p>
          
          <div className="flex gap-2 items-center">
            <Input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="bg-secondary flex-1"
            />
          </div>
          {videoFileName && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-primary flex items-center gap-1">
                <Film size={12} /> {videoFileName}
              </p>
              {uploadTasks.find(t => t.type === 'video' && t.status === 'uploading') && (
                <Loader2 size={12} className="animate-spin text-primary" />
              )}
              {uploadTasks.find(t => t.type === 'video' && t.status === 'completed') && (
                <span className="text-xs text-primary">✓ Uploaded</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Episodes Section - Only for Series */}
      {category === 'series' && (
        <div className="space-y-4 p-4 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center justify-between">
            <Label className="text-foreground flex items-center gap-2">
              <Tv size={16} /> Episodes
            </Label>
            <Button type="button" variant="outline" size="sm" onClick={addEpisode}>
              <Plus size={14} className="mr-1" /> Add Episode
            </Button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {episodes.map((ep, index) => (
              <div key={index} className="glass-card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">SEASON</Label>
                      <Input
                        type="number"
                        value={ep.season}
                        onChange={(e) => updateEpisode(index, 'season', parseInt(e.target.value) || 1)}
                        placeholder="S"
                        className="bg-secondary w-16"
                        min="1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">EPISODE</Label>
                      <Input
                        type="number"
                        value={ep.episode}
                        onChange={(e) => updateEpisode(index, 'episode', parseInt(e.target.value) || 1)}
                        placeholder="E"
                        className="bg-secondary w-16"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] text-muted-foreground">TITLE</Label>
                    <Input
                      value={ep.title}
                      onChange={(e) => updateEpisode(index, 'title', e.target.value)}
                      placeholder="Episode title"
                      className="bg-secondary"
                    />
                  </div>
                  {episodes.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEpisode(index)}>
                      <X size={14} />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleEpisodeVideoChange(index, e)}
                    className="bg-secondary flex-1 text-xs"
                  />
                </div>
                {ep.videoFileName && (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-primary">✓ {ep.videoFileName}</p>
                    {ep.isUploading && <Loader2 size={12} className="animate-spin text-primary" />}
                    {ep.uploadedUrl && <span className="text-xs text-primary">Uploaded</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trailer Upload */}
      <div className="space-y-2">
        <Label className="text-foreground flex items-center gap-2">
          <Film size={16} /> Trailer (optional)
        </Label>
        
        {/* URL Input */}
        <Input
          type="url"
          value={trailerUrlInput}
          onChange={(e) => setTrailerUrlInput(e.target.value)}
          placeholder="Paste trailer URL (e.g., https://example.com/trailer.mp4)"
          className="bg-secondary"
        />
        
        <p className="text-xs text-muted-foreground">Or upload a file:</p>
        
        <div className="flex gap-2 items-center">
          <Input
            type="file"
            accept="video/*"
            onChange={handleTrailerChange}
            className="bg-secondary flex-1"
          />
        </div>
        {trailerFileName && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-primary flex items-center gap-1">
              <Film size={12} /> {trailerFileName}
            </p>
            {uploadTasks.find(t => t.type === 'trailer' && t.status === 'uploading') && (
              <Loader2 size={12} className="animate-spin text-primary" />
            )}
            {uploadTasks.find(t => t.type === 'trailer' && t.status === 'completed') && (
              <span className="text-xs text-primary">✓ Uploaded</span>
            )}
          </div>
        )}
      </div>

      {/* Cast Members */}
      <div className="space-y-2">
        <Label className="text-foreground flex items-center gap-2">
          <Users size={16} /> Cast Members
        </Label>
        <div className="space-y-3">
          {castMembers.map((member, index) => (
            <div key={index} className="glass-card p-3 space-y-2">
              <div className="flex gap-2 items-center">
                {/* Avatar preview */}
                <div className="w-12 h-12 rounded-full bg-secondary border-2 border-primary/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-display text-primary">
                      {member.name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={member.name}
                      onChange={(e) => updateCastMember(index, 'name', e.target.value)}
                      placeholder="Actor name"
                      className="bg-secondary flex-1"
                    />
                    <Input
                      value={member.role}
                      onChange={(e) => updateCastMember(index, 'role', e.target.value)}
                      placeholder="Character"
                      className="bg-secondary flex-1"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCastPhotoChange(index, e)}
                      className="bg-secondary text-xs flex-1"
                    />
                    {castMembers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCastMember(index)}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCastMember}>
            <Plus size={16} className="mr-1" /> Add Cast Member
          </Button>
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full btn-gold" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {uploadProgress || (editMovie ? 'UPDATING...' : 'UPLOADING...')}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Upload size={18} />
            {editMovie ? 'UPDATE ASSET' : 'UPLOAD TO GRID'}
          </span>
        )}
      </Button>
    </form>
  );
};
