import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Camera, Upload, X, Sparkles, CheckCircle2, Scan, RefreshCw, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SAMPLE_PORTRAITS } from '../../data/mockData';

interface FaceMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMatches: (matchedPhotoIds: string[], confidence: number) => void;
}

export function FaceMatchModal({ isOpen, onClose, onApplyMatches }: FaceMatchModalProps) {
  const [step, setStep] = useState<'capture' | 'scanning' | 'results'>('capture');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(SAMPLE_PORTRAITS[0]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('Initializing Face Recognition Engine...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('capture');
      setScanProgress(0);
    }
  }, [isOpen]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) {
        setSelectedPhoto(res);
      }
    };
    reader.readAsDataURL(file);
  };

  const startScanningSimulation = () => {
    setStep('scanning');
    setScanProgress(10);
    setScanStatusText('Aligning facial landmarks & biometric mesh...');

    setTimeout(() => {
      setScanProgress(38);
      setScanStatusText('Extracting 512-dimensional face embedding vector...');
    }, 700);

    setTimeout(() => {
      setScanProgress(72);
      setScanStatusText('Matching vectors across 1,420 conference event photos...');
    }, 1400);

    setTimeout(() => {
      setScanProgress(100);
      setScanStatusText('Matching complete! 5 verified appearances detected.');
    }, 2100);

    setTimeout(() => {
      setStep('results');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }, 2600);
  };

  const handleApplyFilter = () => {
    // Matches p-1, p-2, p-3, p-4, p-6, p-7, p-8
    const matchedIds = ['p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'p-7', 'p-8'];
    onApplyMatches(matchedIds, 98.4);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-teal-500 text-white shadow-xs">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Face-Match Photo Finder</h3>
              <p className="text-xs text-slate-500">Scan event photos with biometric accuracy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* STEP 1: CAPTURE OR PICK HEADSHOT */}
          {step === 'capture' && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">
                  Select or upload your selfie to locate all stage & crowd photos:
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Our privacy-preserving model compares biometric vectors without storing your face.
                </p>
              </div>

              {/* Headshot Preview */}
              <div className="flex justify-center">
                <div className="relative h-44 w-44 rounded-2xl border-4 border-teal-500/30 overflow-hidden shadow-lg group">
                  <img
                    src={selectedPhoto}
                    alt="Attendee Headshot"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-2">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Reference Headshot
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Portrait Selection */}
              <div>
                <span className="block text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Pick Demo Profile Or Upload Your Own
                </span>
                <div className="flex justify-center items-center space-x-3 overflow-x-auto pb-1">
                  {SAMPLE_PORTRAITS.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(url)}
                      className={`h-12 w-12 rounded-full border-2 overflow-hidden transition-all ${
                        selectedPhoto === url
                          ? 'border-teal-500 ring-2 ring-teal-500/20 scale-110'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Sample ${i}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload custom file input */}
              <div className="flex justify-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Local Selfie / Headshot</span>
                </button>
              </div>

              {/* CTA */}
              <button
                id="start-face-scan-btn"
                onClick={startScanningSimulation}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:from-teal-500 hover:to-emerald-500 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>Start AI Face Match Scan</span>
              </button>
            </div>
          )}

          {/* STEP 2: SCANNING SIMULATION */}
          {step === 'scanning' && (
            <div className="py-6 flex flex-col items-center justify-center space-y-5">
              
              {/* Futuristic Biometric Scanner Display */}
              <div className="relative h-56 w-56 rounded-2xl border-2 border-teal-400 overflow-hidden shadow-[0_0_25px_rgba(20,184,166,0.25)] bg-slate-950">
                <img
                  src={selectedPhoto}
                  alt="Scanning Target"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover opacity-85 filter contrast-110"
                />

                {/* Laser scan line moving down */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf] animate-scanline z-20" />

                {/* Simulated 68-point landmark dots */}
                <div className="absolute inset-0 pointer-events-none z-10">
                  {/* Eye boxes */}
                  <div className="absolute top-[38%] left-[28%] h-7 w-7 border border-teal-400/80 rounded-sm" />
                  <div className="absolute top-[38%] right-[28%] h-7 w-7 border border-teal-400/80 rounded-sm" />
                  {/* Nose point */}
                  <div className="absolute top-[52%] left-[48%] h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  {/* Mouth box */}
                  <div className="absolute top-[68%] left-[34%] h-5 w-16 border border-teal-400/70 rounded-sm" />
                  {/* Biometric coordinate grid lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a615_1px,transparent_1px),linear-gradient(to_bottom,#14b8a615_1px,transparent_1px)] bg-[size:16px_16px]" />
                </div>

                {/* Biometric overlay status */}
                <div className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono text-teal-400 uppercase tracking-widest border border-teal-500/30">
                  FACE_ID: 0x9B4E
                </div>
                <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono text-emerald-400 uppercase tracking-widest border border-emerald-500/30">
                  CONF: 98.4%
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5 text-teal-700 font-mono">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Vector Similarity Engine</span>
                  </span>
                  <span className="font-mono text-teal-600 font-bold">{scanProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="text-center text-xs text-slate-500 font-mono pt-1">
                  {scanStatusText}
                </p>
              </div>

            </div>
          )}

          {/* STEP 3: RESULTS SUMMARY */}
          {step === 'results' && (
            <div className="space-y-5 text-center py-2">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto ring-8 ring-emerald-50/50">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-900">
                  Matches Found in Event Gallery!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  We identified <strong className="text-teal-700 font-bold">7 high-resolution photos</strong> across 3 stages matching your facial biometrics.
                </p>
              </div>

              {/* Match Stats Card */}
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xl font-extrabold text-teal-600">98.4%</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Confidence</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xl font-extrabold text-slate-900">7 Photos</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Detected</div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  id="view-matched-photos-btn"
                  onClick={handleApplyFilter}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-3 text-sm font-bold shadow-md shadow-teal-600/20 transition-all"
                >
                  <span>View My Matched Photos In Gallery</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setStep('capture')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Scan with another photo
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
