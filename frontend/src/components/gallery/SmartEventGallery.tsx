import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Upload, Trash2, Users, Image as ImageIcon, Camera, 
  Loader2, MapPin, Calendar, Download, Heart, Share2, X, Check, Bookmark
} from 'lucide-react';
import { EventItem, AttendeeLead, EventMoment } from '../../types';

interface SmartEventGalleryProps {
  event: EventItem;
  onNavigateToStudio: () => void;
}

export function SmartEventGallery({ event, onNavigateToStudio }: SmartEventGalleryProps) {
  const [activeFolder, setActiveFolder] = useState<'attendees' | 'moments'>('attendees');
  const [attendees, setAttendees] = useState<AttendeeLead[]>([]);
  const [moments, setMoments] = useState<EventMoment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Storage & Filter State
  const [savedMomentIds, setSavedMomentIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  
  // Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadImageBase64, setUploadImageBase64] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '', location: '', timeString: '', credit: '', identifiedPeople: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox State
  const [activeMoment, setActiveMoment] = useState<EventMoment | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:5011/api' 
    : '/api';

  useEffect(() => {
    setIsLoading(true);
    const eventId = event.id || event._id;

    // Load saved IDs from local storage
    const storedSavedIds = localStorage.getItem(`saved_moments_${eventId}`);
    if (storedSavedIds) {
      setSavedMomentIds(JSON.parse(storedSavedIds));
    }

    const fetchAttendees = fetch(`${API_BASE}/events/${eventId}/leads`)
      .then(res => res.json())
      .then(data => {
        const mappedLeads = data.map((d: any) => ({ 
          ...d, 
          id: d._id, 
          badgeThumbnail: d.finalBadgeUrl || d.avatarUrl 
        }));
        setAttendees(mappedLeads);
      });

    const fetchMoments = fetch(`${API_BASE}/events/${eventId}/moments`)
      .then(res => res.json())
      .then(data => setMoments(data));

    Promise.all([fetchAttendees, fetchMoments])
      .catch(err => console.error("Failed to fetch gallery data:", err))
      .finally(() => setIsLoading(false));
  }, [event, API_BASE]);

  const toggleSaveMoment = (momentId: string) => {
    setSavedMomentIds(prev => {
      const next = prev.includes(momentId)
        ? prev.filter(id => id !== momentId)
        : [...prev, momentId];
      
      localStorage.setItem(`saved_moments_${event.id || event._id}`, JSON.stringify(next));
      return next;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setUploadImageBase64(ev.target.result as string);
        setUploadModalOpen(true); 
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('momentImage', uploadFile);
      formData.append('title', uploadForm.title || 'Event Moment');
      formData.append('location', uploadForm.location || 'Main Venue');
      formData.append('timeString', uploadForm.timeString || 'Day 1');
      formData.append('credit', uploadForm.credit || 'Event Photography');

      const peopleArray = uploadForm.identifiedPeople.split(',').map(s => s.trim()).filter(Boolean);
      peopleArray.forEach(person => formData.append('identifiedPeople', person));

      const res = await fetch(`${API_BASE}/events/${event.id || event._id}/moments`, {
        method: 'POST',
        body: formData 
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Backend rejected payload");
      }
      
      const newMoment = await res.json();
      setMoments(prev => [newMoment, ...prev]);
      setUploadModalOpen(false);
      setUploadForm({ title: '', location: '', timeString: '', credit: '', identifiedPeople: '' });
      setUploadImageBase64('');
      setUploadFile(null);
    } catch (err: any) {
      console.error("Upload failed", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMoment = async (momentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to delete this moment?")) return;
    try {
      const res = await fetch(`${API_BASE}/events/${event.id || event._id}/moments/${momentId}`, { method: 'DELETE' });
      if (res.ok) {
        setMoments(prev => prev.filter(m => m._id !== momentId));
        // Also remove from saved list if deleted
        setSavedMomentIds(prev => {
          const next = prev.filter(id => id !== momentId);
          localStorage.setItem(`saved_moments_${event.id || event._id}`, JSON.stringify(next));
          return next;
        });
      }
    } catch (err) { console.error("Delete failed", err); }
  };

  const handleShareMoment = async () => {
    if (!activeMoment) return;

    const shareData = {
      title: activeMoment.title,
      text: `Check out this incredible moment from ${event.name}!`,
      url: activeMoment.imageUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share was cancelled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(activeMoment.imageUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  const handleDownloadMoment = () => {
    if (!activeMoment) return;
    const link = document.createElement('a');
    link.href = activeMoment.imageUrl;
    link.target = '_blank';
    link.download = `${activeMoment.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-hd.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedMoments = showSavedOnly 
    ? moments.filter(m => savedMomentIds.includes(m._id))
    : moments;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      
      {/* Header */}
      <div className="border-b border-slate-200/80 bg-white sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <button onClick={onNavigateToStudio} className="mb-4 inline-flex items-center space-x-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /><span>Back to Organizer Dashboard</span>
          </button>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2"><span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700">Gallery Media</span></div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{event.name} Gallery</h1>
              <p className="mt-1 text-sm text-slate-500">Manage uploaded moments and generated attendee badges.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Tabs & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 mb-8 gap-4">
          <div className="flex space-x-6">
            <button onClick={() => setActiveFolder('attendees')} className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${activeFolder === 'attendees' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <Users className="h-4 w-4" /> Attendee Badges ({attendees.length})
            </button>
            <button onClick={() => setActiveFolder('moments')} className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${activeFolder === 'moments' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <ImageIcon className="h-4 w-4" /> Event Moments ({moments.length})
            </button>
          </div>

          {activeFolder === 'moments' && (
            <div className="pb-2 flex items-center gap-3">
              <button 
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${showSavedOnly ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Bookmark className={`h-4 w-4 ${showSavedOnly ? 'fill-teal-700' : ''}`} />
                {showSavedOnly ? 'Showing Saved' : 'Show Saved'}
              </button>

              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md">
                <Upload className="h-4 w-4" /><span className="hidden sm:inline">Upload Moment</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Grids */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 font-medium">Loading gallery data...</div>
        ) : (
          <>
            {activeFolder === 'attendees' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {attendees.length === 0 ? (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl"><Camera className="h-8 w-8 text-slate-300 mx-auto mb-2" /><p className="text-slate-500 text-sm font-medium">No attendee badges generated yet.</p></div>
                ) : (
                  attendees.map((attendee) => (
                    <div key={attendee.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                      <img src={attendee.badgeThumbnail} alt={attendee.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        <p className="text-white font-bold text-sm truncate">{attendee.name}</p>
                        <p className="text-slate-300 text-xs truncate">{attendee.company}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeFolder === 'moments' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedMoments.length === 0 ? (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm font-medium">
                      {showSavedOnly ? "You haven't saved any moments yet." : "No moments uploaded yet."}
                    </p>
                  </div>
                ) : (
                  displayedMoments.map((moment) => {
                    const isSaved = savedMomentIds.includes(moment._id);
                    return (
                      <div key={moment._id} onClick={() => setActiveMoment(moment)} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs cursor-pointer">
                        <img src={moment.imageUrl} alt="Event Moment" className="w-full h-full object-cover" />
                        
                        {/* Save indicator badge on the grid thumbnail */}
                        {isSaved && (
                          <div className="absolute top-3 left-3 bg-black/50 p-1.5 rounded-full backdrop-blur-[2px]">
                            <Heart className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 pt-8 pb-3 px-4 to-transparent translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                          <h4 className="text-white font-bold text-sm truncate mb-0.5">{moment.title}</h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold tracking-wide">
                            <Users className="h-3 w-3" /> {moment.identifiedPeople.length} Tagged
                          </div>
                        </div>

                        <button onClick={(e) => handleDeleteMoment(moment._id, e)} className="absolute top-3 right-3 bg-black/50 hover:bg-rose-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]" title="Delete Image">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* METADATA UPLOAD MODAL (Unchanged) */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <div className="md:w-2/5 bg-slate-100 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-slate-200">
              <img src={uploadImageBase64} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <form onSubmit={submitUpload} className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-slate-900">Add Photo Details</h3>
                <button type="button" onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Photo Title</label><input type="text" value={uploadForm.title} onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})} placeholder="e.g. Keynote Opening" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Location</label><input type="text" value={uploadForm.location} onChange={(e) => setUploadForm({...uploadForm, location: e.target.value})} placeholder="e.g. Breakout Hall 4" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Time Label</label><input type="text" value={uploadForm.timeString} onChange={(e) => setUploadForm({...uploadForm, timeString: e.target.value})} placeholder="e.g. Day 2 • 10:20 AM" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm" /></div>
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Photographer Credit</label><input type="text" value={uploadForm.credit} onChange={(e) => setUploadForm({...uploadForm, credit: e.target.value})} placeholder="e.g. Marcus Chen" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Tagged People (Comma Separated)</label><input type="text" value={uploadForm.identifiedPeople} onChange={(e) => setUploadForm({...uploadForm, identifiedPeople: e.target.value})} placeholder="e.g. Liam O'Connor, Elena Rostova" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm" /></div>
              <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setUploadModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button><button type="submit" disabled={isUploading} className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-teal-700 disabled:opacity-70">{isUploading && <Loader2 className="h-4 w-4 animate-spin"/>} Save Moment</button></div>
            </form>
          </div>
        </div>
      )}

      {/* EXPANDED LIGHTBOX VIEW */}
      {activeMoment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200">
          <button onClick={() => setActiveMoment(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-900/50 rounded-full transition-colors z-50"><X className="h-6 w-6" /></button>
          
          <div className="flex flex-col md:flex-row bg-[#0f172a] text-slate-200 rounded-2xl overflow-hidden w-full max-w-6xl max-h-full border border-slate-800 shadow-2xl">
            
            {/* Left: Image */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[40vh] md:min-h-0">
               <img src={activeMoment.imageUrl} alt={activeMoment.title} className="w-full h-full object-contain" />
            </div>
            
            {/* Right: Dark Sidebar Details */}
            <div className="w-full md:w-[400px] p-6 sm:p-8 flex flex-col justify-between shrink-0 overflow-y-auto max-h-[50vh] md:max-h-none">
               <div>
                  <div className="text-[11px] font-extrabold tracking-wider text-emerald-400 mb-3 uppercase">Conference Media Archive</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-tight">{activeMoment.title}</h2>
                  
                  <div className="space-y-3.5 text-sm text-slate-300 mb-8 font-medium">
                     <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-slate-500 shrink-0"/> {activeMoment.location}</div>
                     <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-slate-500 shrink-0"/> {activeMoment.timeString}</div>
                     <div className="flex items-center gap-3"><Camera className="w-4 h-4 text-slate-500 shrink-0"/> Credit: {activeMoment.credit}</div>
                  </div>

                  {activeMoment.identifiedPeople && activeMoment.identifiedPeople.length > 0 && (
                    <div className="border-t border-slate-700/50 pt-6 mb-6">
                       <div className="text-[11px] font-bold tracking-wider text-slate-400 mb-4 uppercase">Identified in this photo:</div>
                       <div className="flex flex-wrap gap-2.5">
                         {activeMoment.identifiedPeople.map((person, i) => (
                           <span key={i} className="px-3.5 py-1.5 rounded-lg border border-slate-600/60 bg-slate-800/40 text-sm font-semibold text-slate-200 shadow-xs">{person}</span>
                         ))}
                       </div>
                    </div>
                  )}
               </div>

               <div className="space-y-3 mt-8 pt-6 border-t border-slate-700/30">
                 
                 <button 
                   onClick={handleDownloadMoment} 
                   className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                 >
                   <Download className="w-5 h-5"/> Download Full HD Photo
                 </button>
                 
                 <div className="flex gap-3">
                   {/* DYNAMIC SAVE BUTTON */}
                   <button 
                     onClick={() => toggleSaveMoment(activeMoment._id)}
                     className={`flex-1 border font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                       savedMomentIds.includes(activeMoment._id)
                         ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                         : 'border-slate-600 hover:bg-slate-800 text-slate-300'
                     }`}
                   >
                     <Heart className={`w-4 h-4 ${savedMomentIds.includes(activeMoment._id) ? 'fill-emerald-400 text-emerald-400' : ''}`}/> 
                     {savedMomentIds.includes(activeMoment._id) ? 'Saved' : 'Save'}
                   </button>

                   <button 
                     onClick={handleShareMoment} 
                     className="flex-1 border border-slate-600 hover:bg-slate-800 text-slate-300 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                   >
                     {copiedLink ? <Check className="w-4 h-4 text-emerald-400"/> : <Share2 className="w-4 h-4"/>} 
                     <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                   </button>
                 </div>

               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}