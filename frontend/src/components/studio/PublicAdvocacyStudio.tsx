import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { 
  Camera, Sparkles, User, Briefcase, Building, MessageSquare, 
  ArrowLeft, ArrowRight, AlertCircle, Upload, Mail, Phone, 
  Clock, Navigation, MapPin, Loader2, Users 
} from 'lucide-react';
import { AttendeeBadgeData, EventItem } from '../../types';
import { BadgeCanvasPreview } from './BadgeCanvasPreview';
import { SocialShareModal } from './SocialShareModal';

interface PublicAdvocacyStudioProps {
  event: EventItem;
  badge: AttendeeBadgeData;
  onUpdateBadge: (updates: Partial<AttendeeBadgeData>) => void;
}

export function PublicAdvocacyStudio({ event, badge, onUpdateBadge }: PublicAdvocacyStudioProps) {
  const [step, setStep] = useState<'details' | 'camera' | 'preview'>('details');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [isStarted, setIsStarted] = useState(true);

  const hasCustomFrames = event.customFrames && event.customFrames.length > 0;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + ' ' + event.location)}`;

  // Auto-select the first custom frame if they exist
  useEffect(() => {
    if (hasCustomFrames && !badge.customFrameUrl && event.customFrames) {
      onUpdateBadge({ themeStyle: 'custom' as any, customFrameUrl: event.customFrames[0].url });
    }
  }, [hasCustomFrames, event.customFrames, badge.customFrameUrl, onUpdateBadge]);

  // Countdown Logic
  useEffect(() => {
    if (!event.startDate) return;
    const startMs = new Date(event.startDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = startMs - now;

      if (diff <= 0) {
        setIsStarted(true);
      } else {
        setIsStarted(false);
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [event.startDate]);

  // Camera Initialization
  useEffect(() => {
    let isMounted = true;
    
    const initCamera = async () => {
      setIsCameraLoading(true);
      setCameraError(null);
      
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Webcam API is not supported in this browser.');
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1080 } },
          audio: false
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Play prevented", e));
        }
      } catch (err: any) {
        if (isMounted) setCameraError(err.message || 'Camera access denied. Please check permissions.');
      } finally {
        if (isMounted) setIsCameraLoading(false);
      }
    };

    if (step === 'camera') {
      initCamera();
    }

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [step]);

  const setVideoNode = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current && node.srcObject !== streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(console.error);
    }
  };

  const saveLeadToBackend = async (dataUrl: string, frameUrl?: string, themeId?: string) => {
    try {
      const res = await fetch('/api/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id || event._id, name: badge.name, email: badge.email, mobile: badge.mobile, 
          title: badge.title, company: badge.company, role: badge.role, customQuote: badge.customQuote, 
          avatarUrl: dataUrl, themeStyle: themeId, customFrameUrl: frameUrl
        })
      });
      const data = await res.json();
      if (data.lead) onUpdateBadge({ leadId: data.lead._id });
    } catch (e) { console.error('Failed to register lead', e); }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (step === 'preview' && badge.leadId) {
      timeoutId = setTimeout(() => {
        if (canvasRef.current) {
          try {
            const finalBadgeUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
            fetch(`/api/badges/${badge.leadId}/composite`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ finalBadgeUrl })
            });
          } catch (err) { console.error("Failed to capture composite canvas", err); }
        }
      }, 1500);
    }
    return () => clearTimeout(timeoutId);
  }, [step, badge.leadId, event]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(size, 0); ctx.scale(-1, 1);
    const sx = (video.videoWidth - size) / 2; const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onUpdateBadge({ avatarUrl: dataUrl, scale: 1, panX: 0, panY: 0, rotation: 0 });
    await saveLeadToBackend(dataUrl, badge.customFrameUrl, badge.themeStyle);
    setStep('preview');
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (ev.target?.result) {
        const dataUrl = ev.target.result as string;
        onUpdateBadge({ avatarUrl: dataUrl, scale: 1, panX: 0, panY: 0, rotation: 0 });
        await saveLeadToBackend(dataUrl, badge.customFrameUrl, badge.themeStyle);
        setStep('preview');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60 flex flex-col items-center">
      
      <div className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex min-h-[64px] max-w-2xl items-center justify-between px-4 sm:px-6 py-2 gap-4">
          <div className="flex flex-col">
            {!isStarted ? (
              <>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Clock className="h-3 w-3 text-amber-500" /> Event Starts In
                </span>
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5 text-slate-900 font-mono text-sm font-bold">
                  <div className="bg-slate-100 rounded px-1.5 py-0.5">{timeLeft.days}d</div>
                  <div className="bg-slate-100 rounded px-1.5 py-0.5">{timeLeft.hours}h</div>
                  <div className="bg-slate-100 rounded px-1.5 py-0.5">{timeLeft.mins}m</div>
                  <div className="bg-slate-100 rounded px-1.5 py-0.5 text-amber-600">{timeLeft.secs}s</div>
                </div>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Event is Live
                </span>
                <span className="font-bold text-slate-900 truncate mt-0.5 max-w-[150px] sm:max-w-[300px] text-sm">
                  {event.name}
                </span>
              </>
            )}
          </div>

          <a href={mapsUrl} target="_blank" rel="noreferrer" className={`shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${isStarted ? 'bg-sky-600 text-white hover:bg-sky-700 hover:scale-105' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            {isStarted ? <Navigation className="h-4 w-4" /> : <MapPin className="h-4 w-4 text-slate-400" />}
            <span className="hidden sm:inline">{isStarted ? 'Get Directions' : 'View Venue Map'}</span>
            <span className="sm:hidden">{isStarted ? 'Navigate' : 'Map'}</span>
          </a>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 py-8">
        
        {step === 'details' && (
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-8 text-center text-white">
              <Sparkles className="mx-auto h-8 w-8 opacity-90 mb-3" />
              <h1 className="text-2xl font-extrabold tracking-tight">Join {event.name}</h1>
              <p className="mt-2 text-sm text-teal-50 font-medium">Create your official attendee badge in seconds.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setStep('camera'); }} className="p-6 sm:p-8 space-y-5">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><User className="h-3.5 w-3.5" /><span>Full Name *</span></label>
                <input required type="text" value={badge.name} onChange={(e) => onUpdateBadge({ name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-hidden" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /><span>Email Address *</span></label>
                <input required type="email" value={badge.email} onChange={(e) => onUpdateBadge({ email: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-hidden" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /><span>Mobile Number *</span></label>
                <input required type="tel" value={badge.mobile} onChange={(e) => onUpdateBadge({ mobile: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-hidden" />
              </div>
              
              {/* UPDATED: Blank Required Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /><span>Event Role *</span></label>
                <select 
                  required 
                  value={badge.role || ""} 
                  onChange={(e) => onUpdateBadge({ role: e.target.value as any })} 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-hidden"
                >
                  <option value="" disabled>Select a role...</option>
                  <option value="attendee">Attendee</option>
                  <option value="speaker">Speaker</option>
                  <option value="exhibitor">Exhibitor</option>
                  <option value="sponsor">Sponsor</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /><span>Job Title *</span></label>
                <input required type="text" value={badge.title} onChange={(e) => onUpdateBadge({ title: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-hidden" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /><span>Company *</span></label>
                <input required type="text" value={badge.company} onChange={(e) => onUpdateBadge({ company: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-hidden" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /><span>Quote (Optional)</span></label>
                <textarea rows={2} value={badge.customQuote || ''} onChange={(e) => onUpdateBadge({ customQuote: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-hidden resize-none" />
              </div>
              
              <button type="submit" className="w-full flex items-center justify-center space-x-2 rounded-xl bg-teal-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-teal-700 transition-all"><Camera className="h-4 w-4" /><span>Next: Capture Selfie</span><ArrowRight className="h-4 w-4" /></button>
            </form>
          </div>
        )}

        {step === 'camera' && (
          <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setStep('details')} className="mb-4 inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /><span>Back to Details</span></button>
            
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xl text-center space-y-6">
              <div><h2 className="text-xl font-extrabold text-slate-900">Snap Your Selfie</h2></div>

              <div 
                className="relative mx-auto aspect-[4/5] w-full max-w-sm rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl overflow-hidden"
                style={!badge.customFrameUrl ? { background: event.theme?.gradient || 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)' } : {}}
              >
                {badge.customFrameUrl && <img src={badge.customFrameUrl} alt="Custom Frame" className="absolute inset-0 w-full h-full object-cover z-0 opacity-40" />}
                <div className="absolute top-6 left-0 right-0 text-center z-20"><span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">{event.name}</span></div>
                
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-white/25 shadow-2xl flex items-center justify-center bg-slate-900/50 z-10 relative">
                  {isCameraLoading ? (
                    <div className="text-white flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin mb-2" />
                      <span className="text-xs font-bold">Starting Camera...</span>
                    </div>
                  ) : cameraError ? (
                    <div className="text-white px-4 text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-400" />
                      <p className="text-sm font-semibold">Camera Unavailable</p>
                      <p className="text-[10px] mt-1 opacity-70">Check browser permissions</p>
                    </div>
                  ) : (
                    <video 
                      autoPlay 
                      playsInline 
                      muted 
                      ref={setVideoNode} 
                      className="w-full h-full object-cover transform -scale-x-100" 
                    />
                  )}
                </div>

                <div className="absolute bottom-6 left-0 right-0 text-center text-white px-4 z-20"><h3 className="text-2xl font-extrabold truncate drop-shadow-md">{badge.name || 'Your Name'}</h3></div>
              </div>

              {hasCustomFrames && (
                <div className="pt-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">1. Choose Your Frame</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {event.customFrames?.map((frame) => (
                      <button 
                        key={frame.id || frame._id} 
                        onClick={() => onUpdateBadge({ themeStyle: 'custom' as any, customFrameUrl: frame.url })} 
                        className={`px-3.5 py-2 rounded-full text-xs font-bold ${badge.customFrameUrl === frame.url ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
                      >
                        {frame.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <button onClick={handleCapture} disabled={!!cameraError || isCameraLoading} className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50 transition-all shadow-md"><Camera className="h-5 w-5" /><span>{hasCustomFrames ? '2. Capture Selfie' : 'Capture Selfie'}</span></button>
                <div><input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold hover:bg-slate-50 transition-colors"><Upload className="h-4 w-4" /><span>Upload a Photo Instead</span></button></div>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setStep('camera')} className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /><span>Retake Photo</span></button>
              <button onClick={() => setStep('details')} className="inline-flex items-center space-x-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700"><span>Edit Details</span></button>
            </div>
            <BadgeCanvasPreview badge={badge} event={event} onUpdateBadge={onUpdateBadge} onOpenShareModal={() => setShareModalOpen(true)} canvasRef={canvasRef} />
          </div>
        )}
      </div>

      {shareModalOpen && <SocialShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} badge={badge} event={event} canvasRef={canvasRef} onDownload={() => document.getElementById('download-badge-btn')?.click()} />}
    </div>
  );
}