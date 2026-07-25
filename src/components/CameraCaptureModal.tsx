import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle, FlipHorizontal, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64DataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage]);

  const startCamera = async (mode: 'user' | 'environment') => {
    setIsStarting(true);
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device found on your device.');
      } else {
        setCameraError(`Could not access camera: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsStarting(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const size = Math.min(video.videoWidth || 400, video.videoHeight || 400);
    canvas.width = 400;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Calculate crop to center square for passport/ID photo aspect ratio
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;

      // Flip horizontally if facing user for mirror effect
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const startCountdown = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleCapture();
      setCountdown(null);
    }
  }, [countdown]);

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Capture Passport Photograph</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View / Preview Area */}
        <div className="p-5 flex flex-col items-center justify-center bg-slate-950 min-h-[380px] relative">
          <canvas ref={canvasRef} className="hidden" />

          {capturedImage ? (
            /* Captured Preview Mode */
            <div className="relative flex flex-col items-center">
              <div className="w-64 h-64 rounded-2xl overflow-hidden border-4 border-emerald-500 shadow-xl relative bg-slate-900">
                <img
                  src={capturedImage}
                  alt="Captured Photograph"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                  Captured
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-3 text-center">
                Passport Photo Preview. Check positioning and lighting.
              </p>
            </div>
          ) : cameraError ? (
            /* Error State */
            <div className="text-center p-6 space-y-3 max-w-xs">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-white">{cameraError}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          ) : (
            /* Live Camera Stream View */
            <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-slate-700 bg-black shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Passport Photo Position Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none border-[3px] border-dashed border-blue-400/60 rounded-2xl flex items-center justify-center">
                <div className="w-40 h-52 border-2 border-amber-300/80 rounded-[50%] opacity-70 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-amber-200 bg-slate-900/80 px-2 py-0.5 rounded">
                    Position Face Here
                  </span>
                </div>
              </div>

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-6xl font-black text-amber-400 animate-ping">
                    {countdown}
                  </span>
                </div>
              )}

              {/* Flip camera button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition border border-slate-700"
                title="Switch Camera"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retake Photo
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={startCountdown}
                disabled={!!cameraError || isStarting}
                className="flex-1 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                Capture Photograph
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
