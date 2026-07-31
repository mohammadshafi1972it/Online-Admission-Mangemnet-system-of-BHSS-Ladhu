import React, { useState, useEffect } from 'react';
import { Candidate, DocumentType } from '../types';
import { generateQRCodeDataUrl, buildCandidateQRPayload } from '../utils/qr';
import { calculateCourseFees } from '../utils/feeCalculator';
import { calculateGradeAndPercentage } from '../utils/grade';
import { triggerPrint } from '../utils/print';
import { PrintableBankSlipA4 } from './PrintableBankSlipA4';
import { 
  FileText, 
  Printer, 
  Download, 
  QrCode, 
  Search, 
  Award, 
  CreditCard, 
  BookOpen, 
  CheckCircle2, 
  Building2,
  UserCheck,
  ShieldAlert,
  GraduationCap,
  User,
  Copy
} from 'lucide-react';

interface DocumentGeneratorProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  defaultDocType?: DocumentType;
  onSelectCandidate: (candidate: Candidate) => void;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  candidates,
  selectedCandidate,
  defaultDocType = 'discharge',
  onSelectCandidate,
}) => {
  const [docType, setDocType] = useState<DocumentType>(defaultDocType);
  const [dcFormat, setDcFormat] = useState<'ladhu' | 'standard'>('standard');
  const [dischargeCopyType, setDischargeCopyType] = useState<'both' | 'office' | 'student'>('both');
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(selectedCandidate || candidates[0] || null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync candidate selection
  useEffect(() => {
    if (selectedCandidate) {
      setActiveCandidate(selectedCandidate);
    } else if (candidates.length > 0 && !activeCandidate) {
      setActiveCandidate(candidates[0]);
    }
  }, [selectedCandidate, candidates]);

  // Generate QR Code when candidate or docType changes
  useEffect(() => {
    if (activeCandidate) {
      const payload = buildCandidateQRPayload(
        activeCandidate.id,
        activeCandidate.fullName,
        activeCandidate.courseApplied,
        activeCandidate.assignedRollNumber
      );
      generateQRCodeDataUrl(payload).then(setQrUrl);
    }
  }, [activeCandidate, docType]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    const found = candidates.find(
      (c) =>
        c.id.toLowerCase().includes(q.toLowerCase()) ||
        c.fullName.toLowerCase().includes(q.toLowerCase()) ||
        (c.assignedRollNumber && c.assignedRollNumber.toLowerCase().includes(q.toLowerCase()))
    );
    if (found) {
      setActiveCandidate(found);
    }
  };

  const handlePrint = () => {
    triggerPrint('printable-document-container');
  };

  if (!activeCandidate) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Student Selected</h3>
          <p className="text-sm text-slate-500 mt-1">
            Please select or apply for an admission form first to auto-generate certificates and forms.
          </p>
        </div>
      </div>
    );
  }

  const fees = calculateCourseFees(activeCandidate.courseApplied, activeCandidate.category, activeCandidate.gender, activeCandidate.classWishToJoin);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Top Document Controls (Hidden on Print) */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Auto-Fetched Academic Certificate Engine
            </span>
            <h2 className="text-2xl font-extrabold mt-1">Official Document & Certificate Studio</h2>
            <p className="text-slate-400 text-xs">
              Auto-populates student data directly from backend Excel storage. Select candidate and document format.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Candidate Selector Bar & Document Selector */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Select Candidate (Auto-Fetch Data):
              </label>
              <span className="text-[11px] bg-slate-800 text-blue-400 font-mono font-bold px-2.5 py-0.5 rounded-md border border-slate-700">
                {candidates.length} Registered Students
              </span>
            </div>
            <select
              value={activeCandidate.id}
              onChange={(e) => {
                const found = candidates.find((c) => c.id === e.target.value);
                if (found) onSelectCandidate(found);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.id} - {c.courseApplied}) {c.assignedRollNumber ? `[Roll: ${c.assignedRollNumber}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Select Document Type & Certificate Format:
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Click any document tile below to preview & print
              </span>
            </div>

            {/* Visual Interactive Document Type Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'discharge' as DocumentType,
                  title: 'Discharge Cert',
                  subtitle: 'Transfer & Clearance',
                  icon: FileText,
                  color: 'from-amber-600 to-orange-600',
                  activeBorder: 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-950/40'
                },
                {
                  id: 'character' as DocumentType,
                  title: 'Character Cert',
                  subtitle: 'Conduct & Merit',
                  icon: Award,
                  color: 'from-indigo-600 to-blue-600',
                  activeBorder: 'border-indigo-400 ring-2 ring-indigo-400/30 bg-indigo-950/40'
                },
                {
                  id: 'provisional' as DocumentType,
                  title: 'Provisional Cert',
                  subtitle: 'Course Completion',
                  icon: GraduationCap,
                  color: 'from-blue-600 to-cyan-600',
                  activeBorder: 'border-blue-400 ring-2 ring-blue-400/30 bg-blue-950/40'
                },
                {
                  id: 'library' as DocumentType,
                  title: 'Library Card',
                  subtitle: 'Access & Borrowing',
                  icon: BookOpen,
                  color: 'from-emerald-600 to-teal-600',
                  activeBorder: 'border-emerald-400 ring-2 ring-emerald-400/30 bg-emerald-950/40'
                },
                {
                  id: 'bank-slip' as DocumentType,
                  title: 'Bank Fee Slip',
                  subtitle: '3-Part A4 Challan',
                  icon: CreditCard,
                  color: 'from-teal-600 to-emerald-600',
                  activeBorder: 'border-teal-400 ring-2 ring-teal-400/30 bg-teal-950/40'
                },
                {
                  id: 'hostel' as DocumentType,
                  title: 'Hostel Card',
                  subtitle: 'Room Allotment',
                  icon: Building2,
                  color: 'from-rose-600 to-pink-600',
                  activeBorder: 'border-rose-400 ring-2 ring-rose-400/30 bg-rose-950/40'
                },
                {
                  id: 'scholarship' as DocumentType,
                  title: 'Scholarship Form',
                  subtitle: 'Fee Concession',
                  icon: UserCheck,
                  color: 'from-purple-600 to-indigo-600',
                  activeBorder: 'border-purple-400 ring-2 ring-purple-400/30 bg-purple-950/40'
                },
                {
                  id: 'bonafide' as DocumentType,
                  title: 'Bonafide Cert',
                  subtitle: 'Institution Proof',
                  icon: ShieldAlert,
                  color: 'from-sky-600 to-blue-600',
                  activeBorder: 'border-sky-400 ring-2 ring-sky-400/30 bg-sky-950/40'
                }
              ].map((item) => {
                const IconComp = item.icon;
                const isSelected = docType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDocType(item.id)}
                    className={`p-3 rounded-xl transition-all flex flex-col justify-between text-left border relative overflow-hidden group cursor-pointer ${
                      isSelected
                        ? item.activeBorder + ' shadow-lg scale-[1.02]'
                        : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Active
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-white group-hover:text-blue-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Discharge Certificate Sub-Format & Copy Mode Controls */}
        {docType === 'discharge' && (
          <div className="space-y-3 pt-3 border-t border-slate-800 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Discharge Certificate Format Style:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDcFormat('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dcFormat === 'standard'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Standard School Format
                </button>
                <button
                  type="button"
                  onClick={() => setDcFormat('ladhu')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dcFormat === 'ladhu'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Govt. Boys HSS Ladhu Format
                </button>
              </div>
            </div>

            {/* Carbon / Office Copy Mode Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Print Copy Options (Carbon / Office Copy):</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDischargeCopyType('both')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    dischargeCopyType === 'both'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md ring-2 ring-amber-400'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  📄 2-in-1 (Original + Office Carbon Copy)
                </button>
                <button
                  type="button"
                  onClick={() => setDischargeCopyType('office')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    dischargeCopyType === 'office'
                      ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  🏛️ Office Copy Only (Carbon Copy)
                </button>
                <button
                  type="button"
                  onClick={() => setDischargeCopyType('student')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    dischargeCopyType === 'student'
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  📜 Original Certificate Only
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENT PAPER PREVIEW CONTAINER */}
      <div id="printable-document-container" className="bg-slate-100 p-4 sm:p-8 rounded-2xl shadow-inner border border-slate-300 flex justify-center print:p-0 print:border-none print:shadow-none print:bg-white">
        
        {/* DISCHARGE CERTIFICATES (LADHU OR STANDARD FORMAT WITH CARBON / OFFICE COPY OPTIONS) */}
        {docType === 'discharge' && activeCandidate && (
          <div className="w-full space-y-6">
            {/* Helper function to render Ladhu Format */}
            {(() => {
              const renderLadhu = (isOfficeCopy: boolean) => (
                <div key={isOfficeCopy ? 'ladhu-office' : 'ladhu-student'} className="printable-discharge-page w-full max-w-[210mm] mx-auto bg-white p-4 sm:p-5 shadow-2xl text-slate-900 font-serif relative print:shadow-none print:p-0 print:max-w-none print:w-full my-2">
                  {/* Outer Green Border Frame */}
                  <div className="discharge-outer-frame border-2 border-emerald-900 p-1.5 sm:p-2 relative bg-white flex flex-col justify-between overflow-hidden">
                    {/* Inner Green Border Line */}
                    <div className="discharge-inner-frame border border-emerald-900 p-3 sm:p-4 relative space-y-2 print:space-y-1.5 flex-1 flex flex-col justify-between">

                      {/* Watermark in background */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5 overflow-hidden z-0">
                        <span className="text-7xl sm:text-8xl font-black font-serif text-emerald-950 uppercase tracking-widest rotate-[-15deg]">
                          GBHSS LADHU
                        </span>
                      </div>

                      {/* LIGHT CENTERED OFFICE COPY WATERMARK */}
                      {isOfficeCopy && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none z-0 opacity-15 rotate-[-12deg] w-full px-4">
                          <div className="inline-block border-4 border-dashed border-red-700 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl text-center space-y-1">
                            <div className="text-3xl sm:text-5xl font-black font-sans uppercase text-red-900 tracking-widest leading-none">
                              OFFICE COPY
                            </div>
                            <div className="text-[10px] sm:text-xs font-black font-sans uppercase text-red-800 tracking-wider">
                              CARBON COPY — FOR SCHOOL RECORD & ARCHIVE ONLY
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 relative z-10">
                        {/* Header Emblem & Title */}
                        <div className="text-center space-y-0.5 relative z-10">
                          <div className="w-10 h-10 rounded-full border-2 border-emerald-900 mx-auto flex items-center justify-center p-0.5 bg-emerald-50/50">
                            <div className="w-full h-full rounded-full border border-emerald-900 flex items-center justify-center">
                              <span className="text-emerald-900 font-bold text-[9px] font-serif">GBHSS</span>
                            </div>
                          </div>

                          <p className="text-[9px] font-serif tracking-[0.2em] text-slate-700 font-bold uppercase mt-0.5">
                            OFFICE OF THE PRINCIPAL
                          </p>
                          <h1 className="text-lg sm:text-xl font-black uppercase text-emerald-950 font-serif tracking-tight">
                            GOVT. BOYS HIGHER SECONDARY SCHOOL
                          </h1>
                          <p className="text-[11px] font-serif font-semibold text-emerald-900 tracking-wider">
                            LADHU PAMPORE, PULWAMA, KASHMIR
                          </p>

                          {/* Red Framed Title Box + Copy Badge */}
                          <div className="pt-0.5 flex flex-col items-center gap-1">
                            <div className="inline-block border border-amber-800/70 bg-amber-50/30 px-4 py-0.5 rounded shadow-sm">
                              <span className="text-red-900 font-serif font-extrabold text-xs sm:text-sm tracking-widest uppercase">
                                DISCHARGE CERTIFICATE
                              </span>
                            </div>
                            {isOfficeCopy && (
                              <span className="inline-block bg-red-800 text-white font-sans font-black text-[9px] uppercase px-3 py-0.5 rounded shadow-xs tracking-wider border border-red-900">
                                🏛️ OFFICE COPY (CARBON COPY)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* C. No. & Reg No., Admission No. & Date */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-serif relative z-10">
                          <div className="flex items-baseline">
                            <span className="font-bold text-slate-800 shrink-0">C. No.</span>
                            <span className="border-b border-stone-400 flex-1 ml-2 font-mono px-1.5 text-slate-900">{activeCandidate.id}</span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="font-bold text-slate-800 shrink-0">Reg. No.</span>
                            <span className="border-b border-stone-400 flex-1 ml-2 font-mono px-1.5 text-slate-900">{activeCandidate.enrolmentNumber || `REG-${activeCandidate.id}`}</span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="font-bold text-slate-800 shrink-0">Admission No.</span>
                            <span className="border-b border-stone-400 flex-1 ml-2 font-mono px-1.5 text-slate-900">{activeCandidate.bankChallanNo || activeCandidate.id}</span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="font-bold text-slate-800 shrink-0">Date of Issue</span>
                            <span className="border-b border-stone-400 flex-1 ml-2 font-mono px-1.5 text-slate-900">{new Date().toISOString().split('T')[0]}</span>
                          </div>
                        </div>

                        {/* Personal Details Boxes + Photograph Frame on Right Side */}
                        <div className="flex flex-row items-center justify-between gap-3 relative z-10">
                          <div className="flex-1 space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-24 font-semibold text-slate-800 shrink-0">Name</span>
                              <div className="flex-1 border border-stone-300 rounded py-0.5 px-2 bg-stone-50/50 font-bold text-slate-900 text-xs">
                                {activeCandidate.fullName}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="w-24 font-semibold text-slate-800 shrink-0">Father's Name</span>
                              <div className="flex-1 border border-stone-300 rounded py-0.5 px-2 bg-stone-50/50 font-bold text-slate-900 text-xs">
                                {activeCandidate.fatherName}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="w-24 font-semibold text-slate-800 shrink-0">Mother's Name</span>
                              <div className="flex-1 border border-stone-300 rounded py-0.5 px-2 bg-stone-50/50 font-bold text-slate-900 text-xs">
                                {activeCandidate.motherName || 'N/A'}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="w-24 font-semibold text-slate-800 shrink-0">D.O.B. (figures)</span>
                              <div className="flex-1 border border-stone-300 rounded py-0.5 px-2 bg-stone-50/50 font-bold text-slate-900 font-mono text-xs">
                                {activeCandidate.dob || '2005-06-14'}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="w-24 font-semibold text-slate-800 shrink-0">Permanent Address</span>
                              <div className="flex-1 border border-stone-300 rounded py-0.5 px-2 bg-stone-50/50 font-bold text-slate-900 text-xs truncate">
                                {activeCandidate.address || 'Ladhoo Pampore'}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="w-24 font-semibold text-slate-800 shrink-0">District</span>
                              <div className="flex-1 border border-stone-300 rounded py-0.5 px-2 bg-stone-50/50 font-bold text-slate-900 text-xs">
                                {activeCandidate.district || (activeCandidate.address?.toLowerCase().includes('pulwama') ? 'Pulwama' : 'Pulwama')}
                              </div>
                            </div>
                          </div>

                          {/* Photograph Box (Right Side of Candidate Data) */}
                          <div className="shrink-0 flex flex-col items-center pl-1">
                            <div className="w-24 h-28 border-2 border-emerald-900 rounded-sm bg-emerald-50/20 p-0.5 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden bg-white">
                              {activeCandidate.photoUrl ? (
                                <img src={activeCandidate.photoUrl} alt={activeCandidate.fullName} className="w-full h-full object-cover rounded-2xs" />
                              ) : (
                                <div className="p-1 space-y-0.5">
                                  <User className="w-5 h-5 text-emerald-900/40 mx-auto" />
                                  <span className="block text-[7px] font-sans font-extrabold text-emerald-950 uppercase tracking-tighter leading-tight">
                                    PASSPORT PHOTO
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-[8.5px] font-serif font-bold text-emerald-950 uppercase mt-0.5 tracking-wider">
                              APPLICANT PHOTO
                            </span>
                          </div>
                        </div>

                        {/* Certificate Text & Statements */}
                        <div className="space-y-1 text-xs leading-tight text-slate-900 relative z-10 font-serif">
                          <p className="flex flex-wrap items-baseline gap-1">
                            <span>The above mentioned candidate was reading in Class</span>
                            <span className="border-b border-stone-400 font-bold px-1.5 font-sans">{activeCandidate.courseApplied || '12th'}</span>
                            <span className="text-stone-400 line-through">Middle</span> /
                            <span className="text-stone-400 line-through">HS</span> /
                            <strong className="text-red-900 underline font-extrabold">HSS</strong>
                            <span>department up to</span>
                            <span className="border-b border-stone-400 font-bold px-1.5">{activeCandidate.session || '2025-2026'}</span>.
                          </p>

                          <p className="flex flex-wrap items-baseline gap-1">
                            <span>He appeared in Class</span>
                            <span className="border-b border-stone-400 font-bold px-1.5">{activeCandidate.courseApplied || '12th'}</span>
                            <span>examination under</span>
                            <span className="text-stone-400 line-through">Cluster</span> /
                            <span className="text-stone-400 line-through">School</span> /
                            <strong className="text-red-900 underline font-extrabold">Board</strong>
                            <span>Roll No.</span>
                            <span className="border-b border-stone-400 font-bold px-1.5 font-mono">{activeCandidate.assignedRollNumber || activeCandidate.id}</span>
                            <span>and was declared</span>
                            <strong className="text-red-900 underline font-extrabold">Pass</strong> /
                            <span className="text-stone-400 line-through">Fail</span> /
                            <span className="text-stone-400 line-through">Compartment</span>.
                          </p>

                          <p className="flex items-baseline gap-2">
                            <span>Session</span>
                            <span className="border-b border-stone-400 font-bold px-2">{activeCandidate.session || '2025-2026'}</span>
                            <span>— He has paid all the dues.</span>
                          </p>

                          <p className="flex items-baseline gap-2">
                            <span className="shrink-0">Character of Candidate:</span>
                            <strong className="font-bold text-slate-900 text-xs">{activeCandidate.conductRating || 'Very Good'}</strong>
                          </p>

                          <p className="flex items-baseline gap-2">
                            <span className="shrink-0">Games Offered:</span>
                            <span className="border-b border-stone-400 flex-1 font-bold px-1.5">Cricket, Football, Athletics</span>
                          </p>
                        </div>

                        {/* Marks Summary Box */}
                        <div className="border border-emerald-900 rounded p-1.5 bg-emerald-50/20 relative z-10 mt-1">
                          <div className="grid grid-cols-3 gap-1 text-center font-serif text-xs">
                            {(() => {
                              const docGrade = calculateGradeAndPercentage(activeCandidate.marksObtained || 450, activeCandidate.totalMarks || 500);
                              return (
                                <>
                                  <div>
                                    <span className="text-[8.5px] font-bold text-emerald-950 uppercase tracking-wider block mb-0.5">MARKS OBTAINED</span>
                                    <span className="font-bold text-emerald-950 text-xs font-mono">{activeCandidate.marksObtained || 450} / {activeCandidate.totalMarks || 500}</span>
                                  </div>

                                  <div className="border-x border-emerald-900/30 px-1">
                                    <span className="text-[8.5px] font-bold text-emerald-950 uppercase tracking-wider block mb-0.5">GRADE</span>
                                    <span className="font-bold text-slate-900 text-xs font-mono">{activeCandidate.grade || docGrade.grade}</span>
                                  </div>

                                  <div>
                                    <span className="text-[8.5px] font-bold text-emerald-950 uppercase tracking-wider block mb-0.5">% OF MARKS</span>
                                    <span className="font-bold text-slate-900 text-xs font-mono">
                                      {activeCandidate.percentage || docGrade.percentageFormatted}%
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Signatures & Seal */}
                      <div className="pt-4 sm:pt-5 grid grid-cols-4 gap-2 text-center text-xs font-serif font-bold text-slate-800 relative z-10">
                        <div className="space-y-2">
                          <div className="border-b border-stone-500 w-16 sm:w-20 mx-auto"></div>
                          <span className="text-[10px]">I/C</span>
                        </div>

                        <div className="space-y-2">
                          <div className="border-b border-stone-500 w-16 sm:w-20 mx-auto"></div>
                          <span className="text-[10px]">CHECKED BY</span>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                          <div className="w-10 h-10 rounded-full border border-dashed border-stone-400 flex items-center justify-center p-0.5 text-[7px] font-sans text-stone-400 text-center uppercase tracking-tighter leading-tight">
                            OFFICE SEAL
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="border-b border-stone-900 w-16 sm:w-24 mx-auto"></div>
                          <span className="font-black text-slate-900 text-[10px] uppercase">PRINCIPAL</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );

              const renderStandard = (isOfficeCopy: boolean) => (
                <div key={isOfficeCopy ? 'std-office' : 'std-student'} className="printable-discharge-page w-full max-w-[210mm] mx-auto bg-white p-4 sm:p-5 shadow-2xl rounded-sm border-2 border-amber-900/20 text-slate-900 font-serif relative print:shadow-none print:p-0 print:max-w-none print:w-full my-2">
                  {/* Ornamental Frame Border */}
                  <div className="discharge-outer-frame border-4 border-double border-amber-900/40 p-3 sm:p-4 relative flex flex-col justify-between overflow-hidden">
                    
                    {/* LIGHT CENTERED OFFICE COPY WATERMARK */}
                    {isOfficeCopy && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none z-0 opacity-15 rotate-[-12deg] w-full px-4">
                        <div className="inline-block border-4 border-dashed border-red-700 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl text-center space-y-1">
                          <div className="text-3xl sm:text-5xl font-black font-sans uppercase text-red-900 tracking-widest leading-none">
                            OFFICE COPY
                          </div>
                          <div className="text-[10px] sm:text-xs font-black font-sans uppercase text-red-800 tracking-wider">
                            CARBON COPY — FOR SCHOOL RECORD & ARCHIVE ONLY
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 relative z-10">
                      {/* Header */}
                      <div className="text-center space-y-0.5 border-b-2 border-amber-900/30 pb-2">
                        <p className="text-[10px] sm:text-xs font-sans font-bold text-amber-900 uppercase tracking-widest">Govt. Boys Higher Secondary School</p>
                        <h1 className="text-lg sm:text-xl font-black uppercase text-amber-950 font-serif">OFFICE OF THE PRINCIPAL</h1>
                        <p className="text-[11px] font-sans text-slate-600">Ladhoo Pampore, Pulwama, J&K</p>
                        <div className="mt-1 flex flex-col items-center gap-1">
                          <div className="inline-block bg-amber-900 text-white px-3 py-0.5 text-xs font-sans font-extrabold uppercase tracking-widest rounded-sm">
                            DISCHARGE / TRANSFER CERTIFICATE
                          </div>
                          {isOfficeCopy && (
                            <span className="inline-block bg-red-800 text-white font-sans font-black text-[9px] uppercase px-3 py-0.5 rounded shadow-xs tracking-wider border border-red-900">
                              🏛️ OFFICE COPY (CARBON COPY)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Certificate Meta Bar + Photograph Box */}
                      <div className="flex flex-row items-center justify-between gap-3 border-b border-dashed border-amber-900/30 pb-2">
                        <div className="space-y-1 text-xs font-sans font-bold text-slate-700 flex-1">
                          <div>Cert No: <span className="font-mono text-amber-900">DC-{activeCandidate.id.replace('ADM-', '')}-2026</span></div>
                          <div>Admission / Roll No: <span className="font-mono text-slate-900">{activeCandidate.assignedRollNumber || activeCandidate.id}</span></div>
                          <div>Date of Issue: <span className="font-mono text-slate-900">{new Date().toISOString().split('T')[0]}</span></div>
                        </div>

                        {/* Applicant Photograph Frame (Right Side) */}
                        <div className="shrink-0 flex flex-col items-center">
                          <div className="w-24 h-28 border-2 border-amber-900/60 rounded bg-amber-50/40 p-0.5 flex flex-col items-center justify-center shadow-sm text-center relative overflow-hidden bg-white">
                            {activeCandidate.photoUrl ? (
                              <img src={activeCandidate.photoUrl} alt={activeCandidate.fullName} className="w-full h-full object-cover rounded-2xs" />
                            ) : (
                              <div className="p-1 space-y-0.5">
                                <User className="w-6 h-6 text-amber-900/40 mx-auto" />
                                <span className="block text-[7px] font-sans font-bold text-amber-900/80 uppercase tracking-tight">AFFIX PASSPORT PHOTO</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[8.5px] font-sans font-extrabold text-amber-950 uppercase mt-0.5 tracking-wider">APPLICANT PHOTO</span>
                        </div>
                      </div>

                      {/* Body Text */}
                      <div className="text-xs sm:text-sm leading-relaxed text-slate-800 space-y-2.5 font-serif text-justify pt-0.5">
                        <p>
                          This is to certify that <span className="font-extrabold text-slate-950 underline underline-offset-4 decoration-amber-900/40">{activeCandidate.fullName}</span>, 
                          Son/Daughter of Shri <span className="font-bold text-slate-950 underline underline-offset-4 decoration-amber-900/40">{activeCandidate.fatherName}</span> 
                          and Smt. <span className="font-bold text-slate-950 underline underline-offset-4 decoration-amber-900/40">{activeCandidate.motherName || 'N/A'}</span>, 
                          resident of <span className="font-bold text-slate-950 underline underline-offset-4 decoration-amber-900/40">{activeCandidate.address || 'Ladhoo Pampore'}</span>, 
                          District <span className="font-bold text-slate-950 underline underline-offset-4 decoration-amber-900/40">{activeCandidate.district || 'Pulwama'}</span>, 
                          bearing Assigned Roll Number <span className="font-mono font-bold text-slate-950">{activeCandidate.assignedRollNumber || '26BSC101'}</span> 
                          and Enrolment Number <span className="font-mono font-bold text-slate-950">{activeCandidate.enrolmentNumber || 'EN202600101'}</span>, 
                          was a bona fide student of this Institution in the <span className="font-bold text-slate-950">{activeCandidate.courseApplied}</span> program during the session <span className="font-bold">{activeCandidate.session}</span>.
                        </p>

                        <p>
                          He/She has cleared all school dues including Tuition Fees, Library Deposits, and Laboratory equipment. 
                          His/Her general conduct and moral character during his/her stay in this institution has been 
                          <span className="font-bold text-amber-900"> {activeCandidate.conductRating || 'EXCELLENT'}</span>.
                        </p>

                        <p>
                          <strong className="font-sans text-xs uppercase tracking-wide text-slate-600 block">Reason for Discharge / Leaving:</strong>
                          <span className="font-medium italic text-slate-900">{activeCandidate.dcReason || 'Completion of prescribed academic course of study / Higher Studies.'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Signatures & Security QR Code */}
                    <div className="pt-4 flex items-end justify-between border-t border-slate-300 font-sans relative z-10">
                      {qrUrl && (
                        <div className="text-center">
                          <img src={qrUrl} alt="Security QR" className="w-16 h-16 border border-slate-300 p-0.5 mx-auto" />
                          <p className="text-[8px] font-mono font-bold text-slate-600 mt-0.5">Scan to Verify Record</p>
                        </div>
                      )}

                      <div className="text-center space-y-1">
                        <div className="h-6 border-b border-slate-400 w-28 mx-auto"></div>
                        <p className="text-[10px] font-bold text-slate-900">Head Clerk / Academic Cell</p>
                      </div>

                      <div className="text-center space-y-1">
                        <div className="h-6 border-b border-slate-800 w-36 mx-auto flex items-center justify-center">
                          <span className="text-[10px] font-serif italic text-amber-900 font-bold opacity-80">[ Principal Seal & Signature ]</span>
                        </div>
                        <p className="text-[11px] font-extrabold text-slate-900 uppercase">Principal</p>
                        <p className="text-[9px] text-slate-500">Govt. Boys HSS Ladhu, Pampore</p>
                      </div>
                    </div>
                  </div>
                </div>
              );

              const renderDoc = (isOfficeCopy: boolean) => 
                dcFormat === 'ladhu' ? renderLadhu(isOfficeCopy) : renderStandard(isOfficeCopy);

              return (
                <div className="w-full space-y-6">
                  {/* Student Copy (Original) */}
                  {(dischargeCopyType === 'both' || dischargeCopyType === 'student') && renderDoc(false)}

                  {/* Cut / Tear Divider Line on screen when displaying both copies */}
                  {dischargeCopyType === 'both' && (
                    <div className="my-6 border-t-2 border-dashed border-stone-400 relative text-center print:hidden">
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-stone-200 text-stone-700 font-mono text-[10px] font-bold px-3 py-0.5 rounded-full border border-stone-300 flex items-center gap-1.5 shadow-xs">
                        ✂ TEAR / CUT HERE (ORIGINAL CERTIFICATE ABOVE — OFFICE CARBON COPY BELOW)
                      </span>
                    </div>
                  )}

                  {/* Custom Office Copy (Carbon Copy) */}
                  {(dischargeCopyType === 'both' || dischargeCopyType === 'office') && (
                    <div className={dischargeCopyType === 'both' ? 'print-page-break' : ''}>
                      {renderDoc(true)}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* DOCUMENT 2: CHARACTER CERTIFICATE */}
        {docType === 'character' && (
          <div className="w-full max-w-3xl bg-white p-8 sm:p-12 shadow-2xl rounded-sm border-2 border-indigo-900/20 text-slate-900 font-serif relative print:shadow-none print:p-6 print:max-w-none">
            <div className="border-4 border-indigo-900/30 p-6 sm:p-8 space-y-6">
              
              <div className="text-center space-y-1.5 border-b-2 border-indigo-900/30 pb-4">
                <p className="text-xs font-sans font-bold text-indigo-900 uppercase tracking-widest">Govt. Boys Higher Secondary School Ladhu</p>
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-indigo-950 font-serif">CHARACTER & CONDUCT CERTIFICATE</h1>
                <p className="text-xs font-sans text-slate-600">Issued under Academic Regulations</p>
              </div>

              <div className="flex justify-between text-xs font-sans font-bold text-slate-700">
                <div>Ref No: <span className="font-mono text-indigo-900">CC-2026/{activeCandidate.id}</span></div>
                <div>Date: <span className="font-mono">{new Date().toISOString().split('T')[0]}</span></div>
              </div>

              <div className="text-sm sm:text-base leading-relaxed text-slate-800 space-y-4 text-justify pt-2 font-serif">
                <p>
                  This is to certify that <span className="font-extrabold text-slate-950 underline underline-offset-4 decoration-indigo-900/40">{activeCandidate.fullName}</span>, 
                  Son/Daughter of <span className="font-bold text-slate-950 underline underline-offset-4 decoration-indigo-900/40">{activeCandidate.fatherName}</span>, 
                  resident of <span className="font-bold text-slate-950 underline underline-offset-4 decoration-indigo-900/40">{activeCandidate.address || 'Ladhoo Pampore'}</span>, 
                  District <span className="font-bold text-slate-950 underline underline-offset-4 decoration-indigo-900/40">{activeCandidate.district || 'Pulwama'}</span>, 
                  is/was a regular student of <span className="font-bold text-indigo-950">{activeCandidate.courseApplied}</span> in this school during the session <span className="font-bold">{activeCandidate.session}</span>.
                </p>

                <p>
                  To the best of my knowledge and belief, he/she bears an <span className="font-bold text-indigo-900 uppercase">{activeCandidate.conductRating || 'EXEMPLARY'}</span> moral character 
                  and has not been involved in any act of indiscipline, ragging, or misconduct during his/her academic tenure.
                </p>

                <p>We wish him/her all success in future endeavors and career goals.</p>
              </div>

              <div className="pt-12 flex items-end justify-between border-t border-slate-300 font-sans">
                {qrUrl && (
                  <div className="text-center">
                    <img src={qrUrl} alt="Security QR" className="w-20 h-20 border border-slate-300 p-1 mx-auto" />
                    <p className="text-[8px] font-mono text-slate-500 mt-0.5">Authenticity QR Code</p>
                  </div>
                )}

                <div className="text-center space-y-1">
                  <div className="h-10 border-b border-slate-800 w-48 mx-auto flex items-center justify-center">
                    <span className="text-xs font-serif italic text-indigo-900 font-bold opacity-80">[ Official Seal ]</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 uppercase">PRINCIPAL</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENT 3: PROVISIONAL CERTIFICATE */}
        {docType === 'provisional' && (
          <div className="w-full max-w-3xl bg-white p-8 sm:p-12 shadow-2xl rounded-sm border-2 border-blue-900/20 text-slate-900 font-serif relative print:shadow-none print:p-6 print:max-w-none">
            <div className="border-4 border-double border-blue-900/40 p-6 sm:p-8 space-y-6">
              
              <div className="text-center space-y-1.5 border-b-2 border-blue-900/30 pb-4">
                <p className="text-xs font-sans font-bold text-blue-900 uppercase tracking-widest">Central Examination Board</p>
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-blue-950 font-serif">PROVISIONAL PASS CERTIFICATE</h1>
                <p className="text-xs font-sans text-slate-600">Pending Degree Convocation Award</p>
              </div>

              <div className="flex justify-between text-xs font-sans font-bold text-slate-700">
                <div>Provisional Cert No: <span className="font-mono text-blue-900">PROV-{activeCandidate.id}-2026</span></div>
                <div>Issue Date: <span className="font-mono">{new Date().toISOString().split('T')[0]}</span></div>
              </div>

              <div className="text-sm sm:text-base leading-relaxed text-slate-800 space-y-4 text-justify pt-2 font-serif">
                <p>
                  This is to provisionally certify that <span className="font-extrabold text-slate-950 underline underline-offset-4 decoration-blue-900/40">{activeCandidate.fullName}</span>, 
                  Roll Number <span className="font-mono font-bold">{activeCandidate.assignedRollNumber || '26BSC101'}</span>, 
                  Enrolment Number <span className="font-mono font-bold">{activeCandidate.enrolmentNumber || 'EN202600101'}</span>, 
                  has successfully passed the examination for the degree of <span className="font-bold text-blue-950">{activeCandidate.courseApplied}</span> held in the year <span className="font-bold">{activeCandidate.passingYear || '2026'}</span>.
                </p>

                <div className="bg-blue-50/80 p-4 border border-blue-200 rounded text-xs font-sans space-y-1">
                  {(() => {
                    const docGrade = calculateGradeAndPercentage(activeCandidate.marksObtained || 450, activeCandidate.totalMarks || 500);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Marks Secured:</span>
                          <span className="font-bold font-mono text-slate-900">{activeCandidate.marksObtained} / {activeCandidate.totalMarks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Percentage Obtained:</span>
                          <span className="font-bold font-mono text-blue-900">{activeCandidate.percentage || docGrade.percentageFormatted}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Division / Grade:</span>
                          <span className="font-bold text-emerald-800">
                            GRADE {activeCandidate.grade || docGrade.grade} ({activeCandidate.division || docGrade.division})
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-10 flex items-end justify-between border-t border-slate-300 font-sans">
                {qrUrl && (
                  <div className="text-center">
                    <img src={qrUrl} alt="Security QR" className="w-20 h-20 border border-slate-300 p-1 mx-auto" />
                  </div>
                )}

                <div className="text-center space-y-1">
                  <p className="text-xs font-extrabold text-slate-900 uppercase">Controller of Examinations</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENT 4: LIBRARY APPLICATION FORM & PASS */}
        {docType === 'library' && (
          <div id="printable-library-card" className="w-full max-w-3xl bg-white p-8 shadow-2xl rounded-sm border-2 border-emerald-900/20 text-slate-900 font-sans space-y-6 print:shadow-none print:p-4 print:max-w-none">
            {/* Header */}
            <div className="text-center border-b-2 border-emerald-800 pb-3">
              <h2 className="text-xl font-black text-emerald-950 uppercase tracking-wide">
                CENTRAL LIBRARY MEMBERSHIP FORM & READER PASS
              </h2>
              <p className="text-xs font-bold text-slate-700">Govt. Boys Higher Secondary School Ladhoo Pampore (Pulwama J&K)</p>
              <p className="text-[11px] font-mono text-emerald-800 font-semibold mt-0.5">
                Session: 2026-2027 • Library Card No: <strong className="text-slate-900">LIB-2026-{activeCandidate.id.replace('ADM-', '')}</strong>
              </p>
            </div>

            {/* Official Member Reader Pass Box (Pocket-size style outline) */}
            <div className="relative">
              <div className="text-[10px] font-mono font-bold text-slate-500 mb-1 flex items-center justify-between">
                <span>✂ OFFICIAL POCKET READER PASS (Cut Along Border)</span>
                <span>Issue Date: {new Date().toISOString().split('T')[0]}</span>
              </div>
              <div className="library-pass-card bg-emerald-50/90 border-2 border-emerald-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-24 bg-slate-200 border-2 border-slate-600 rounded flex items-center justify-center font-bold text-xs text-slate-500 overflow-hidden shrink-0 shadow-sm">
                    {activeCandidate.photoUrl ? (
                      <img src={activeCandidate.photoUrl} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      'PASTE PHOTO'
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-extrabold text-[10px] uppercase tracking-wider inline-block">
                      LIBRARY READER PASS
                    </span>
                    <h3 className="text-base font-black text-slate-950 uppercase tracking-wide">{activeCandidate.fullName}</h3>
                    <p className="text-slate-800 font-bold">
                      Class / Stream: <strong className="text-emerald-900">{activeCandidate.courseApplied}</strong>
                    </p>
                    <p className="text-slate-800">
                      Father Name: <span className="font-semibold">{activeCandidate.fatherName}</span>
                    </p>
                    <p className="text-slate-800">
                      Roll No: <span className="font-mono font-bold text-blue-900">{activeCandidate.assignedRollNumber || activeCandidate.id}</span> • Gender: <span className="font-bold">{activeCandidate.gender || 'Male'}</span>
                    </p>
                    <p className="text-slate-700 text-[11px]">
                      Valid Academic Session: <span className="font-mono font-bold text-emerald-900">2026 – 2028</span>
                    </p>
                  </div>
                </div>

                {qrUrl && (
                  <div className="text-center shrink-0 border-l border-emerald-300 pl-4 sm:pl-0 sm:border-l-0">
                    <img src={qrUrl} alt="Library Barcode QR" className="w-20 h-20 bg-white p-1 border-2 border-emerald-600 rounded shadow-sm mx-auto" />
                    <span className="text-[9px] font-mono font-bold text-emerald-950 block mt-1">LIBRARY QR CODE</span>
                  </div>
                )}
              </div>
            </div>

            {/* Book Issuance & Borrowing Ledger Grid */}
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center justify-between">
                <span>Book Issue & Return Ledger</span>
                <span className="text-[10px] text-slate-500 font-normal font-mono">(To be filled by Librarian)</span>
              </h4>
              <table className="w-full border-2 border-slate-900 text-[10px] text-center divide-y divide-slate-300">
                <thead className="bg-slate-100 font-bold text-slate-800 uppercase">
                  <tr className="divide-x divide-slate-300">
                    <th className="py-1.5 px-2">S.No</th>
                    <th className="py-1.5 px-2">Book Title & Accession No.</th>
                    <th className="py-1.5 px-2">Issue Date</th>
                    <th className="py-1.5 px-2">Due Date</th>
                    <th className="py-1.5 px-2">Return Date</th>
                    <th className="py-1.5 px-2">Librarian Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[1, 2, 3, 4].map((num) => (
                    <tr key={num} className="divide-x divide-slate-200 h-7">
                      <td className="font-mono font-bold">{num}</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Library Rules */}
            <div className="space-y-1.5 text-[11px] text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-300">
              <h4 className="font-bold text-slate-900 text-xs uppercase">Library Rules & Conduct:</h4>
              <ul className="list-disc pl-5 space-y-0.5 text-[10.5px]">
                <li>Maximum 2 books issued at a time for a period of 14 days.</li>
                <li>Books lost or damaged must be replaced with the latest edition or paid for at full market cost.</li>
                <li>This pass is strictly non-transferable and must be presented for book borrowing and library entry.</li>
              </ul>
            </div>

            <div className="pt-6 flex justify-between items-end border-t border-slate-400 text-xs font-bold">
              <div>
                <p className="border-t border-slate-600 pt-1 w-36 text-center text-slate-800">Student Signature</p>
              </div>
              <div className="text-center">
                <p className="border-t border-slate-900 pt-1 w-44 text-center text-emerald-950 uppercase font-black">
                  Librarian Signature & Seal
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENT 5: BANK FEE DEPOSITION SLIP (A4 3-COPY CHALLAN) */}
        {docType === 'bank-slip' && (
          <div className="w-full">
            <PrintableBankSlipA4 candidate={activeCandidate} />
          </div>
        )}

        {/* DOCUMENT 6: HOSTEL ALLOCATION FORM */}
        {docType === 'hostel' && (
          <div className="w-full max-w-3xl bg-white p-8 sm:p-12 shadow-2xl rounded-sm border-2 border-amber-900/20 text-slate-900 font-sans space-y-6 print:shadow-none print:p-6 print:max-w-none">
            <div className="text-center border-b-2 border-amber-800 pb-3">
              <h2 className="text-2xl font-black text-amber-950 uppercase">HOSTEL ACCOMMODATION ALLOCATION CARD</h2>
              <p className="text-xs text-slate-600">Office of the Chief Warden & Resident Welfare Board</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-amber-50 p-4 rounded-xl border border-amber-200">
              <div><span className="text-slate-500 block">Resident Student:</span> <span className="font-bold text-slate-900 text-sm">{activeCandidate.fullName}</span></div>
              <div><span className="text-slate-500 block">Father Name:</span> <span className="font-bold text-slate-800">{activeCandidate.fatherName}</span></div>
              <div><span className="text-slate-500 block">Course & Roll No:</span> <span className="font-semibold text-amber-900">{activeCandidate.courseApplied} ({activeCandidate.assignedRollNumber || activeCandidate.id})</span></div>
              <div><span className="text-slate-500 block">Assigned Hostel:</span> <span className="font-bold text-amber-900">Block A - Room #204</span></div>
            </div>

            <div className="pt-8 flex justify-between items-end border-t border-slate-300 text-xs font-bold">
              <div>
                <p className="border-t border-slate-400 pt-1 w-36 text-center">Student Signature</p>
              </div>
              {qrUrl && <img src={qrUrl} alt="QR" className="w-16 h-16 border p-1" />}
              <div>
                <p className="border-t border-slate-900 pt-1 w-44 text-center text-amber-950">Warden Signature & Seal</p>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENT 7: SCHOLARSHIP CERTIFICATE */}
        {docType === 'scholarship' && (
          <div className="w-full max-w-3xl bg-white p-8 sm:p-12 shadow-2xl rounded-sm border-2 border-purple-900/20 text-slate-900 font-serif space-y-6 print:shadow-none print:p-6 print:max-w-none">
            <div className="text-center border-b-2 border-purple-900 pb-3">
              <h2 className="text-2xl font-black text-purple-950 uppercase">MERIT SCHOLARSHIP GRANT CERTIFICATE</h2>
              <p className="text-xs font-sans text-slate-600">Institutional Merit & Financial Concession Scheme</p>
            </div>

            <div className="text-sm leading-relaxed text-slate-800 space-y-3 font-serif">
              <p>
                This is to certify that <strong className="text-slate-950">{activeCandidate.fullName}</strong>, student of <strong className="text-purple-900">{activeCandidate.courseApplied}</strong>, category <strong>{activeCandidate.category}</strong>, has been awarded the <strong className="text-purple-900">Academic Concession & Merit Scholarship</strong> for the session {activeCandidate.session}.
              </p>
            </div>

            <div className="pt-8 flex justify-between items-end border-t border-slate-300 text-xs font-sans font-bold">
              <div>
                <p className="border-t border-slate-400 pt-1 w-36 text-center">Scholarship Officer</p>
              </div>
              {qrUrl && <img src={qrUrl} alt="QR" className="w-16 h-16 border p-1" />}
              <div>
                <p className="border-t border-slate-900 pt-1 w-44 text-center text-purple-950">Dean Student Welfare</p>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENT 8: BONAFIDE & NOC CERTIFICATE */}
        {docType === 'bonafide' && (
          <div className="w-full max-w-3xl bg-white p-8 sm:p-12 shadow-2xl rounded-sm border-2 border-sky-900/20 text-slate-900 font-serif space-y-6 print:shadow-none print:p-6 print:max-w-none">
            <div className="text-center border-b-2 border-sky-900 pb-3">
              <h2 className="text-2xl font-black text-sky-950 uppercase">BONAFIDE STUDENT CERTIFICATE</h2>
              <p className="text-xs font-sans text-slate-600">Office of Academic Registrar</p>
            </div>

            <div className="text-sm sm:text-base leading-relaxed text-slate-800 space-y-4 font-serif text-justify">
              <p>
                This is to certify that <strong className="text-slate-950 underline">{activeCandidate.fullName}</strong>, Son/Daughter of <strong className="text-slate-950">{activeCandidate.fatherName}</strong>, resident of <strong className="text-slate-950 underline">{activeCandidate.address || 'Ladhoo Pampore'}</strong>, District <strong className="text-slate-950 underline">{activeCandidate.district || 'Pulwama'}</strong>, is a bona fide regular student of this school studying in <strong className="text-sky-950">{activeCandidate.courseApplied}</strong> program (Roll No: <span className="font-mono">{activeCandidate.assignedRollNumber || activeCandidate.id}</span>).
              </p>
              <p>
                This certificate is issued upon student request for Official / Educational / Passport / Bank / Scholarship verification purposes.
              </p>
            </div>

            <div className="pt-10 flex justify-between items-end border-t border-slate-300 text-xs font-sans font-bold">
              <div>
                <p className="border-t border-slate-400 pt-1 w-36 text-center">Academic Registrar</p>
              </div>
              {qrUrl && <img src={qrUrl} alt="QR" className="w-16 h-16 border p-1" />}
              <div>
                <p className="border-t border-slate-900 pt-1 w-44 text-center text-sky-950">Principal & Seal</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
