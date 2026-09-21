import { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { SAMPLE_PORTRAITS } from '../../data/mockData';

interface WebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
}

export function WebcamModal({ isOpen, onClose, onCapture }: WebcamModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  };

  const stopCamera = () => {
    clearCountdown();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1080 },
          height: { ideal: 1080 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Webcam playback error:', err);
        });
      }
      setIsInitializing(false);
    } catch (err: unknown) {
      console.warn('Webcam access error:', err);
      const msg = err instanceof Error ? err.message : 'Camera permission was denied or not found.';
      setCameraError(msg);
      setIsInitializing(false);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;

    clearCountdown();
    let remaining = 3;
    setCountdown(remaining);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearCountdown();
        captureFrame();
      } else {
        setCountdown(remaining);
      }
    }, 600);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop & mirror flip for natural selfie look
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    onCapture(dataUrl);
    onClose();
  };

  const selectSamplePortrait = (url: string) => {
    stopCamera();
    onCapture(url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Take Live Headshot</h3>
              <p className="text-xs text-slate-500">Center your face in the guide circle</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative bg-slate-950 flex items-center justify-center min-h-[360px] aspect-square overflow-hidden">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="font-semibold text-slate-100 text-sm mb-1">Camera Stream Unavailable</p>
              <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
                Browser camera access was restricted or not detected in this frame preview. You can pick an instant high-res conference portrait below:
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={startCamera}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry Camera</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover transform -scale-x-100"
              />

              {/* Circular framing guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="h-64 w-64 rounded-full border-2 border-dashed border-teal-400/70 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]"></div>
              </div>

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 z-10">
                  <span className="text-7xl font-extrabold text-white animate-ping">
                    {countdown}
                  </span>
                </div>
              )}
            </>
          )}

          {isInitializing && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-teal-400" />
              <p className="text-xs font-medium text-slate-300">Starting camera preview...</p>
            </div>
          )}
        </div>

        {/* Fallback Sample Portraits Bar */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Or Choose Instant Sample Headshot
            </span>
            <span className="text-[10px] font-medium text-teal-600 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Quick pick
            </span>
          </div>
          <div className="flex items-center space-x-3 overflow-x-auto pb-1">
            {SAMPLE_PORTRAITS.map((url, idx) => (
              <button
                key={idx}
                onClick={() => selectSamplePortrait(url)}
                className="group relative h-12 w-12 shrink-0 rounded-full border-2 border-slate-200 hover:border-teal-500 overflow-hidden transition-all shadow-xs"
              >
                <img
                  src={url}
                  alt={`Sample Portrait ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3.5">
          <button
            onClick={handleClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          {!cameraError && (
            <button
              id="snap-photo-btn"
              onClick={takeSnapshot}
              disabled={isInitializing}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-teal-500/20 hover:from-teal-500 hover:to-emerald-500 transition-all disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              <span>Capture Headshot</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
