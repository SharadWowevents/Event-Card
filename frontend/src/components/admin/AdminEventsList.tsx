import { useState } from 'react';
import { 
  Plus, Search, Calendar, MapPin, Sparkles, Share2, Users, 
  Check, Link as LinkIcon, ExternalLink, Edit3, 
  Archive, RotateCcw, Image, TrendingUp, Ticket, Flame,
  Download, Filter, ArrowUpRight, CheckCircle2
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
  isDark?: boolean;
}

export function AdminEventsList({
  events,
  onSelectEvent,
  onOpenCreateModal,
  onEditEvent,
  onToggleArchive,
  onLaunchStudio,
  onLaunchGallery,
  isDark
}: AdminEventsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Stats calculation
  const totalPosters = events.reduce((acc, e) => acc + (e.postersCount || 0), 0);
  const totalShares = events.reduce((acc, e) => acc + (e.sharesCount || 0), 0);
  const activeEventsCount = events.filter((e) => e.status === 'active').length;
  const draftEventsCount = events.filter((e) => e.status === 'draft').length;
  const archivedEventsCount = events.filter((e) => e.status === 'archived').length;

  const filteredEvents = events.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        (e.venue && e.venue.toLowerCase().includes(q)) ||
        e.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleExportSummaryCsv = () => {
    const headers = ['Event Name', 'Slug', 'Status', 'Dates', 'Venue', 'Posters Claimed', 'Social Shares'];
    const rows = events.map(e => [
      `"${e.name.replace(/"/g, '""')}"`,
      e.slug,
      e.status,
      `"${e.dates}"`,
      `"${e.venue}"`,
      e.postersCount || 0,
      e.sharesCount || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `events-campaign-summary-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      {/* Top Page Header: Advocacy Lifecycle Controller */}
      <div className={`p-6 sm:p-8 rounded-2xl border relative overflow-hidden transition-all ${
        isDark
          ? 'bg-gradient-to-br from-slate-900/90 via-[#0e1626] to-[#0c1322] border-white/10 shadow-xl'
          : 'bg-white border-slate-300 shadow-sm'
      }`}>
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Advocacy Lifecycle Controller</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Campaign Management & Live Summits
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Orchestrate attendee advocacy loops, custom digital passes, and viral reach metrics with automated distribution pipelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
              className={`h-10 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                statusFilter === 'active'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filter Status</span>
            </button>
            <button
              onClick={handleExportSummaryCsv}
              className="h-10 px-4 rounded-xl border bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenCreateModal}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 High-Impact KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Active Campaigns */}
        <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
          isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Campaigns
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {activeEventsCount} Active
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold tracking-tight">
              {activeEventsCount}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              / {events.length} Total
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              +12% MoM pacing
            </span>
            <span>{draftEventsCount} in review</span>
          </div>
        </div>

        {/* Metric 2: Total Passes Issued */}
        <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
          isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Passes Claimed
            </span>
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Ticket className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold tracking-tight font-mono">
              {totalPosters.toLocaleString()}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-bold font-mono">
              96.5%
            </span>
          </div>
          <div className="flex items-center gap-2 pt-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-end gap-1 h-3.5 w-24">
              <span className="w-1.5 h-2 rounded bg-sky-400" />
              <span className="w-1.5 h-3 rounded bg-sky-400" />
              <span className="w-1.5 h-2.5 rounded bg-sky-400" />
              <span className="w-1.5 h-3.5 rounded bg-emerald-500" />
              <span className="w-1.5 h-3 rounded bg-emerald-500" />
              <span className="w-1.5 h-3.5 rounded bg-emerald-500" />
            </div>
            <span>Target 50,000 passes</span>
          </div>
        </div>

        {/* Metric 3: Viral Share Velocity */}
        <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
          isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Viral Share Velocity
            </span>
            <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[10px] font-bold">
              2.6x Mult
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold tracking-tight font-mono">
              {totalShares.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">shares</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-1 text-slate-400">
              <Share2 className="h-3.5 w-3.5 text-teal-500" />
              LinkedIn & X Amplified
            </span>
            <span className="font-semibold text-teal-500">+18.4%</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className={`p-3 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-300 shadow-sm'
      }`}>
        {/* Segmented Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full md:w-auto border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Campaigns <span className="ml-1 text-[11px] font-normal text-slate-400">{events.length}</span>
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Live <span className="ml-1 text-[11px] font-semibold text-emerald-500">{activeEventsCount}</span>
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'draft'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Drafts <span className="ml-1 text-[11px] font-normal text-slate-400">{draftEventsCount}</span>
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'archived'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Archived <span className="ml-1 text-[11px] font-normal text-slate-400">{archivedEventsCount}</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, venue, slug..."
            className={`w-full h-9 pl-9 pr-4 rounded-xl text-xs border outline-none transition-all ${
              isDark
                ? 'bg-slate-800/80 border-white/10 text-slate-200 placeholder-slate-500 focus:border-emerald-500'
                : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-emerald-500'
            }`}
          />
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <Ticket className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold mb-1">No event campaigns found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Try adjusting your search query or filter options, or create a brand new campaign.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md hover:bg-emerald-600 transition-all"
          >
            Create New Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const isLive = evt.status === 'active';

            return (
              <div
                key={evt.id}
                className={`group rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/80 border-white/10 hover:border-emerald-500/40'
                    : 'bg-white border-slate-300 hover:border-emerald-500/50 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Card Top Header & Status */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isLive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : evt.status === 'draft'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      {evt.status}
                    </span>

                    <button
                      onClick={() => handleCopyLink(evt.slug)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        copiedSlug === evt.slug
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : isDark
                          ? 'bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Copy Public Studio Link"
                    >
                      {copiedSlug === evt.slug ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-3 w-3" />
                          <span className="font-mono text-[10px]">/{evt.slug}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors line-clamp-1">
                    {evt.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {evt.tagline || 'Digital pass and advocate amplification campaign for registered summit attendees.'}
                  </p>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{evt.dates}</span>
                    </div>
                    {evt.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Metric Pills */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Posters Claimed</div>
                      <div className="font-mono font-bold text-sm mt-0.5">{evt.postersCount || 0}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Shares</div>
                      <div className="font-mono font-bold text-sm mt-0.5">{evt.sharesCount || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className={`p-3 px-5 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'bg-slate-950/40 border-white/10' : 'bg-slate-50/70 border-slate-300'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditEvent(evt)}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Campaign"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onLaunchGallery(evt)}
                      className="p-2 rounded-lg text-slate-500 hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
                      title="View Moments Gallery"
                    >
                      <Image className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onToggleArchive(evt.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      title={evt.status === 'archived' ? 'Restore Campaign' : 'Archive Campaign'}
                    >
                      {evt.status === 'archived' ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                    </button>
                  </div>

                  <button
                    onClick={() => onLaunchStudio(evt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all"
                  >
                    <span>Launch Studio</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}