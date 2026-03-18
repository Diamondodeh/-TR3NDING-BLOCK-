import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Moon, 
  Wifi, 
  Bell,
  Shield,
  Heart,
  Trash2,
  Download,
  Crown,
  Film,
  Users,
  Plus,
  ArrowLeft,
  Megaphone,
  FileText,
  Star,
  Link
} from 'lucide-react';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { MovieUploadForm } from '@/components/admin/MovieUploadForm';
import { MovieList } from '@/components/admin/MovieList';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdSettings } from '@/components/admin/AdSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrivacyPolicyDialog } from '@/components/PrivacyPolicyDialog';
import logoImage from '@/assets/logo.jpg';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, role, isAdmin, isExecutiveAdmin, isMainAdmin, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [dataSaving, setDataSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminView, setAdminView] = useState<'list' | 'upload' | 'edit'>('list');
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const quickActions = [
    { icon: Heart, label: 'Favorites', count: 0, path: '/favorites' },
    { icon: Trash2, label: 'Deleted', count: 0, path: '/deleted' },
    { icon: Download, label: 'Downloads', count: 0, path: '/downloads' },
  ];

  const menuItems = [
    { icon: Shield, label: 'Privacy & Security', path: '/privacy' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleEditMovie = (movie: any) => {
    setEditingMovie(movie);
    setAdminView('edit');
  };

  const handleUploadSuccess = () => {
    setAdminView('list');
    setEditingMovie(null);
  };

  // Show admin panel view
  if (showAdminPanel && isAdmin) {
    return (
      <Layout>
        <div className="animate-fade-in px-4 pt-4 pb-20">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                if (adminView !== 'list') {
                  setAdminView('list');
                  setEditingMovie(null);
                } else {
                  setShowAdminPanel(false);
                }
              }}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <div>
              <h1 className="font-display text-2xl text-foreground">
                {adminView === 'upload' ? 'UPLOAD ASSET' : 
                 adminView === 'edit' ? 'EDIT ASSET' : 
                 'MANAGE TRENDING BLOCK'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isMainAdmin ? 'MAIN ADMIN ACCESS' : isExecutiveAdmin ? 'EXECUTIVE ADMIN ACCESS' : 'ADMIN ACCESS'}
              </p>
            </div>
          </div>

          {adminView === 'list' && (
            <>
              {/* Admin Tabs */}
              <Tabs defaultValue="movies" className="w-full">
                <TabsList className="w-full bg-secondary mb-4">
                  <TabsTrigger value="movies" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Film size={16} className="mr-2" />
                    Movies
                  </TabsTrigger>
                  {isExecutiveAdmin && (
                    <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Users size={16} className="mr-2" />
                      Users
                    </TabsTrigger>
                  )}
                  {isMainAdmin && (
                    <TabsTrigger value="ads" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Megaphone size={16} className="mr-2" />
                      Ads
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="movies" className="mt-0">
                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setAdminView('upload')}
                      className="flex-1 btn-gold flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      UPLOAD ASSET
                    </button>
                    <button
                      onClick={() => navigate('/import')}
                      className="flex-1 bg-secondary text-foreground py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                    >
                      <Link size={18} />
                      IMPORT URL
                    </button>
                  </div>

                  <MovieList onEdit={handleEditMovie} />
                </TabsContent>

                {isExecutiveAdmin && (
                  <TabsContent value="users" className="mt-0">
                    <UserManagement />
                  </TabsContent>
                )}

                {isMainAdmin && (
                  <TabsContent value="ads" className="mt-0">
                    <AdSettings />
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}

          {(adminView === 'upload' || adminView === 'edit') && (
            <MovieUploadForm
              editMovie={editingMovie}
              onSuccess={handleUploadSuccess}
            />
          )}

          <AdBanner />
        </div>
      </Layout>
    );
  }

  // Generate node ID from user ID
  const nodeId = user?.id 
    ? `NODE-${user.id.substring(0, 4).toUpperCase()}-${user.id.substring(4, 8).toUpperCase()}`
    : 'NODE-XXXX-XXXX';

  const getRoleIcon = () => {
    if (isMainAdmin) return <Crown size={14} className="text-primary-foreground" />;
    if (isExecutiveAdmin) return <Star size={14} className="text-primary-foreground" />;
    return null;
  };

  return (
    <Layout>
      <div className="animate-fade-in px-4 pt-4 pb-20">
        {/* Profile Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center relative overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-primary" />
              )}
              {(isMainAdmin || isExecutiveAdmin) && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  {getRoleIcon()}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground">
                {profile?.display_name || user?.email?.split('@')[0] || 'GUEST'}
              </h2>
              <p className="text-xs text-muted-foreground font-mono mt-1">{nodeId}</p>
              {role && (
                <span className="inline-block mt-2 px-3 py-1 bg-primary/20 rounded-full text-xs font-bold text-primary uppercase tracking-wider">
                  {role.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
          
          {!user ? (
            <button 
              onClick={() => navigate('/login')}
              className="w-full btn-gold mt-6"
            >
              LOGIN
            </button>
          ) : (
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors mt-6"
            >
              <LogOut size={18} />
              LOGOUT
            </button>
          )}
        </div>

        {/* Admin Quick Access - Only for Admin/Executive Admin/Main Admin */}
        {isAdmin && (
          <section className="mb-6">
            <button
              onClick={() => setShowAdminPanel(true)}
              className="w-full glass-card p-4 flex items-center justify-between hover:bg-secondary/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Settings size={24} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-display text-lg text-foreground">MANAGE TRENDING BLOCK</p>
                  <p className="text-xs text-muted-foreground">
                    {isMainAdmin ? 'Movies, Users & Ad Settings' : 
                     isExecutiveAdmin ? 'Movies & User Management' : 
                     'Upload & Manage Content'}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-primary" />
            </button>
          </section>
        )}

        {/* Quick Actions */}
        <section className="mb-6">
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={cn(
                  "glass-card p-4 flex flex-col items-center gap-2",
                  "hover:bg-secondary/80 transition-colors"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <action.icon size={24} className="text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Settings */}
        <section className="mb-6">
          <h3 className="font-display text-lg mb-3 text-foreground">PREFERENCES</h3>
          
          <div className="glass-card divide-y divide-border/50">
            {/* Dark Theme */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Moon size={20} className="text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Dark Theme</p>
                  <p className="text-xs text-muted-foreground">Enable dark mode</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            {/* Data Saving */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Wifi size={20} className="text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Data Saving</p>
                  <p className="text-xs text-muted-foreground">Reduce data usage</p>
                </div>
              </div>
              <Switch checked={dataSaving} onCheckedChange={setDataSaving} />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Bell size={20} className="text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Notifications</p>
                  <p className="text-xs text-muted-foreground">Push notifications</p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </div>
        </section>

        {/* Menu Items */}
        <section className="mb-6">
          <h3 className="font-display text-lg mb-3 text-foreground">SETTINGS</h3>
          
          <div className="glass-card divide-y divide-border/50">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <item.icon size={20} className="text-foreground" />
                  </div>
                  <p className="font-medium text-foreground">{item.label}</p>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>

        {/* Exit Button - Only when logged in */}
        {user && (
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/20 text-destructive font-medium hover:bg-destructive/30 transition-colors"
          >
            <LogOut size={18} />
            EXIT
          </button>
        )}

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          TR3NDING BLOCK v1.0.0 • NODE {user ? 'ACTIVE' : 'OFFLINE'}
        </p>

        {/* Privacy Policy Button */}
        <button
          onClick={() => setShowPrivacyPolicy(true)}
          className="w-full flex items-center justify-center gap-2 py-3 mt-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
        >
          <FileText size={18} />
          Privacy Policy
        </button>

        {/* Privacy Policy Dialog */}
        <PrivacyPolicyDialog 
          isOpen={showPrivacyPolicy} 
          onClose={() => setShowPrivacyPolicy(false)} 
        />

        {/* Ad Banner */}
        <AdBanner />
      </div>
    </Layout>
  );
};

export default Profile;
