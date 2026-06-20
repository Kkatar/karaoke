import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2,
  Search, Plus, Edit, Trash2, LogIn, LogOut, LayoutDashboard, Home, Music, 
  Languages, User as UserIcon, Lock, Mail, Eye, EyeOff, Loader, 
  ArrowLeft, Upload, AlertCircle, CheckCircle, 
  Sparkles, RefreshCw, X
} from 'lucide-react';
import axios from 'axios';
import { User, Song, LyricsLine } from './types';

// ==========================================
// TOAST NOTIFICATION CONTEXT
// ==========================================
type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);
const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

// ==========================================
// AUTHENTICATION CONTEXT
// ==========================================
interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ==========================================
// PARSE LRC LYRICS FUNCTION
// ==========================================
const parseLyrics = (lrcText: string): LyricsLine[] => {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: LyricsLine[] = [];
  // Matches [00:12.34] or [01:05:22] etc.
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3]);
      const time = minutes * 60 + seconds + milliseconds / 100;
      const text = line.replace(timeRegex, '').trim();
      result.push({ time, text });
    } else {
      const text = line.trim();
      if (text && !text.startsWith('[')) {
        // Fallback: assign incremental times if no tags
        result.push({ time: result.length ? result[result.length - 1].time + 3 : 0, text });
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
};

// ==========================================
// MAIN COMPONENT & STATE MANAGER
// ==========================================
export default function App() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('kh_token'));
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState<'home' | 'player' | 'admin' | 'auth'>('home');
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch current user details on load
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get('/api/auth/me');
        setUser(res.data.user);
      } catch (err) {
        console.error('Session expired or error loading user:', err);
        localStorage.removeItem('kh_token');
        setToken(null);
        setUser(null);
        showToast('Session expired. Please log in again.', 'info');
      } finally {
        setAuthLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('kh_token', newToken);
    setToken(newToken);
    setUser(newUser);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setCurrentPage('home');
    showToast(`Welcome back, ${newUser.name}!`, 'success');
  };

  const logout = () => {
    localStorage.removeItem('kh_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    setCurrentPage('home');
    showToast('Logged out successfully.', 'info');
  };

  const updateUser = (newUser: User) => {
    setUser(newUser);
  };

  // Helper: check route protection
  const navigateTo = (page: 'home' | 'player' | 'admin' | 'auth', songId: string | null = null) => {
    if (page === 'admin' && (!user || user.role !== 'ADMIN')) {
      showToast('Access Denied: Admins only!', 'error');
      setCurrentPage('auth');
      setAuthView('login');
      return;
    }
    if (page === 'player' && !token) {
      showToast('Please log in to sing along!', 'info');
      setCurrentPage('auth');
      setAuthView('login');
      return;
    }
    setCurrentPage(page);
    if (songId) setCurrentSongId(songId);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <AuthContext.Provider value={{ token, user, isLoading: authLoading, login, logout, updateUser }}>
        
        {/* Ambient Nature Glowing Orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="bg-ambient-glow -top-40 -left-40" />
          <div className="bg-ambient-glow top-1/2 left-2/3" style={{ animationDelay: '-10s', background: 'radial-gradient(circle, rgba(29, 185, 84, 0.05) 0%, rgba(0, 0, 0, 0) 70%)' }} />
        </div>

        {/* Global Toast Overlay */}
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className={`flex items-center gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md ${
                  toast.type === 'success' 
                    ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' 
                    : toast.type === 'error'
                    ? 'bg-red-950/80 border-red-500/30 text-red-300'
                    : 'bg-zinc-950/80 border-zinc-500/30 text-zinc-300'
                }`}
              >
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                {toast.type === 'info' && <Music className="w-5 h-5 flex-shrink-0" />}
                <p className="text-sm font-medium flex-grow">{toast.message}</p>
                <button 
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Navbar */}
        <nav className="sticky top-0 z-40 w-full glass-panel border-x-0 border-t-0 border-b border-forest-800/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="bg-spotify-green p-2 rounded-xl text-black shadow-lg shadow-spotify-green/20 animate-pulse">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-emerald-300 to-spotify-green bg-clip-text text-transparent">
                KaraokeHub
              </h1>
              <span className="text-[10px] text-emerald-500/80 font-semibold uppercase tracking-wider block -mt-1">Nature Edition</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigateTo('home')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                currentPage === 'home' ? 'text-spotify-green bg-forest-800/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Home</span>
            </button>

            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => navigateTo('admin')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  currentPage === 'admin' ? 'text-spotify-green bg-forest-800/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">Admin</span>
              </button>
            )}

            {token && user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-forest-800/30">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-xs font-semibold text-white">{user.name}</span>
                  <span className="text-[10px] text-emerald-500/70 capitalize font-medium">{user.role}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-forest-700/50 border border-emerald-500/30 flex items-center justify-center text-spotify-green font-bold text-sm">
                  {user.name[0].toUpperCase()}
                </div>
                <button 
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setCurrentPage('auth'); setAuthView('login'); }}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-spotify-green hover:from-emerald-500 hover:to-spotify-hover text-black font-semibold text-xs md:text-sm px-4 py-2 rounded-xl transition-all shadow-lg shadow-spotify-green/10"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </nav>

        {/* Content Wrapper */}
        <main className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 min-h-[calc(100vh-140px)]">
          {authLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
              <Loader className="w-10 h-10 text-spotify-green animate-spin" />
              <p className="text-sm text-slate-400">Loading your profile...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {currentPage === 'home' && <HomePage key="home" navigateTo={navigateTo} />}
              {currentPage === 'auth' && <AuthPage key="auth" view={authView} setView={setAuthView} />}
              {currentPage === 'player' && currentSongId && <PlayerPage key="player" songId={currentSongId} navigateTo={navigateTo} />}
              {currentPage === 'admin' && <AdminPage key="admin" />}
            </AnimatePresence>
          )}
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-forest-800/10 py-6 text-center text-xs text-slate-500">
          <p>© 2026 KaraokeHub. Crafted with nature-inspired glassmorphism & premium high fidelity audio components.</p>
        </footer>

      </AuthContext.Provider>
    </ToastContext.Provider>
  );
}

// ==========================================
// 1. AUTH / LOGIN PAGE COMPONENT
// ==========================================
function AuthPage({ view, setView }: { view: 'login' | 'register' | 'forgot', setView: (v: 'login' | 'register' | 'forgot') => void }) {
  const { login } = useAuth();
  const { showToast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [mockToken, setMockToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === 'login') {
        const res = await axios.post('/api/auth/login', { email, password });
        login(res.data.token, res.data.user);
      } else if (view === 'register') {
        const res = await axios.post('/api/auth/register', { name, email, password });
        login(res.data.token, res.data.user);
      } else if (view === 'forgot') {
        const res = await axios.post('/api/auth/forgot-password', { email });
        setResetSent(true);
        if (res.data.resetToken) {
          setMockToken(res.data.resetToken);
        }
        showToast('Password reset details logged in terminal console!', 'info');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Authentication failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center justify-center min-h-[70vh] py-10"
    >
      <div className="w-full max-w-md relative">
        {/* Background Nature Art Accent behind the form card */}
        <div className="absolute inset-0 rounded-3xl bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=600')] bg-cover bg-center opacity-10 filter blur-xs -z-10 rounded-2xl border border-emerald-500/20" />

        <div className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-spotify-green">
            <UserIcon className="w-24 h-24" />
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-center text-white mb-2">
            {view === 'login' && 'Welcome Back'}
            {view === 'register' && 'Create Account'}
            {view === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-center text-emerald-500/80 font-medium mb-8">
            {view === 'login' && 'Unlock the ultimate singing arena'}
            {view === 'register' && 'Join the KaraokeHub community'}
            {view === 'forgot' && 'Send a secure recovery mock link'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {view === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                    placeholder="Arijit Singh"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                  placeholder="name@domain.com"
                />
              </div>
            </div>

            {view !== 'forgot' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  {view === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setView('forgot')} 
                      className="text-xs text-spotify-green hover:underline font-semibold"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 text-sm rounded-xl glass-input"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-spotify-green hover:from-emerald-500 hover:to-spotify-hover text-black font-semibold py-3 rounded-xl transition-all shadow-lg shadow-spotify-green/10 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin text-black" />
              ) : (
                <>
                  {view === 'login' && 'Sign In'}
                  {view === 'register' && 'Sign Up'}
                  {view === 'forgot' && 'Send Reset Instructions'}
                </>
              )}
            </button>
          </form>

          {view === 'forgot' && resetSent && (
            <div className="mt-6 p-4 rounded-xl bg-forest-800/20 border border-emerald-500/20 text-xs text-slate-300 space-y-2">
              <p className="text-emerald-400 font-semibold">✔ Check the Node Server terminal console output!</p>
              <p>We simulated sending an email. You can copy the raw reset token shown below or copy the url in the logs:</p>
              <div className="font-mono bg-black/60 p-2 rounded select-all break-all border border-forest-700/30 text-spotify-green">
                {mockToken || 'Token generated successfully'}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-forest-850/30 text-center text-sm">
            {view === 'login' ? (
              <p className="text-slate-400">
                New to KaraokeHub?{' '}
                <button onClick={() => setView('register')} className="text-spotify-green hover:underline font-semibold">
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-slate-400">
                Already have an account?{' '}
                <button onClick={() => setView('login')} className="text-spotify-green hover:underline font-semibold">
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 2. HOME PAGE COMPONENT
// ==========================================
function HomePage({ navigateTo }: { navigateTo: (page: 'home' | 'player' | 'admin' | 'auth', songId?: string) => void }) {
  const { showToast } = useToast();
  const { token } = useAuth();
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'All' | 'Hindi' | 'English'>('All');
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSongs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedLanguage, selectedArtist, page]);

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/songs', {
        params: {
          search,
          language: selectedLanguage,
          artist: selectedArtist,
          page,
          limit: 8
        }
      });
      setSongs(res.data.songs);
      setArtists(res.data.artists);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      showToast('Error loading songs list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  const handleLanguageChange = (lang: 'All' | 'Hindi' | 'English') => {
    setSelectedLanguage(lang);
    setPage(1);
  };

  const handleArtistChange = (art: string) => {
    setSelectedArtist(art);
    setPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel-heavy p-8 md:p-12 border border-forest-800/30 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200')] bg-cover bg-center opacity-10 filter mix-blend-overlay" />
        
        <div className="relative z-10 space-y-4 max-w-2xl text-center md:text-left">
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
            🎤 Interactive Synchronized Lyrics
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Sing along to your favorite <span className="text-spotify-green">Hindi & English</span> classics.
          </h2>
          <p className="text-sm md:text-base text-slate-400">
            Enjoy full high-fidelity audio, dynamic nature-themed card animations, and precise real-time lyrics scrolling. Free and open source.
          </p>
        </div>

        <div className="relative z-10 flex-shrink-0 bg-forest-800/30 border border-emerald-500/10 p-6 rounded-2xl backdrop-blur-xl w-full md:w-80 space-y-4">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-spotify-green" /> Quick Seeding Guide
          </h4>
          <p className="text-xs text-slate-400">
            If there are no songs, run this command or click below to populate the database with popular Hindi and English tracks.
          </p>
          <button 
            onClick={async () => {
              try {
                showToast('Seeding database with demo tracks...', 'info');
                // Backend seed endpoint is run via terminal seed.ts or a mock API
                showToast('To seed the database, run: npm run db:seed in your terminal', 'success');
              } catch (err) {
                showToast('Failed seeding process.', 'error');
              }
            }}
            className="w-full bg-forest-700/50 hover:bg-forest-600/70 border border-emerald-500/30 text-white font-medium text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Learn How to Seed
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between glass-panel p-4 rounded-2xl">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search song titles or artists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <div className="flex bg-forest-950/80 p-1 rounded-xl border border-forest-800/40">
            {(['All', 'Hindi', 'English'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  selectedLanguage === lang 
                    ? 'bg-spotify-green text-black shadow-lg shadow-spotify-green/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="relative flex-shrink-0">
            <select
              value={selectedArtist}
              onChange={(e) => handleArtistChange(e.target.value)}
              className="bg-forest-950/80 border border-forest-800/40 text-xs text-slate-300 font-semibold px-4 py-2 rounded-xl focus:outline-none focus:border-spotify-green"
            >
              <option value="">All Artists</option>
              {artists.map((artist) => (
                <option key={artist} value={artist}>{artist}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hindi & English Headers and Layout */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Languages className="w-5 h-5 text-spotify-green" /> 
            {selectedLanguage === 'All' ? 'Hindi & English Hits' : `${selectedLanguage} Hits`}
          </h3>
          <span className="text-xs text-slate-400 font-medium">Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          // Loading Skeletons
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden glass-card p-3 space-y-3 animate-pulse border border-forest-800/10">
                <div className="w-full aspect-[4/3] rounded-xl bg-forest-800/20" />
                <div className="h-4 bg-forest-850/40 rounded w-3/4" />
                <div className="h-3 bg-forest-850/40 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : songs.length === 0 ? (
          // Empty State
          <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-forest-800/30 rounded-full flex items-center justify-center text-slate-500 mx-auto">
              <Music className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">No songs found</h4>
            <p className="text-xs text-slate-400">
              Try broadening your filters, typing another search keyword, or seeding the database.
            </p>
            <button 
              onClick={() => { setSearch(''); setSelectedLanguage('All'); setSelectedArtist(''); }}
              className="bg-forest-800 hover:bg-forest-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          // Songs Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {songs.map((song) => {
              // Extract clean background or fallback to high-quality nature landscape
              const bgImg = song.backgroundUrl || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800';
              
              return (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -6 }}
                  className="group relative rounded-2xl overflow-hidden glass-card p-3 border border-forest-800/10 flex flex-col justify-between"
                >
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3">
                    <img 
                      src={bgImg} 
                      alt={song.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-all" />
                    
                    {/* Play Button Overlay */}
                    <button 
                      onClick={() => navigateTo(token ? 'player' : 'auth', song.id)}
                      className="absolute bottom-3 right-3 bg-spotify-green text-black p-3.5 rounded-full shadow-2xl scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-spotify-hover transform hover:scale-105 active:scale-95 z-20"
                    >
                      <Play className="w-5 h-5 fill-current text-black" />
                    </button>

                    <span className="absolute top-3 left-3 bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {song.language}
                    </span>
                  </div>

                  <div className="px-1 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 
                        onClick={() => navigateTo(token ? 'player' : 'auth', song.id)}
                        className="font-bold text-white text-base truncate cursor-pointer hover:text-spotify-green transition-all"
                      >
                        {song.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mb-2">{song.artist}</p>
                    </div>
                    
                    <button 
                      onClick={() => navigateTo(token ? 'player' : 'auth', song.id)}
                      className="w-full mt-2 bg-forest-950/60 hover:bg-forest-900 border border-forest-850 hover:border-emerald-500/40 text-emerald-400 text-xs font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 group-hover:bg-spotify-green group-hover:text-black group-hover:border-transparent"
                    >
                      <Music className="w-3.5 h-3.5" />
                      Sing Along
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-forest-800/40 bg-forest-950/60 text-xs text-slate-400 font-semibold transition-all hover:border-emerald-500/40 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400 font-bold px-3">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-forest-800/40 bg-forest-950/60 text-xs text-slate-400 font-semibold transition-all hover:border-emerald-500/40 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ==========================================
// 3. KARAOKE PLAYER PAGE COMPONENT
// ==========================================
function PlayerPage({ songId, navigateTo }: { songId: string, navigateTo: (page: 'home' | 'player' | 'admin' | 'auth', songId?: string) => void }) {
  const { showToast } = useToast();
  const [song, setSong] = useState<Song | null>(null);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Audio states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // LRC Lyrics parsing
  const [lyricsLines, setLyricsLines] = useState<LyricsLine[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLyricRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    fetchSongDetails();
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveIndex(-1);
  }, [songId]);

  const fetchSongDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/songs/${songId}`);
      setSong(res.data.song);
      setRecommendations(res.data.recommendations || []);
      
      // Parse LRC lyrics
      const parsed = parseLyrics(res.data.song.lyrics);
      setLyricsLines(parsed);
    } catch (err) {
      showToast('Error loading song details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Audio effects
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync lyrics highlight and scrolling
  useEffect(() => {
    if (lyricsLines.length === 0) return;

    // Find current index based on currentTime
    const idx = lyricsLines.findIndex((line, index) => {
      const nextLine = lyricsLines[index + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });

    if (idx !== activeIndex) {
      setActiveIndex(idx);
    }
  }, [currentTime, lyricsLines]);

  // Auto scroll current lyric line to center of lyrics viewport
  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        showToast('Playback failed, click again.', 'info');
      });
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remain = Math.floor(secs % 60);
    return `${mins}:${remain < 10 ? '0' : ''}${remain}`;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading || !song) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader className="w-10 h-10 text-spotify-green animate-spin" />
        <p className="text-sm text-slate-400">Loading audio engine and synchronized lyrics...</p>
      </div>
    );
  }

  // Fallback card background
  const bgImg = song.backgroundUrl || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`grid grid-cols-1 ${isFullscreen ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8`}
    >
      {/* Hidden native HTML5 audio component */}
      <audio
        ref={audioRef}
        src={song.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Left panel: player control / backdrop */}
      <div className={`col-span-1 lg:col-span-2 space-y-6 flex flex-col justify-between ${isFullscreen ? 'hidden lg:flex' : ''}`}>
        <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-video border border-forest-800/20">
          <img 
            src={bgImg} 
            alt={song.title} 
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.4] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040806] via-transparent to-transparent" />
          
          <button 
            onClick={() => navigateTo('home')}
            className="absolute top-4 left-4 p-2 rounded-xl bg-black/60 border border-white/10 hover:bg-black text-white transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Songs
          </button>

          <div className="absolute bottom-6 left-6 right-6">
            <span className="bg-spotify-green text-black font-bold uppercase text-[9px] px-2 py-0.5 rounded tracking-widest mb-1.5 inline-block">
              NOW SINGING
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-md truncate">
              {song.title}
            </h2>
            <p className="text-sm text-slate-300 font-medium drop-shadow-sm truncate">{song.artist}</p>
          </div>
        </div>

        {/* Dynamic audio player control strip */}
        <div className="glass-panel rounded-2xl p-6 border border-forest-800/20 space-y-4">
          
          {/* Seek progress slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleAudioSeek}
              className="w-full h-1.5 rounded-lg bg-forest-950/80 accent-spotify-green appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Volume controls */}
            <div className="flex items-center gap-3 w-1/4">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-slate-400 hover:text-white transition-all"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                className="w-20 md:w-28 h-1 rounded-lg bg-forest-950/80 accent-spotify-green cursor-pointer"
              />
            </div>

            {/* Playbacks */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }}
                title="-10 seconds"
                className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-forest-800/20 transition-all"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="p-4 bg-spotify-green hover:bg-spotify-hover text-black rounded-full shadow-lg shadow-spotify-green/20 hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </button>

              <button 
                onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10); }}
                title="+10 seconds"
                className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-forest-800/20 transition-all"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Fullscreen button */}
            <div className="flex justify-end w-1/4">
              <button 
                onClick={toggleFullscreen}
                className="p-2 text-slate-400 hover:text-white hover:bg-forest-800/20 rounded-lg transition-all"
                title={isFullscreen ? 'Exit fullscreen lyrics' : 'Fullscreen lyrics'}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel / Synchronized LRC display */}
      <div className={`col-span-1 ${isFullscreen ? 'lg:col-span-3 h-[75vh]' : 'lg:col-span-1 h-[550px]'} flex flex-col justify-between`}>
        <div className="glass-panel rounded-3xl p-6 border border-forest-800/20 flex flex-col h-full overflow-hidden">
          
          <div className="flex items-center justify-between pb-4 border-b border-forest-800/10 mb-4 flex-shrink-0">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-spotify-green animate-pulse" /> Synchronized Lyrics
            </h3>
            {isFullscreen && (
              <button 
                onClick={toggleFullscreen}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-forest-800/20 px-2.5 py-1 rounded-lg border border-white/5"
              >
                <Minimize2 className="w-3.5 h-3.5" /> Normal View
              </button>
            )}
          </div>

          {/* Scrolling lyrics area */}
          <div 
            ref={lyricsContainerRef}
            className="flex-grow overflow-y-auto space-y-6 scroll-smooth pr-2 flex flex-col py-36"
          >
            {lyricsLines.length === 0 ? (
              <div className="text-center text-slate-500 py-10 italic">
                No synchronized lyrics tags found for this song.
              </div>
            ) : (
              lyricsLines.map((line, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <p
                    key={idx}
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = line.time;
                        setCurrentTime(line.time);
                      }
                    }}
                    className={`lyric-line text-lg md:text-xl font-medium text-left cursor-pointer ${
                      isActive 
                        ? 'lyric-active' 
                        : idx < activeIndex 
                        ? 'text-slate-500 hover:text-slate-400' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            )}
          </div>

          <div className="pt-4 border-t border-forest-800/10 text-[10px] text-slate-500 text-center flex-shrink-0">
            💡 Click any lyric line to jump directly to that timestamp segment.
          </div>
        </div>
      </div>

      {/* Similar Tracks/Recommendations strip (only shown when not fullscreen lyrics) */}
      {!isFullscreen && recommendations.length > 0 && (
        <div className="col-span-1 lg:col-span-3 mt-6">
          <h3 className="text-lg font-bold text-white mb-4">You May Also Like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {recommendations.map((rec) => (
              <div 
                key={rec.id}
                onClick={() => navigateTo('player', rec.id)}
                className="flex items-center gap-3 p-3 rounded-xl bg-forest-950/40 border border-forest-800/10 cursor-pointer hover:border-emerald-500/20 hover:bg-forest-950/80 transition-all group"
              >
                <img 
                  src={rec.backgroundUrl || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800'} 
                  alt={rec.title} 
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="overflow-hidden">
                  <h4 className="font-semibold text-sm text-white truncate group-hover:text-spotify-green transition-all">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">{rec.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ==========================================
// 4. ADMIN DASHBOARD COMPONENT
// ==========================================
function AdminPage() {
  const { showToast } = useToast();
  
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit mode vs Create mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [lyrics, setLyrics] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');

  // File Upload states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminSongs();
  }, []);

  const fetchAdminSongs = async () => {
    setLoading(true);
    try {
      // Get all songs (larger limit for admin control)
      const res = await axios.get('/api/songs', { params: { limit: 100 } });
      setSongs(res.data.songs);
    } catch (err) {
      showToast('Failed to load songs directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInit = (song: Song) => {
    setIsEditing(true);
    setEditingId(song.id);
    setTitle(song.title);
    setArtist(song.artist);
    setLanguage(song.language);
    setLyrics(song.lyrics);
    setAudioUrl(song.audioUrl);
    setBackgroundUrl(song.backgroundUrl);
    setAudioFile(null);
    setBackgroundFile(null);
    
    // Smooth scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    clearForm();
  };

  const clearForm = () => {
    setTitle('');
    setArtist('');
    setLanguage('Hindi');
    setLyrics('');
    setAudioUrl('');
    setBackgroundUrl('');
    setAudioFile(null);
    setBackgroundFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this song?')) return;
    try {
      await axios.delete(`/api/songs/${id}`);
      showToast('Song deleted successfully.', 'success');
      fetchAdminSongs();
    } catch (err) {
      showToast('Failed to delete song.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('language', language);
    formData.append('lyrics', lyrics);
    formData.append('audioUrl', audioUrl);
    formData.append('backgroundUrl', backgroundUrl);

    if (audioFile) formData.append('audio', audioFile);
    if (backgroundFile) formData.append('background', backgroundFile);

    try {
      if (isEditing && editingId) {
        await axios.put(`/api/songs/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Song updated successfully!', 'success');
        setIsEditing(false);
        setEditingId(null);
      } else {
        await axios.post('/api/songs', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Song created successfully!', 'success');
      }
      clearForm();
      fetchAdminSongs();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Operation failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const loadLyricsTemplate = () => {
    const template = `[00:00.00](Intro Instrumental)
[00:05.00]Line one of song lyrics goes here
[00:10.00]Line two of song lyrics goes here
[00:15.00]Line three of song lyrics goes here
[00:20.00](Chorus/Beat drop)
[00:25.00]Chorus line one lyrics goes here`;
    setLyrics(template);
    showToast('Loaded LRC template. Replace with real timings!', 'info');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center border-b border-forest-800/10 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Admin Control Center</h2>
          <p className="text-sm text-slate-400">Publish, modify, or remove songs from the catalog.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Add/Edit Song */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 border border-forest-800/20 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                {isEditing ? <Edit className="w-5 h-5 text-spotify-green" /> : <Plus className="w-5 h-5 text-spotify-green" />}
                {isEditing ? 'Edit Song' : 'Create Song'}
              </h3>
              {isEditing && (
                <button 
                  onClick={handleCancelEdit}
                  className="text-xs text-red-400 hover:underline font-semibold"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Song Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl glass-input"
                  placeholder="e.g. Perfect"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Artist / Band</label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl glass-input"
                  placeholder="e.g. Ed Sheeran"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl glass-input cursor-pointer"
                  >
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              {/* Audio section */}
              <div className="border border-forest-800/10 p-3.5 rounded-2xl bg-black/30 space-y-3">
                <label className="block text-xs font-bold text-slate-350 uppercase tracking-wide">Audio Source File</label>
                
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Direct MP3 Link</label>
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg glass-input"
                    placeholder="https://example.com/song.mp3"
                  />
                </div>
                
                <div className="text-center text-[10px] text-slate-500 font-bold uppercase py-0.5">OR</div>
                
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Upload File (15MB limit)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAudioFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-forest-800 file:text-white file:cursor-pointer hover:file:bg-forest-700"
                  />
                  {audioFile && <span className="text-[10px] text-emerald-400 mt-1 block truncate">✔ {audioFile.name}</span>}
                </div>
              </div>

              {/* Background section */}
              <div className="border border-forest-800/10 p-3.5 rounded-2xl bg-black/30 space-y-3">
                <label className="block text-xs font-bold text-slate-350 uppercase tracking-wide">Background Backdrop</label>
                
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Direct Image URL</label>
                  <input
                    type="url"
                    value={backgroundUrl}
                    onChange={(e) => setBackgroundUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg glass-input"
                    placeholder="https://images.unsplash.com/photo..."
                  />
                </div>
                
                <div className="text-center text-[10px] text-slate-500 font-bold uppercase py-0.5">OR</div>
                
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setBackgroundFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-forest-800 file:text-white file:cursor-pointer hover:file:bg-forest-700"
                  />
                  {backgroundFile && <span className="text-[10px] text-emerald-400 mt-1 block truncate">✔ {backgroundFile.name}</span>}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Synchronized LRC Lyrics</label>
                  <button 
                    type="button" 
                    onClick={loadLyricsTemplate}
                    className="text-[10px] text-spotify-green hover:underline flex items-center gap-1 font-bold"
                  >
                    <Sparkles className="w-3 h-3" /> Templates
                  </button>
                </div>
                <textarea
                  required
                  rows={8}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input font-mono"
                  placeholder="[00:05.10]Line lyrics here..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-spotify-green hover:bg-spotify-hover text-black font-semibold py-3 rounded-xl transition-all shadow-lg shadow-spotify-green/10 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <>
                    {isEditing ? 'Save Changes' : 'Publish Song'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Songs Directory List */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-3xl p-6 border border-forest-800/20 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-spotify-green" /> Songs Directory ({songs.length})
              </h3>
              
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader className="w-8 h-8 text-spotify-green animate-spin" />
                </div>
              ) : songs.length === 0 ? (
                <div className="text-center py-20 text-slate-500 italic">No songs found in catalog. Add your first track on the left!</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-forest-850/30 text-slate-400 uppercase font-semibold">
                        <th className="pb-3 pr-4">Details</th>
                        <th className="pb-3 pr-4">Language</th>
                        <th className="pb-3 pr-4 hidden md:table-cell">LRC Sync</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-forest-850/10">
                      {songs.map((song) => (
                        <tr key={song.id} className="group hover:bg-forest-800/10 transition-all">
                          <td className="py-3 pr-4 flex items-center gap-3">
                            <img 
                              src={song.backgroundUrl || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800'} 
                              alt={song.title} 
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="overflow-hidden max-w-[150px] sm:max-w-xs">
                              <h5 className="font-semibold text-slate-200 truncate">{song.title}</h5>
                              <p className="text-[10px] text-slate-400 truncate">{song.artist}</p>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="bg-forest-950/80 border border-forest-850 text-emerald-400 px-2 py-0.5 rounded font-semibold text-[9px] uppercase tracking-wider">
                              {song.language}
                            </span>
                          </td>
                          <td className="py-3 pr-4 hidden md:table-cell text-slate-400">
                            {parseLyrics(song.lyrics).length} synced lines
                          </td>
                          <td className="py-3 text-right space-x-1.5">
                            <button
                              onClick={() => handleEditInit(song)}
                              title="Edit Track"
                              className="p-2 rounded-lg bg-forest-800/30 border border-forest-750 text-slate-300 hover:text-spotify-green hover:border-spotify-green/45 transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(song.id)}
                              title="Delete Track"
                              className="p-2 rounded-lg bg-red-950/10 border border-red-900/25 text-slate-300 hover:text-red-400 hover:border-red-500/45 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
