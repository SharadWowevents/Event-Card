import { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Sparkles, Plus, ExternalLink, Menu, X, 
  HelpCircle, ChevronDown, Check, ShieldAlert, Layers,
  TrendingUp, Ticket, ShieldCheck, User, Calendar, CheckCheck,
  Clock, ArrowRight, CheckCircle2, History, Database
} from 'lucide-react';
import { EventItem } from '../../types';

interface HeaderProps {
  currentView: string;
  onSelectView: (view: string) => void;
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelectEvent: (event: EventItem) => void;
  onOpenCreateEventModal: () => void;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
  onLaunchStudio?: (event: EventItem) => void;
  isDark?: boolean;
  user?: { name?: string; email?: string; role?: string } | null;
}

interface NotificationItem {
  id: string | number;
  title: string;
  text: string;
  time: string;
  unread: boolean;
  view?: string;
  eventItem?: EventItem;
}

export function Header({
  currentView,
  onSelectView,
  events,
  selectedEvent,
  onSelectEvent,
  onOpenCreateEventModal,
  onLogout,
  onToggleMobileMenu,
  onLaunchStudio,
  isDark,
  user
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // Load real notifications & attendees for search and bell dropdown
  useEffect(() => {
    if (!selectedEvent) return;
    const eventId = selectedEvent.id || selectedEvent._id;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/events/${eventId}/leads`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRecentLeads(data);
          const notifs: NotificationItem[] = data.slice(0, 5).map((lead: any, idx: number) => {
            const timeAgo = lead.createdAt
              ? new Date(lead.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
              : 'Recent';
            const hasShared = lead.sharesCount && lead.sharesCount > 0;
            return {
              id: lead._id || idx,
              title: hasShared ? 'Pass Shared Online' : 'Verified Pass Claimed',
              text: `${lead.name || 'An attendee'} ${hasShared ? 'broadcasted their pass on social feeds' : `claimed a pass for ${selectedEvent.name}`}`,
              time: timeAgo,
              unread: idx < 2, // First 2 marked as unread
              view: 'admin-analytics',
              eventItem: selectedEvent
            };
          });

          // Add active campaign notification
          notifs.push({
            id: 'event-status',
            title: 'Live Campaign Active',
            text: `${selectedEvent.name} is running and collecting attendee registrations.`,
            time: 'Ongoing',
            unread: false,
            view: 'admin-events',
            eventItem: selectedEvent
          });

          setNotifications(notifs);
        } else {
          setRecentLeads([]);
          setNotifications([
            {
              id: 'initial',
              title: 'Live Campaign Ready',
              text: `${selectedEvent.name} is active and ready for attendee pass claims.`,
              time: 'Just now',
              unread: true,
              view: 'admin-events',
              eventItem: selectedEvent
            }
          ]);
        }
      })
      .catch(() => {
        setNotifications([
          {
            id: 'fallback',
            title: 'System Active',
            text: 'Attendee advocacy engine is running.',
            time: 'Live',
            unread: false,
            view: 'admin-events'
          }
        ]);
      });
  }, [selectedEvent?.id, selectedEvent?._id]);

  // Click outside and ⌘K / Ctrl+K keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setNotificationsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const userRole = (user?.role || 'Superadmin').trim();
  const isSuperAdmin = userRole.toLowerCase().replace(/[\s_-]+/g, '') === 'superadmin';

  // Quick Action Navigation definitions
  const quickActions = [
    { id: 'create', label: 'Create New Campaign', icon: Plus, action: () => onOpenCreateEventModal() },
    { id: 'analytics', label: 'Pass & Advocacy Analytics', icon: TrendingUp, action: () => onSelectView('admin-analytics') },
    ...(isSuperAdmin ? [
      { id: 'logs', label: 'Activity Logs & Undo (Last 500)', icon: History, action: () => onSelectView('admin-logs') },
      { id: 'backups', label: 'Backup & Restore Center', icon: Database, action: () => onSelectView('admin-backups') }
    ] : []),
    { id: 'gallery', label: 'Moments Photo Gallery', icon: Layers, action: () => onSelectView('gallery') },
    { id: 'passes', label: 'Badge Studio Passes', icon: Ticket, action: () => onSelectView('admin-passes') },
    { id: 'team', label: 'Team & Permissions', icon: ShieldCheck, action: () => onSelectView('admin-team') },
    { id: 'studio', label: 'Launch Public Studio Preview', icon: ExternalLink, action: () => selectedEvent && onLaunchStudio?.(selectedEvent) }
  ];

  // Search Results Filtering
  const cleanQ = searchQuery.trim().toLowerCase();

  const matchingEvents = cleanQ
    ? events.filter(e => 
        e.name.toLowerCase().includes(cleanQ) || 
        e.slug.toLowerCase().includes(cleanQ) || 
        (e.venue && e.venue.toLowerCase().includes(cleanQ))
      )
    : [];

  const matchingAttendees = cleanQ
    ? recentLeads.filter(l => 
        (l.name && l.name.toLowerCase().includes(cleanQ)) ||
        (l.email && l.email.toLowerCase().includes(cleanQ))
      )
    : [];

  const matchingActions = cleanQ
    ? quickActions.filter(a => a.label.toLowerCase().includes(cleanQ))
    : quickActions.slice(0, 4);

  const hasAnyResults = matchingEvents.length > 0 || matchingAttendees.length > 0 || matchingActions.length > 0;

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    // Mark this notification as read
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
    if (item.eventItem && onSelectEvent) {
      onSelectEvent(item.eventItem);
    }
    if (item.view) {
      onSelectView(item.view);
    }
    setNotificationsOpen(false);
  };

  return (
    <header className={`sticky top-0 z-30 h-16 w-full border-b backdrop-blur-xl transition-colors ${
      isDark
        ? 'bg-[#0b0f19]/85 border-white/10 text-white'
        : 'bg-white/85 border-slate-200/90 text-slate-900'
    }`}>
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              aria-label="Toggle Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <nav className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <button 
              onClick={() => onSelectView('admin-events')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Events
            </button>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[320px]">
              {selectedEvent ? selectedEvent.name : 'All Campaigns'}
            </span>
          </nav>

          {selectedEvent && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LIVE SUMMIT</span>
            </div>
          )}
        </div>

        {/* Right: Search, Notifications & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Functional Search Bar */}
          <div ref={searchContainerRef} className="relative hidden md:block w-56 lg:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder="Search campaigns, attendees, actions..."
              className={`w-full h-9 pl-9 pr-14 rounded-xl text-xs transition-all border outline-none ${
                isDark
                  ? 'bg-slate-900/60 border-white/10 text-slate-200 placeholder-slate-500 focus:border-emerald-500/60 focus:bg-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-emerald-500/60 focus:bg-white'
              }`}
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200/60 dark:bg-slate-800 text-slate-500 pointer-events-none">
                ⌘K
              </kbd>
            )}

            {/* Search Results Dropdown */}
            {isSearchOpen && (
              <div className={`absolute left-0 right-0 mt-2 rounded-2xl shadow-2xl border p-2 z-50 max-h-[460px] overflow-y-auto animate-in fade-in slide-in-from-top-2 ${
                isDark ? 'bg-slate-900 border-white/15 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                {cleanQ && hasAnyResults && (
                  <div className="p-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Search Results
                  </div>
                )}

                {/* Matching Campaigns */}
                {matchingEvents.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      Campaigns & Summits
                    </div>
                    {matchingEvents.map(evt => (
                      <button
                        key={evt.id || evt._id}
                        onClick={() => {
                          onSelectEvent(evt);
                          onSelectView('admin-events');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <Calendar className="h-3.5 w-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="font-bold truncate">{evt.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{evt.dates} • {evt.venue || 'Online'}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          {evt.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Matching Attendees */}
                {matchingAttendees.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-500">
                      Attendee Passes
                    </div>
                    {matchingAttendees.map((lead, idx) => (
                      <button
                        key={lead.id || lead._id || idx}
                        onClick={() => {
                          onSelectView('admin-analytics');
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="font-bold truncate">{lead.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{lead.email || 'Verified Pass'}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">
                          View in Analytics
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Navigation / Actions */}
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {cleanQ ? 'Matching Views & Actions' : 'Quick Actions'}
                  </div>
                  {matchingActions.map(act => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.id}
                        onClick={() => {
                          act.action();
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="font-medium">{act.label}</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-slate-400 opacity-60" />
                      </button>
                    );
                  })}
                </div>

                {cleanQ && !hasAnyResults && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No results found for &ldquo;<span className="font-semibold">{searchQuery}</span>&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Functional Notifications Popover */}
          <div ref={notifContainerRef} className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`relative p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border p-3 z-50 animate-in fade-in slide-in-from-top-2 ${
                isDark ? 'bg-slate-900 border-white/15 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-inherit mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-500">
                        {unreadCount} Unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="h-3 w-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`p-2.5 rounded-xl text-xs flex flex-col gap-1 transition-all cursor-pointer ${
                          n.unread 
                            ? isDark 
                              ? 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15' 
                              : 'bg-emerald-50/70 border border-emerald-200/60 hover:bg-emerald-50'
                            : isDark
                              ? 'hover:bg-slate-800/60 border border-transparent'
                              : 'hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                            {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />}
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{n.time}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-300 leading-relaxed">{n.text}</div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      You have no notifications right now.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Action: Create Campaign */}
          <button
            onClick={onOpenCreateEventModal}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/30"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Campaign</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>
    </header>
  );
}