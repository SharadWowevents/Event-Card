import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Sparkles, Palette, Layout, Sliders, Info, Calendar, MapPin, Globe, Image as ImageIcon, Upload, Trash2, Map } from 'lucide-react';
import { EventItem } from '../../types';

interface CreateEditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit: EventItem | null;
  onSave: (event: EventItem) => void;
}

export function CreateEditEventModal({ isOpen, onClose, eventToEdit, onSave }: CreateEditEventModalProps) {
  const isEditing = Boolean(eventToEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [dates, setDates] = useState('');
  const [startDate, setStartDate] = useState('');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<EventItem['status']>('active');

  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');
  const [fontFamily, setFontFamily] = useState('Plus Jakarta Sans');
  const [bannerStyle, setBannerStyle] = useState<EventItem['theme']['bannerStyle']>('gradient');

  const [attendeeHeadline, setAttendeeHeadline] = useState("I'M ATTENDING");
  const [speakerHeadline, setSpeakerHeadline] = useState('KEYNOTE SPEAKER');
  const [exhibitorHeadline, setExhibitorHeadline] = useState('VISIT OUR BOOTH');
  const [sponsorHeadline, setSponsorHeadline] = useState('PROUD SPONSOR');
  
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showVenue, setShowVenue] = useState(true);
  const [showDate, setShowDate] = useState(true);

  const [customFrames, setCustomFrames] = useState<{ _id?: string; id?: string; label: string; url: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'brand' | 'templates' | 'positioning' | 'frames'>('general');

  useEffect(() => {
    if (isOpen) {
      setName(eventToEdit?.name || '');
      setSlug(eventToEdit?.slug || '');
      setTagline(eventToEdit?.tagline || '');
      setDates(eventToEdit?.dates || 'October 14–16, 2026');
      setVenue(eventToEdit?.venue || 'Moscone West Convention Center');
      setLocation(eventToEdit?.location || 'San Francisco, CA');
      setWebsite(eventToEdit?.website || 'https://event.example.com');
      setStatus(eventToEdit?.status || 'active');
      setPrimaryColor(eventToEdit?.theme.primaryColor || '#0ea5e9');
      setSecondaryColor(eventToEdit?.theme.secondaryColor || '#10b981');
      setFontFamily(eventToEdit?.theme.fontFamily || 'Plus Jakarta Sans');
      setBannerStyle(eventToEdit?.theme.bannerStyle || 'gradient');
      setAttendeeHeadline(eventToEdit?.templateConfig?.attendeeHeadline || "I'M ATTENDING");
      setSpeakerHeadline(eventToEdit?.templateConfig?.speakerHeadline || 'KEYNOTE SPEAKER');
      setExhibitorHeadline(eventToEdit?.templateConfig?.exhibitorHeadline || 'VISIT OUR BOOTH');
      setSponsorHeadline(eventToEdit?.templateConfig?.sponsorHeadline || 'PROUD SPONSOR');
      setAlignment(eventToEdit?.templateConfig?.textPositioning?.alignment || 'center');
      setShowQrCode(eventToEdit?.templateConfig?.textPositioning?.showQrCode ?? true);
      setShowVenue(eventToEdit?.templateConfig?.textPositioning?.showVenue ?? true);
      setShowDate(eventToEdit?.templateConfig?.textPositioning?.showDate ?? true);
      setCustomFrames(eventToEdit?.customFrames || []);
      
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() + 1);
      const startIso = eventToEdit?.startDate 
        ? new Date(eventToEdit.startDate).toISOString().slice(0, 16) 
        : defaultStart.toISOString().slice(0, 16);
      setStartDate(startIso);

      setActiveTab('general');
    }
  }, [isOpen, eventToEdit]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing || !slug) setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30));
  };

  const handleFrameUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!eventToEdit?.id) { alert("Please save the event first before uploading custom frames."); return; }
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('frame', file);
    formData.append('label', `Custom Frame ${customFrames.length + 1}`);

    try {
      const res = await fetch(`/api/events/${eventToEdit.id}/frames`, { method: 'POST', body: formData });
      const updatedFrames = await res.json();
      setCustomFrames(updatedFrames);
    } catch (err) { console.error("Frame upload failed", err); }
  };

  const handleRemoveFrame = async (id: string) => {
    if (!eventToEdit?.id) return;
    try {
      const res = await fetch(`/api/events/${eventToEdit.id}/frames/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomFrames(prev => prev.filter(f => f._id !== id && f.id !== id));
      }
    } catch (err) { console.error(err); }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedEvent: EventItem = {
      id: eventToEdit ? eventToEdit.id : `evt-${Date.now()}`,
      _id: eventToEdit?._id,
      name, slug, tagline, dates, startDate, venue, location, status, website,
      attendeeCount: eventToEdit ? eventToEdit.attendeeCount : 0,
      postersCount: eventToEdit ? eventToEdit.postersCount : 0,
      sharesCount: eventToEdit ? eventToEdit.sharesCount : 0,
      emvValue: eventToEdit ? eventToEdit.emvValue : 0,
      theme: { primaryColor, secondaryColor, accentColor: primaryColor, gradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`, fontFamily, bannerStyle },
      templateConfig: { attendeeHeadline, speakerHeadline, exhibitorHeadline, sponsorHeadline, overlayStyle: 'card', textPositioning: { nameY: 820, titleY: 875, companyY: 920, roleBadgeY: 760, textColor: '#ffffff', alignment, showQrCode, showVenue, showDate } },
      sponsors: eventToEdit?.sponsors || [],
      customFrames
    };

    onSave(savedEvent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600"><Sparkles className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{isEditing ? `Edit Event: ${eventToEdit?.name}` : 'Create New Event'}</h3>
              <p className="text-xs text-slate-500">Configure brand styling and templates</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex items-center border-b border-slate-100 bg-slate-50/70 px-6 gap-2 overflow-x-auto whitespace-nowrap">
          <button type="button" onClick={() => setActiveTab('general')} className={`flex items-center space-x-1.5 py-3 border-b-2 text-xs font-semibold px-2 transition-colors ${activeTab === 'general' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Info className="h-3.5 w-3.5" /><span>General Info</span></button>
          <button type="button" onClick={() => setActiveTab('brand')} className={`flex items-center space-x-1.5 py-3 border-b-2 text-xs font-semibold px-2 transition-colors ${activeTab === 'brand' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Palette className="h-3.5 w-3.5" /><span>Brand & Colors</span></button>
          <button type="button" onClick={() => setActiveTab('templates')} className={`flex items-center space-x-1.5 py-3 border-b-2 text-xs font-semibold px-2 transition-colors ${activeTab === 'templates' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Layout className="h-3.5 w-3.5" /><span>Headlines</span></button>
          <button type="button" onClick={() => setActiveTab('positioning')} className={`flex items-center space-x-1.5 py-3 border-b-2 text-xs font-semibold px-2 transition-colors ${activeTab === 'positioning' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Sliders className="h-3.5 w-3.5" /><span>Elements</span></button>
          <button type="button" onClick={() => setActiveTab('frames')} className={`flex items-center space-x-1.5 py-3 border-b-2 text-xs font-semibold px-2 transition-colors ${activeTab === 'frames' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><ImageIcon className="h-3.5 w-3.5" /><span>Custom Frames</span></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2"><label className="text-xs font-bold text-slate-700">Event Name *</label><input type="text" required value={name} onChange={(e) => handleNameChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium focus:bg-white focus:border-teal-500 focus:outline-hidden" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Brand Slug</label><input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Status</label><select value={status} onChange={(e) => setStatus(e.target.value as EventItem['status'])} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-semibold text-slate-800"><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
                <div className="space-y-1 sm:col-span-2"><label className="text-xs font-bold text-slate-700">Tagline / Theme</label><input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm" /></div>
                
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-400" /> Display Dates String</label><input type="text" value={dates} onChange={(e) => setDates(e.target.value)} placeholder="e.g. Oct 14-16" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs" /></div>
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Calendar className="h-3 w-3 text-emerald-500" /> Live Event Start Time</label><input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs" /></div>
                
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" /> Venue Address</span>
                    {venue && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue + ' ' + location)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-sky-600 hover:text-sky-800">
                        <Map className="h-3 w-3" /> Verify on Maps
                      </a>
                    )}
                  </label>
                  <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Moscone Center, SF" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm" />
                </div>
                
                <div className="space-y-1 sm:col-span-2"><label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Globe className="h-3 w-3 text-slate-400" /> Official Website</label><input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs" /></div>
              </div>
            </div>
          )}

          {activeTab === 'brand' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-700 block mb-1">Primary Color</label><div className="flex items-center space-x-2"><input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5" /><input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono" /></div></div>
                <div><label className="text-xs font-bold text-slate-700 block mb-1">Secondary Color</label><div className="flex items-center space-x-2"><input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5" /><input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono" /></div></div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Default Badge Theme</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[{ id: 'gradient', name: 'Emerald Gradient' }, { id: 'minimal', name: 'Monochrome Slate' }, { id: 'cyber', name: 'Cyber Indigo' }, { id: 'aurora', name: 'Aurora Glow' }, { id: 'executive', name: 'Executive Gold' }].map((preset) => (
                    <button key={preset.id} type="button" onClick={() => setBannerStyle(preset.id as any)} className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition-all ${bannerStyle === preset.id ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500 text-teal-900' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>{preset.name}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1"><span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Attendee Headline</span><input type="text" value={attendeeHeadline} onChange={(e) => setAttendeeHeadline(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold" /></div>
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1"><span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Speaker Headline</span><input type="text" value={speakerHeadline} onChange={(e) => setSpeakerHeadline(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold" /></div>
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1"><span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Exhibitor Headline</span><input type="text" value={exhibitorHeadline} onChange={(e) => setExhibitorHeadline(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold" /></div>
                <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1"><span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Sponsor Headline</span><input type="text" value={sponsorHeadline} onChange={(e) => setSponsorHeadline(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold" /></div>
              </div>
            </div>
          )}

          {activeTab === 'positioning' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-2"><label className="text-xs font-bold text-slate-700 block">Text Alignment</label><div className="flex items-center space-x-2">{['left', 'center', 'right'].map((align) => (<button key={align} type="button" onClick={() => setAlignment(align as any)} className={`flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition-all ${alignment === align ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>{align}</button>))}</div></div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">Badge Element Display</label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50"><div><span className="text-xs font-bold text-slate-800">Dynamic QR Code</span></div><input type="checkbox" checked={showQrCode} onChange={(e) => setShowQrCode(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" /></label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50"><div><span className="text-xs font-bold text-slate-800">Display Venue & Location</span></div><input type="checkbox" checked={showVenue} onChange={(e) => setShowVenue(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" /></label>
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50"><div><span className="text-xs font-bold text-slate-800">Display Event Dates</span></div><input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" /></label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'frames' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Custom Event Frames</h3>
                  <p className="text-xs text-slate-500">Upload branded 1080x1080 background templates.</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFrameUpload} accept="image/*" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-1.5 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs font-bold hover:bg-black transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Frame</span>
                </button>
              </div>

              {customFrames.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs">
                  No custom frames uploaded yet. Attendees will use standard algorithmic gradients.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {customFrames.map((frame) => (
                    <div key={frame._id || frame.id} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                      <img src={frame.url} alt={frame.label} className="w-full aspect-square object-cover" />
                      <button type="button" onClick={() => handleRemoveFrame(frame._id || frame.id!)} className="absolute top-2 right-2 rounded-md bg-rose-500 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-2 text-[10px] font-bold truncate">
                        {frame.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex items-center space-x-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition-all"><Save className="h-4 w-4" /><span>{isEditing ? 'Save Changes' : 'Publish'}</span></button>
          </div>
        </form>

      </div>
    </div>
  );
}