import { useState, useEffect } from 'react';
import { 
  BarChart3, Sparkles, Share2, Users, DollarSign, Download, Search, HelpCircle, 
  Linkedin, Twitter, MessageCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { EventItem } from '../../types';
import { exportLeadsToCsv } from '../../utils/csvExporter';

interface AnalyticsDashboardProps {
  event: EventItem;
}

export function AnalyticsDashboard({ event }: AnalyticsDashboardProps) {
  const [leadsSearch, setLeadsSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showEmvInfo, setShowEmvInfo] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const cpmBenchmark = 28.50; 
  const totalPosters = event.postersCount || 0;
  const totalShares = event.sharesCount || 0;
  const estimatedReach = Math.round(totalShares * 115); 
  const calculatedEmv = event.emvValue || Math.round((estimatedReach / 1000) * cpmBenchmark);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/events/${event.id || event._id}/leads`)
      .then(res => res.json())
      .then(data => {
        const mappedLeads = data.map((d: any) => ({
          ...d,
          id: d._id,
          rawDate: d.createdAt,
          createdAt: new Date(d.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          badgeThumbnail: d.avatarUrl,
          platformsShared: d.platformsShared && d.platformsShared.length > 0 ? d.platformsShared : [d.platformShared || 'Direct Download']
        }));
        setLeads(mappedLeads);
      })
      .catch(err => console.error("Failed to fetch leads:", err))
      .finally(() => setIsLoading(false));
  }, [event.id, event._id]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [leadsSearch, roleFilter]);

  const filteredLeads = leads.filter((l) => {
    if (roleFilter !== 'All' && l.role !== roleFilter.toLowerCase()) return false;
    if (leadsSearch.trim()) {
      const q = leadsSearch.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) || (l.email && l.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const currentLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCsv = () => exportLeadsToCsv(filteredLeads, event.name);

  // --- 1. DYNAMIC TIMELINE CHART DATA ---
  const dailyStats = leads.reduce((acc: any, lead: any) => {
    const dateObj = new Date(lead.rawDate);
    const day = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!acc[day]) acc[day] = { date: day, rawDate: lead.rawDate, shares: 0, posters: 0, emv: 0 };
    acc[day].posters += lead.downloadsCount || 1;
    acc[day].shares += lead.sharesCount || 0;
    acc[day].emv += Math.round(((lead.sharesCount || 0) * 115 / 1000) * cpmBenchmark);
    return acc;
  }, {});

  let chartData = Object.values(dailyStats).sort((a: any, b: any) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

  if (chartData.length === 1) {
    const d = new Date(chartData[0].rawDate);
    d.setDate(d.getDate() - 1);
    chartData.unshift({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      shares: 0, posters: 0, emv: 0
    });
  } else if (chartData.length === 0) {
    chartData = [
      { date: 'Yesterday', shares: 0, posters: 0, emv: 0 }, 
      { date: 'Today', shares: 0, posters: 0, emv: 0 }
    ];
  }

  const chartHeight = 220;
  const chartWidth = 700;
  const maxShareVal = Math.max(...chartData.map((d: any) => d.shares), 5);
  const points = chartData.map((d: any, i) => {
    const x = (i / (chartData.length - 1)) * (chartWidth - 60) + 30;
    const y = chartHeight - (d.shares / maxShareVal) * (chartHeight - 60) - 30;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - 30} L ${points[0].x} ${chartHeight - 30} Z`;

  // --- 2. DYNAMIC PLATFORMS & ROLES ---
  const roleStats = ['attendee', 'speaker', 'exhibitor', 'sponsor'].map(role => {
    const count = leads.filter(l => l.role === role).length;
    const percentage = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
    let color = '#0ea5e9';
    if (role === 'speaker') color = '#a855f7';
    if (role === 'exhibitor') color = '#10b981';
    if (role === 'sponsor') color = '#f59e0b';
    return { role: role.charAt(0).toUpperCase() + role.slice(1) + 's', count, percentage, color };
  });

  const platformStats = ['LinkedIn', 'X', 'WhatsApp', 'Direct Download'].map(platform => {
    const platformLeads = leads.filter(l => l.platformsShared?.includes(platform));
    let metricCount = 0;
    if (platform === 'Direct Download') {
      metricCount = platformLeads.reduce((acc, curr) => acc + (curr.downloadsCount || 0), 0);
    } else {
      metricCount = Math.round(platformLeads.reduce((acc, curr) => {
        const socialCount = (curr.platformsShared || []).filter((p: string) => p !== 'Direct Download').length;
        return acc + (socialCount > 0 ? (curr.sharesCount || 0) / socialCount : 0);
      }, 0));
    }
    const totalDownloads = leads.reduce((acc, curr) => acc + (curr.downloadsCount || 0), 0) || 1;
    const totalEventShares = totalShares || 1; 
    const sharePercentage = platform === 'Direct Download' ? Math.round((metricCount / totalDownloads) * 100) : Math.round((metricCount / totalEventShares) * 100);
    
    return {
      platform: platform === 'X' ? 'X / Twitter' : platform,
      shares: metricCount,
      sharePercentage,
      reachEstimate: platform === 'Direct Download' ? 0 : metricCount * 115,
      engagement: platform === 'Direct Download' ? '-' : `${(Math.random() * 4 + 2).toFixed(1)}%`
    };
  }).sort((a, b) => b.shares - a.shares);


  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      
      {/* Top Header & KPIs */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-xs font-semibold text-emerald-800 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Advocacy & Earned Media Value (EMV)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{event.name} Analytics</h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">Track organic attendee amplification, viral multipliers, and tangible pipeline value generated.</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold"><span>Total Posters Generated</span><Sparkles className="h-4 w-4 text-teal-600" /></div>
              <div className="mt-2 text-3xl font-black text-slate-900">{totalPosters.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold"><span>Total Social Shares</span><Share2 className="h-4 w-4 text-sky-600" /></div>
              <div className="mt-2 text-3xl font-black text-slate-900">{totalShares.toLocaleString()}</div>
            </div>
            {/* <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold"><span>Estimated Social Reach</span><Users className="h-4 w-4 text-indigo-600" /></div>
              <div className="mt-2 text-3xl font-black text-slate-900">{(estimatedReach / 1000).toFixed(1)}K</div>
            </div> */}
            {/* <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 p-5 shadow-xs relative">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
                <span className="flex items-center gap-1">Earned Media Value (EMV)<button onClick={() => setShowEmvInfo(!showEmvInfo)} className="text-emerald-700 hover:text-emerald-900"><HelpCircle className="h-3.5 w-3.5" /></button></span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-3xl font-black text-emerald-700">${calculatedEmv.toLocaleString()}</div>
              
              {showEmvInfo && (
                <div className="absolute left-4 right-4 top-full mt-2 rounded-xl bg-slate-900 text-white p-3 text-[11px] shadow-2xl z-20 animate-in fade-in duration-150">
                  <div className="font-bold text-teal-400 mb-1">How EMV is Calculated:</div>
                  <p className="text-slate-300 leading-relaxed">
                    Earned Media Value (EMV) = (Estimated Organic Reach / 1,000) × Benchmark B2B Tech CPM ($28.50). This represents the paid advertising expenditure required to achieve equivalent qualified reach.
                  </p>
                </div>
              )}
            </div> */}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* ROW 1: Timeline Graph & Role Mix */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          
          {/* Live Timeline SVG Chart */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daily Badge Downloads & Social Shares</h3>
                <p className="text-xs text-slate-500">Live advocate engagement over time</p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-teal-600"><span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Social Shares</span>
              </div>
            </div>

            <div className="relative w-full h-56 mt-2 overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="30" y1={chartHeight - 30} x2={chartWidth - 30} y2={chartHeight - 30} stroke="#e2e8f0" strokeWidth="1" />
                <line x1="30" y1="30" x2={chartWidth - 30} y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="30" y1="110" x2={chartWidth - 30} y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                
                <path d={areaD} fill="url(#areaGradient)" />
                <path d={pathD} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />

                {points.map((p, i) => (
                  <g key={i} onMouseEnter={() => setHoveredPointIndex(i)} onMouseLeave={() => setHoveredPointIndex(null)} className="cursor-pointer">
                    <circle cx={p.x} cy={p.y} r={hoveredPointIndex === i ? 6 : 4} fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                    <text x={p.x} y={chartHeight - 12} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="inherit">{p.date}</text>
                  </g>
                ))}
              </svg>

              {hoveredPointIndex !== null && (
                <div className="absolute pointer-events-none rounded-xl bg-slate-900 text-white p-2.5 text-xs shadow-xl z-20 -translate-x-1/2 -translate-y-full" style={{ left: `${(hoveredPointIndex / (chartData.length - 1)) * 90 + 5}%`, top: `${points[hoveredPointIndex].y * 0.8}px` }}>
                  <div className="font-bold text-teal-400">{chartData[hoveredPointIndex].date}</div>
                  <div className="text-slate-200">Shares: <strong>{chartData[hoveredPointIndex].shares.toLocaleString()}</strong></div>
                  {/* <div className="text-slate-400 text-[10px]">EMV: ${chartData[hoveredPointIndex].emv.toLocaleString()}</div> */}
                </div>
              )}
            </div>
          </div>

          {/* Role Mix */}
          {/* <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Advocate Role Mix</h3>
              <div className="mt-5 h-4 w-full rounded-full overflow-hidden flex shadow-inner">
                {roleStats.map((r, i) => (<div key={i} style={{ width: `${r.percentage}%`, backgroundColor: r.color }} title={`${r.role}: ${r.percentage}%`} />))}
              </div>
              <div className="mt-5 space-y-3">
                {roleStats.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} /><span className="font-semibold text-slate-700">{r.role}</span></div>
                    <div className="flex items-center space-x-2"><span className="font-bold text-slate-900">{r.count.toLocaleString()}</span><span className="text-[11px] text-slate-400 font-mono">({r.percentage}%)</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div> */}

        </div>

        {/* ROW 2: Top Channels */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Top Social Advocacy Distribution Channels</h3>
          <p className="text-xs text-slate-500 mb-5">Where your attendees are spreading the word</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformStats.map((p, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between"><span className="font-bold text-xs text-slate-800">{p.platform}</span><span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">{p.sharePercentage}%</span></div>
                <div className="text-xl font-extrabold text-slate-900">{p.shares.toLocaleString()}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60"><span>Reach: {(p.reachEstimate / 1000).toFixed(1)}k</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 3: Table with Pagination */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col min-h-[400px]">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Advocate Leads & Shared Passes</h3>
              <p className="text-xs text-slate-500">Attendees who customized and published official advocacy cards ({filteredLeads.length} leads)</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <option value="All">All Roles</option><option value="Attendee">Attendees</option><option value="Speaker">Speakers</option><option value="Exhibitor">Exhibitors</option><option value="Sponsor">Sponsors</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input type="text" value={leadsSearch} onChange={(e) => setLeadsSearch(e.target.value)} placeholder="Search name, company..." className="rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden" />
              </div>
              <button onClick={handleExportCsv} className="flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 hover:bg-black text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors">
                <Download className="h-3.5 w-3.5" /><span>Export CSV</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-medium">Fetching live attendees...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-medium">No attendees found.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-5">Advocate</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Company & Designation</th>
                    <th className="py-3 px-4">Channels Used</th>
                    <th className="py-3 px-4 text-center">Downloads</th>
                    <th className="py-3 px-4 text-center">Shares</th>
                    <th className="py-3 px-5 text-right">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <img src={lead.badgeThumbnail} alt={lead.name} referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover border border-slate-200 bg-slate-100" />
                          <div>
                            <div className="font-bold text-slate-900">{lead.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{lead.email || 'No email provided'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${lead.role === 'speaker' ? 'bg-purple-100 text-purple-700' : lead.role === 'exhibitor' ? 'bg-emerald-100 text-emerald-700' : lead.role === 'sponsor' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                          {lead.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{lead.company}</div>
                        <div className="text-[11px] text-slate-500">{lead.title}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-700">
                          {lead.platformsShared?.map((p: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center gap-1">
                              {p === 'LinkedIn' && <Linkedin className="h-3.5 w-3.5 text-[#0a66c2]" />}
                              {p === 'X' && <Twitter className="h-3.5 w-3.5 text-slate-800" />}
                              {p === 'WhatsApp' && <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />}
                              <span>{p}</span>{idx < lead.platformsShared.length - 1 && <span className="mr-1">,</span>}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">{lead.downloadsCount}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-teal-600">{lead.sharesCount}</td>
                      <td className="py-3.5 px-5 text-right font-mono text-[11px] text-slate-500">{lead.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-4 mt-auto rounded-b-2xl">
              <span className="text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="font-semibold text-slate-900">{filteredLeads.length}</span> entries
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold transition-colors ${
                        currentPage === idx + 1 
                          ? 'bg-teal-600 text-white shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}