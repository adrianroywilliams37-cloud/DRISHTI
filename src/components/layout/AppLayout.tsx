import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  Activity, 
  Menu, 
  LogOut, 
  ChevronRight,
  Shield,
  FileText,
  Clock,
  Satellite
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMEOUT_MS);
  const { user, logout, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const resetTimer = useCallback(() => {
    setTimeLeft(SESSION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    // Event listeners to reset timer on user activity
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          handleLogout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimer));
      clearInterval(interval);
    };
  }, [handleLogout, resetTimer]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };



  // Generate breadcrumbs from pathname
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 64 }}
        className="bg-[#0a0f16] text-slate-300 flex flex-col border-r border-white/5 z-20 shadow-2xl shadow-black/20"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${!sidebarOpen && 'hidden'}`}>
            <Shield className="w-6 h-6 text-white shrink-0" />
            <span className="font-serif font-bold text-white tracking-wide truncate">DRISHTI</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-white/10 rounded-sm transition-colors text-slate-400 hover:text-white shrink-0 border border-transparent hover:border-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <motion.nav 
          className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
            <Link to="/" className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors border border-transparent ${location.pathname === '/' ? 'bg-white/10 text-white border-white/5' : 'hover:bg-white/5 hover:text-white'}`}>
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span className={`transition-opacity whitespace-nowrap ${!sidebarOpen && 'hidden'}`}>Command Center</span>
            </Link>
          </motion.div>

          {(user?.role === 'ministry' || user?.role === 'apex' || user?.role === 'master') && (
            <>
              <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
                <Link to="/portfolio" className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors border border-transparent ${location.pathname.startsWith('/portfolio') ? 'bg-white/10 text-white border-white/5' : 'hover:bg-white/5 hover:text-white'}`}>
                  <Briefcase className="w-5 h-5 shrink-0" />
                  <span className={`transition-opacity whitespace-nowrap ${!sidebarOpen && 'hidden'}`}>Sector Portfolios</span>
                </Link>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
                <Link to="/radar" className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors border border-transparent ${location.pathname.startsWith('/radar') ? 'bg-white/10 text-white border-white/5' : 'hover:bg-white/5 hover:text-white'}`}>
                  <Activity className="w-5 h-5 shrink-0" />
                  <span className={`transition-opacity whitespace-nowrap ${!sidebarOpen && 'hidden'}`}>Model Benchmarks</span>
                </Link>
              </motion.div>
              <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
                <Link to="/predictive-radar" className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors border border-transparent ${location.pathname.startsWith('/predictive-radar') ? 'bg-white/10 text-white border-white/5' : 'hover:bg-white/5 hover:text-white'}`}>
                  <Activity className="w-5 h-5 shrink-0" />
                  <span className={`transition-opacity whitespace-nowrap ${!sidebarOpen && 'hidden'}`}>Live Predictive Radar</span>
                </Link>
              </motion.div>
            </>
          )}

          {(user?.role === 'ministry' || user?.role === 'master') && (
            <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
              <Link to="/verify" className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors border border-transparent ${location.pathname.startsWith('/verify') ? 'bg-white/10 text-white border-white/5' : 'hover:bg-white/5 hover:text-white'}`}>
                <Satellite className="w-5 h-5 shrink-0" />
                <span className={`transition-opacity whitespace-nowrap ${!sidebarOpen && 'hidden'}`}>Orbital Verify</span>
              </Link>
            </motion.div>
          )}

          {(user?.role === 'ministry' || user?.role === 'apex' || user?.role === 'master') && (
            <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
              <Link to="/procurement" className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors border border-transparent ${location.pathname.startsWith('/procurement') ? 'bg-white/10 text-white border-white/5' : 'hover:bg-white/5 hover:text-white'}`}>
                <Shield className="w-5 h-5 shrink-0" />
                <span className={`transition-opacity whitespace-nowrap ${!sidebarOpen && 'hidden'}`}>Procurement Node</span>
              </Link>
            </motion.div>
          )}

          <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
            <Link to="/docs" className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-colors border border-transparent ${location.pathname.startsWith('/docs') ? 'bg-white/10 text-white border-white/5' : 'hover:bg-white/5 hover:text-white'}`}>
              <FileText className="w-5 h-5 shrink-0" />
              <span className={`transition-opacity whitespace-nowrap ${!sidebarOpen && 'hidden'}`}>Documentation</span>
            </Link>
          </motion.div>
        </motion.nav>

        <div className="p-4 border-t border-white/10">
          <div className={`mb-4 flex items-center gap-3 overflow-hidden ${!sidebarOpen && 'hidden'}`}>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-white">{user?.name.charAt(0) || 'U'}</span>
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.sicn}</p>
            </div>
          </div>
          {user?.sicn !== 'DEV-MODE' && (
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-sm transition-colors border border-transparent hover:border-white/5 ${!sidebarOpen && 'justify-center'}`}
              title="Log out"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className={`transition-opacity ${!sidebarOpen && 'hidden'}`}>Log out</span>
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Breadcrumb Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 justify-between">
          <nav className="flex items-center text-sm text-slate-500" aria-label="Breadcrumb">
            <button 
              onClick={() => navigate(-1)}
              className="mr-4 p-1.5 hover:bg-slate-100 rounded-sm transition-colors text-slate-400 hover:text-slate-900"
              title="Go Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
              </li>
              {pathnames.map((name, index) => {
                if (name === 'sector' || name === 'project') return null;
                
                const decodedName = decodeURIComponent(name);
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                return (
                  <li key={name}>
                    <div className="flex items-center">
                      <ChevronRight className="w-4 h-4 text-slate-400 mx-1" />
                      {isLast ? (
                        <span className="text-slate-900 font-medium capitalize">{decodedName.replace(/-/g, ' ')}</span>
                      ) : (
                        <Link to={routeTo} className="hover:text-slate-900 transition-colors capitalize">
                          {decodedName.replace(/-/g, ' ')}
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Dev Mode Role Tabs */}
          {user?.sicn === 'DEV-MODE' && (
            <div className="flex bg-slate-100 p-1 rounded-sm mx-4">
              {(['nodal', 'ministry', 'apex', 'master'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {}} // Dummy as switchRole isn't standard
                  className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${
                    user.role === r 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border ${
              timeLeft < 60000 
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
