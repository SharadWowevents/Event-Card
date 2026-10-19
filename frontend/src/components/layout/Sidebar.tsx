import { useState } from 'react';
import { 
  Calendar, Layers, BarChart3, Users, Share2, Settings, LogOut, 
  Sun, Moon, ChevronLeft, ChevronRight, ChevronsUpDown, Check, Plus, 
  ExternalLink, Shield, Workflow, TrendingUp, Ticket, Flame, 
  BadgePercent, Eye, ShieldCheck, Compass, Sparkles
} from 'lucide-react';
import { EventItem } from '../../types';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelectEvent: (event: EventItem) => void;
  onOpenCreateEventModal: () => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLaunchStudio?: (event: EventItem) => void;
  user?: { name?: string; email?: string; role?: string } | null;
}

const getInitials = (name?: string) => {
  if (!name) return 'AD';
  const parts = name.trim().split(' ').filter(p => p.length > 0);
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

export function Sidebar({
  currentView,
  onSelectView,
  events,
  selectedEvent,
  onSelectEvent,
  onOpenCreateEventModal,
  onLogout,
  isDark,
  onToggleDark,
  isCollapsed,
  onToggleCollapse,
  onLaunchStudio,
  user
}: SidebarProps) {
  const [eventSelectorOpen, setEventSelectorOpen] = useState(false);

  const currentUser = user || (() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) return JSON.parse(saved);
      const token = localStorage.getItem('token');
      if (token) {
        return JSON.parse(atob(token.split('.')[1]));
      }
    } catch {}
    return null;
  })();

  const displayName = currentUser?.name || 'Master Admin';
  const displayRole = currentUser?.role || 'Superadmin';

  const mainNav = [
    {
      id: 'admin-events',
      label: 'Campaigns & Events',
      icon: Calendar,
      badge: `${events.length}`,
      description: 'Manage active summits'
    },
    // {
    //   id: 'admin-passes',
    //   label: 'Badge Studio & Passes',
    //   icon: Ticket,
    //   badge: 'PRO',
    //   description: 'Pass templates & styling'
    // },
    {
      id: 'gallery',
      label: 'Moments Gallery',
      icon: Layers,
      description: 'Advocate photo stream'
    },
    {
      id: 'admin-analytics',
      label: 'Pass & Advocacy Analytics',
      icon: TrendingUp,
      badge: '',
      description: 'Attendee passes & downloads'
    }
  ];

  const platformNav = [
    // {
    //   id: 'admin-integrations',
    //   label: 'Integrations & CRM',
    //   icon: Workflow,
    //   description: 'HubSpot, Zapier, Webhooks'
    // },
    {
      id: 'admin-team',
      label: 'Team & Permissions',
      icon: ShieldCheck,
      description: 'RBAC & collaborators'
    }
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between transition-all duration-300 border-r ${
        isDark 
          ? 'bg-[#0b0f19] border-white/10 text-slate-200' 
          : 'bg-white border-slate-200/90 text-slate-800'
      } ${isCollapsed ? 'w-20' : 'w-72'}`}
    >
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-inherit">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
                <Ticket className="h-5 w-5" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight leading-tight">EventCards</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Studio
                  </span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
                  Advocacy Engine
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Active Campaign Selector */}
        {!isCollapsed && selectedEvent && (
          <div className="p-3 border-b border-inherit">
            <div className="relative">
              <button
                onClick={() => setEventSelectorOpen(!eventSelectorOpen)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                  isDark
                    ? 'bg-slate-900/60 border-white/10 hover:border-emerald-500/50 hover:bg-slate-900'
                    : 'bg-slate-50 border-slate-200 hover:border-emerald-500/40 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate leading-tight">
                      {selectedEvent.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Live Summit
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400 ml-1" />
              </button>

              {eventSelectorOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-xl shadow-xl border z-50 max-h-60 overflow-y-auto ${
                  isDark ? 'bg-slate-900 border-white/15' : 'bg-white border-slate-200'
                }`}>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active Summit
                  </div>
                  {events.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => {
                        onSelectEvent(evt);
                        setEventSelectorOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        selectedEvent.id === evt.id
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{evt.name}</span>
                      {selectedEvent.id === evt.id && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setEventSelectorOpen(false);
                      onOpenCreateEventModal();
                    }}
                    className="w-full flex items-center gap-1.5 px-2.5 py-2 mt-1 rounded-lg text-xs text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create New Event</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="px-3 py-4 space-y-6">
          {/* Core Workspace */}
          <div>
            {!isCollapsed && (
              <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Core Workspace
              </div>
            )}
            <nav className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Org & Platform */}
          <div>
            {!isCollapsed && (
              <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Org & Platform
              </div>
            )}
            <nav className="space-y-1">
              {platformNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Public Studio Quick-Action Pill */}
        {!isCollapsed && selectedEvent && onLaunchStudio && (
          <div className="px-3 pb-3">
            <button
              onClick={() => onLaunchStudio(selectedEvent)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-teal-500/10 border border-sky-500/20 text-xs font-bold text-sky-600 dark:text-sky-400 hover:border-sky-500/40 transition-all group"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                <span>Launch Public Studio</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20">
                /{selectedEvent.slug}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Area: Theme Toggle, Profile */}
      <div className={`p-3 border-t border-inherit ${
        isDark ? 'bg-slate-950/40' : 'bg-slate-50/70'
      }`}>
        {/* Theme Toggle & User Row */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          <button
            onClick={onToggleDark}
            className={`p-2 rounded-xl border text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${
              isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {!isCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                {getInitials(displayName)}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold leading-tight truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight truncate">
                  {displayRole}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
