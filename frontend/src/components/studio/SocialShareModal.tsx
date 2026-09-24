import React, { useState } from 'react';
import { X, Check, Copy, Share2, Download, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendeeBadgeData, EventItem } from '../../types';

interface SocialShareModalProps {
  isOpen: boolean; onClose: () => void; badge: AttendeeBadgeData; event: EventItem; canvasRef: React.RefObject<HTMLCanvasElement | null>; onDownload: () => void;
}

export function SocialShareModal({ isOpen, onClose, badge, event, onDownload }: SocialShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;
  const viralCopy = `I'm attending ${event.name} this ${event.dates} in ${event.location}! Looking forward to connecting. #${event.slug.replace('-', '')}`;

  const trackShare = async (platform: string) => {
    if (!badge.leadId) return;
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges/${badge.leadId}/track`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share', platform })
    }).catch(console.error);
  };

  const shareLink = (url: string, platform: string) => {
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    trackShare(platform);
    window.open(url, '_blank', 'width=600,height=600');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Share Your Badge</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => shareLink(`https://www.linkedin.com/sharing/share-offsite/?url=${event.website}`, 'LinkedIn')} className="flex items-center justify-center space-x-2 rounded-xl bg-[#0a66c2] text-white px-4 py-3 font-semibold text-xs"><Linkedin className="h-4 w-4 fill-white" /><span>Share to LinkedIn</span></button>
            <button onClick={() => shareLink(`https://twitter.com/intent/tweet?text=${encodeURIComponent(viralCopy)}`, 'X')} className="flex items-center justify-center space-x-2 rounded-xl bg-slate-900 text-white px-4 py-3 font-semibold text-xs"><Twitter className="h-4 w-4 fill-white" /><span>Post to X</span></button>
            <button onClick={() => shareLink(`https://api.whatsapp.com/send?text=${encodeURIComponent(viralCopy)}`, 'WhatsApp')} className="flex items-center justify-center space-x-2 rounded-xl bg-[#25D366] text-white px-4 py-3 font-semibold text-xs"><MessageCircle className="h-4 w-4 fill-white" /><span>Send WhatsApp</span></button>
          </div>

          <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 font-normal">
            {viralCopy}
          </div>
        </div>
      </div>
    </div>
  );
}