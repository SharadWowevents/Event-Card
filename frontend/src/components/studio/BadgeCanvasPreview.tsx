import React, { useEffect, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendeeBadgeData, EventItem } from '../../types';
import { exportCanvasToPng, renderBadgeToCanvas } from '../../utils/canvasRenderer';

interface BadgeCanvasPreviewProps {
  badge: AttendeeBadgeData;
  event: EventItem;
  onUpdateBadge: (updates: Partial<AttendeeBadgeData>) => void;
  onOpenShareModal: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function BadgeCanvasPreview({ badge, event, onUpdateBadge, onOpenShareModal, canvasRef }: BadgeCanvasPreviewProps) {
  const [avatarImg, setAvatarImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!badge.avatarUrl) { setAvatarImg(null); return; }
    const img = new Image();
    if (badge.avatarUrl.startsWith('http')) img.crossOrigin = 'anonymous';
    img.src = badge.avatarUrl;
    img.onload = () => setAvatarImg(img);
  }, [badge.avatarUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderBadgeToCanvas(canvas, badge, event, avatarImg);
  }, [badge, event, avatarImg, canvasRef]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    exportCanvasToPng(canvas, `${event.slug}-badge.png`);

    if (badge.leadId) {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/badges/${badge.leadId}/track`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download' })
      }).catch(console.error);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 shadow-xl p-3 sm:p-4 flex flex-col items-center">
        
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between pb-3 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">1080 × 1350 PX (HD)</span>
          </div>
        </div>
        
        {/* Canvas Area */}
        <div className="w-full aspect-[4/5] max-w-[500px] flex items-center justify-center rounded-xl overflow-hidden bg-slate-900 shadow-2xl">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex gap-2.5">
          <button 
            id="download-badge-btn"
            onClick={handleDownload} 
            className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700 transition-colors shadow-md"
            style={{ background: `linear-gradient(135deg, ${event.theme?.primaryColor || '#0d9488'}, ${event.theme?.secondaryColor || '#059669'})` }}
          >
            <Download className="h-4 w-4" /><span>Download HD Badge</span>
          </button>
          <button 
            onClick={onOpenShareModal} 
            className="flex items-center justify-center space-x-2 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100 px-4 py-3 text-sm font-bold transition-colors"
          >
            <Share2 className="h-4 w-4" /><span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}