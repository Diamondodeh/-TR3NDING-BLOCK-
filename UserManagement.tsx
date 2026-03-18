import { useState, useEffect } from 'react';
import { User, Shield, ShieldOff, Trash2, Crown, Search, Star } from 'lucide-react';
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

type AppRole = 'user' | 'admin' | 'executive_admin' | 'main_admin';

interface UserData {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: AppRole;
}

export const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          display_name: profile.display_name,
          role: (userRole?.role || 'user') as AppRole,
        };
      }) || [];

      setUsers(usersWithRoles);
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
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Role Updated',
        description: `User role changed to ${newRole.replace('_', ' ')}.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      toast({
        title: 'User Deleted',
        description: 'User has been removed from the grid.',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'main_admin':
        return <Crown size={16} className="text-primary" />;
      case 'executive_admin':
        return <Star size={16} className="text-yellow-400" />;
      case 'admin':
        return <Shield size={16} className="text-blue-400" />;
      default:
        return <User size={16} className="text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: AppRole) => {
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-bold uppercase";
    switch (role) {
      case 'main_admin':
        return `${baseClasses} bg-primary/20 text-primary`;
      case 'executive_admin':
        return `${baseClasses} bg-yellow-500/20 text-yellow-400`;
      case 'admin':
        return `${baseClasses} bg-blue-500/20 text-blue-400`;
      default:
        return `${baseClasses} bg-secondary text-muted-foreground`;
    }
  };

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
          placeholder="Search users..."
          className="bg-secondary pl-10"
        />
      </div>

      {/* User List */}
      <div className="space-y-2">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="glass-card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                {getRoleIcon(user.role)}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {user.display_name || user.email.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <span className={getRoleBadge(user.role)}>
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>

            {user.role !== 'main_admin' && (
              <div className="flex items-center gap-2 flex-wrap">
                {user.role === 'user' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateUserRole(user.user_id, 'admin')}
                      className="text-xs"
                    >
                      <Shield size={14} className="mr-1" />
                      Admin
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateUserRole(user.user_id, 'executive_admin')}
                      className="text-xs"
                    >
                      <Star size={14} className="mr-1" />
                      Executive
                    </Button>
                  </>
                )}
                
                {user.role === 'admin' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateUserRole(user.user_id, 'executive_admin')}
                      className="text-xs"
                    >
                      <Star size={14} className="mr-1" />
                      Promote
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateUserRole(user.user_id, 'user')}
                      className="text-xs"
                    >
                      <ShieldOff size={14} className="mr-1" />
                      Remove
                    </Button>
                  </>
                )}

                {user.role === 'executive_admin' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateUserRole(user.user_id, 'user')}
                    className="text-xs"
                  >
                    <ShieldOff size={14} className="mr-1" />
                    Demote
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="text-xs">
                      <Trash2 size={14} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {user.email}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteUser(user.user_id)}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};
