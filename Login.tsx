import { Layout } from '@/components/Layout';
import { AdBanner } from '@/components/AdBanner';
import { Play, Mail, Lock, ArrowRight, Shield, Zap, LogIn, UserPlus, WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setNetworkError(false);

    // Validate
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (!error) {
          navigate('/');
        } else if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed')) {
          setNetworkError(true);
        }
      } else {
        const { error } = await signUp(email, password);
        if (!error) {
          navigate('/');
        } else if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed')) {
          setNetworkError(true);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
        setNetworkError(true);
      }
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <Layout showHeader={false} showNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showHeader={false} showNav={false}>
      <div className="min-h-screen flex flex-col animate-fade-in">
        {/* Hero Section */}
        {/* Back Button */}
        <div className="w-full px-4 pt-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center gold-glow">
              <Play size={28} className="text-primary-foreground ml-1" fill="currentColor" />
            </div>
            <span className="font-display text-3xl tracking-wider text-foreground">
              TR3NDING BLOCK
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl text-center text-foreground mb-2">
            {isLogin ? 'LOGIN' : 'SIGN UP'}
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            {isLogin 
              ? 'Sign in to access your account' 
              : 'Create a new account to get started'}
          </p>

          {/* Network Error Banner */}
          {networkError && (
            <div className="w-full max-w-sm mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <WifiOff size={20} className="text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">Connection Error</p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  Unable to reach the server. Please check your internet connection and try again.
                </p>
              </div>
              <button 
                onClick={() => setNetworkError(false)}
                className="text-destructive/60 hover:text-destructive text-xs underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            {/* Email */}
            <div>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-12 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-12 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-gold flex items-center justify-center gap-2 py-4 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : networkError ? (
                <>
                  <RefreshCw size={20} />
                  <span>RETRY</span>
                </>
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  <span>{isLogin ? 'LOGIN' : 'SIGN UP'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button 
              onClick={() => { setIsLogin(!isLogin); setNetworkError(false); }}
              className="text-primary font-semibold hover:underline mt-1"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">4K STREAMING</p>
                <p className="text-xs text-muted-foreground">Ultra HD</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">SECURE</p>
                <p className="text-xs text-muted-foreground">Encrypted</p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Banner */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-t border-primary/30 px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-primary font-semibold tracking-wider">
              SPONSORED CONTENT PROVIDER
            </span>
            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded">
              PREMIUM
            </span>
          </div>
        </div>

        <AdBanner />
      </div>
    </Layout>
  );
};

export default Login;
