import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { 
  Mic, MicOff, Play, Pause, Send, Moon, Sun, Sparkles, User, 
  LogOut, Crown, Home, MessageCircle, Scan, Users, Settings,
  ChevronRight, Star, Zap, Heart, Brain, Volume2, VolumeX,
  Layers, Eye, BookOpen
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ======================== CONTEXT ========================
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('yky_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    localStorage.setItem('yky_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem('yky_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('yky_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ======================== SPLASH SCREEN ========================
const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cosmic-bg noise"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Dragon/Orb */}
      <motion.div
        className="relative w-48 h-48 mb-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1.5, type: 'spring' }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-900/50 orb" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-16 h-16 text-emerald-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="font-syne text-5xl md:text-7xl font-bold mb-4 text-glow"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <span className="text-emerald-400">YKY</span>
        <span className="text-gold-light ml-2">Hub</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="font-outfit text-xl text-emerald-300/70 mb-8 text-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        Everything you are, in one breath.
      </motion.p>

      {/* Dr Ethergreen Signature */}
      <motion.div
        className="flex items-center gap-2 text-gold-light/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
      >
        <div className="w-8 h-8 rounded-full border border-gold-light/30 flex items-center justify-center">
          <span className="text-xs font-syne">DE</span>
        </div>
        <span className="font-outfit text-sm tracking-widest">Dr Ethergreen</span>
      </motion.div>

      {/* Loading Indicator */}
      <motion.div
        className="absolute bottom-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        <div className="spinner" />
      </motion.div>
    </motion.div>
  );
};

// ======================== AUTH PAGE ========================
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', birth_date: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      toast.success(isLogin ? 'Welcome back, Seeker' : 'Your journey begins');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg noise flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md glass rounded-2xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-900/50 flex items-center justify-center glow-emerald">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <h2 className="font-syne text-3xl font-bold text-center mb-2 text-glow">
          {isLogin ? 'Welcome Back' : 'Begin Your Journey'}
        </h2>
        <p className="text-emerald-300/60 text-center mb-8 font-outfit">
          {isLogin ? 'The Oracle awaits' : 'Discover your true nature'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Your Name"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required={!isLogin}
              data-testid="register-name-input"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            data-testid="auth-email-input"
          />
          <input
            type="password"
            placeholder="Password"
            className="input"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            data-testid="auth-password-input"
          />
          {!isLogin && (
            <input
              type="date"
              placeholder="Birth Date"
              className="input"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              data-testid="register-birthdate-input"
            />
          )}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
            data-testid="auth-submit-btn"
          >
            {loading ? 'Channeling...' : isLogin ? 'Enter the Portal' : 'Awaken'}
          </button>
        </form>

        <p className="text-center mt-6 text-emerald-300/60">
          {isLogin ? "New seeker?" : "Already awakened?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-emerald-400 hover:text-emerald-300 transition-colors"
            data-testid="auth-toggle-btn"
          >
            {isLogin ? 'Begin your journey' : 'Enter the portal'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

// ======================== NAVIGATION ========================
const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/oracle', icon: MessageCircle, label: 'Oracle' },
    { path: '/tarot', icon: BookOpen, label: 'Tarot' },
    { path: '/bio-scan', icon: Scan, label: 'Bio Scan' },
    { path: '/community', icon: Users, label: 'Community' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-900/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-syne text-xl font-bold text-emerald-400">YKY Hub</span>
          </div>

          {/* Nav Items */}
          <div className="flex items-center justify-around w-full md:w-auto md:gap-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === path
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-emerald-300/50 hover:text-emerald-300'
                }`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs md:text-sm font-outfit">{label}</span>
              </button>
            ))}
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {user?.is_premium && (
              <div className="flex items-center gap-1 text-gold-light text-sm">
                <Crown className="w-4 h-4" />
                <span className="font-outfit">Premium</span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-emerald-300/50 hover:text-emerald-300 p-2"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ======================== DASHBOARD ========================
const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [soulprint, setSoulprint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSoulprint();
  }, []);

  const fetchSoulprint = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/soulprint`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSoulprint(data);
      }
    } catch (err) {
      console.error('Error fetching soulprint:', err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: MessageCircle, label: 'Voice Oracle', desc: 'Speak with Dr. Ethergreen', path: '/oracle', color: 'emerald' },
    { icon: BookOpen, label: 'Tarot Reading', desc: 'Hyper-personalized draws', path: '/tarot', color: 'gold', premium: true },
    { icon: Scan, label: 'Bio Scanner', desc: 'Voice resonance analysis', path: '/bio-scan', color: 'blood' },
    { icon: Layers, label: 'Database', desc: '20k+ remedies', path: '/database', color: 'emerald' },
  ];

  return (
    <div className="min-h-screen cosmic-bg noise pb-24 md:pt-24" data-testid="dashboard">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-syne text-4xl md:text-5xl font-bold mb-2">
            Welcome, <span className="text-emerald-400 text-glow">{user?.name || 'Seeker'}</span>
          </h1>
          <p className="font-outfit text-emerald-300/60 text-lg">
            The cosmos aligns for your awakening
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Oracle Card - Large */}
          <motion.div
            className="md:col-span-2 lg:col-span-1 lg:row-span-2 card cursor-pointer group relative overflow-hidden"
            onClick={() => navigate('/oracle')}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            data-testid="oracle-card"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-900/50 flex items-center justify-center orb">
                <MessageCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="font-syne text-2xl font-bold text-center mb-2">Voice Oracle</h3>
              <p className="text-emerald-300/60 text-center font-outfit">
                Speak your truth. Dr. Ethergreen awaits.
              </p>
            </div>
          </motion.div>

          {/* Soulprint Preview */}
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne text-lg font-bold">Your Soulprint</h3>
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner" /></div>
            ) : soulprint && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300/60 text-sm">Human Design</span>
                  <span className="text-emerald-400 font-outfit">{soulprint.human_design?.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300/60 text-sm">Life Path</span>
                  <span className="text-gold-light font-outfit">{soulprint.numerology?.life_path || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300/60 text-sm">Primary Gene Key</span>
                  <span className="text-blood-light font-outfit">{soulprint.gene_keys?.life_work?.key || '—'}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick Actions */}
          {features.slice(1).map((feature, idx) => (
            <motion.div
              key={feature.path}
              className={`card cursor-pointer group relative overflow-hidden ${
                feature.premium && !user?.is_premium ? 'opacity-75' : ''
              }`}
              onClick={() => navigate(feature.path)}
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              data-testid={`feature-${feature.label.toLowerCase().replace(' ', '-')}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <feature.icon className={`w-8 h-8 mb-3 ${
                    feature.color === 'emerald' ? 'text-emerald-400' :
                    feature.color === 'gold' ? 'text-gold-light' : 'text-blood-light'
                  }`} />
                  <h3 className="font-syne text-lg font-bold mb-1">{feature.label}</h3>
                  <p className="text-emerald-300/60 text-sm font-outfit">{feature.desc}</p>
                </div>
                {feature.premium && (
                  <Crown className="w-5 h-5 text-gold-light" />
                )}
              </div>
              <ChevronRight className="absolute right-4 bottom-4 w-5 h-5 text-emerald-400/50 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </motion.div>
          ))}

          {/* Premium CTA */}
          {!user?.is_premium && (
            <motion.div
              className="card bg-gradient-to-br from-gold-light/10 to-transparent border-gold-light/20 cursor-pointer"
              onClick={() => navigate('/premium')}
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              data-testid="premium-cta"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gold-light/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-gold-light" />
                </div>
                <div>
                  <h3 className="font-syne text-lg font-bold text-gold-light">Unlock Premium</h3>
                  <p className="text-gold-light/60 text-sm font-outfit">$19.99/mo • Unlimited access</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

// ======================== VOICE ORACLE ========================
const VoiceOracle = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const endpoint = audioEnabled ? '/api/oracle/speak' : '/api/oracle/chat';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      if (!res.ok) throw new Error('Oracle unavailable');
      const data = await res.json();

      const oracleMessage = { 
        role: 'oracle', 
        content: data.text || data.response,
        audio: data.audio_base64
      };
      setMessages(prev => [...prev, oracleMessage]);

      // Play audio if available
      if (data.audio_base64 && audioEnabled) {
        playAudio(data.audio_base64);
      }
    } catch (err) {
      toast.error('The Oracle is meditating. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (base64) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audioRef.current = audio;
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.play();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Transcribe
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');

        try {
          const res = await fetch(`${API_URL}/api/oracle/listen`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          if (res.ok) {
            const data = await res.json();
            if (data.transcription) {
              sendMessage(data.transcription);
            }
          }
        } catch (err) {
          toast.error('Voice recognition failed');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg noise pb-24 md:pt-24" data-testid="voice-oracle">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-10rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-syne text-3xl font-bold text-glow">Voice Oracle</h1>
            <p className="font-outfit text-emerald-300/60">Dr. Ethergreen speaks</p>
          </div>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-3 rounded-full ${audioEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-emerald-300/50'}`}
            data-testid="audio-toggle"
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Oracle Orb */}
        <motion.div 
          className="flex justify-center mb-6"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/40 to-emerald-900/60 flex items-center justify-center ${isPlaying ? 'orb' : ''}`}>
            <Sparkles className={`w-12 h-12 ${isPlaying ? 'text-emerald-300 animate-pulse' : 'text-emerald-400'}`} />
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-2">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-emerald-300/40 font-outfit text-lg">
                "Speak your truth, and I shall illuminate your path..."
              </p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                    : 'glass-emerald'
                }`}
              >
                {msg.role === 'oracle' && (
                  <div className="flex items-center gap-2 mb-2 text-emerald-400 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-outfit">Dr. Ethergreen</span>
                  </div>
                )}
                <p className="font-manrope leading-relaxed">{msg.content}</p>
                {msg.audio && (
                  <button
                    onClick={() => playAudio(msg.audio)}
                    className="mt-2 text-emerald-400 text-sm flex items-center gap-1 hover:text-emerald-300"
                    data-testid="play-audio-btn"
                  >
                    <Play className="w-4 h-4" /> Replay
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="glass-emerald p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="spinner w-5 h-5" />
                  <span className="text-emerald-300/60 font-outfit">The Oracle speaks...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-blood-light text-white animate-pulse' 
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
              data-testid="record-btn"
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask the Oracle..."
              className="input flex-1"
              disabled={loading || isRecording}
              data-testid="oracle-input"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="btn-primary px-4 py-3"
              data-testid="send-btn"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================== TAROT PAGE ========================
const TarotPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [spreadType, setSpreadType] = useState('single');
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flippedCards, setFlippedCards] = useState([]);

  const spreads = [
    { id: 'single', name: 'Single Card', cards: 1 },
    { id: 'three_card', name: 'Past/Present/Future', cards: 3 },
    { id: 'celtic_cross', name: 'Celtic Cross', cards: 10, premium: true },
  ];

  const drawCards = async () => {
    if (!user?.is_premium && spreadType === 'celtic_cross') {
      toast.error('Celtic Cross requires Premium');
      navigate('/premium');
      return;
    }

    setLoading(true);
    setReading(null);
    setFlippedCards([]);

    try {
      const res = await fetch(`${API_URL}/api/tarot/draw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ spread_type: spreadType, question })
      });

      if (!res.ok) throw new Error('Reading failed');
      const data = await res.json();
      setReading(data);

      // Flip cards with delay
      data.cards.forEach((_, idx) => {
        setTimeout(() => {
          setFlippedCards(prev => [...prev, idx]);
        }, 500 + idx * 800);
      });
    } catch (err) {
      toast.error('The cards are not aligned. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg noise pb-24 md:pt-24" data-testid="tarot-page">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-syne text-4xl font-bold mb-2 text-glow">Tarot Reading</h1>
          <p className="font-outfit text-emerald-300/60 mb-8">Hyper-personalized to your unique blueprint</p>
        </motion.div>

        {!reading ? (
          <motion.div
            className="max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Question Input */}
            <div className="mb-6">
              <label className="block text-emerald-300/80 mb-2 font-outfit">Your Question (optional)</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What guidance do you seek?"
                className="input"
                data-testid="tarot-question-input"
              />
            </div>

            {/* Spread Selection */}
            <div className="mb-8">
              <label className="block text-emerald-300/80 mb-3 font-outfit">Choose Your Spread</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {spreads.map((spread) => (
                  <button
                    key={spread.id}
                    onClick={() => setSpreadType(spread.id)}
                    className={`card p-4 text-left transition-all ${
                      spreadType === spread.id
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : ''
                    } ${spread.premium && !user?.is_premium ? 'opacity-50' : ''}`}
                    data-testid={`spread-${spread.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-outfit font-medium">{spread.name}</span>
                      {spread.premium && <Crown className="w-4 h-4 text-gold-light" />}
                    </div>
                    <span className="text-emerald-300/50 text-sm">{spread.cards} cards</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Draw Button */}
            <button
              onClick={drawCards}
              disabled={loading}
              className="btn-primary w-full text-lg py-4"
              data-testid="draw-cards-btn"
            >
              {loading ? 'Shuffling the Cosmos...' : 'Draw Cards'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Cards Display */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8">
              {reading.cards.map((card, idx) => (
                <motion.div
                  key={idx}
                  className="tarot-card w-32 md:w-40 h-48 md:h-56"
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: flippedCards.includes(idx) ? 180 : 0 }}
                  transition={{ duration: 0.8 }}
                  style={{ perspective: 1000 }}
                >
                  <div className="tarot-card-inner relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
                    {/* Back */}
                    <div 
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-900 to-emerald-950 border-2 border-gold-light/30 flex items-center justify-center"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <Sparkles className="w-12 h-12 text-gold-light/50" />
                    </div>
                    {/* Front */}
                    <div 
                      className={`absolute inset-0 rounded-xl bg-gradient-to-br ${
                        card.reversed ? 'from-blood/30 to-obsidian-subtle rotate-180' : 'from-emerald-900/50 to-obsidian-subtle'
                      } border-2 border-gold-light/50 p-3 flex flex-col items-center justify-center`}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <span className="text-gold-light text-2xl md:text-3xl font-syne font-bold">{card.id}</span>
                      <span className="text-emerald-100 text-center text-sm md:text-base font-outfit mt-2">{card.name}</span>
                      {card.reversed && (
                        <span className="text-blood-light text-xs mt-1">Reversed</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Interpretation */}
            {flippedCards.length === reading.cards.length && (
              <motion.div
                className="glass-emerald rounded-2xl p-6 md:p-8 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span className="font-outfit text-emerald-400">Dr. Ethergreen's Interpretation</span>
                </div>
                <p className="font-manrope text-emerald-100/90 leading-relaxed whitespace-pre-line">
                  {reading.interpretation}
                </p>
              </motion.div>
            )}

            {/* New Reading Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => setReading(null)}
                className="btn-secondary"
                data-testid="new-reading-btn"
              >
                New Reading
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ======================== BIO SCANNER ========================
const BioScanner = () => {
  const { token } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const mediaRecorderRef = useRef(null);

  const startScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64 = reader.result.split(',')[1];
          setLoading(true);
          
          try {
            const res = await fetch(`${API_URL}/api/bio/scan`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ audio_base64: base64 })
            });

            if (!res.ok) throw new Error('Scan failed');
            const data = await res.json();
            setResult(data);
          } catch (err) {
            toast.error('Bio-scan analysis failed');
          } finally {
            setLoading(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopScan();
        }
      }, 30000);
    } catch (err) {
      toast.error('Microphone access required');
    }
  };

  const stopScan = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg noise pb-24 md:pt-24" data-testid="bio-scanner">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-syne text-4xl font-bold mb-2">
            <span className="text-blood-light">Bio</span>-Resonance Scanner
          </h1>
          <p className="font-outfit text-emerald-300/60 mb-8">30-second voice analysis for frequency assessment</p>
        </motion.div>

        {!result ? (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Scanner Visualization */}
            <div className="relative w-64 h-64 mb-8">
              <div className={`absolute inset-0 rounded-full border-2 ${isRecording ? 'border-blood-light animate-pulse' : 'border-emerald-500/30'}`} />
              <div className={`absolute inset-4 rounded-full border ${isRecording ? 'border-blood-light/50' : 'border-emerald-500/20'}`} />
              <div className={`absolute inset-8 rounded-full border ${isRecording ? 'border-blood-light/30' : 'border-emerald-500/10'}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={isRecording ? stopScan : startScan}
                  disabled={loading}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-blood-light/20 border-2 border-blood-light' 
                      : 'bg-emerald-500/20 border-2 border-emerald-500/50 hover:border-emerald-400'
                  }`}
                  data-testid="scan-btn"
                >
                  {loading ? (
                    <div className="spinner" />
                  ) : isRecording ? (
                    <Pause className="w-10 h-10 text-blood-light" />
                  ) : (
                    <Mic className="w-10 h-10 text-emerald-400" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-emerald-300/60 font-outfit text-center max-w-md">
              {isRecording 
                ? "Speak naturally for 30 seconds... describing how you feel today." 
                : "Tap to begin your voice scan. Speak naturally about your current state."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Frequency Analysis */}
              <div className="card">
                <h3 className="font-syne text-xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-gold-light" />
                  Frequency Analysis
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-emerald-300/60 text-sm">Dominant Frequency</span>
                      <span className="text-emerald-400 font-mono">{result.frequencies?.dominant}</span>
                    </div>
                    <div className="h-2 bg-emerald-500/20 rounded-full">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-emerald-300/60 text-sm">Weakest Frequency</span>
                      <span className="text-blood-light font-mono">{result.frequencies?.weakest}</span>
                    </div>
                    <div className="h-2 bg-blood-light/20 rounded-full">
                      <div className="h-full bg-blood-light rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vitality Score */}
              <div className="card flex flex-col items-center justify-center">
                <h3 className="font-syne text-xl font-bold mb-4">Vitality Score</h3>
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(16,185,129,0.1)" strokeWidth="8" />
                    <circle 
                      cx="64" cy="64" r="56" fill="none" stroke="#10B981" strokeWidth="8"
                      strokeDasharray={`${(result.vitality_score / 10) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-syne font-bold text-emerald-400">{result.vitality_score}</span>
                  </div>
                </div>
                <span className="text-emerald-300/60 mt-2">/10</span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="card mb-8">
              <h3 className="font-syne text-xl font-bold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-blood-light" />
                Instant Remedies
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(result.recommendations || {}).map(([type, value]) => (
                  <div key={type} className="bg-white/5 rounded-lg p-4 text-center">
                    <span className="text-emerald-300/50 text-xs uppercase tracking-wide">{type}</span>
                    <p className="text-emerald-100 font-outfit mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis */}
            <div className="glass-emerald rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-emerald-400" />
                <span className="font-outfit text-emerald-400">AI Analysis</span>
              </div>
              <p className="font-manrope text-emerald-100/90 leading-relaxed whitespace-pre-line">
                {result.analysis}
              </p>
            </div>

            {/* New Scan Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => setResult(null)}
                className="btn-secondary"
                data-testid="new-scan-btn"
              >
                New Scan
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ======================== COMMUNITY ========================
const Community = () => {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/feed`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;
    
    try {
      const res = await fetch(`${API_URL}/api/community/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newPost, category })
      });

      if (res.ok) {
        const post = await res.json();
        setPosts([post, ...posts]);
        setNewPost('');
        toast.success('Your insight has been shared');
      }
    } catch (err) {
      toast.error('Failed to share');
    }
  };

  const categories = ['general', 'transit', 'gate_activation', 'insight'];

  return (
    <div className="min-h-screen cosmic-bg noise pb-24 md:pt-24" data-testid="community">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-syne text-4xl font-bold mb-2">Community Sanctuary</h1>
          <p className="font-outfit text-emerald-300/60 mb-8">Anonymous soul connections</p>
        </motion.div>

        {/* Create Post */}
        <div className="card mb-8">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share an insight, transit experience, or gate activation..."
            className="input min-h-[100px] resize-none mb-4"
            data-testid="post-input"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-outfit transition-colors ${
                    category === cat
                      ? 'bg-emerald-500/30 text-emerald-300'
                      : 'bg-white/5 text-emerald-300/50 hover:bg-white/10'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={createPost}
              className="btn-primary px-6 py-2"
              disabled={!newPost.trim()}
              data-testid="post-submit-btn"
            >
              Share
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : posts.length === 0 ? (
            <p className="text-center text-emerald-300/40 py-12">No posts yet. Be the first to share.</p>
          ) : (
            posts.map((post, idx) => (
              <motion.div
                key={post.id || idx}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="font-outfit text-emerald-300/80">{post.user_name || 'Anonymous'}</span>
                  </div>
                  <span className="text-emerald-300/40 text-xs px-2 py-1 bg-white/5 rounded-full">
                    {post.category?.replace('_', ' ')}
                  </span>
                </div>
                <p className="font-manrope text-emerald-100/90">{post.content}</p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ======================== PROFILE ========================
const Profile = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [soulprint, setSoulprint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSoulprint();
  }, []);

  const fetchSoulprint = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/soulprint`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSoulprint(data);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg noise pb-24 md:pt-24" data-testid="profile">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-syne text-4xl font-bold mb-2">Your Soulprint</h1>
          <p className="font-outfit text-emerald-300/60 mb-8">Holographic fusion of all systems</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : soulprint && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info */}
            <div className="card md:col-span-2">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-900/50 flex items-center justify-center glow-emerald">
                  <span className="font-syne text-2xl font-bold text-emerald-400">
                    {soulprint.name?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <h2 className="font-syne text-2xl font-bold">{soulprint.name || 'Seeker'}</h2>
                  <p className="text-emerald-300/60 font-outfit">{user?.email}</p>
                  {user?.is_premium && (
                    <div className="flex items-center gap-1 text-gold-light text-sm mt-1">
                      <Crown className="w-4 h-4" />
                      <span>Premium Member</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Human Design */}
            <div className="card">
              <h3 className="font-syne text-xl font-bold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Human Design
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-emerald-300/60">Type</span>
                  <span className="text-emerald-400 font-outfit">{soulprint.human_design?.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300/60">Profile</span>
                  <span className="text-emerald-400 font-outfit">{soulprint.human_design?.profile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300/60">Authority</span>
                  <span className="text-emerald-400 font-outfit">{soulprint.human_design?.authority}</span>
                </div>
              </div>
            </div>

            {/* Gene Keys */}
            <div className="card">
              <h3 className="font-syne text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-gold-light" />
                Gene Keys
              </h3>
              <div className="space-y-3">
                {Object.entries(soulprint.gene_keys || {}).map(([sphere, data]) => (
                  <div key={sphere} className="flex justify-between items-center">
                    <span className="text-emerald-300/60 capitalize">{sphere.replace('_', ' ')}</span>
                    <div className="text-right">
                      <span className="text-gold-light font-mono">Key {data.key}</span>
                      <p className="text-emerald-300/40 text-xs">{data.gift}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Numerology */}
            <div className="card">
              <h3 className="font-syne text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blood-light" />
                Numerology
              </h3>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full border-2 border-blood-light/30 flex items-center justify-center mb-2">
                    <span className="font-syne text-4xl font-bold text-blood-light">
                      {soulprint.numerology?.life_path || '—'}
                    </span>
                  </div>
                  <span className="text-emerald-300/60 text-sm">Life Path</span>
                </div>
              </div>
            </div>

            {/* Bio Markers */}
            <div className="card">
              <h3 className="font-syne text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                Bio Markers
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-emerald-300/60">Strongest Frequency</span>
                  <span className="text-emerald-400 font-mono">{soulprint.bio_markers?.strongest_frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300/60">Weakest Area</span>
                  <span className="text-blood-light">{soulprint.bio_markers?.weakest_area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300/60">Element</span>
                  <span className="text-emerald-400">{soulprint.bio_markers?.recommended_element}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
              {!user?.is_premium && (
                <button
                  onClick={() => navigate('/premium')}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  data-testid="upgrade-btn"
                >
                  <Crown className="w-5 h-5" />
                  Upgrade to Premium
                </button>
              )}
              <button
                onClick={logout}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
                data-testid="logout-profile-btn"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ======================== PREMIUM PAGE ========================
const PremiumPage = () => {
  const { user, token, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.payment_status === 'paid') {
          toast.success('Welcome to Premium! Your journey expands.');
          setUser({ ...user, is_premium: true });
        }
      }
    } catch (err) {
      console.error('Error checking payment:', err);
    } finally {
      setLoading(false);
    }
  };

  const startCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: 'premium_monthly',
          origin_url: window.location.origin
        })
      });

      if (!res.ok) throw new Error('Checkout failed');
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      toast.error('Payment initialization failed');
      setLoading(false);
    }
  };

  const features = [
    'Unlimited Tarot Readings with AI interpretation',
    'Voice Oracle with audio responses',
    'Celtic Cross & advanced spreads',
    'Custom voice meditations',
    'Priority Bio-Resonance analysis',
    'Early access to new features',
    'AI Coaching sessions'
  ];

  if (user?.is_premium) {
    return (
      <div className="min-h-screen cosmic-bg noise pb-24 md:pt-24" data-testid="premium-active">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold-light/30 to-gold-light/10 flex items-center justify-center glow-gold">
            <Crown className="w-12 h-12 text-gold-light" />
          </div>
          <h1 className="font-syne text-4xl font-bold mb-4 text-gold-light">You're Premium</h1>
          <p className="text-emerald-300/60 font-outfit text-lg">
            All features are unlocked. Continue your journey.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg noise pb-24 md:pt-24" data-testid="premium-page">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold-light/30 to-gold-light/10 flex items-center justify-center">
            <Crown className="w-10 h-10 text-gold-light" />
          </div>
          <h1 className="font-syne text-4xl font-bold mb-2">
            <span className="text-gold-light text-glow-gold">Premium</span> Access
          </h1>
          <p className="font-outfit text-emerald-300/60 text-lg">
            Unlock the full power of the Oracle
          </p>
        </motion.div>

        <motion.div
          className="card border-gold-light/20 bg-gradient-to-br from-gold-light/5 to-transparent mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center mb-6">
            <span className="text-5xl font-syne font-bold text-gold-light">$19.99</span>
            <span className="text-emerald-300/60 font-outfit">/month</span>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <Star className="w-5 h-5 text-gold-light flex-shrink-0" />
                <span className="font-outfit text-emerald-100/90">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={startCheckout}
            disabled={loading}
            className="w-full py-4 rounded-full bg-gradient-to-r from-gold-light to-gold-light/80 text-obsidian font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50"
            data-testid="checkout-btn"
          >
            {loading ? 'Channeling...' : 'Unlock Premium'}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// ======================== PAYMENT SUCCESS/CANCEL ========================
const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { token, setUser, user } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    }
  }, [sessionId]);

  const pollPaymentStatus = async (attempts = 0) => {
    if (attempts >= 5) {
      setStatus('timeout');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/payments/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.payment_status === 'paid') {
          setStatus('success');
          setUser({ ...user, is_premium: true });
          return;
        }
      }
      
      setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
    } catch (err) {
      setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg noise flex items-center justify-center p-4">
      <div className="text-center">
        {status === 'checking' && (
          <>
            <div className="spinner mx-auto mb-4" />
            <p className="text-emerald-300/60">Verifying your payment...</p>
          </>
        )}
        {status === 'success' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Crown className="w-12 h-12 text-gold-light" />
            </div>
            <h1 className="font-syne text-3xl font-bold mb-2 text-gold-light">Welcome to Premium!</h1>
            <p className="text-emerald-300/60 mb-6">Your spiritual journey expands.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Enter the Sanctuary
            </button>
          </motion.div>
        )}
        {status === 'timeout' && (
          <>
            <p className="text-emerald-300/60 mb-4">Payment verification timed out.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const PaymentCancel = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen cosmic-bg noise flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-emerald-300/60 mb-6">Payment was cancelled. No charges were made.</p>
        <button onClick={() => navigate('/premium')} className="btn-secondary">
          Return to Premium
        </button>
      </div>
    </div>
  );
};

// ======================== DATABASE PAGE ========================
const DatabasePage = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/database/search?query=${encodeURIComponent(query)}&category=${category}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg noise pb-24 md:pt-24" data-testid="database-page">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-4xl font-bold mb-2">Sacred Database</h1>
          <p className="font-outfit text-emerald-300/60 mb-8">20,000+ entries: peptides, herbs, frequencies, and more</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search remedies, frequencies, herbs..."
            className="input flex-1"
            data-testid="db-search-input"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-full md:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="peptides">Peptides</option>
            <option value="herbs">Herbs</option>
            <option value="frequencies">Frequencies</option>
          </select>
          <button onClick={search} className="btn-primary" data-testid="db-search-btn">
            Search
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((item, idx) => (
              <motion.div
                key={idx}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-syne text-lg font-bold text-emerald-400">{item.name}</h3>
                  <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">
                    {item.type}
                  </span>
                </div>
                <p className="text-emerald-100/80 text-sm font-outfit">{item.description}</p>
                {item.frequency && (
                  <p className="text-gold-light text-sm mt-2 font-mono">{item.frequency}</p>
                )}
                {item.element && (
                  <p className="text-blood-light text-sm mt-2">Element: {item.element}</p>
                )}
              </motion.div>
            ))}
          </div>
        ) : query && (
          <p className="text-center text-emerald-300/40 py-12">No results found. Try a different search.</p>
        )}
      </div>
    </div>
  );
};

// ======================== PROTECTED ROUTE ========================
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};

// ======================== MAIN APP ========================
function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#0A0A0A',
              color: '#ECFDF5',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            },
          }}
        />
        <AnimatePresence mode="wait">
          {showSplash && (
            <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
          )}
        </AnimatePresence>
        
        {!showSplash && (
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/oracle" element={<ProtectedRoute><VoiceOracle /></ProtectedRoute>} />
            <Route path="/tarot" element={<ProtectedRoute><TarotPage /></ProtectedRoute>} />
            <Route path="/bio-scan" element={<ProtectedRoute><BioScanner /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
            <Route path="/database" element={<ProtectedRoute><DatabasePage /></ProtectedRoute>} />
            <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            <Route path="/payment/cancel" element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        )}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
