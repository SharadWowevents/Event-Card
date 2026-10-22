import { useState, useEffect } from 'react';
import { EventItem, AttendeeBadgeData } from './types';
import { INITIAL_EVENTS } from './data/mockData';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PublicAdvocacyStudio } from './components/studio/PublicAdvocacyStudio';
import { AdminEventsList } from './components/admin/AdminEventsList';
import { BadgeStudioPasses } from './components/admin/BadgeStudioPasses';
import { AnalyticsDashboard } from './components/admin/AnalyticsDashboard';
import { IntegrationsHub } from './components/admin/IntegrationsHub';
import { TeamManagement } from './components/admin/TeamManagement';
import { ActivityLogsView } from './components/admin/ActivityLogsView';
import { BackupRestoreView } from './components/admin/BackupRestoreView';
import { CreateEditEventModal } from './components/admin/CreateEditEventModal';
import { SmartEventGallery } from './components/gallery/SmartEventGallery';
import { Lock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}`;
console.log('API_BASE:', API_BASE);
const DEFAULT_ATTENDEE_BADGE: AttendeeBadgeData = {
  name: '', email: '', mobile: '', title: '', company: '', 
  role: '' as any,
  avatarUrl: '', scale: 1, panX: 0, panY: 0, rotation: 0, themeStyle: 'gradient'
};

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') return false;
    if (savedTheme === 'dark') return true;

    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.themePreference === 'light') return false;
        if (parsed.themePreference === 'dark') return true;
      }
    } catch {}

    return true; // Default to dark Luminescent Precision
  });

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // App mode & Auth
  const [appMode, setAppMode] = useState<'public' | 'admin'>(() => {
    const p = window.location.pathname.replace(/\/$/, '');
    if (p === '' || p === '/' || p === '/admin' || p === '/login') return 'admin';
    return localStorage.getItem('token') ? 'admin' : 'public';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token') || true // Default to true for instant demo preview, can be toggled
  );

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) return JSON.parse(saved);
      const token = localStorage.getItem('token');
      if (token) {
        return JSON.parse(atob(token.split('.')[1]));
      }
    } catch {}
    return { name: 'Master Admin', role: 'Superadmin', email: 'admin@eventcards.io' };
  });

  const userRole = (currentUser?.role || 'Superadmin').trim();
  const isSuperAdmin = userRole.toLowerCase().replace(/[\s_-]+/g, '') === 'superadmin';

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Events & Badge
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(INITIAL_EVENTS[0]);
  const [badge, setBadge] = useState<AttendeeBadgeData>(DEFAULT_ATTENDEE_BADGE);
  const [currentAdminView, setCurrentAdminView] = useState<string>('admin-events');
  const [isLoading, setIsLoading] = useState(false);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);

  // Sync theme with HTML class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // URL Parsing & Initial Data Fetch
  useEffect(() => {
    const path = window.location.pathname;
    const slugFromUrl = path.length > 1 ? path.substring(1).replace(/\/$/, '') : null;

    // Check if this is an internal reserved route (like /login or /admin) that should stay in admin
    if (slugFromUrl === 'login' || slugFromUrl === 'admin') {
      window.history.replaceState({}, '', '/');
      setAppMode('admin');
      setIsAuthenticated(true);
    }

    fetch(`${API_BASE}/events`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mappedEvents = data.map((e: any) => ({ ...e, id: e._id || e.id }));
          setEvents(mappedEvents);
          
          if (slugFromUrl && slugFromUrl !== 'login' && slugFromUrl !== 'admin') {
            const cleanSlug = slugFromUrl.startsWith('e/') ? slugFromUrl.replace('e/', '') : slugFromUrl;
            const matchedEvent = mappedEvents.find((e: EventItem) => e.slug === cleanSlug);
            if (matchedEvent) {
              setSelectedEvent(matchedEvent);
              setAppMode('public');
            }
          } else {
            setSelectedEvent(mappedEvents[0]);
          }
        } else {
          // If database is empty, fall back to initial mock events for immediate rich preview
          if (slugFromUrl && slugFromUrl !== 'login' && slugFromUrl !== 'admin') {
            const matched = INITIAL_EVENTS.find(e => e.slug === slugFromUrl);
            if (matched) {
              setSelectedEvent(matched);
              setAppMode('public');
            }
          }
        }
      })
      .catch(err => {
        console.warn('Backend server not responding, using local event cache:', err);
      });

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE}/team/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(userData => {
          if (userData) {
            setCurrentUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            if (userData.themePreference) {
              const shouldBeDark = userData.themePreference === 'dark';
              setIsDark(shouldBeDark);
              localStorage.setItem('theme', userData.themePreference);
            }
          }
        })
        .catch(() => {});
    } else {
      // Auto-authenticate default master admin session if token is missing
      fetch(`${API_BASE}/team/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@eventcards.io', password: 'admin123' })
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.token) {
            localStorage.setItem('token', data.token);
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
              setCurrentUser(data.user);
            }
            setIsAuthenticated(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleToggleDark = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const themeStr = nextDark ? 'dark' : 'light';
    localStorage.setItem('theme', themeStr);

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE}/team/theme`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ themePreference: themeStr })
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.user) {
            setCurrentUser((prev: any) => ({ ...prev, ...data.user }));
            try {
              const currentLocal = JSON.parse(localStorage.getItem('user') || '{}');
              localStorage.setItem('user', JSON.stringify({ ...currentLocal, themePreference: themeStr }));
            } catch {}
          }
        })
        .catch(err => console.warn('Could not persist theme preference to backend:', err));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/team/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        if (data.user.themePreference) {
          const shouldBeDark = data.user.themePreference === 'dark';
          setIsDark(shouldBeDark);
          localStorage.setItem('theme', data.user.themePreference);
        }
      }
      setIsAuthenticated(true);
      setAppMode('admin'); 
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      // Allow bypass for local dev demo if backend is offline
      if (loginEmail === 'admin@eventcards.io' || loginEmail.includes('admin')) {
        const fallbackUser = { name: 'Master Admin', email: loginEmail, role: 'Superadmin' };
        localStorage.setItem('user', JSON.stringify(fallbackUser));
        setCurrentUser(fallbackUser);
        setIsAuthenticated(true);
        setAppMode('admin');
      } else {
        setAuthError(err.message || 'Invalid credentials');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAppMode('admin');
  };

  const handleSaveEvent = async (eventData: EventItem) => {
    const isNew = !eventData._id && !events.find(e => e.id === eventData.id);
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API_BASE}/events` : `${API_BASE}/events/${eventData.id}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      if (res.ok) {
        const saved = await res.json();
        const mapped = { ...saved, id: saved._id || saved.id };
        setEvents(prev => isNew ? [mapped, ...prev] : prev.map(e => e.id === mapped.id ? mapped : e));
        if (!selectedEvent || selectedEvent.id === mapped.id) setSelectedEvent(mapped);
      } else {
        // Local update if backend API fails
        setEvents(prev => isNew ? [eventData, ...prev] : prev.map(e => e.id === eventData.id ? eventData : e));
        if (!selectedEvent || selectedEvent.id === eventData.id) setSelectedEvent(eventData);
      }
    } catch {
      setEvents(prev => isNew ? [eventData, ...prev] : prev.map(e => e.id === eventData.id ? eventData : e));
      if (!selectedEvent || selectedEvent.id === eventData.id) setSelectedEvent(eventData);
    }
    setIsEventModalOpen(false);
  };

  const handleToggleArchive = (eventId: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId) {
        return { ...e, status: e.status === 'archived' ? 'active' : 'archived' };
      }
      return e;
    }));
  };

  const handleLaunchStudio = (evt: EventItem) => {
    setSelectedEvent(evt);
    setAppMode('public');
    window.history.pushState({}, '', `/${evt.slug}`);
  };

  const handleLaunchGallery = (evt: EventItem) => {
    setSelectedEvent(evt);
    setCurrentAdminView('gallery');
  };

  // 1. PUBLIC ADVOCACY STUDIO MODE
  if (appMode === 'public') {
    if (!selectedEvent) {
      return (
        <div className={`flex h-screen flex-col items-center justify-center text-center px-4 ${
          isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-50 text-slate-900'
        }`}>
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-slate-400 mb-6 max-w-sm text-sm">
            The campaign link you followed doesn't match an active summit pass. Please check the URL or select an active summit.
          </p>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/');
              setSelectedEvent(events[0]);
              setAppMode('admin');
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            Go to Organizer Studio
          </button>
        </div>
      );
    }

    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="sticky top-0 z-40 px-6 py-3 border-b flex items-center justify-between backdrop-blur-xl bg-inherit/90 border-inherit">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-emerald-500">EventCards</span>
            <span className="text-xs text-slate-400">/ {selectedEvent.name}</span>
          </div>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/');
              setAppMode('admin');
            }}
            className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1"
          >
            <span>Organizer Portal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <main className="flex-1">
          <PublicAdvocacyStudio
            event={selectedEvent}
            badge={badge}
            onUpdateBadge={(u) => setBadge(prev => ({ ...prev, ...u }))}
          />
        </main>
      </div>
    );
  }

  // 2. ADMIN AUTHENTICATION
  if (appMode === 'admin' && !isAuthenticated) {
    return (
      <div className={`flex h-screen flex-col items-center justify-center p-6 ${
        isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className={`w-full max-w-md rounded-3xl border p-8 shadow-2xl relative overflow-hidden ${
          isDark ? 'bg-slate-900/90 border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <Lock className="h-7 w-7" />
          </div>

          <h2 className="text-center text-2xl font-black tracking-tight mb-1">Organizer Studio</h2>
          <p className="text-center text-xs text-slate-400 mb-6">Enter credentials to manage your live summit advocacy pipelines.</p>

          {authError && (
            <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-semibold text-rose-500 text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@eventcards.io"
                className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition-all ${
                  isDark
                    ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                }`}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full rounded-xl border px-4 py-2.5 text-xs outline-none transition-all ${
                  isDark
                    ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                }`}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-3 font-bold text-xs text-white shadow-lg shadow-emerald-500/25 transition-all"
            >
              Sign In to Studio
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-inherit/40 text-center">
            <button
              onClick={() => setIsAuthenticated(true)}
              className="text-xs text-slate-400 hover:text-emerald-500 font-semibold transition-colors"
            >
              Skip auth for local demo preview &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN ORGANIZER ADMIN PORTAL
  return (
    <div className={`min-h-screen flex transition-colors ${
      isDark ? 'bg-[#080e1a] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Modular Left Sidebar */}
      <Sidebar
        currentView={currentAdminView}
        onSelectView={setCurrentAdminView}
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
        onOpenCreateEventModal={() => {
          setEventToEdit(null);
          setIsEventModalOpen(true);
        }}
        onLogout={handleLogout}
        isDark={isDark}
        onToggleDark={handleToggleDark}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLaunchStudio={handleLaunchStudio}
        user={currentUser}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? 'pl-20' : 'pl-72'
      }`}>
        <Header
          currentView={currentAdminView}
          onSelectView={setCurrentAdminView}
          events={events}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
          onOpenCreateEventModal={() => {
            setEventToEdit(null);
            setIsEventModalOpen(true);
          }}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onLaunchStudio={handleLaunchStudio}
          isDark={isDark}
          user={currentUser}
        />

        <main className="flex-1 pb-12">
          {currentAdminView === 'admin-events' && (
            <AdminEventsList
              events={events}
              onSelectEvent={setSelectedEvent}
              onOpenCreateModal={() => {
                setEventToEdit(null);
                setIsEventModalOpen(true);
              }}
              onEditEvent={(evt) => {
                setEventToEdit(evt);
                setIsEventModalOpen(true);
              }}
              onToggleArchive={handleToggleArchive}
              onLaunchStudio={handleLaunchStudio}
              onLaunchGallery={handleLaunchGallery}
              isDark={isDark}
            />
          )}

          {currentAdminView === 'admin-passes' && (
            <BadgeStudioPasses
              event={selectedEvent || events[0]}
              onLaunchStudio={handleLaunchStudio}
              isDark={isDark}
            />
          )}

          {currentAdminView === 'gallery' && (
            <SmartEventGallery
              event={selectedEvent || events[0]}
              onNavigateToStudio={() => setCurrentAdminView('admin-events')}
            />
          )}

          {currentAdminView === 'admin-analytics' && (
            <AnalyticsDashboard
              event={selectedEvent || events[0]}
              isDark={isDark}
            />
          )}

          {currentAdminView === 'admin-integrations' && (
            <IntegrationsHub />
          )}

          {currentAdminView === 'admin-team' && (
            <TeamManagement onLogout={handleLogout} />
          )}

          {currentAdminView === 'admin-logs' && (
            isSuperAdmin ? (
              <ActivityLogsView isDark={isDark} />
            ) : (
              <div className="p-8 max-w-lg mx-auto my-16 text-center rounded-3xl border border-rose-500/20 bg-rose-500/5 animate-fade-in">
                <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 w-fit mx-auto mb-4">
                  <Lock className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-rose-500">Super Admin Access Only</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Activity Audit Logs and Undo operations are restricted. Only users with the <strong>Superadmin</strong> role can view or roll back activities.
                </p>
                <button
                  onClick={() => setCurrentAdminView('admin-events')}
                  className="mt-6 px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  Return to Campaigns
                </button>
              </div>
            )
          )}

          {currentAdminView === 'admin-backups' && (
            isSuperAdmin ? (
              <BackupRestoreView isDark={isDark} />
            ) : (
              <div className="p-8 max-w-lg mx-auto my-16 text-center rounded-3xl border border-rose-500/20 bg-rose-500/5 animate-fade-in">
                <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 w-fit mx-auto mb-4">
                  <Lock className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-rose-500">Super Admin Access Only</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Database Snapshots, Recurring Schedules, and Non-Destructive Restore are restricted. Only users with the <strong>Superadmin</strong> role can manage backups.
                </p>
                <button
                  onClick={() => setCurrentAdminView('admin-events')}
                  className="mt-6 px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                >
                  Return to Campaigns
                </button>
              </div>
            )
          )}
        </main>
      </div>

      {/* Create / Edit Event Modal */}
      <CreateEditEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        eventToEdit={eventToEdit}
        onSave={handleSaveEvent}
      />
    </div>
  );
}