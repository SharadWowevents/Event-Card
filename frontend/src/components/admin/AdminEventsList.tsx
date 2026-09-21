import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Layers, 
  Archive, 
  RotateCcw, 
  ExternalLink, 
  Edit3, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Share2, 
  Users, 
  DollarSign, 
  CheckCircle2,
  Link,   // Added for the copy button
  Check   // Added for the copy success state
} from 'lucide-react';
import { EventItem, EventStatus } from '../../types';

interface AdminEventsListProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onOpenCreateModal: () => void;
  onEditEvent: (event: EventItem) => void;
  onToggleArchive: (eventId: string) => void;
  onLaunchStudio: (event: EventItem) => void;
  onLaunchGallery: (event: EventItem) => void;
}

export function AdminEventsList({
  events,
  onSelectEvent,
  onOpenCreateModal,
  onEditEvent,
  onToggleArchive,
  onLaunchStudio,
  onLaunchGallery
}: AdminEventsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  
  // NEW: State to track which link was just copied
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Stats calculation
  const totalAdvocates = events.reduce((acc, e) => acc + e.postersCount, 0);
  const totalShares = events.reduce((acc, e) => acc + e.sharesCount, 0);
  const totalEMV = events.reduce((acc, e) => acc + e.emvValue, 0);
  const activeEventsCount = events.filter((e) => e.status === 'active').length;

  const filteredEvents = events.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.slug.toLowerCase().includes(q);
    }
    return true;
  });

  // NEW: Function to generate and copy the link
  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000); // Reset after 2 seconds
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      
      {/* Top Header */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-50 border border-indigo-200/60 px-3 py-1 text-xs font-semibold text-indigo-800 mb-2">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                <span>Organizer Command Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Event Advocacy Campaigns
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Deploy dynamic badge generators, monitor advocate sharing loops, and calculate earned media value.
              </p>
            </div>

            <button
              id="create-event-top-btn"
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center space-x-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Event</span>
            </button>
          </div>

          {/* Top-line KPI Cards */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Active Campaigns</span>
                <Layers className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">{activeEventsCount}</div>
              <span className="text-[11px] text-slate-500 font-medium">{events.length} total registered</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Badges Created</span>
                <Sparkles className="h-4 w-4 text-teal-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">
                {totalAdvocates.toLocaleString()}
              </div>
              <span className="text-[11px] text-teal-600 font-bold">+28% this month</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Social Shares</span>
                <Share2 className="h-4 w-4 text-sky-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2">
                {totalShares.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">2.6x shares / attendee</span>
            </div>

            {/* <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Earned Media (EMV)</span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-2">
                ${totalEMV.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-700 font-bold">Industry CPM benchmark</span>
            </div> */}
          </div>

        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-200">
          
          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5 rounded-xl bg-slate-200/60 p-1 text-xs">
            {(['all', 'active', 'draft', 'archived'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event name, venue..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className={`group rounded-2xl border transition-all duration-200 flex flex-col justify-between bg-white shadow-xs hover:shadow-xl ${
                evt.status === 'archived'
                  ? 'border-slate-200/60 opacity-80'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="p-5 sm:p-6 space-y-4">
                
                {/* Status + Actions */}
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      evt.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : evt.status === 'draft'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {evt.status}
                  </span>

                  {/* Archive / Restore toggle */}
                  <button
                    onClick={() => onToggleArchive(evt.id)}
                    title={evt.status === 'archived' ? 'Restore event' : 'Archive event'}
                    className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {evt.status === 'archived' ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Restore</span>
                      </>
                    ) : (
                      <>
                        <Archive className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Archive</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Event Title & Details */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                    {evt.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {evt.tagline}
                  </p>
                </div>

                {/* Date & Location */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{evt.dates}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{evt.venue}</span>
                  </div>
                </div>

                {/* Metrics ribbon */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100 text-center">
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      {evt.postersCount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Posters</div>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-teal-600">
                      {evt.sharesCount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Shares</div>
                  </div>
                  {/* <div>
                    <div className="text-xs font-extrabold text-emerald-600">
                      ${Math.round(evt.emvValue / 1000)}k
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">EMV</div>
                  </div> */}
                </div>

              </div>

              {/* Card Footer Actions */}
              <div className="border-t border-slate-100 bg-slate-50/50 p-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {/* <button
                    onClick={() => onLaunchStudio(evt)}
                    className="rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-2.5 py-1.5 text-xs font-bold text-teal-800 transition-colors"
                  >
                    Badge Studio
                  </button> */}
                  <button
                    onClick={() => onLaunchGallery(evt)}
                    className="rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200/80 px-2.5 py-1.5 text-xs font-bold text-sky-800 transition-colors"
                  >
                    Gallery
                  </button>

                  {/* NEW: Copy Link Button */}
                  <button 
                    onClick={() => handleCopyLink(evt.slug)} 
                    className="flex items-center space-x-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    title="Copy Public Attendee Link"
                  >
                    {copiedSlug === evt.slug ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Link className="h-3.5 w-3.5 text-slate-500" />}
                    <span className={copiedSlug === evt.slug ? "text-emerald-600" : ""}>{copiedSlug === evt.slug ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <button
                  onClick={() => onEditEvent(evt)}
                  className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Configure</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
}