import { X, Download, Share2, Heart, Calendar, MapPin, Camera, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GalleryPhoto } from '../../types';

interface PhotoLightboxProps {
  photo: GalleryPhoto | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function PhotoLightbox({
  photo,
  onClose,
  onToggleFavorite,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}: PhotoLightboxProps) {
  if (!photo) return null;

  const handleDownload = () => {
    confetti({ particleCount: 40, spread: 50 });
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `${photo.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-hd.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: photo.title,
        text: `Check out this shot from ${photo.stage}!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(photo.url);
      alert('Photo link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150">
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 rounded-full bg-slate-900/80 p-2.5 text-white hover:bg-slate-800 transition-colors border border-white/10"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev / Next buttons */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 rounded-full bg-slate-900/80 p-3 text-white hover:bg-slate-800 border border-white/10"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={onNext}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-40 rounded-full bg-slate-900/80 p-3 text-white hover:bg-slate-800 border border-white/10"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Container */}
      <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col lg:flex-row rounded-2xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl">
        
        {/* Photo Left/Top */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] max-h-[60vh] lg:max-h-[85vh] overflow-hidden">
          <img
            src={photo.url}
            alt={photo.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain"
          />

          {photo.matchScore && (
            <div className="absolute top-4 left-4 flex items-center space-x-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white shadow-lg">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Face Matched: {photo.matchScore}%</span>
            </div>
          )}
        </div>

        {/* Info Right/Bottom */}
        <div className="w-full lg:w-84 bg-slate-900 p-5 sm:p-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 text-white space-y-4">
          
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                Conference Media Archive
              </span>
              <h3 className="text-lg font-bold text-white mt-1 leading-snug">
                {photo.title}
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="font-medium text-slate-200">{photo.stage}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                <span>{photo.timestamp}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Camera className="h-4 w-4 text-slate-500 shrink-0" />
                <span>Credit: {photo.photographer}</span>
              </div>
            </div>

            {/* Tagged Attendees */}
            {photo.attendeeTags.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Identified in this photo:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {photo.attendeeTags.map((name, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 border border-slate-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-teal-400 hover:to-emerald-400 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download Full HD Photo</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(photo.id)}
                className={`flex-1 flex items-center justify-center space-x-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  photo.isFavorite
                    ? 'border-pink-500/50 bg-pink-500/10 text-pink-400'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Heart className={`h-4 w-4 ${photo.isFavorite ? 'fill-pink-400' : ''}`} />
                <span>{photo.isFavorite ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center space-x-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 px-3 py-2 text-xs font-semibold transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
