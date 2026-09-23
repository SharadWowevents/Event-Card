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

  const [attendeeHeadline, setAttendeeHeadline] = useState("I'M ATTENDING");
  const [speakerHeadline, setSpeakerHeadline] = useState('KEYNOTE SPEAKER');
  const [exhibitorHeadline, setExhibitorHeadline] = useState('VISIT OUR BOOTH');
  const [sponsorHeadline, setSponsorHeadline] = useState('PROUD SPONSOR');

  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showVenue, setShowVenue] = useState(true);
  const [showDate, setShowDate] = useState(true);

  // Typography States
  const [nameFontSize, setNameFontSize] = useState(80);
  const [nameColor, setNameColor] = useState('#ffffff');
  const [nameUseGradient, setNameUseGradient] = useState(false);
  const [nameY, setNameY] = useState(1130);
  const [subTextFontSize, setSubTextFontSize] = useState(36);
  const [subTextColor, setSubTextColor] = useState('#e2e8f0');
  const [subTextY, setSubTextY] = useState(1210);

  // Background States
  const [bgType, setBgType] = useState<'color' | 'gradient' | 'image'>('gradient');
  const [bgColor, setBgColor] = useState('#0f172a');
  const [bgImageUrl, setBgImageUrl] = useState('');

  // Selfie Mask States
  const [selfieShape, setSelfieShape] = useState<'circle' | 'square'>('circle');
  const [selfieX, setSelfieX] = useState(540);
  const [selfieY, setSelfieY] = useState(595);
  const [selfieSize, setSelfieSize] = useState(560);
  const [selfieBorderRadius, setSelfieBorderRadius] = useState(0);

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
      setPrimaryColor(eventToEdit?.theme?.primaryColor || '#0ea5e9');
      setSecondaryColor(eventToEdit?.theme?.secondaryColor || '#10b981');
      setFontFamily(eventToEdit?.theme?.fontFamily || 'Plus Jakarta Sans');

      setAttendeeHeadline(eventToEdit?.templateConfig?.attendeeHeadline || "I'M ATTENDING");
      setSpeakerHeadline(eventToEdit?.templateConfig?.speakerHeadline || 'KEYNOTE SPEAKER');
      setExhibitorHeadline(eventToEdit?.templateConfig?.exhibitorHeadline || 'VISIT OUR BOOTH');
      setSponsorHeadline(eventToEdit?.templateConfig?.sponsorHeadline || 'PROUD SPONSOR');

      setAlignment(eventToEdit?.templateConfig?.textPositioning?.alignment || 'center');
      setShowQrCode(eventToEdit?.templateConfig?.textPositioning?.showQrCode ?? true);
      setShowVenue(eventToEdit?.templateConfig?.textPositioning?.showVenue ?? true);
      setShowDate(eventToEdit?.templateConfig?.textPositioning?.showDate ?? true);

      setNameFontSize(eventToEdit?.templateConfig?.textPositioning?.nameFontSize ?? 80);
      setNameColor(eventToEdit?.templateConfig?.textPositioning?.nameColor || '#ffffff');
      setNameUseGradient(eventToEdit?.templateConfig?.textPositioning?.nameUseGradient ?? false);
      setNameY(eventToEdit?.templateConfig?.textPositioning?.nameY ?? 1130);
      setSubTextFontSize(eventToEdit?.templateConfig?.textPositioning?.subTextFontSize ?? 36);
      setSubTextColor(eventToEdit?.templateConfig?.textPositioning?.subTextColor || '#e2e8f0');
      setSubTextY(eventToEdit?.templateConfig?.textPositioning?.subTextY ?? 1210);

      setBgType(eventToEdit?.theme?.backgroundType || 'gradient');
      setBgColor(eventToEdit?.theme?.backgroundColor || '#0f172a');
      setBgImageUrl(eventToEdit?.theme?.backgroundImageUrl || '');

      setSelfieShape(eventToEdit?.templateConfig?.selfiePositioning?.shape || 'circle');
      setSelfieX(eventToEdit?.templateConfig?.selfiePositioning?.x ?? 540);
      setSelfieY(eventToEdit?.templateConfig?.selfiePositioning?.y ?? 595);
      setSelfieSize(eventToEdit?.templateConfig?.selfiePositioning?.size ?? 560);
      setSelfieBorderRadius(eventToEdit?.templateConfig?.selfiePositioning?.borderRadius ?? 0);

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
    if (!eventToEdit?.id && !eventToEdit?._id) {
      alert("Please save the event first before uploading custom frames.");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const eventId = eventToEdit.id || eventToEdit._id;
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

      const formData = new FormData();
      formData.append('frameImage', file);
      formData.append('label', `Custom Frame ${customFrames.length + 1}`);

      const res = await fetch(`${API_BASE}/events/${eventId}/frames`, { method: 'POST', body: formData });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Backend rejected payload");
      }

      const updatedFrames = await res.json();
      setCustomFrames(updatedFrames);
    } catch (err: any) {
      console.error("Frame upload failed", err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!eventToEdit?.id && !eventToEdit?._id) {
      alert("Please save the event first before uploading a background image.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const eventId = eventToEdit.id || eventToEdit._id;
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

      const formData = new FormData();
      formData.append('backgroundImage', file); // Must match multer .single('backgroundImage')

      const res = await fetch(`${API_BASE}/events/${eventId}/background`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setBgImageUrl(data.url);
      setBgType('image'); // Auto-switch to image mode
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const handleRemoveFrame = async (id: string) => {
    const eventId = eventToEdit?.id || eventToEdit?._id;
    if (!eventId) return;
    try {
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
      const res = await fetch(`${API_BASE}/events/${eventId}/frames/${id}`, { method: 'DELETE' });
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
      theme: {
        primaryColor, secondaryColor, accentColor: primaryColor,
        gradient: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        fontFamily, bannerStyle: 'custom',
        backgroundType: bgType, backgroundColor: bgColor, backgroundImageUrl: bgImageUrl
      },
      templateConfig: {
        attendeeHeadline, speakerHeadline, exhibitorHeadline, sponsorHeadline, overlayStyle: 'card',
        textPositioning: {
          textColor: '#ffffff', alignment, showQrCode, showVenue, showDate,
          nameFontSize, nameColor, nameUseGradient, nameY,
          subTextFontSize, subTextColor, subTextY
        },
        selfiePositioning: { 
          shape: selfieShape, x: selfieX, y: selfieY, size: selfieSize, borderRadius: selfieBorderRadius 
        }
      },
      sponsors: eventToEdit?.sponsors || [],
      customFrames
    };

    onSave(savedEvent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
      <div className={`relative w-full rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 ${activeTab === 'positioning' ? 'max-w-5xl' : 'max-w-3xl'}`}>

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600"><Sparkles className="h-5 w-5" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{isEditing ? `Edit Event: ${name}` : 'Create New Event'}</h3>
              <p className="text-xs text-slate-500">Configure brand styling and templates</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex items-center border-b border-slate-100 bg-slate-50/70 px-6 gap-2 overflow-x-auto whitespace-nowrap">
          <button type="button" onClick={() => setActiveTab('general')} className={`flex items-center space-x-1.5 py-3 border-b-2 text-xs font-semibold px-2 transition-colors ${activeTab === 'general' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Info className="h-3.5 w-3.5" /><span>General Info</span></button>
          <button type="button" onClick={() => setActiveTab('brand')} className={`flex items-center space-x-1.5 py-3 border-b-2 text-xs font-semibold px-2 transition-colors ${activeTab === 'brand' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Palette className="h-3.5 w-3.5" /><span>Brand & Colors</span></button>
          <button type="button" onClick={() => setActiveTab('templates')} className={`flex items-center space-x-1.5 py-3 border-b-2 text-xs font-semibold px-2 transition-colors ${activeTab === 'templates' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Layout className="h-3.5 w-3.5" /><span>Headlines</span></button>
          <button type="button" onClick={() => setActiveTab('positioning')} className={`flex items-center space-x-1.5 py-3 border-b-2 text-xs font-semibold px-2 transition-colors ${activeTab === 'positioning' ? 'border-teal-600 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Sliders className="h-3.5 w-3.5" /><span>Elements & Preview</span></button>
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
                <div className="space-y-1 sm:col-span-2"><label className="text-xs font-bold text-slate-700 flex items-center justify-between"><span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" /> Venue Address</span></label><input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Moscone Center, SF" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm" /></div>
              </div>
            </div>
          )}

          {activeTab === 'brand' && (
            <div className="flex flex-col md:flex-row gap-8 animate-in fade-in duration-150">

              {/* LEFT: Controls Panel */}
              <div className="flex-1 space-y-6">

                {/* Brand Colors */}
                <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Brand Accent Colors</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">Primary Color</label>
                      <div className="flex items-center space-x-2">
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                        <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono uppercase" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">Secondary Color</label>
                      <div className="flex items-center space-x-2">
                        <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                        <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono uppercase" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page Background */}
                <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Attendee Page Background</h4>

                  <div className="flex bg-slate-200/60 p-1 rounded-xl">
                    <button type="button" onClick={() => setBgType('color')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${bgType === 'color' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Solid Color</button>
                    <button type="button" onClick={() => setBgType('gradient')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${bgType === 'gradient' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Brand Gradient</button>
                    <button type="button" onClick={() => setBgType('image')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${bgType === 'image' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Custom Image</button>
                  </div>

                  {bgType === 'color' && (
                    <div className="flex items-center gap-3 pt-2 animate-in fade-in">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-14 rounded-lg cursor-pointer" />
                      <span className="text-sm font-semibold text-slate-700">Select solid background color</span>
                    </div>
                  )}

                  {bgType === 'gradient' && (
                    <div className="pt-2 text-xs text-slate-500 font-medium animate-in fade-in">
                      The page background will use a smooth gradient flowing from your Primary Color to your Secondary Color.
                    </div>
                  )}

                  {bgType === 'image' && (
                    <div className="pt-2 animate-in fade-in">
                      <input type="file" id="bgUpload" onChange={handleBackgroundUpload} accept="image/*" className="hidden" />
                      <label htmlFor="bgUpload" className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:bg-slate-100 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-bold text-slate-600">{bgImageUrl ? 'Replace Background Image' : 'Upload Background Image'}</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Live Page Preview */}
              <div className="w-[300px] shrink-0 mx-auto md:mx-0 flex flex-col gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Attendee Page Preview</span>

                <div
                  className="relative w-[300px] h-[375px] rounded-[1.5rem] shadow-xl border-4 border-slate-900 overflow-hidden flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: bgType === 'color' ? bgColor : undefined,
                    backgroundImage: bgType === 'gradient' ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` : bgType === 'image' && bgImageUrl ? `url(${bgImageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    fontFamily: fontFamily
                  }}
                >
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center opacity-80">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm"></div>
                    <div className="w-16 h-2 rounded bg-white/30 backdrop-blur-sm"></div>
                  </div>

                  <div className="w-[85%] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 text-center">
                    <div className="w-12 h-12 rounded-xl mx-auto mb-3" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}></div>
                    <h5 className="font-bold text-slate-900 text-sm mb-1">{name || 'Event Name'}</h5>
                    <p className="text-[10px] text-slate-500 mb-4">{dates || 'Event Dates'}</p>

                    <div className="space-y-2">
                      <div className="h-6 w-full bg-slate-100 rounded-md border border-slate-200"></div>
                      <div className="h-6 w-full bg-slate-100 rounded-md border border-slate-200"></div>
                      <div className="h-7 w-full rounded-md mt-4 text-white text-[10px] font-bold flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                        Get My Badge
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1"><span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Attendee Headline</span><input type="text" value={attendeeHeadline} onChange={(e) => setAttendeeHeadline(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold" /></div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1"><span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Exhibitor Headline</span><input type="text" value={exhibitorHeadline} onChange={(e) => setExhibitorHeadline(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold" /></div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1"><span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Speaker Headline</span><input type="text" value={speakerHeadline} onChange={(e) => setSpeakerHeadline(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold" /></div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1"><span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Sponsor Headline</span><input type="text" value={sponsorHeadline} onChange={(e) => setSponsorHeadline(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold" /></div>
            </div>
          )}

          {activeTab === 'positioning' && (
            <div className="flex flex-col md:flex-row gap-8 animate-in fade-in duration-150">

              {/* LEFT: Controls Panel */}
              <div className="flex-1 space-y-6">

                {/* Font Family & Alignment */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Font Family</label>
                    <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold">
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Playfair Display">Playfair Display</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Text Alignment</label>
                    <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align} type="button" onClick={() => setAlignment(align as any)}
                          className={`flex-1 py-1 text-xs font-bold capitalize rounded-lg transition-colors ${alignment === align ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Attendee Name Typography */}
                <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Attendee Name Styling</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Font Size ({nameFontSize}px)</label>
                      <input type="range" min="40" max="150" value={nameFontSize} onChange={(e) => setNameFontSize(Number(e.target.value))} className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Y-Position ({nameY})</label>
                      <input type="range" min="700" max="1300" value={nameY} onChange={(e) => setNameY(Number(e.target.value))} className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <input type="color" value={nameColor} onChange={(e) => setNameColor(e.target.value)} disabled={nameUseGradient} className="h-8 w-10 rounded cursor-pointer disabled:opacity-50" />
                      <span className="text-xs font-bold text-slate-700">Solid Color</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={nameUseGradient} onChange={(e) => setNameUseGradient(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" />
                      <span className="text-xs font-bold text-slate-700">Use Brand Gradient</span>
                    </label>
                  </div>
                </div>

                {/* Subtext Typography */}
                <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Role & Company Styling</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Font Size ({subTextFontSize}px)</label>
                      <input type="range" min="20" max="80" value={subTextFontSize} onChange={(e) => setSubTextFontSize(Number(e.target.value))} className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Y-Position ({subTextY})</label>
                      <input type="range" min="700" max="1300" value={subTextY} onChange={(e) => setSubTextY(Number(e.target.value))} className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input type="color" value={subTextColor} onChange={(e) => setSubTextColor(e.target.value)} className="h-8 w-10 rounded cursor-pointer" />
                    <span className="text-xs font-bold text-slate-700">Solid Color</span>
                  </div>
                </div>

                {/* Selfie Mask Positioning */}
                <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50 mt-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Selfie Mask Setup</h4>
                  
                  <div className="flex bg-slate-200/60 p-1 rounded-xl mb-4">
                    <button type="button" onClick={() => setSelfieShape('circle')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${selfieShape === 'circle' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Circle</button>
                    <button type="button" onClick={() => setSelfieShape('square')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${selfieShape === 'square' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Square / Rectangle</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">X-Position (Left/Right: {selfieX})</label>
                      <input type="range" min="0" max="1080" value={selfieX} onChange={(e) => setSelfieX(Number(e.target.value))} className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Y-Position (Up/Down: {selfieY})</label>
                      <input type="range" min="0" max="1350" value={selfieY} onChange={(e) => setSelfieY(Number(e.target.value))} className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Total Size ({selfieSize}px)</label>
                      <input type="range" min="200" max="1000" value={selfieSize} onChange={(e) => setSelfieSize(Number(e.target.value))} className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    {selfieShape === 'square' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Corner Radius ({selfieBorderRadius}px)</label>
                        <input type="range" min="0" max={selfieSize/2} value={selfieBorderRadius} onChange={(e) => setSelfieBorderRadius(Number(e.target.value))} className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge Element Toggles */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-700 block">Badge Element Display</label>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50"><div><span className="text-xs font-bold text-slate-800">Dynamic QR Code</span></div><input type="checkbox" checked={showQrCode} onChange={(e) => setShowQrCode(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" /></label>
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50"><div><span className="text-xs font-bold text-slate-800">Display Venue & Location</span></div><input type="checkbox" checked={showVenue} onChange={(e) => setShowVenue(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" /></label>
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50"><div><span className="text-xs font-bold text-slate-800">Display Event Dates</span></div><input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} className="h-4 w-4 accent-teal-600 rounded" /></label>
                  </div>
                </div>
              </div>

              {/* RIGHT: Live Visual Preview */}
              <div className="w-[300px] shrink-0 mx-auto md:mx-0 flex flex-col gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Live Badge Preview</span>

                <div className="relative w-[300px] h-[375px] rounded-[1.5rem] overflow-hidden shadow-2xl border border-slate-300 bg-slate-900 pointer-events-none">
                  <div
                    className="absolute top-0 left-0 w-[1080px] h-[1350px] origin-top-left"
                    style={{
                      transform: `scale(${300 / 1080})`,
                      background: customFrames.length > 0 ? `url(${customFrames[0].url}) center/cover` : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      fontFamily: fontFamily
                    }}
                  >
                    
                    {/* DYNAMIC Fake Selfie Area */}
                    <div 
                      className="absolute bg-black/40 border-[12px] border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-75"
                      style={{
                        left: `${selfieX}px`,
                        top: `${selfieY}px`,
                        width: `${selfieSize}px`,
                        height: `${selfieSize}px`,
                        transform: 'translate(-50%, -50%)', // Keeps the X/Y dead center!
                        borderRadius: selfieShape === 'circle' ? '50%' : `${selfieBorderRadius}px`
                      }}
                    >
                      <span className="text-white/60 text-4xl font-bold tracking-widest uppercase">Selfie</span>
                    </div>

                    {/* Dynamic Name */}
                    <div
                      className="absolute w-full px-20"
                      style={{
                        top: `${nameY}px`,
                        transform: 'translateY(-80%)', // Approximates canvas baseline alignment
                        textAlign: alignment,
                        fontSize: `${nameFontSize}px`,
                        fontWeight: 'bold',
                        color: nameUseGradient ? 'transparent' : nameColor,
                        backgroundImage: nameUseGradient ? `linear-gradient(to bottom, ${primaryColor}, ${secondaryColor})` : 'none',
                        WebkitBackgroundClip: nameUseGradient ? 'text' : 'border-box',
                        lineHeight: 1
                      }}
                    >
                      Full Name
                    </div>

                    {/* Dynamic Subtext */}
                    <div
                      className="absolute w-full px-20"
                      style={{
                        top: `${subTextY}px`,
                        transform: 'translateY(-80%)',
                        textAlign: alignment,
                        fontSize: `${subTextFontSize}px`,
                        fontWeight: '600',
                        color: subTextColor,
                        lineHeight: 1
                      }}
                    >
                      Event Role • Job Title • Company
                    </div>

                    {/* Bottom Elements (Venue/Date) */}
                    {(showVenue || showDate) && (
                      <div className="absolute bottom-[60px] w-full text-center text-[28px] font-semibold text-white/90">
                        {[showDate && dates ? `📅 ${dates}` : '', showVenue && (venue || location) ? `📍 ${venue || location}` : ''].filter(Boolean).join('   •   ')}
                      </div>
                    )}

                    {/* Fake QR Code */}
                    {showQrCode && (
                      <div className="absolute top-[50px] right-[50px] w-[110px] h-[110px] bg-white rounded-[12px] flex items-center justify-center">
                        <div className="w-[85%] h-[85%] border-[3px] border-slate-900 rounded-sm opacity-90 relative">
                          <div className="absolute top-1 left-1 w-3 h-3 bg-slate-900"></div>
                          <div className="absolute top-1 right-1 w-3 h-3 bg-slate-900"></div>
                          <div className="absolute bottom-1 left-1 w-3 h-3 bg-slate-900"></div>
                          <div className="absolute bottom-1 right-1 w-5 h-5 bg-slate-900"></div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'frames' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Custom Event Frames</h3>
                  <p className="text-xs text-slate-500">Upload branded 1080x1350 background templates.</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFrameUpload} accept="image/*" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-1.5 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs font-bold hover:bg-black transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Frame</span>
                </button>
              </div>

              {customFrames.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs">
                  No custom frames uploaded yet. Ensure you save the event first before uploading.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {customFrames.map((frame) => (
                    <div key={frame._id || frame.id} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                      <img src={frame.url} alt={frame.label} className="w-full aspect-[4/5] object-cover" />
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

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex items-center space-x-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition-all"><Save className="h-4 w-4" /><span>{isEditing ? 'Save Changes' : 'Publish'}</span></button>
          </div>
        </form>

      </div>
    </div>
  );
}