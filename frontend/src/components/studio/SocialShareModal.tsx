import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Share2, Download, AlertCircle, Info } from 'lucide-react';
import { AttendeeBadgeData, EventItem } from '../../types';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: AttendeeBadgeData;
  event: EventItem;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onDownload: () => void;
}

export function SocialShareModal({ isOpen, onClose, badge, event, canvasRef, onDownload }: SocialShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);

  const locationString = event.venue || event.location || 'the venue';
  const eventDates = event.dates || '';
  
  const defaultShareText = `I'm attending ${event.name} ${eventDates ? `this ${eventDates}` : ''} at ${locationString}! Looking forward to connecting. #${event.name.replace(/\s+/g, '')}`;
  
  const [shareText, setShareText] = useState(defaultShareText);

  useEffect(() => {
    if (!navigator.canShare || !navigator.share) {
      setFallbackMode(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const logShareToBackend = (platform: string) => {
    if (!badge.leadId) return;
    fetch(`/api/badges/${badge.leadId}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share', platform })
    }).catch(console.error);
  };

  const handleNativeShare = async (platform: string) => {
    if (isSharing) return;
    
    if (fallbackMode || !canvasRef.current) {
      handleCopyText();
      onDownload();
      logShareToBackend(platform);
      return;
    }

    setIsSharing(true);
    
    try {
      // 1. THE FIX: Always force-copy the text to the clipboard first.
      // Because WhatsApp/LinkedIn strip text when an image is attached, 
      // this ensures the user can just hit "Paste" when the app opens.
      await navigator.clipboard.writeText(shareText).catch(() => {});
      setShowPasteHint(true); // Show the UI hint

      // 2. Generate the Image Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current?.toBlob(resolve, 'image/jpeg', 0.95);
      });

      if (!blob) throw new Error("Could not generate image blob");

      const file = new File([blob], `${badge.name || 'attendee'}-badge.jpg`, { type: 'image/jpeg' });
      
      const shareData = {
        title: `My ${event.name} Badge`,
        text: shareText, // Kept for apps that DO support both (like Email clients)
        files: [file] 
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
        logShareToBackend(platform);
      } else {
        await navigator.share({
          title: `My ${event.name} Badge`,
          text: shareText,
        });
        onDownload();
        logShareToBackend(platform);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Native share failed:", err);
      }
    } finally {
      setIsSharing(false);
      setTimeout(() => setShowPasteHint(false), 6000); // Hide hint after 6 seconds
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-teal-600" /> Share Your Badge
          </h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              disabled={isSharing}
              onClick={() => handleNativeShare('LinkedIn')}
              className="flex items-center justify-center space-x-2 rounded-xl bg-[#0a66c2] px-4 py-3 text-sm font-bold text-white hover:bg-[#084e96] transition-colors shadow-md disabled:opacity-70"
            >
              <span>{fallbackMode ? 'Copy & Download for LinkedIn' : 'Share to LinkedIn'}</span>
            </button>
            <button
              disabled={isSharing}
              onClick={() => handleNativeShare('WhatsApp')}
              className="flex items-center justify-center space-x-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white hover:bg-[#1da851] transition-colors shadow-md disabled:opacity-70"
            >
              <span>{fallbackMode ? 'Copy & Download for WhatsApp' : 'Send WhatsApp'}</span>
            </button>
          </div>

          {/* Dynamic User Hint (Shows up when sharing) */}
          {showPasteHint && !fallbackMode && (
             <div className="flex items-start gap-2 bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-800 animate-in fade-in zoom-in duration-200">
             <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
             <p><strong>Text Copied!</strong> Some apps ignore the text when an image is attached. Just hit <strong>"Paste"</strong> in the app to add your caption!</p>
           </div>
          )}

          {/* Desktop Fallback Warning */}
          {fallbackMode && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Your browser doesn't support direct image sharing. Clicking a share button above will <strong>copy your text</strong> and <strong>download the image</strong> so you can easily paste both into the app!</p>
            </div>
          )}

          {/* Text Editor */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block flex justify-between items-end">
              <span>Customize Your Post</span>
              <button 
                onClick={handleCopyText}
                className="flex items-center gap-1 text-teal-600 hover:text-teal-700 bg-teal-50 px-2 py-1 rounded-md transition-colors"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </label>
            <textarea
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors resize-none h-28"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <p className="text-[11px] font-medium text-slate-500">
            {event.name} • {new Date().getFullYear()}
          </p>
          <button 
            onClick={onDownload}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Just Download Image
          </button>
        </div>

      </div>
    </div>
  );
}