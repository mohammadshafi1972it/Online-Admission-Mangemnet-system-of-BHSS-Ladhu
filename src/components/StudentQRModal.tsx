import React, { useState, useEffect } from 'react';
import { generateQRCodeDataUrl } from '../utils/qr';
import { triggerPrint } from '../utils/print';
import { QrCode, X, Copy, Check, Printer, UserCheck, ShieldCheck, Camera, Smartphone, Sparkles, Building2 } from 'lucide-react';

interface StudentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToStudentView: () => void;
}

export const StudentQRModal: React.FC<StudentQRModalProps> = ({
  isOpen,
  onClose,
  onSwitchToStudentView,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const studentFormUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?role=student&form=admission`
    : 'https://campus-admission-portal.edu/apply?role=student';

  useEffect(() => {
    if (isOpen) {
      generateQRCodeDataUrl(studentFormUrl).then((url) => setQrDataUrl(url));
    }
  }, [isOpen, studentFormUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(studentFormUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-md p-4 overflow-y-auto print:p-0 print:static print:bg-white print:block">
      <div id="printable-qr-modal" className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-auto print:border-none print:shadow-none print:max-w-none print:rounded-none">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Student Admission QR Code Poster</h2>
              <p className="text-xs text-slate-400">Print or display this poster at the school gate or notice board.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE POSTER CONTAINER */}
        <div className="p-6 sm:p-10 space-y-6 text-center print:p-8 print:space-y-6">
          
          {/* Poster Outer Frame */}
          <div className="border-4 border-slate-900 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-slate-50 via-white to-blue-50/30 space-y-6 shadow-inner relative">
            
            {/* School Crest / Header */}
            <div className="space-y-2 border-b-2 border-slate-900 pb-4">
              <div className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                GOVT. BOYS HIGHER SECONDARY SCHOOL
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                LADHOO PAMPORE, PULWAMA (J&K)
              </h1>
              <p className="text-xs sm:text-sm font-extrabold text-blue-900 uppercase">
                OFFICIAL ONLINE ADMISSION PORTAL — SESSION 2026-27
              </p>
            </div>

            {/* Poster Headline */}
            <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-xl">
              <h3 className="text-base sm:text-lg font-black text-amber-950 uppercase tracking-wide">
                SCAN QR CODE TO APPLY ONLINE
              </h3>
              <p className="text-xs text-amber-800 font-semibold mt-0.5">
                Fast & Paperless Admission Application Form for Class 9th, 10th, 11th & 12th
              </p>
            </div>

            {/* Center High Resolution QR Code */}
            <div className="py-2">
              <div className="inline-block p-4 sm:p-5 bg-white rounded-2xl border-4 border-slate-900 shadow-xl relative group">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Official Student Admission QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-56 h-56 sm:w-64 sm:h-64 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400">
                    Generating Official QR...
                  </div>
                )}
                <div className="mt-2 font-mono text-[11px] font-black uppercase text-slate-800 tracking-wider">
                  SCAN WITH MOBILE CAMERA
                </div>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">Open Camera</h4>
                  <p className="text-[11px] text-slate-600">Open mobile camera or any QR reader app.</p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">Scan QR Code</h4>
                  <p className="text-[11px] text-slate-600">Point phone camera steady at the QR code above.</p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">Fill Application</h4>
                  <p className="text-[11px] text-slate-600">Tap banner link to open & complete application.</p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-slate-100 p-2.5 rounded-xl border border-slate-300 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Security Guarantee:</strong> Scanning this QR code grants direct access to student application submission only. Administrative controls and database records remain password protected.
              </span>
            </div>

            {/* Footer Contact */}
            <div className="pt-2 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-600 font-semibold gap-2">
              <span>Govt. BHSS Ladhoo Admission Cell</span>
              <span className="font-mono text-slate-800">Helpline: +91 94190XXXXX</span>
            </div>

          </div>

        </div>

        {/* Modal Action Controls (Screen Only) */}
        <div className="bg-slate-50 p-4 sm:p-6 border-t border-slate-200 print:hidden space-y-4">
          
          {/* Direct Link Bar */}
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-700">
            <span className="truncate flex-1 text-left px-1">{studentFormUrl}</span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition shrink-0 flex items-center gap-1.5 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                onSwitchToStudentView();
              }}
              className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <UserCheck className="w-4 h-4 text-amber-300" />
              Test Student Mode View
            </button>

            <button
              onClick={() => triggerPrint('printable-qr-modal')}
              className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              Print Official A4 QR Poster
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
