import { useState } from 'react';
import { 
  Ticket, Sparkles, Layers, Sliders, Palette, Type, QrCode, 
  Download, Eye, Check, ExternalLink, RefreshCw, Upload, Image as ImageIcon
} from 'lucide-react';
import { EventItem } from '../../types';

interface BadgeStudioPassesProps {
  event: EventItem;
  onLaunchStudio: (event: EventItem) => void;
  isDark?: boolean;
}

export function BadgeStudioPasses({ event, onLaunchStudio, isDark }: BadgeStudioPassesProps) {
  const [selectedRole, setSelectedRole] = useState<'attendee' | 'speaker' | 'vip' | 'sponsor'>('speaker');
  const [activeTheme, setActiveTheme] = useState<'emerald' | 'cyan' | 'cyber' | 'glass'>('emerald');
  const [showQr, setShowQr] = useState(true);
  const [headlineText, setHeadlineText] = useState('FEATURED KEYNOTE SPEAKER');
  const [subText, setSubText] = useState('SaaS Frontiers Global Summit 2026');
  const [isCopied, setIsCopied] = useState(false);

  const samplePass = {
    name: 'Sarah Connor',
    title: 'Chief Technology Officer',
    company: 'Skynet Defense Systems',
    passCode: 'SF-2026-KEYNOTE-084',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'
  };

  const roles = [
    { id: 'speaker', label: 'Speaker', badge: 'KEYNOTE', color: 'bg-emerald-500 text-white' },
    { id: 'vip', label: 'VIP Pass', badge: 'ALL-ACCESS', color: 'bg-amber-500 text-white' },
    { id: 'attendee', label: 'Attendee', badge: 'SUMMIT PASS', color: 'bg-sky-500 text-white' },
    { id: 'sponsor', label: 'Sponsor', badge: 'PLATINUM', color: 'bg-purple-500 text-white' }
  ];

  const themes = [
    { id: 'emerald', name: 'Luminescent Emerald', gradient: 'from-emerald-500 via-teal-600 to-slate-900', border: 'border-emerald-500/50' },
    { id: 'cyan', name: 'Cyber Cerulean', gradient: 'from-sky-500 via-blue-600 to-slate-900', border: 'border-sky-500/50' },
    { id: 'cyber', name: 'Obsidian Neon', gradient: 'from-purple-500 via-indigo-600 to-slate-950', border: 'border-purple-500/50' },
    { id: 'glass', name: 'Frost Glassmorphism', gradient: 'from-white/20 via-slate-500/20 to-white/5', border: 'border-white/30' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200/90'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
              Badge Studio & Passes
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">Real-time Canvas Renderer</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Pass Templates & Design System</h1>
          <p className="text-xs text-slate-400 mt-1">Configure digital advocacy passes, badges, holographic foils, and attendee frames.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onLaunchStudio(event)}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Test in Live Public Studio</span>
          </button>
        </div>
      </div>

      {/* Studio Workspace: Split Controls & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Configuration Controls (7 cols) */}
        <div className={`lg:col-span-7 p-6 rounded-2xl border space-y-6 ${
          isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200/90'
        }`}>
          {/* Role Tier Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Select Pass Role Tier
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRole(r.id as any);
                    if (r.id === 'speaker') setHeadlineText('FEATURED KEYNOTE SPEAKER');
                    if (r.id === 'vip') setHeadlineText('VIP ALL-ACCESS DELEGATE');
                    if (r.id === 'attendee') setHeadlineText('CONFIRMED SUMMIT ATTENDEE');
                    if (r.id === 'sponsor') setHeadlineText('PROUD PLATINUM SPONSOR');
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedRole === r.id
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-inherit hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">{r.label}</div>
                  <span className={`inline-block mt-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${r.color}`}>
                    {r.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Preset */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Visual Theme & Foil Gradient
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTheme(t.id as any)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    activeTheme === t.id
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'border-inherit hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${t.gradient} shrink-0 border ${t.border}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{t.name}</div>
                    <div className="text-[10px] text-slate-400">High-gloss render</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Typography & Headline Editor */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Pass Typography & Headlines
            </label>
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Pass Header Badge</span>
              <input
                type="text"
                value={headlineText}
                onChange={(e) => setHeadlineText(e.target.value)}
                className={`w-full h-9 px-3 rounded-xl text-xs border outline-none font-semibold ${
                  isDark ? 'bg-slate-800/80 border-white/10 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                }`}
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Event Subtitle / Edition</span>
              <input
                type="text"
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                className={`w-full h-9 px-3 rounded-xl text-xs border outline-none ${
                  isDark ? 'bg-slate-800/80 border-white/10 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-inherit/40 space-y-2">
            <label className="flex items-center justify-between text-xs cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-semibold">Display Dynamic Verification QR Code</span>
              <input
                type="checkbox"
                checked={showQr}
                onChange={(e) => setShowQr(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
              />
            </label>
          </div>
        </div>

        {/* Right: Live Realistic Badge Canvas Preview (5 cols) */}
        <div className={`lg:col-span-5 p-6 rounded-2xl border flex flex-col items-center justify-center ${
          isDark ? 'bg-slate-900/70 border-white/10' : 'bg-white border-slate-200/90'
        }`}>
          <div className="text-center mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Card Output</span>
            <h3 className="font-bold text-sm">3D High-Fidelity Holographic Pass</h3>
          </div>

          {/* Badge Container */}
          <div className="w-full max-w-[340px] aspect-[9/14] rounded-3xl p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-400 shadow-2xl relative overflow-hidden group">
            <div className="h-full w-full rounded-[22px] bg-[#0c1322] p-5 flex flex-col justify-between relative overflow-hidden text-white">
              {/* Background ambient foil glows */}
              <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-sky-500/20 blur-2xl pointer-events-none" />

              {/* Top Pass Bar */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs">
                    EC
                  </div>
                  <span className="text-xs font-extrabold tracking-tight">EventCards</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {headlineText.split(' ')[0]}
                </span>
              </div>

              {/* Avatar & Photo Framing */}
              <div className="flex flex-col items-center z-10 my-auto py-2">
                <div className="relative p-1 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-sky-400 shadow-lg mb-3">
                  <img
                    src={samplePass.avatar}
                    alt={samplePass.name}
                    className="h-28 w-28 rounded-full object-cover border-2 border-[#0c1322]"
                  />
                  <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-emerald-500 border-2 border-[#0c1322] flex items-center justify-center text-slate-950 font-bold">
                    ✓
                  </div>
                </div>

                <div className="text-center space-y-0.5">
                  <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    {headlineText}
                  </div>
                  <h4 className="text-xl font-black tracking-tight">{samplePass.name}</h4>
                  <p className="text-xs text-slate-300 font-medium">{samplePass.title}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{samplePass.company}</p>
                </div>
              </div>

              {/* Pass Footer: Code & QR */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between z-10">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Verification ID</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">{samplePass.passCode}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{event.dates || 'Oct 14–16, 2026'}</div>
                </div>

                {showQr && (
                  <div className="h-12 w-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
                    <QrCode className="h-full w-full text-slate-950" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full max-w-[340px] mt-4 flex items-center gap-2">
            <button
              onClick={() => onLaunchStudio(event)}
              className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all text-center"
            >
              Open In Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
