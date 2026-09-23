import { useState, useEffect } from 'react';
import { EventItem, AttendeeBadgeData } from './types';
import { Header } from './components/layout/Header';
import { PublicAdvocacyStudio } from './components/studio/PublicAdvocacyStudio';
import { AdminEventsList } from './components/admin/AdminEventsList';
import { AnalyticsDashboard } from './components/admin/AnalyticsDashboard';
import { IntegrationsHub } from './components/admin/IntegrationsHub';
import { TeamManagement } from './components/admin/TeamManagement';
import { CreateEditEventModal } from './components/admin/CreateEditEventModal';
import { SmartEventGallery } from './components/gallery/SmartEventGallery';
import { Lock } from 'lucide-react';

const API_BASE = '/api';
const DEFAULT_ATTENDEE_BADGE: AttendeeBadgeData = {
  name: '', email: '', mobile: '', title: '', company: '', 
  role: '' as any, // <-- Set this to empty so the dropdown starts blank
  avatarUrl: '', scale: 1, panX: 0, panY: 0, rotation: 0, themeStyle: 'gradient'
};

export default function App() {
  // 1. Initial State: If they are on the root URL '/', default to admin mode immediately
  const [appMode, setAppMode] = useState<'public' | 'admin'>(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') return 'admin';
    return localStorage.getItem('token') ? 'admin' : 'public';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token')
  );
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [badge, setBadge] = useState<AttendeeBadgeData>(DEFAULT_ATTENDEE_BADGE);
  const [currentAdminView, setCurrentAdminView] = useState<string>('admin-events');
  const [isLoading, setIsLoading] = useState(true);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);

  // STRICT URL PARSING & ROUTING
  useEffect(() => {
    const path = window.location.pathname;
    const slugFromUrl = path.length > 1 ? path.substring(1).replace(/\/$/, '') : null;
    
    const token = localStorage.getItem('token');

    // 2. FORCE ADMIN MODE ON ROOT: If there is no slug, this is the admin portal
    if (!slugFromUrl) {
      setAppMode('admin');
      if (token) setIsAuthenticated(true);
    }

    fetch(`${API_BASE}/events`)
      .then(res => res.json())
      .then(data => {
        const mappedEvents = data.map((e: any) => ({ ...e, id: e._id }));
        setEvents(mappedEvents);
        
        if (slugFromUrl) {
          // Clean the slug just in case older /e/ links are used
          const cleanSlug = slugFromUrl.startsWith('e/') ? slugFromUrl.replace('e/', '') : slugFromUrl;
          const matchedEvent = mappedEvents.find((e: EventItem) => e.slug === cleanSlug);
          
          if (matchedEvent) {
            setSelectedEvent(matchedEvent);
            setAppMode('public');
          } else {
            // STRICT FAIL: If slug doesn't exist, set to null so it triggers the 404 screen
            setSelectedEvent(null);
            setAppMode('public');
          }
        } else {
          // If on the root URL, load the first event for the admin dashboard
          setAppMode('admin'); // Ensure admin mode stays locked
          if (mappedEvents.length > 0) setSelectedEvent(mappedEvents[0]);
        }
      })
      .catch(err => console.error('Backend connection failed:', err))
      .finally(() => setIsLoading(false));
  }, []);

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
      if (!res.ok) throw new Error(data.error);
      
      localStorage.setItem('token', data.token);
      setIsAuthenticated(true);
      setAppMode('admin'); 
      setLoginEmail('');
      setLoginPassword('');
      window.history.pushState({}, '', '/');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setAppMode('admin'); // Changed to drop them back at the login screen
    window.history.pushState({}, '', '/');
  };

  const handleSaveEvent = async (eventData: EventItem) => {
    const isNew = !eventData._id && !events.find(e => e.id === eventData.id);
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API_BASE}/events` : `${API_BASE}/events/${eventData.id}`;

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
      const saved = await res.json();
      const mapped = { ...saved, id: saved._id };
      setEvents(prev => isNew ? [mapped, ...prev] : prev.map(e => e.id === mapped.id ? mapped : e));
      if (!selectedEvent || selectedEvent.id === mapped.id) setSelectedEvent(mapped);
    } catch (err) { console.error('Failed to save event:', err); }
  };

  const handleLaunchStudio = (evt: EventItem) => {
    setSelectedEvent(evt);
    setAppMode('public'); 
    // Update the URL to the exact clean slug
    window.history.pushState({}, '', `/${evt.slug}`);
  };

  const handleLaunchGallery = (evt: EventItem) => {
    setSelectedEvent(evt);
    setCurrentAdminView('gallery'); 
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center text-slate-500 font-medium">Loading Database...</div>;

  if (appMode === 'public') {
    if (!selectedEvent) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-center px-4">
          <div className="text-4xl mb-4">📍</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Event Not Found</h2>
          <p className="text-slate-500 mb-6 max-w-sm">The campaign link you followed doesn't match an active event. Please check the URL.</p>
          <button onClick={() => { window.history.pushState({}, '', '/'); setAppMode('admin'); }} className="text-sm font-semibold text-teal-600 underline">Go to Organizer Portal</button>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <main className="flex-1">
          <PublicAdvocacyStudio event={selectedEvent} badge={badge} onUpdateBadge={(u) => setBadge(prev => ({...prev, ...u}))} />
        </main>
        <footer className="py-6 text-center border-t border-slate-200">
          <button onClick={() => { setAppMode('admin'); window.history.pushState({}, '', '/'); }} className="text-xs font-medium text-slate-400 hover:text-slate-600">Organizer Login</button>
        </footer>
      </div>
    );
  }

  if (appMode === 'admin' && !isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600"><Lock className="h-6 w-6" /></div>
          <h2 className="text-center text-xl font-bold text-slate-900 mb-6">Admin Login</h2>
          {authError && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-600 text-center">{authError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="admin@eventcards.io" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-hidden" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter password..." className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-teal-500 focus:outline-hidden" />
            </div>
            <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white hover:bg-black transition-colors">Secure Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (!selectedEvent && events.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h2 className="text-2xl font-extrabold mb-2">Welcome to the Admin Portal!</h2>
        <p className="text-slate-500 mb-8 max-w-md">Your database is connected. Create your first event campaign.</p>
        <button onClick={() => setIsEventModalOpen(true)} className="rounded-xl bg-teal-600 px-6 py-3 font-bold text-white shadow-md hover:bg-teal-700">Create Your First Event</button>
        <CreateEditEventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} eventToEdit={null} onSave={handleSaveEvent} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header currentView={currentAdminView} onSelectView={setCurrentAdminView} events={events} selectedEvent={selectedEvent!} onSelectEvent={setSelectedEvent} onOpenCreateEventModal={() => { setEventToEdit(null); setIsEventModalOpen(true); }} onLogout={handleLogout} />
      <main className="flex-1">
        {currentAdminView === 'admin-events' && <AdminEventsList events={events} onSelectEvent={setSelectedEvent} onOpenCreateModal={() => { setEventToEdit(null); setIsEventModalOpen(true); }} onEditEvent={(evt) => { setEventToEdit(evt); setIsEventModalOpen(true); }} onToggleArchive={() => {}} onLaunchStudio={handleLaunchStudio} onLaunchGallery={handleLaunchGallery} />}
        {currentAdminView === 'gallery' && <SmartEventGallery event={selectedEvent!} onNavigateToStudio={() => setCurrentAdminView('admin-events')} />}
        {currentAdminView === 'admin-analytics' && <AnalyticsDashboard event={selectedEvent!} />}
        {currentAdminView === 'admin-integrations' && <IntegrationsHub />}
        {currentAdminView === 'admin-team' && <TeamManagement />}
      </main>
      <CreateEditEventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} eventToEdit={eventToEdit} onSave={handleSaveEvent} />
    </div>
  );
}