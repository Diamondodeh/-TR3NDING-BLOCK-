import { useState, useEffect } from 'react';
import { Megaphone, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export const AdSettings = () => {
  const { toast } = useToast();
  const [adId, setAdId] = useState('');
  const [appId, setAppId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .in('setting_key', ['admob_ad_id', 'admob_app_id']);

      if (error) throw error;

      data?.forEach((setting) => {
        if (setting.setting_key === 'admob_ad_id') {
          setAdId(setting.setting_value || '');
        } else if (setting.setting_key === 'admob_app_id') {
          setAppId(setting.setting_value || '');
        }
      });
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update ad id
      await supabase
        .from('app_settings')
        .update({ setting_value: adId })
        .eq('setting_key', 'admob_ad_id');

      // Update app id
      await supabase
        .from('app_settings')
        .update({ setting_value: appId })
        .eq('setting_key', 'admob_app_id');

      toast({
        title: 'Settings Saved',
        description: 'Ad configuration has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Megaphone size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg text-foreground">AD MONETIZATION</h3>
          <p className="text-xs text-muted-foreground">Configure AdMob/AdSense IDs</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="appId" className="text-foreground">App ID</Label>
          <Input
            id="appId"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder="ca-app-pub-XXXXXXXXXXXXXXXX"
            className="bg-secondary font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Your AdMob/AdSense Application ID
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adId" className="text-foreground">Ad Unit ID</Label>
          <Input
            id="adId"
            value={adId}
            onChange={(e) => setAdId(e.target.value)}
            placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
            className="bg-secondary font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Your Ad Unit ID for displaying ads
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full btn-gold"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              SAVING...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={18} />
              SAVE SETTINGS
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};
