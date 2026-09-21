import React, { useEffect, useState } from 'react';
import { Download, Share2, ZoomIn, ZoomOut, RotateCw, Sparkles, Sliders, Check, Copy } from 'lucide-react';
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
  const [showTransformControls, setShowTransformControls] = useState(false);

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
      await fetch(`/api/badges/${badge.leadId}/track`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download' })
      }).catch(console.error);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90mo shadow-xl p-3 sm:p-4 flex flex-col items-center">
        
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between pb-3 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">1080 × 1080 PX</span>
          </div>
          <button 
            onClick={() => setShowTransformControls(!showTransformControls)} 
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${showTransformControls ? 'bg-teal-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Reposition</span>
          </button>
        </div>
        
        {/* Canvas Area */}
        <div className="w-full aspect-square max-w-[500px] flex items-center justify-center rounded-xl overflow-hidden bg-black shadow-2xl">
          <canvas ref={canvasRef} className="w-full h-full object-contain cursor-crosshair" />
        </div>

        {/* NEW: Reposition Sliders */}
        {showTransformControls && (
          <div className="w-full mt-4 space-y-4 rounded-xl bg-slate-800/80 p-4 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Zoom / Scale</span><span>{((badge.scale || 1) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center space-x-3">
                <ZoomOut className="h-4 w-4 text-slate-500 shrink-0" />
                <input type="range" min="0.5" max="3" step="0.05" value={badge.scale || 1} onChange={(e) => onUpdateBadge({ scale: parseFloat(e.target.value) })} className="w-full accent-teal-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                <ZoomIn className="h-4 w-4 text-slate-500 shrink-0" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider"><span>Horizontal Pan</span></div>
                <input type="range" min="-500" max="500" step="10" value={badge.panX || 0} onChange={(e) => onUpdateBadge({ panX: parseInt(e.target.value) })} className="w-full accent-teal-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider"><span>Vertical Pan</span></div>
                <input type="range" min="-500" max="500" step="10" value={badge.panY || 0} onChange={(e) => onUpdateBadge({ panY: parseInt(e.target.value) })} className="w-full accent-teal-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
              </div>
            </div>
          </div>
        )}

        {/* Frame Swapper */}
        <div className="w-full mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {event.customFrames?.map((frame) => (
              <button 
                key={frame.id || frame._id} 
                onClick={() => onUpdateBadge({ themeStyle: 'custom' as any, customFrameUrl: frame.url })} 
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${badge.customFrameUrl === frame.url ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {frame.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex gap-2.5">
          <button onClick={handleDownload} className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700 transition-colors shadow-md">
            <Download className="h-4 w-4" /><span>Download HD Badge</span>
          </button>
          <button onClick={onOpenShareModal} className="flex items-center justify-center space-x-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 px-4 py-3 text-sm font-bold transition-colors">
            <Share2 className="h-4 w-4" /><span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}