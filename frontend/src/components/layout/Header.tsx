import { useState } from 'react';
import { 
  Sparkles, Layers, BarChart3, Plug, Users, Calendar, ExternalLink, ChevronDown, Check, LogOut, Menu, X
} from 'lucide-react';
import { EventItem } from '../../types';

interface HeaderProps {
  currentView: string;
  onSelectView: (view: string) => void;
  events: EventItem[];
  selectedEvent: EventItem;
  onSelectEvent: (event: EventItem) => void;
  onOpenCreateEventModal: () => void;
  onLogout: () => void; // New logout prop
}

export function Header({
  currentView, onSelectView, events, selectedEvent, onSelectEvent, onOpenCreateEventModal, onLogout
}: HeaderProps) {
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleEventChange = (evt: EventItem) => {
    onSelectEvent(evt);
    setEventDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Brand Identity + Event Selector */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <img src='logo.png' className="h-5 w-5"/>
              {/* <Sparkles className="h-5 w-5" /> */}
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">EventCards</span>
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Admin Portal</span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
              className="hidden sm:flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span className="max-w-[180px] truncate font-semibold text-slate-800">{selectedEvent.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {eventDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 origin-top-left rounded-xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
                <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Switch Active Campaign</div>
                <div className="space-y-1">
                  {events.map((evt) => (
                    <button key={evt.id} onClick={() => handleEventChange(evt)} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${selectedEvent.id === evt.id ? 'bg-teal-50 font-semibold text-teal-900' : 'text-slate-700 hover:bg-slate-50'}`}>
                      <div className="truncate"><p className="font-medium text-slate-900 truncate">{evt.name}</p></div>
                      {selectedEvent.id === evt.id && <Check className="h-4 w-4 text-teal-600 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-slate-100 pt-1.5">
                  <button onClick={() => { setEventDropdownOpen(false); onOpenCreateEventModal(); }} className="flex w-full items-center justify-center space-x-1.5 rounded-lg py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors">
                    <span>+ Create New Event</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Admin Tabs Only */}
        <nav className="hidden md:flex items-center space-x-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/80">
          <button onClick={() => onSelectView('admin-events')} className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${currentView === 'admin-events' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
            <Layers className="h-3.5 w-3.5 text-indigo-600" /><span>Events</span>
          </button>
          <button onClick={() => onSelectView('admin-analytics')} className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${currentView === 'admin-analytics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
            <BarChart3 className="h-3.5 w-3.5 text-emerald-600" /><span>EMV Analytics</span>
          </button>
          <button onClick={() => onSelectView('admin-integrations')} className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${currentView === 'admin-integrations' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
            <Plug className="h-3.5 w-3.5 text-amber-600" /><span>Integrations</span>
          </button>
          <button onClick={() => onSelectView('admin-team')} className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${currentView === 'admin-team' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
            <Users className="h-3.5 w-3.5 text-purple-600" /><span>Team</span>
          </button>
        </nav>

        {/* Right: Event Link & Logout */}
        <div className="flex items-center space-x-3">
          <a href={selectedEvent.website} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <span>Event Site</span><ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
          
          <button onClick={onLogout} className="hidden sm:inline-flex items-center space-x-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors">
            <LogOut className="h-3.5 w-3.5" /><span>Sign Out</span>
          </button>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}