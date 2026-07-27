import React, { useState, useEffect, useRef } from 'react';
import { Candidate, UserRole } from '../types';
import { submitAdmissionForm, deleteCandidateRecord } from '../utils/api';
import { calculateCourseFees } from '../utils/feeCalculator';
import { generateQRCodeDataUrl, buildCandidateQRPayload } from '../utils/qr';
import { calculateGradeAndPercentage } from '../utils/grade';
import { triggerPrint } from '../utils/print';
import { compressPhotoUnder50KB, getPhotoSizeKB } from '../utils/imageUtils';
import { CameraCaptureModal } from './CameraCaptureModal';
import { PrintableAdmissionForm } from './PrintableAdmissionForm';
import { PrintableBankSlipA4 } from './PrintableBankSlipA4';
import { 
  UserPlus, 
  CheckCircle2, 
  QrCode, 
  Printer, 
  ArrowRight, 
  IndianRupee, 
  CreditCard,
  FileText,
  AlertCircle,
  Building2,
  BookOpen,
  Camera,
  Upload,
  Image as ImageIcon,
  Check,
  Award,
  TrendingUp,
  Percent,
  X,
  Trash2,
  RotateCcw,
  Send
} from 'lucide-react';

interface ApplyAdmissionProps {
  onSuccessSubmitted: (newCandidate: Candidate) => void;
  onOpenDocuments?: (candidate: Candidate, docType: string) => void;
  userRole?: UserRole;
}

export const ApplyAdmission: React.FC<ApplyAdmissionProps> = ({ onSuccessSubmitted, onOpenDocuments, userRole = 'incharge' }) => {
  const [formData, setFormData] = useState({
    admNo: 'ADM-2026-102',
    classWishToJoin: '11th Class',
    session: '2026-2027',
    boardRegNo: '',
    aadharNumber: '',
    bankAccountNo: '',
    fullName: '',
    fatherName: '',
    motherName: '',
    address: '',
    fatherOccupation: 'Government Service',
    bloodGroup: 'O+',
    height: "5'6\"",
    penNumber: 'PEN-2026-8901',
    rationCardDetail: 'APL',
    socialCategory: 'General',
    parentContactNo: '',
    mobile: '',
    email: '',
    dob: '2010-05-15',
    gender: 'Male',
    category: 'General',
    hasDisability: 'NO',
    disabilityType: '',
    previousQualification: 'Matriculation (10th Class Passed)',
    boardUniversity: 'JKBOSE (J&K Board of School Education)',
    prevRollNumber: '',
    passingYear: '2025',
    marksObtained: '',
    totalMarks: '500',
    courseApplied: 'Science Stream (Medical: Physics, Chemistry, Biology)',
    majorSubjects: 'Physics, Chemistry, Biology, General English',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [submittedCandidate, setSubmittedCandidate] = useState<Candidate | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [activePreviewDoc, setActivePreviewDoc] = useState<'form' | 'bank-slip' | 'library' | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMsg('');
      try {
        const compressed = await compressPhotoUnder50KB(file);
        setFormData((prev) => ({ ...prev, photoUrl: compressed.dataUrl }));
      } catch (err: any) {
        setErrorMsg(err.message || 'Selected photo could not be compressed under 50KB limit.');
      }
    }
  };

  // Calculate live fee breakdown based on course, category, and gender
  const fees = calculateCourseFees(formData.courseApplied, formData.category, formData.gender);

  // Autocalculate Percentage, Grade & Standing Division
  const gradeInfo = calculateGradeAndPercentage(formData.marksObtained, formData.totalMarks);
  const percentage = gradeInfo.percentageFormatted;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'classWishToJoin') {
      const is9thOr10th = value === '9th Class' || value === '10th Class';
      if (is9thOr10th) {
        setFormData({
          ...formData,
          classWishToJoin: value,
          courseApplied: `Secondary (${value})`,
          majorSubjects: 'General English, Mathematics, Science, Social Science, Urdu, IT & ITES',
        });
      } else {
        setFormData({
          ...formData,
          classWishToJoin: value,
          courseApplied: 'Science Stream',
          majorSubjects: 'General English, Physics, Chemistry, Biology',
        });
      }
      return;
    }

    if (name === 'courseApplied') {
      let subjects = 'General English';
      if (value.includes('Science')) {
        subjects = 'General English, Physics, Chemistry, Biology';
      } else if (value.includes('Humanities') || value.includes('Arts')) {
        subjects = 'General English, Education, Economics, Political Science, History';
      } else if (value.includes('Vocational')) {
        subjects = 'General English, IT & ITES';
      }
      setFormData({ ...formData, courseApplied: value, majorSubjects: subjects });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName || !formData.fatherName || !formData.parentContactNo) {
      setErrorMsg('Please complete all required fields (Candidate Name, Father Name, Parent Contact No.).');
      return;
    }

    if (!formData.marksObtained || Number(formData.marksObtained) > Number(formData.totalMarks)) {
      setErrorMsg('Please enter valid Marks Obtained and Total Marks.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        mobile: formData.parentContactNo || formData.mobile,
        email: formData.email || `${formData.fullName.toLowerCase().replace(/\s+/g, '')}@student.bhssladhoo.edu.in`,
        marksObtained: Number(formData.marksObtained),
        totalMarks: Number(formData.totalMarks),
        percentage: Number(gradeInfo.percentageFormatted),
        grade: gradeInfo.grade,
        division: gradeInfo.division,
        feeAmount: fees.totalFee,
        parentContactNo: formData.parentContactNo || formData.mobile,
        socialCategory: formData.socialCategory || formData.category,
      };

      const result = await submitAdmissionForm(payload);
      setSubmittedCandidate(result);

      // Generate QR Code data URL for receipt
      const qrPayload = buildCandidateQRPayload(result.id, result.fullName, result.courseApplied);
      const url = await generateQRCodeDataUrl(qrPayload);
      setQrCodeUrl(url);

      if (userRole === 'student') {
        setActivePreviewDoc(null);
      } else {
        setActivePreviewDoc('form');
      }
      onSuccessSubmitted(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit admission application.');
    } finally {
      setLoading(false);
    }
  };

  if (submittedCandidate) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 print:p-0 print:max-w-none">
        {activePreviewDoc && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-sm p-3 sm:p-6 flex flex-col items-center justify-start print:p-0 print:static print:bg-transparent print:block print:overflow-visible print:w-full print:h-auto">
            <div className="w-full max-w-5xl my-2 sm:my-6 print:my-0 print:max-w-none print:w-full space-y-4">
              {/* Top Navigation & Document Selection Bar */}
              <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl border border-slate-800 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-white">Application Documents for {submittedCandidate.fullName}</h3>
                    <p className="text-[10px] text-slate-400">Application ID: <strong className="text-emerald-400 font-mono">{submittedCandidate.id}</strong></p>
                  </div>
                </div>

                {/* Tab Switcher Bar */}
                <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700 w-full sm:w-auto overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActivePreviewDoc('form')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      activePreviewDoc === 'form'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-200" />
                    1. Official Admission Form
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePreviewDoc('bank-slip')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      activePreviewDoc === 'bank-slip'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-200" />
                    2. 3-Copy Bank Fee Slip
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePreviewDoc('library')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      activePreviewDoc === 'library'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
                    3. Library Pass Form
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePreviewDoc(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Close Preview
                </button>
              </div>

              {/* Document Component Views */}
              {activePreviewDoc === 'form' && (
                <PrintableAdmissionForm
                  candidate={submittedCandidate}
                  qrCodeUrl={qrCodeUrl}
                  onClose={() => setActivePreviewDoc(null)}
                />
              )}

              {activePreviewDoc === 'bank-slip' && (
                <PrintableBankSlipA4
                  candidate={submittedCandidate}
                  onClose={() => setActivePreviewDoc(null)}
                />
              )}

              {activePreviewDoc === 'library' && (
                <div id="printable-library-card" className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-300 max-w-4xl mx-auto text-slate-900 font-sans space-y-6">
                  <div className="flex items-center justify-between bg-indigo-950 text-white p-4 rounded-xl print:hidden">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-300" />
                      Central Library Membership Form & Pass
                    </h4>
                    <button
                      type="button"
                      onClick={() => triggerPrint('printable-library-card')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Print Library Form
                    </button>
                  </div>

                  <div className="border-2 border-slate-800 p-6 space-y-4">
                    <div className="text-center border-b-2 border-slate-800 pb-3">
                      <h2 className="text-xl font-black uppercase text-slate-900">CENTRAL LIBRARY MEMBERSHIP FORM & READER PASS</h2>
                      <p className="text-xs font-bold text-slate-700">Govt. Boys Higher Secondary School Ladhoo Pampore (Pulwama J&K)</p>
                      <p className="text-xs font-mono text-emerald-800 font-bold mt-1">
                        Session: {submittedCandidate.session} • Library Card No: LIB-2026-{submittedCandidate.id.replace('ADM-', '')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-serif pt-2">
                      <div><strong>Applicant Name:</strong> {submittedCandidate.fullName}</div>
                      <div><strong>Father Name:</strong> {submittedCandidate.fatherName}</div>
                      <div><strong>Class / Stream:</strong> {submittedCandidate.courseApplied}</div>
                      <div><strong>Session:</strong> {submittedCandidate.session}</div>
                      <div><strong>Contact No:</strong> {submittedCandidate.mobile}</div>
                      <div><strong>Bank Fee Challan No:</strong> {submittedCandidate.bankChallanNo || submittedCandidate.id}</div>
                    </div>

                    <div className="pt-8 flex justify-between items-end border-t border-slate-300 text-xs">
                      <div className="text-center">
                        <div className="h-10 border-b border-slate-400 w-36"></div>
                        <span className="text-[10px] uppercase font-bold text-slate-600 mt-1 block">Librarian Signature</span>
                      </div>
                      <div className="text-center">
                        <div className="h-10 border-b border-slate-800 w-40 flex items-center justify-center font-bold italic text-slate-700 text-xs">
                          [ School Seal ]
                        </div>
                        <span className="text-[10px] uppercase font-extrabold text-slate-900 mt-1 block">Principal / Admission Cell</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden ${activePreviewDoc ? 'print:hidden' : ''}`}>
          {/* Top Success Alert Toast Banner */}
          <div className="bg-emerald-900 text-emerald-100 px-6 py-3.5 border-b border-emerald-800 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span>🎉 <strong>Form Submitted Successfully!</strong> Your record has been saved into the official school database.</span>
            </div>
            <span className="font-mono text-xs bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded font-bold shrink-0">
              ID: {submittedCandidate.id}
            </span>
          </div>

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-emerald-300" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-200 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
                  BOYS HIGHER SECONDARY SCHOOL LADHOO PAMPORE
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-1.5 text-white tracking-tight">Admission Form Submitted Successfully!</h2>
                <p className="text-emerald-100 text-sm mt-1 flex flex-wrap items-center gap-2">
                  <span>Application Reference ID:</span>
                  <span className="font-mono font-bold text-white bg-emerald-900/80 border border-emerald-400/40 px-2.5 py-0.5 rounded text-sm">{submittedCandidate.id}</span>
                </p>
              </div>
            </div>

            {qrCodeUrl && (
              <div className="bg-white p-2.5 rounded-2xl shadow-xl text-center flex flex-col items-center shrink-0 border border-emerald-100">
                <img src={qrCodeUrl} alt="Application QR Code" className="w-28 h-28 object-contain rounded-lg" />
                <span className="text-[10px] font-mono text-slate-600 font-bold mt-1">Scan to Verify Record</span>
              </div>
            )}
          </div>

          {/* Submitted Summary Details */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 rounded-xl p-5 border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 font-medium">Candidate Name</span>
                <p className="text-base font-bold text-slate-900">{submittedCandidate.fullName}</p>
                <p className="text-xs text-slate-600">S/O {submittedCandidate.fatherName}</p>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium">Class / Academic Stream</span>
                <p className="text-base font-bold text-blue-700">{submittedCandidate.courseApplied}</p>
                <p className="text-xs text-slate-600">Session: {submittedCandidate.session}</p>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium">Marks Percentage</span>
                <p className="text-base font-bold text-emerald-700">{submittedCandidate.percentage}%</p>
                <p className="text-xs text-slate-600">{submittedCandidate.marksObtained} / {submittedCandidate.totalMarks} Marks</p>
              </div>
            </div>

            {/* Student Mode Success Guidance vs Incharge Document Control Hub */}
            {userRole === 'student' ? (
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-6 border border-emerald-200/80 space-y-5 text-left">
                <div className="flex items-center gap-3 border-b border-emerald-200/60 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Application Form Successfully Received!</h3>
                    <p className="text-xs text-slate-600">Your application data is safely saved in the Govt. BHSS Ladhoo Admission Database.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">1</span>
                    <h4 className="font-bold text-xs text-slate-900 uppercase">Save Reference ID</h4>
                    <p className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 text-center">
                      {submittedCandidate.id}
                    </p>
                    <p className="text-[11px] text-slate-500">Keep this ID safe for all future inquiries.</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center">2</span>
                    <h4 className="font-bold text-xs text-slate-900 uppercase">Visit Admission Cell</h4>
                    <p className="text-xs text-slate-700 font-semibold">Govt. BHSS Ladhoo Pampore</p>
                    <p className="text-[11px] text-slate-500">Bring original Marksheets, Aadhaar, & Passport Photos.</p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-extrabold text-xs flex items-center justify-center">3</span>
                    <h4 className="font-bold text-xs text-slate-900 uppercase">Incharge Document Print</h4>
                    <p className="text-xs text-slate-700 font-semibold">Printed by Admission Incharge</p>
                    <p className="text-[11px] text-slate-500">Official Admission Form, 3-Copy Bank Slip, & Library Pass will be printed at school counter.</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-amber-900 text-xs">
                  <span className="text-xl">ℹ️</span>
                  <span>
                    <strong>Note for Students:</strong> Printed copies of Bank Fee Slips & Admission Forms are officially issued by the School Admission Cell upon physical document verification.
                  </span>
                </div>
              </div>
            ) : (
              /* Fee & Bank Slip Action Cards Section for Incharge Admission Control */
              <div className="bg-gradient-to-br from-blue-50/90 to-emerald-50/90 rounded-2xl p-5 sm:p-6 border border-blue-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-200/60 pb-3">
                  <div>
                    <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wide bg-blue-100 px-2.5 py-0.5 rounded-full">
                      INCHARGE ADMISSION CONTROL — FEE & PRINT DOCUMENTS
                    </span>
                    <div className="flex flex-wrap items-baseline gap-3 mt-1.5">
                      <p className="text-2xl sm:text-3xl font-black text-blue-950">₹{submittedCandidate.feeAmount.toLocaleString('en-IN')}</p>
                      <p className="text-xs font-bold text-slate-700">Bank Fee Challan No: <span className="font-mono text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-300 font-bold">{submittedCandidate.bankChallanNo}</span></p>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Fee deposit slip is generated in 3-Copy A4 format (Bank Copy, Student Copy, School Copy).</p>
                  </div>

                  {onOpenDocuments && (
                    <button
                      type="button"
                      onClick={() => onOpenDocuments(submittedCandidate, 'bank-slip')}
                      className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <FileText className="w-4 h-4 text-amber-300" />
                      Open Full Document Generator
                    </button>
                  )}
                </div>

                {/* Action Cards for Generated Documents */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Card 1: Official Admission Form */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition">
                    <div className="space-y-1 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">1. Official Admission Form</h4>
                      <p className="text-xs text-slate-500">Filled application record with candidate photo & QR code.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePreviewDoc('form')}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      Print Admission Form
                    </button>
                  </div>

                  {/* Card 2: 3-Copy J&K Bank Fee Slip */}
                  <div className="bg-white p-4 rounded-xl border-2 border-emerald-500/50 shadow-md flex flex-col justify-between hover:border-emerald-600 transition bg-emerald-50/20">
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">3 Copies</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900">2. 3-Copy Bank Fee Slip</h4>
                      <p className="text-xs text-slate-600">J&K Bank Fee Deposition Slip in A4 format.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePreviewDoc('bank-slip')}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow cursor-pointer active:scale-95"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-200" />
                      Print 3-Copy Bank Slip
                    </button>
                  </div>

                  {/* Card 3: Library Pass Form */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition">
                    <div className="space-y-1 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">3. Library Pass Form</h4>
                      <p className="text-xs text-slate-500">Central library reader membership form & pass.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePreviewDoc('library')}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Print Library Form
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Official Stamps / Signatures for Printouts */}
            <div className="pt-8 border-t border-dashed border-slate-400 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="h-12 flex items-end justify-center">
                  <span className="border-b border-slate-600 w-36 italic font-serif text-slate-700">Signature of Candidate</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Applicant / Parent Signature</p>
              </div>

              <div>
                <div className="h-12 flex items-end justify-center">
                  <span className="border-b border-slate-600 w-36 font-bold text-slate-800 uppercase">BHSS Ladhoo Seal</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Principal / Admission Cell</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                {userRole === 'incharge' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to permanently delete submitted admission form for "${submittedCandidate.fullName}" (${submittedCandidate.id})?`)) {
                        setLoading(true);
                        try {
                          await deleteCandidateRecord(submittedCandidate.id);
                          alert('Admission form record deleted successfully.');
                          setSubmittedCandidate(null);
                          onSuccessSubmitted({ id: submittedCandidate.id } as Candidate);
                        } catch (err) {
                          alert('Failed to delete application record.');
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    className="text-xs font-bold text-rose-700 hover:text-rose-900 transition flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    Delete Application
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedCandidate(null);
                    setFormData({
                      admNo: 'ADM-2026-103',
                      classWishToJoin: '11th Class',
                      session: '2026-2027',
                      boardRegNo: '',
                      aadharNumber: '',
                      bankAccountNo: '',
                      fullName: '',
                      fatherName: '',
                      motherName: '',
                      address: '',
                      fatherOccupation: 'Government Service',
                      bloodGroup: 'O+',
                      height: "5'6\"",
                      penNumber: 'PEN-2026-8902',
                      rationCardDetail: 'APL',
                      socialCategory: 'General',
                      parentContactNo: '',
                      mobile: '',
                      email: '',
                      dob: '2010-05-15',
                      gender: 'Male',
                      category: 'General',
                      hasDisability: 'NO',
                      disabilityType: '',
                      previousQualification: 'Matriculation (10th Class Passed)',
                      boardUniversity: 'JKBOSE (J&K Board of School Education)',
                      prevRollNumber: '',
                      passingYear: '2025',
                      marksObtained: '',
                      totalMarks: '500',
                      courseApplied: 'Science Stream (Medical: Physics, Chemistry, Biology)',
                      majorSubjects: 'Physics, Chemistry, Biology, General English',
                      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    });
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Submit Another Application
                </button>
              </div>

              {userRole === 'incharge' ? (
                <button
                  type="button"
                  onClick={() => setActivePreviewDoc('form')}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition shadow-lg flex items-center gap-2.5 active:scale-95 cursor-pointer"
                >
                  <Printer className="w-5 h-5 text-emerald-400" />
                  Print Official Form & QR Code
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-sm transition shadow-lg flex items-center gap-2.5 active:scale-95 cursor-pointer"
                >
                  <Printer className="w-5 h-5 text-emerald-200" />
                  Print Submission Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSecondaryClass = formData.classWishToJoin === '9th Class' || formData.classWishToJoin === '10th Class';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(dataUrl) => {
          setFormData((prev) => ({ ...prev, photoUrl: dataUrl }));
        }}
      />

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Form Title Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              BOYS HIGHER SECONDARY SCHOOL LADHOO PAMPORE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 flex items-center gap-3">
              <UserPlus className="w-7 h-7 text-blue-400" />
              Official Admission Registration Form
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              JKBOSE Secondary (9th/10th) & Higher Secondary (11th/12th) Stream & Vocational Choice
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700 shrink-0">
            <Building2 className="w-5 h-5 text-blue-400" />
            <div className="text-xs">
              <p className="font-bold text-slate-200">Central Admission Cell</p>
              <p className="text-slate-400">BHSS Ladhoo Pampore</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Header Row: Class Wish to Join, Adm No, Session */}
          <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                Class You Wish to Join <span className="text-rose-500">*</span>
              </label>
              <select
                name="classWishToJoin"
                value={formData.classWishToJoin}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 font-bold text-sm text-slate-900 bg-white"
              >
                <option value="11th Class">11th Class (Higher Secondary)</option>
                <option value="12th Class">12th Class (Higher Secondary)</option>
                <option value="9th Class">9th Class (Secondary)</option>
                <option value="10th Class">10th Class (Secondary)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                Admission No. (Adm. No.)
              </label>
              <input
                type="text"
                name="admNo"
                value={formData.admNo}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-blue-300 font-mono font-bold text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-900 uppercase mb-1">
                Session
              </label>
              <input
                type="text"
                name="session"
                value={formData.session}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-blue-300 font-bold text-sm bg-white"
              />
            </div>
          </div>

          {/* Basic Information & Student Pic */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">1</span>
              Basic Information & Student Pic
            </h3>

            {/* Photo Block */}
            <div className="mb-6 bg-slate-50 p-4.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-28 h-32 rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-200 shadow-md">
                  <img
                    src={formData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt="Student Passport Pic"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shadow border border-slate-700 whitespace-nowrap">
                  3.5cm × 4.5cm
                </span>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-extrabold uppercase text-slate-900 tracking-wide">
                    Candidate Passport Pic <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Mandatory &lt;50KB Size Limit
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-300">
                    Saved to Backend Server Storage
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Snap live pic with camera or upload pic file. Pics are auto-compressed under 50KB and stored directly on the backend server.
                </p>

                {formData.photoUrl && (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-bold text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Current Pic Size: {getPhotoSizeKB(formData.photoUrl)} (Validated &lt;50KB)
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Take Pic with Camera
                  </button>

                  <input
                    ref={photoFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    Upload Pic (&lt;50KB)
                  </button>
                </div>
              </div>
            </div>

            {/* Board Reg, Aadhaar, Bank A/C */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Board Registration No.
                </label>
                <input
                  type="text"
                  name="boardRegNo"
                  value={formData.boardRegNo}
                  onChange={handleChange}
                  placeholder="e.g. N1823001002"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Aadhaar No.
                </label>
                <input
                  type="text"
                  name="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={handleChange}
                  placeholder="12-digit Aadhaar Number"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bank A/C Number
                </label>
                <input
                  type="text"
                  name="bankAccountNo"
                  value={formData.bankAccountNo}
                  onChange={handleChange}
                  placeholder="JK Bank A/C Number"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1. Name of Candidate (Capital Letters) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="FULL NAME IN CAPITAL LETTERS"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1. Father's Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  placeholder="FATHER'S FULL NAME"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-semibold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  2. Mother's Name
                </label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  placeholder="MOTHER'S FULL NAME"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-semibold uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  3. Permanent Home Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Village / Town, Tehsil, District Pampore Pulwama J&K"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  4. Occupation of Father
                </label>
                <input
                  type="text"
                  name="fatherOccupation"
                  value={formData.fatherOccupation}
                  onChange={handleChange}
                  placeholder="e.g. Agriculture / Business / Service"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  5. Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-bold bg-white"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  5. Height
                </label>
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g. 5'6&quot; or 168 cm"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  6. PEN Number No.
                </label>
                <input
                  type="text"
                  name="penNumber"
                  value={formData.penNumber}
                  onChange={handleChange}
                  placeholder="Permanent Education Number"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  7. Ration Card Detail
                </label>
                <select
                  name="rationCardDetail"
                  value={formData.rationCardDetail}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-bold bg-white"
                >
                  <option value="APL">APL (Above Poverty Line)</option>
                  <option value="BPL">BPL (Below Poverty Line)</option>
                  <option value="AAY">AAY (Antyodaya Anna Yojana)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  8. Social Category
                </label>
                <select
                  name="socialCategory"
                  value={formData.socialCategory}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-bold bg-white"
                >
                  <option value="General">General</option>
                  <option value="RBA">RBA (Residential Backward Area)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="OBC">OBC / ALC / OSC</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  9. Parent Contact No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="parentContactNo"
                  value={formData.parentContactNo || formData.mobile}
                  onChange={(e) => {
                    setFormData({ ...formData, parentContactNo: e.target.value, mobile: e.target.value });
                  }}
                  placeholder="10-digit Parent Contact"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Student Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  10. Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  10(a). Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender || 'Male'}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-bold bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female (Girl Concession Fee Rate)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  11. Disability if any?
                </label>
                <select
                  name="hasDisability"
                  value={formData.hasDisability}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-bold bg-white"
                >
                  <option value="NO">NO</option>
                  <option value="YES">YES</option>
                </select>
              </div>

              {formData.hasDisability === 'YES' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Type of Disability
                  </label>
                  <input
                    type="text"
                    name="disabilityType"
                    value={formData.disabilityType}
                    onChange={handleChange}
                    placeholder="Specify disability detail"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Stream & Subject Selection Based on Class */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">2</span>
              Stream & Subject Selection ({formData.classWishToJoin})
            </h3>

            {isSecondaryClass ? (
              /* Class 9th & 10th Secondary Subjects Choice Selection Box */
              <div className="bg-amber-50/90 rounded-2xl p-5 border border-amber-300 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-950 uppercase flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-700" />
                      12. Secondary Class Subject Choice Selection ({formData.classWishToJoin}):
                    </h4>
                    <p className="text-xs text-amber-800 font-medium">
                      Select your preferred First Language choice, Vocational Skill trade, and optional subjects.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 font-extrabold text-[11px] rounded-lg self-start sm:self-auto border border-amber-300">
                    JKBOSE Secondary Curriculum
                  </span>
                </div>

                {/* 1. Compulsory Core Subjects */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-900 tracking-wide">
                      A. Compulsory Core Subjects (Mandatory for All Students):
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      4 Core Mandatory
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { name: 'English', desc: 'Core English Language' },
                      { name: 'Mathematics', desc: 'General Mathematics' },
                      { name: 'Science', desc: 'Physics, Chem, Life Science' },
                      { name: 'Social Science', desc: 'History, Civics, Geography' },
                    ].map((core) => (
                      <div
                        key={core.name}
                        className="bg-white border-2 border-emerald-500/70 p-2.5 rounded-xl shadow-sm flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-slate-900 uppercase">{core.name}</span>
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 mt-0.5">{core.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Regional / Language Choice */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-900 tracking-wide">
                      B. First Language / Regional Subject Choice (Select 1):
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-300">
                      Language Choice
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Urdu', 'Kashmiri', 'Hindi', 'Arabic', 'Punjabi'].map((lang) => {
                      const isSelected = formData.majorSubjects.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            const languages = ['Urdu', 'Kashmiri', 'Hindi', 'Arabic', 'Punjabi'];
                            let currentList = formData.majorSubjects.split(',').map(s => s.trim()).filter(Boolean);
                            currentList = currentList.filter(s => !languages.includes(s));
                            currentList.push(lang);
                            setFormData({ ...formData, majorSubjects: currentList.join(', ') });
                          }}
                          className={`px-3.5 py-2 rounded-xl font-extrabold text-xs border transition-all flex items-center gap-1.5 shadow-sm ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300'
                              : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="text-slate-400">+</span>}
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Vocational / Skill Trade Choice */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-900 tracking-wide">
                      C. Vocational & NSQF Skill Trades (Select ONLY 1 out of 2 trades):
                    </span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-300">
                      Select Only 1 Trade
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'IT & ITES', desc: 'Information Technology & Information Technology Enabled Services' },
                      { name: 'Tourism & Hospitality', desc: 'Tourism, Travel & Hospitality Management Skills' },
                    ].map((voca) => {
                      const isSelected = formData.majorSubjects.includes(voca.name);
                      return (
                        <button
                          key={voca.name}
                          type="button"
                          onClick={() => {
                            let currentList = formData.majorSubjects.split(',').map(s => s.trim()).filter(Boolean);
                            const vocationalTrades = ['IT & ITES', 'Tourism & Hospitality'];
                            if (isSelected) {
                              currentList = currentList.filter(s => s !== voca.name);
                            } else {
                              // Deselect any other vocational trade first so ONLY ONE is selected out of the two
                              currentList = currentList.filter(s => !vocationalTrades.includes(s));
                              currentList.push(voca.name);
                            }
                            setFormData({ ...formData, majorSubjects: currentList.join(', ') });
                          }}
                          className={`p-3 rounded-xl text-left border transition-all shadow-sm flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-300'
                              : 'bg-white text-slate-900 border-slate-300 hover:bg-amber-100/50'
                          }`}
                        >
                          <div>
                            <span className="block font-extrabold text-xs uppercase">{voca.name}</span>
                            <span className={`text-[10px] font-medium block mt-0.5 ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                              {voca.desc}
                            </span>
                          </div>
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded shrink-0 ${isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'}`}>
                            {isSelected ? '✓ Selected' : '+ Select'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Additional Elective / Activity Option */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-black uppercase text-amber-900 tracking-wide block">
                    D. Additional Electives & Activity Options (Optional):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['Physical Education', 'Art & Craft', 'Environmental Education'].map((opt) => {
                      const isSelected = formData.majorSubjects.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            let currentList = formData.majorSubjects.split(',').map(s => s.trim()).filter(Boolean);
                            if (isSelected) {
                              currentList = currentList.filter(s => s !== opt);
                            } else {
                              currentList.push(opt);
                            }
                            setFormData({ ...formData, majorSubjects: currentList.join(', ') });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Editable List of Selected Subjects */}
                <div className="pt-2 border-t border-amber-200">
                  <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                    Complete Selected Subject Combination:
                  </label>
                  <input
                    type="text"
                    name="majorSubjects"
                    value={formData.majorSubjects}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 font-mono text-xs font-extrabold text-slate-900 bg-white"
                  />
                  <p className="text-[11px] text-amber-800 font-medium mt-1">
                    You can customize or fine-tune subject names directly in the text field above.
                  </p>
                </div>
              </div>
            ) : (
              /* Class 11th & 12th Higher Secondary Streams */
              <div className="space-y-5">
                {/* Stream Opted Selection Cards */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    13. Select Stream Opted <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'Science Stream',
                        title: 'Science Stream',
                        desc: 'Physics, Chemistry, Biology / Mathematics',
                        badge: 'Medical / Non-Med / PCMB',
                        color: 'blue',
                      },
                      {
                        id: 'Humanities / Arts Stream',
                        title: 'Humanities Stream',
                        desc: 'Education, Economics, History, Pol. Sci, Urdu',
                        badge: 'Arts & Humanities',
                        color: 'amber',
                      },
                      {
                        id: 'Vocational Stream',
                        title: 'Vocational Stream',
                        desc: 'IT & ITES / Tourism & Hospitality Skills',
                        badge: 'NSQF Vocational Trade',
                        color: 'purple',
                      },
                    ].map((stream) => {
                      const isSelected = formData.courseApplied.includes(stream.id) || (stream.id.includes('Science') && formData.courseApplied.includes('Science'));
                      return (
                        <button
                          key={stream.id}
                          type="button"
                          onClick={() => {
                            let defaultSubj = 'General English';
                            if (stream.id.includes('Science')) {
                              defaultSubj = 'General English, Physics, Chemistry, Biology';
                            } else if (stream.id.includes('Humanities')) {
                              defaultSubj = 'General English, Education, Economics, Political Science, History';
                            } else if (stream.id.includes('Vocational')) {
                              defaultSubj = 'General English, IT & ITES';
                            }
                            setFormData({
                              ...formData,
                              courseApplied: stream.id,
                              majorSubjects: defaultSubj,
                            });
                          }}
                          className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col justify-between gap-2 shadow-sm ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-200'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-sm text-slate-900">{stream.title}</span>
                              {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{stream.desc}</p>
                          </div>
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-800 self-start">
                            {stream.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subject Selection Box for Opted Stream */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase">
                      14. Select Elective Subjects for {formData.courseApplied}
                    </label>
                    <span className="text-[11px] text-blue-700 font-extrabold bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Compulsory: General English
                    </span>
                  </div>

                  {/* Elective Toggles for Science */}
                  {formData.courseApplied.includes('Science') && (
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1.5">Science Electives:</span>
                      <div className="flex flex-wrap gap-2">
                        {['Physics', 'Chemistry', 'Biology', 'Mathematics'].map((subj) => {
                          const isSelected = formData.majorSubjects.includes(subj);
                          return (
                            <button
                              key={subj}
                              type="button"
                              onClick={() => {
                                let list = formData.majorSubjects.split(',').map(s => s.trim()).filter(Boolean);
                                if (isSelected) list = list.filter(s => s !== subj);
                                else list.push(subj);
                                setFormData({ ...formData, majorSubjects: list.join(', ') });
                              }}
                              className={`px-3.5 py-1.5 rounded-lg font-extrabold text-xs border transition ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}{subj}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Elective Toggles for Humanities */}
                  {(formData.courseApplied.includes('Humanities') || formData.courseApplied.includes('Arts')) && (
                    <div>
                      <span className="text-xs font-bold text-slate-700 block mb-1.5">Humanities / Arts Electives:</span>
                      <div className="flex flex-wrap gap-2">
                        {['Education', 'Economics', 'Political Science', 'History', 'Urdu', 'Mathematics'].map((subj) => {
                          const isSelected = formData.majorSubjects.includes(subj);
                          return (
                            <button
                              key={subj}
                              type="button"
                              onClick={() => {
                                let list = formData.majorSubjects.split(',').map(s => s.trim()).filter(Boolean);
                                if (isSelected) list = list.filter(s => s !== subj);
                                else list.push(subj);
                                setFormData({ ...formData, majorSubjects: list.join(', ') });
                              }}
                              className={`px-3.5 py-1.5 rounded-lg font-extrabold text-xs border transition ${
                                isSelected
                                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}{subj}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Vocational Skill Trade Toggle (Available for All Streams as 5th/Vocational choice - Select ONLY 1 trade) */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs font-bold text-purple-900 block mb-1.5">
                      Vocational & NSQF Skill Trade Choice (Select ONLY 1 out of 2 trades):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {['IT & ITES', 'Tourism & Hospitality'].map((voca) => {
                        const isSelected = formData.majorSubjects.includes(voca);
                        return (
                          <button
                            key={voca}
                            type="button"
                            onClick={() => {
                              let list = formData.majorSubjects.split(',').map(s => s.trim()).filter(Boolean);
                              const vocationalTrades = ['IT & ITES', 'Tourism & Hospitality'];
                              if (isSelected) {
                                list = list.filter(s => s !== voca);
                              } else {
                                // Deselect any other vocational trade first so ONLY ONE can be selected out of the two
                                list = list.filter(s => !vocationalTrades.includes(s));
                                list.push(voca);
                              }
                              setFormData({ ...formData, majorSubjects: list.join(', ') });
                            }}
                            className={`px-3.5 py-1.5 rounded-lg font-extrabold text-xs border transition ${
                              isSelected
                                ? 'bg-purple-700 text-white border-purple-800 shadow-sm'
                                : 'bg-white text-purple-900 border-purple-300 hover:bg-purple-50'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}{voca}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Subject Combination Display */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Final Selected Subject Combination:
                    </label>
                    <input
                      type="text"
                      name="majorSubjects"
                      value={formData.majorSubjects}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs font-mono font-bold bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Previous Academic Record */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">3</span>
              15. Previous Academic Record
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Class / Exam Passed
                </label>
                <input
                  type="text"
                  name="previousQualification"
                  value={formData.previousQualification}
                  onChange={handleChange}
                  placeholder="e.g. 10th Class Passed / 11th Class Passed"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Name of the Board
                </label>
                <input
                  type="text"
                  name="boardUniversity"
                  value={formData.boardUniversity}
                  onChange={handleChange}
                  placeholder="JKBOSE / CBSE"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Board Roll No.
                </label>
                <input
                  type="text"
                  name="prevRollNumber"
                  value={formData.prevRollNumber}
                  onChange={handleChange}
                  placeholder="e.g. 2510921"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Passing Session / Year
                </label>
                <input
                  type="text"
                  name="passingYear"
                  value={formData.passingYear}
                  onChange={handleChange}
                  placeholder="e.g. 2025"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Marks Obtained <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="marksObtained"
                  value={formData.marksObtained}
                  onChange={handleChange}
                  placeholder="e.g. 450"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Total Maximum Marks
                </label>
                <input
                  type="number"
                  name="totalMarks"
                  value={formData.totalMarks}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold"
                />
              </div>
            </div>

            {/* LIVE AUTOCALCULATED PERCENTAGE & GRADE CARD */}
            <div className="mt-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-black uppercase text-white tracking-wide">
                      Autocalculated Academic Performance
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Real-time percentage & JKBOSE / CBSE grade calculation
                    </p>
                  </div>
                </div>

                <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-black border ${gradeInfo.badgeColor}`}>
                  Grade: {gradeInfo.grade} ({gradeInfo.division})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Percentage */}
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    Calculated Percentage
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {gradeInfo.percentageFormatted}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({formData.marksObtained || 0}/{formData.totalMarks || 500})
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        gradeInfo.percentage >= 80
                          ? 'bg-emerald-500'
                          : gradeInfo.percentage >= 60
                          ? 'bg-blue-500'
                          : gradeInfo.percentage >= 40
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, gradeInfo.percentage)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Grade & Division */}
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    Assigned Grade
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black font-mono text-amber-300">
                      {gradeInfo.grade}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {gradeInfo.division}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Grade Points: {gradeInfo.gradePoints} / 10
                  </span>
                </div>

                {/* 3. Academic Status & Remark */}
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    Standing Status
                  </span>
                  <div className="mt-1">
                    <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                      gradeInfo.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {gradeInfo.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 font-medium line-clamp-1">
                    {gradeInfo.remarks}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fee & Enclosures & Declaration Block */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                Enclosures Checklist & Declaration
              </h4>
              <p className="text-xs text-slate-600">
                Documents to attach with physical application form:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  1. Marks Certificate
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  2. Discharge Certificate
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  3. Character Certificate
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  4. Aadhaar Card (Photocopy)
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  5. Ration Card (Front page Photocopy)
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  6. Bank Passbook (FrontPage Photocopy)
                </label>
                <label className="flex items-center gap-2 col-span-1 sm:col-span-2">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  7. 3 Recent Passport Pics
                </label>
              </div>

              <div className="pt-3 border-t border-slate-300">
                <label className="flex items-start gap-2.5 text-xs text-slate-800 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={declarationChecked}
                    onChange={(e) => setDeclarationChecked(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    DECLARATION BY STUDENT: I will obey all rules and regulations of the institute, attend classes regularly, and certify that all particulars filled above are correct.
                  </span>
                </label>
              </div>
            </div>

            {/* Fee Box - Consolidated Fee Structure */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4" />
                  Consolidated Fee Structure
                </span>
                <span className="text-[11px] bg-slate-800 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                  {formData.gender === 'Female' ? 'Girl Concession Rate: ₹1,325' : 'Standard Rate: ₹1,400'}
                </span>
              </div>

              <div className="text-xs space-y-2 text-slate-300">
                <div className="flex justify-between items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <div>
                    <span className="font-bold text-slate-100 block">All-Inclusive Consolidated Institutional Fee</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Includes Tuition, Admission, Development Fund, Library Deposit & Examination Fees</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                    ₹{fees.totalFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Total Consolidated Fee Payable:</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">
                  ₹{fees.totalFee.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Submit / Save PDF / Print A4 Action Block */}
          <div className="pt-6 border-t border-slate-200">
            {!declarationChecked ? (
              <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 text-xs font-semibold shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⚠️</span>
                  <span>
                    Please check the <strong>DECLARATION BY STUDENT</strong> box above to enable printing, saving as PDF, and submitting your application.
                  </span>
                </div>
                <span className="px-3 py-1 bg-amber-200 text-amber-900 font-bold rounded-lg text-[10px] uppercase tracking-wider shrink-0">
                  Declaration Required
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-600 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Declaration accepted. Save application as PDF or print directly in A4 format.
                </p>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset all fields in this admission form?')) {
                        setFormData({
                          admNo: 'ADM-2026-103',
                          classWishToJoin: '11th Class',
                          session: '2026-2027',
                          boardRegNo: '',
                          aadharNumber: '',
                          bankAccountNo: '',
                          fullName: '',
                          fatherName: '',
                          motherName: '',
                          address: '',
                          fatherOccupation: 'Government Service',
                          bloodGroup: 'O+',
                          height: "5'6\"",
                          penNumber: '',
                          rationCardDetail: 'APL',
                          socialCategory: 'General',
                          parentContactNo: '',
                          mobile: '',
                          email: '',
                          dob: '2010-05-15',
                          gender: 'Male',
                          category: 'General',
                          hasDisability: 'NO',
                          disabilityType: '',
                          previousQualification: 'Matriculation (10th Class Passed)',
                          boardUniversity: 'JKBOSE (J&K Board of School Education)',
                          prevRollNumber: '',
                          passingYear: '2025',
                          marksObtained: '',
                          totalMarks: '500',
                          courseApplied: 'Science Stream (Medical: Physics, Chemistry, Biology)',
                          majorSubjects: 'Physics, Chemistry, Biology, General English',
                          photoUrl: '',
                        });
                      }
                    }}
                    className="px-4 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Fields
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting Application & Saving...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Admission Application & Save PDF
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
