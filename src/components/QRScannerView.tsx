import React, { useState, useEffect, useRef } from 'react';
import { Candidate } from '../types';
import { fetchCandidateByIdentifier } from '../utils/api';
import { 
  QrCode, 
  Camera, 
  Search, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  GraduationCap, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface QRScannerViewProps {
  onSelectCandidate: (candidate: Candidate, docType?: string) => void;
  onShowStudentQR?: () => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({ onSelectCandidate, onShowStudentQR }) => {
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundCandidate, setFoundCandidate] = useState<Candidate | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleLookup = async (codeToLookup?: string) => {
    const code = codeToLookup || qrCodeInput.trim();
    if (!code) {
      setErrorMessage('Please enter or scan a valid QR Code payload or Student ID.');
      return;
    }

    setSearching(true);
    setErrorMessage('');
    setFoundCandidate(null);

    try {
      // Try parsing if it's JSON payload
      let parsedId = code;
      if (code.startsWith('{')) {
        try {
          const json = JSON.parse(code);
          parsedId = json.id || json.candidateId || code;
        } catch (e) {
          // ignore
        }
      }

      const candidate = await fetchCandidateByIdentifier(parsedId);
      if (!candidate) {
        setErrorMessage(`No candidate found matching QR payload / ID: "${parsedId}"`);
      } else {
        setFoundCandidate(candidate);
      }
    } catch (err) {
      setErrorMessage('Failed to search candidate from backend database');
    } finally {
      setSearching(false);
    }
  };

  // Simulated Camera Toggle
  const toggleCamera = async () => {
    if (!cameraActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        alert('Camera access not permitted or unavailable in iframe context. Use manual QR Code input or upload image file below.');
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">QR Code Student Verification</h2>
            <p className="text-xs text-slate-400 mt-1">
              Instant candidate verification & auto-fetch from backend Excel storage by scanning student QR Code or entering Application ID.
            </p>
          </div>
        </div>

        {onShowStudentQR && (
          <button
            onClick={onShowStudentQR}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition shadow border border-amber-500 flex items-center gap-2 shrink-0"
          >
            <QrCode className="w-4 h-4 text-amber-200" />
            Print Student QR Poster
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner / Camera / Input Box */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 space-y-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Camera className="w-4 h-4 text-teal-600" />
            Live Camera / QR Scanner
          </h3>

          <div className="bg-slate-950 rounded-xl h-56 flex flex-col items-center justify-center relative overflow-hidden border border-slate-800">
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4 space-y-2">
                <QrCode className="w-12 h-12 text-teal-400 mx-auto animate-pulse" />
                <p className="text-xs text-slate-300">Position QR Code within scanner frame</p>
              </div>
            )}
            
            <button
              onClick={toggleCamera}
              className="absolute bottom-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow transition"
            >
              {cameraActive ? 'Stop Camera' : 'Start Camera Scanner'}
            </button>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Or Paste / Enter QR Code Payload or Student ID:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrCodeInput}
                onChange={(e) => setQrCodeInput(e.target.value)}
                placeholder="e.g. ADM-2026-1001 or 26BSC101"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={() => handleLookup()}
                disabled={searching}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow shrink-0"
              >
                {searching ? 'Fetching...' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Quick Demo QR Buttons */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Quick Demo QR Payload Buttons:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setQrCodeInput('ADM-2026-1001');
                  handleLookup('ADM-2026-1001');
                }}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-semibold border"
              >
                ADM-2026-1001
              </button>
              <button
                onClick={() => {
                  setQrCodeInput('26BSC101');
                  handleLookup('26BSC101');
                }}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-semibold border"
              >
                Roll: 26BSC101
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}
        </div>

        {/* Verification Result Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified Backend Candidate Result
          </h3>

          {foundCandidate ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-extrabold flex items-center justify-center text-lg">
                    {foundCandidate.fullName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      VERIFIED AUTHENTIC STUDENT
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{foundCandidate.fullName}</h4>
                    <p className="text-xs text-slate-600">Father: {foundCandidate.fatherName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-emerald-200 pt-2 font-medium text-slate-800">
                  <div><span className="text-slate-500 block">App ID:</span> {foundCandidate.id}</div>
                  <div><span className="text-slate-500 block">Roll No:</span> {foundCandidate.assignedRollNumber || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Course:</span> {foundCandidate.courseApplied}</div>
                  <div><span className="text-slate-500 block">Status:</span> {foundCandidate.status}</div>
                </div>
              </div>

              {/* 1-Click Document Actions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Generate Document for Verified Candidate:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectCandidate(foundCandidate, 'discharge')}
                    className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
                  >
                    Discharge Cert (DC)
                  </button>

                  <button
                    onClick={() => onSelectCandidate(foundCandidate, 'character')}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
                  >
                    Character Cert
                  </button>

                  <button
                    onClick={() => onSelectCandidate(foundCandidate, 'provisional')}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
                  >
                    Provisional Cert
                  </button>

                  <button
                    onClick={() => onSelectCandidate(foundCandidate, 'bank-slip')}
                    className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
                  >
                    Bank Fee Slip
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
              Scan or enter a QR Code / Student ID on the left to verify candidate details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
