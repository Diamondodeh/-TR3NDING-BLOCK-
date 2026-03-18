import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { 
  Download, 
  HardDrive, 
  Wifi, 
  Smartphone, 
  Film, 
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Star,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DownloadItem {
  id: string;
  title: string;
  thumbnail: string;
  size: string;
  progress: number;
  status: 'downloading' | 'completed' | 'paused';
  quality: string;
  video_url?: string;
  movie_id?: string;
  episode_id?: string;
  season_number?: number;
  episode_number?: number;
}

interface EpisodeGroup {
  movie_id: string;
  title: string;
  thumbnail: string;
  episodes: DownloadItem[];
}

type TabType = 'library' | 'active' | 'device';

const Downloads = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<EpisodeGroup | null>(null);
  
  const tabs = [
    { id: 'library' as TabType, label: 'LIBRARY', icon: HardDrive },
    { id: 'active' as TabType, label: 'DOWNLOADING', icon: Wifi },
    { id: 'device' as TabType, label: 'LOCAL FILES', icon: Smartphone }
  ];

  useEffect(() => {
    if (user) {
      fetchDownloads();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchDownloads = async () => {
    try {
      const { data, error } = await supabase
        .from('downloads')
        .select('*')
        .eq('user_id', user?.id)
        .order('downloaded_at', { ascending: false });

      if (error) throw error;

      const mappedDownloads: DownloadItem[] = (data || []).map(d => ({
        id: d.id,
        title: d.movie_title,
        thumbnail: d.poster_url || '/placeholder.svg',
        size: d.file_size || '~1 GB',
        progress: 100,
        status: (d.status as 'downloading' | 'completed' | 'paused') || 'completed',
        quality: d.quality,
        video_url: d.video_url || undefined,
        movie_id: d.movie_id || undefined,
        episode_id: d.episode_id || undefined,
      }));

      setDownloads(mappedDownloads);
    } catch (error) {
      console.error('Error fetching downloads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDownload = async (downloadId: string, title: string) => {
    try {
      // Delete from downloads table
      await supabase
        .from('downloads')
        .delete()
        .eq('id', downloadId);

      // Add to deleted_movies for tracking
      if (user) {
        await supabase
          .from('deleted_movies')
          .insert({
            user_id: user.id,
            movie_title: title,
          });
      }

      setDownloads(prev => prev.filter(d => d.id !== downloadId));
    } catch (error) {
      console.error('Error deleting download:', error);
    }
  };

  const playDownload = (item: DownloadItem) => {
    // Navigate with video data so player can use it directly
    navigate(`/watch/${item.movie_id || item.id}`, {
      state: {
        videoUrl: item.video_url,
        title: item.title,
        thumbnail: item.thumbnail,
      }
    });
  };

  // Group episodes by series
  const groupSeriesEpisodes = (): EpisodeGroup[] => {
    const groups: { [key: string]: EpisodeGroup } = {};
    
    downloads
      .filter(d => d.episode_id && d.status === 'completed')
      .forEach(d => {
        const key = d.movie_id || d.id;
        if (!groups[key]) {
          groups[key] = {
            movie_id: key,
            title: d.title.split(' - ')[0] || d.title,
            thumbnail: d.thumbnail,
            episodes: [],
          };
        }
        groups[key].episodes.push(d);
      });

    // Sort episodes by season and episode number
    Object.values(groups).forEach(group => {
      group.episodes.sort((a, b) => {
        const seasonA = a.season_number || 1;
        const seasonB = b.season_number || 1;
        if (seasonA !== seasonB) return seasonA - seasonB;
        return (a.episode_number || 1) - (b.episode_number || 1);
      });
    });

    return Object.values(groups);
  };

  const handleSeriesClick = (group: EpisodeGroup) => {
    if (group.episodes.length > 1) {
      setSelectedSeries(group);
      setShowEpisodeList(true);
    } else if (group.episodes.length === 1) {
      playDownload(group.episodes[0]);
    }
  };

  const playNextEpisode = (currentEpisode: DownloadItem) => {
    if (!selectedSeries) return;
    
    const currentIndex = selectedSeries.episodes.findIndex(e => e.id === currentEpisode.id);
    if (currentIndex < selectedSeries.episodes.length - 1) {
      playDownload(selectedSeries.episodes[currentIndex + 1]);
    }
  };

  const completedDownloads = downloads.filter(d => d.status === 'completed' && !d.episode_id);
  const downloadingItems = downloads.filter(d => d.status === 'downloading');
  const seriesGroups = groupSeriesEpisodes();

  const renderDownloadItem = (item: DownloadItem, showProgress = true) => (
    <div key={item.id} className="glass-card p-4 flex gap-4">
      {/* Thumbnail */}
      <div className="w-20 h-28 rounded-lg bg-secondary overflow-hidden relative flex-shrink-0">
        <img 
          src={item.thumbnail} 
          alt={item.title}
          className="w-full h-full object-cover"
        />
        {item.quality && (
          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded">
            {item.quality}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{item.title}</h3>
        <p className="text-xs text-muted-foreground mb-2">{item.size}</p>

        {showProgress && item.status !== 'completed' && (
          <>
            {/* Progress Bar */}
            <div className="w-full bg-secondary rounded-full h-2 mb-2 overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  item.status === 'downloading' 
                    ? "bg-gradient-to-r from-primary to-primary/70" 
                    : "bg-muted-foreground"
                )}
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary font-semibold">
                {item.progress}% DOWNLOADING
              </span>
              <div className="flex gap-2">
                <button className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  {item.status === 'downloading' ? (
                    <Pause size={14} className="text-foreground" />
                  ) : (
                    <Play size={14} className="text-foreground ml-0.5" />
                  )}
                </button>
                <button 
                  onClick={() => deleteDownload(item.id, item.title)}
                  className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center"
                >
                  <Trash2 size={14} className="text-destructive" />
                </button>
              </div>
            </div>
          </>
        )}

        {item.status === 'completed' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-primary">
              <CheckCircle size={14} />
              <span className="text-xs font-semibold">SYNCED</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => playDownload(item)}
                className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"
              >
                <Play size={14} className="text-primary ml-0.5" />
              </button>
              <button 
                onClick={() => deleteDownload(item.id, item.title)}
                className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center"
              >
                <Trash2 size={14} className="text-destructive" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSeriesGroup = (group: EpisodeGroup) => (
    <button 
      key={group.movie_id} 
      onClick={() => handleSeriesClick(group)}
      className="glass-card p-4 flex gap-4 w-full text-left hover:bg-secondary/50 transition-colors"
    >
      {/* Thumbnail */}
      <div className="w-20 h-28 rounded-lg bg-secondary overflow-hidden relative flex-shrink-0">
        <img 
          src={group.thumbnail} 
          alt={group.title}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded">
          {group.episodes.length} EP
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{group.title}</h3>
        <p className="text-xs text-muted-foreground mb-2">{group.episodes.length} episodes downloaded</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-primary">
            <List size={14} />
            <span className="text-xs font-semibold">TAP TO VIEW</span>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <Play size={14} className="ml-0.5" />
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <Layout>
      <div className="animate-fade-in pb-20">
        {/* Header */}
        <div className="px-4 pt-4 mb-4">
          <h1 className="font-display text-3xl text-foreground">DOWNLOADS</h1>
          <p className="text-sm text-muted-foreground">Manage your synchronized assets</p>
        </div>

        {/* Tabs */}
        <div className="px-4 mb-6">
          <div className="flex gap-2 p-1 bg-secondary rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all",
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 space-y-4">
          {activeTab === 'library' && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Series Groups */}
                  {seriesGroups.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground">SERIES</h3>
                      {seriesGroups.map(group => renderSeriesGroup(group))}
                    </div>
                  )}

                  {/* Movies */}
                  {completedDownloads.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground">MOVIES</h3>
                      {completedDownloads.map(item => renderDownloadItem(item, false))}
                    </div>
                  )}

                  {completedDownloads.length === 0 && seriesGroups.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                        <Download size={32} className="text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No assets in library</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'active' && (
            <>
              {downloadingItems.length > 0 ? (
                downloadingItems.map(item => renderDownloadItem(item, true))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <Wifi size={32} className="text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No active downloads</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'device' && (
            <>
              <div className="glass-card p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <HardDrive size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Local Storage</p>
                    <p className="text-xs text-muted-foreground">Videos from your device</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <Smartphone size={32} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Local video access requires browser permissions
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Downloaded content will appear here
                </p>
              </div>
            </>
          )}
        </div>

        {/* Ad Banner - Below everything */}
        <div className="px-4 mt-6">
          <div className="w-full py-3 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-lg pointer-events-none">
            <div className="flex items-center justify-center gap-2">
              <Star size={14} className="text-primary" />
              <span className="text-xs text-primary font-semibold tracking-wider">
                SPONSORED CONTENT
              </span>
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded">
                AD
              </span>
            </div>
          </div>
        </div>

        <AdBanner />
      </div>

      {/* Episode List Dialog */}
      <Dialog open={showEpisodeList} onOpenChange={setShowEpisodeList}>
        <DialogContent className="bg-background border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{selectedSeries?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedSeries?.episodes.map((ep, index) => (
              <button
                key={ep.id}
                onClick={() => {
                  setShowEpisodeList(false);
                  playDownload(ep);
                }}
                className="w-full glass-card p-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Play size={16} className="text-primary ml-0.5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground text-sm">
                    {ep.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{ep.quality} · {ep.size}</p>
                </div>
                {index < selectedSeries.episodes.length - 1 && (
                  <span className="text-xs text-primary">→</span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Downloads;
