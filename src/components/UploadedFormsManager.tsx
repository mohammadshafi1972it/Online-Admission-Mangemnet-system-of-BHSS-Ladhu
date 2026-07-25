import React, { useState } from 'react';
import { Candidate } from '../types';
import { submitAdmissionForm, parseFormImage } from '../utils/api';
import { generateQRCodeDataUrl, buildCandidateQRPayload } from '../utils/qr';
import { calculateGradeAndPercentage } from '../utils/grade';
import { triggerPrint } from '../utils/print';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Building2, 
  Home, 
  GraduationCap, 
  Award, 
  FileCheck, 
  Eye, 
  QrCode, 
  ArrowRight,
  RefreshCw,
  Copy,
  Sliders
} from 'lucide-react';

interface UploadedFormsManagerProps {
  candidates: Candidate[];
  onSuccessSubmitted: (newCandidate: Candidate) => void;
  onOpenDocuments: (candidate: Candidate, docType: string) => void;
}

export const UploadedFormsManager: React.FC<UploadedFormsManagerProps> = ({
  candidates,
  onSuccessSubmitted,
  onOpenDocuments,
}) => {
  const [selectedFormCategory, setSelectedFormCategory] = useState<
    'custom-upload' | 'hostel' | 'scholarship' | 'examination' | 'bonafide'
  >('custom-upload');

  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [submittedCandidate, setSubmittedCandidate] = useState<Candidate | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    gender: 'Male',
    category: 'General',
    email: '',
    mobile: '',
    aadharNumber: '',
    address: '',
    previousQualification: 'Matriculation (10th Class Passed)',
    boardUniversity: 'JKBOSE (J&K Board of School Education)',
    prevRollNumber: '',
    passingYear: '2025',
    marksObtained: '450',
    totalMarks: '500',
    courseApplied: 'Science Stream (Medical: Physics, Chemistry, Biology)',
    majorSubjects: 'Physics, Chemistry, Biology, General English',
    session: '2026-2027',
    formTypeSubmitted: 'Custom Uploaded Form',
    hostelRequested: false,
    scholarshipApplied: false,
    hostelBlock: 'Block A (Boys Hostel)',
    roomType: 'Double Occupancy with Study Table',
    messPreference: 'Vegetarian',
    guardianMobile: '',
    scholarshipName: 'Post-Matric Merit Scholarship Scheme',
    familyIncome: '180000',
    bankAccountNo: '39481029384',
    bankIfscCode: 'SBIN0001020',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle Form Image / Document Upload
  const handleFormFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setExtractSuccess(false);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      setUploadedImagePreview(base64);

      // Auto trigger AI extraction
      await handleAIFieldExtraction(base64);
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini / AI Vision extraction
  const handleAIFieldExtraction = async (base64Img?: string) => {
    const targetImg = base64Img || uploadedImagePreview;
    if (!targetImg) {
      setErrorMsg('Please upload a scanned form image or document first.');
      return;
    }

    setExtracting(true);
    setErrorMsg('');
    try {
      const extracted = await parseFormImage(targetImg);
      if (extracted && Object.keys(extracted).length > 0) {
        setFormData((prev) => ({
          ...prev,
          fullName: extracted.fullName || prev.fullName,
          fatherName: extracted.fatherName || prev.fatherName,
          motherName: extracted.motherName || prev.motherName,
          dob: extracted.dob || prev.dob,
          gender: extracted.gender || prev.gender,
          category: extracted.category || prev.category,
          email: extracted.email || prev.email,
          mobile: extracted.mobile || prev.mobile,
          aadharNumber: extracted.aadharNumber || prev.aadharNumber,
          address: extracted.address || prev.address,
          courseApplied: extracted.courseApplied || prev.courseApplied,
          marksObtained: extracted.marksObtained ? String(extracted.marksObtained) : prev.marksObtained,
          totalMarks: extracted.totalMarks ? String(extracted.totalMarks) : prev.totalMarks,
          previousQualification: extracted.previousQualification || prev.previousQualification,
          boardUniversity: extracted.boardUniversity || prev.boardUniversity,
        }));
        setExtractSuccess(true);
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMsg('Failed to extract text from uploaded form image.');
    } finally {
      setExtracting(false);
    }
  };

  // Populate from Existing Candidate profile if selected
  const handleSelectExistingCandidate = (candidateId: string) => {
    const found = candidates.find((c) => c.id === candidateId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        fullName: found.fullName,
        fatherName: found.fatherName,
        motherName: found.motherName,
        dob: found.dob,
        gender: found.gender,
        category: found.category,
        email: found.email,
        mobile: found.mobile,
        aadharNumber: found.aadharNumber,
        address: found.address,
        courseApplied: found.courseApplied,
        marksObtained: String(found.marksObtained),
        totalMarks: String(found.totalMarks),
        previousQualification: found.previousQualification,
        boardUniversity: found.boardUniversity,
      }));
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName || !formData.fatherName || !formData.mobile) {
      setErrorMsg('Required fields missing: Full Name, Father Name, Mobile Number.');
      return;
    }

    setLoading(true);
    try {
      const marks = Number(formData.marksObtained || 450);
      const total = Number(formData.totalMarks || 500);
      const gradeCalc = calculateGradeAndPercentage(marks, total);

      const payload = {
        ...formData,
        marksObtained: marks,
        totalMarks: total,
        percentage: Number(gradeCalc.percentageFormatted),
        grade: gradeCalc.grade,
        division: gradeCalc.division,
        formTypeSubmitted: selectedFormCategory,
        uploadedFormUrl: uploadedImagePreview || undefined,
        feeAmount: selectedFormCategory === 'hostel' ? 24000 : selectedFormCategory === 'scholarship' ? 0 : 15000,
      };

      const result = await submitAdmissionForm(payload);
      setSubmittedCandidate(result);

      // Generate QR Payload
      const qrPayload = buildCandidateQRPayload(result.id, result.fullName, result.courseApplied);
      const url = await generateQRCodeDataUrl(qrPayload);
      setQrCodeUrl(url);

      onSuccessSubmitted(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting uploaded form data.');
    } finally {
      setLoading(false);
    }
  };

  if (submittedCandidate) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div id="uploaded-form-success-card" className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 sm:p-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-blue-900/40 px-2.5 py-0.5 rounded-full">
                  Form Record Synchronized
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Uploaded Form Saved to Backend Excel!</h2>
                <p className="text-blue-100 text-xs mt-0.5">Reference ID: <span className="font-mono font-bold bg-blue-950/60 px-2 py-0.5 rounded text-white">{submittedCandidate.id}</span></p>
              </div>
            </div>

            {qrCodeUrl && (
              <div className="hidden sm:flex bg-white p-2 rounded-xl shadow-lg text-center flex-col items-center">
                <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 object-contain" />
                <span className="text-[9px] font-mono text-slate-600 mt-1">Verification QR</span>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Candidate Name</span>
                <span className="font-bold text-slate-900 text-sm">{submittedCandidate.fullName}</span>
                <span className="text-slate-600 block">S/O {submittedCandidate.fatherName}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Program Applied</span>
                <span className="font-bold text-blue-700 text-sm">{submittedCandidate.courseApplied}</span>
                <span className="text-slate-600 block">Mobile: {submittedCandidate.mobile}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Form Type</span>
                <span className="font-bold text-indigo-700 uppercase">{selectedFormCategory} Form</span>
                <span className="text-slate-600 block">Status: <strong className="text-emerald-700">{submittedCandidate.status}</strong></span>
              </div>
            </div>

            {uploadedImagePreview && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase">Uploaded Form Document Copy:</span>
                <div className="border border-slate-300 rounded-xl overflow-hidden max-h-60 bg-slate-900 flex justify-center items-center p-2">
                  <img src={uploadedImagePreview} alt="Uploaded Copy" className="max-h-56 object-contain rounded" />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setSubmittedCandidate(null);
                  setUploadedImagePreview(null);
                  setExtractSuccess(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
              >
                Upload Another Form
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => onOpenDocuments(submittedCandidate, 'discharge')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Printable Copy
                </button>

                <button
                  onClick={() => triggerPrint('uploaded-form-success-card')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Upload className="w-4 h-4" />
            Institutional Form Upload & AI Auto-Parse Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Uploaded Form Document Hub</h2>
          <p className="text-slate-400 text-xs mt-1">
            Upload scanned forms, certificates, or applications. Auto-extract student fields using AI OCR and save directly to backend Excel.
          </p>
        </div>

        {/* Quick Pre-loaded Form Templates Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setSelectedFormCategory('custom-upload')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              selectedFormCategory === 'custom-upload' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Scanned Form
          </button>

          <button
            onClick={() => setSelectedFormCategory('hostel')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              selectedFormCategory === 'hostel' ? 'bg-amber-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Hostel Form
          </button>

          <button
            onClick={() => setSelectedFormCategory('scholarship')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              selectedFormCategory === 'scholarship' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Scholarship Form
          </button>

          <button
            onClick={() => setSelectedFormCategory('bonafide')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              selectedFormCategory === 'bonafide' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Bonafide / NOC
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Main Form Processing Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form File Upload & AI Vision Extractor (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Upload Form Document / Scan
              </h3>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                JPG, PNG, PDF, WEBP
              </span>
            </div>

            {/* Upload Zone */}
            <label className="border-2 border-dashed border-blue-300 bg-blue-50/40 hover:bg-blue-50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center min-h-[160px] relative">
              {uploadedImagePreview ? (
                <div className="space-y-2 w-full">
                  <img src={uploadedImagePreview} alt="Form Document Preview" className="max-h-48 w-full object-contain rounded-lg border border-slate-300" />
                  <p className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Form Loaded Successfully
                  </p>
                </div>
              ) : (
                <>
                  <FileText className="w-10 h-10 text-blue-600 mb-2" />
                  <span className="text-xs font-bold text-blue-900">Click or Drag Uploaded Form File</span>
                  <span className="text-[10px] text-slate-500 mt-1">Scanned Admission, Hostel, Scholarship, or Exam Form</span>
                </>
              )}
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFormFileUpload}
                className="hidden"
              />
            </label>

            {/* AI Parsing Controls */}
            {uploadedImagePreview && (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAIFieldExtraction()}
                  disabled={extracting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {extracting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      AI Analyzing Form Image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Re-Extract Form Fields with Gemini AI
                    </>
                  )}
                </button>

                {extractSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    AI Vision extracted candidate data into fields!
                  </div>
                )}
              </div>
            )}

            {/* Populate From Existing Candidate Search */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Or Quick-Fill From Existing Candidate DB:
              </label>
              <select
                onChange={(e) => handleSelectExistingCandidate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-slate-50"
              >
                <option value="">-- Select Existing Student Record --</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.id} - {c.courseApplied})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Form Data Inputs & Institutional Form Editor (7 Cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {selectedFormCategory === 'hostel' ? <Home className="w-5 h-5" /> : selectedFormCategory === 'scholarship' ? <Award className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 uppercase">
                    {selectedFormCategory === 'custom-upload' && 'Custom Uploaded Form Data'}
                    {selectedFormCategory === 'hostel' && 'Hostel Accommodation Application'}
                    {selectedFormCategory === 'scholarship' && 'Scholarship & Merit Grant Application'}
                    {selectedFormCategory === 'bonafide' && 'Bonafide / NOC Certificate Request'}
                  </h3>
                  <p className="text-xs text-slate-500">Auto-mapped fields from uploaded document or manual entry.</p>
                </div>
              </div>

              <span className="text-xs font-extrabold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Excel Sync Ready
              </span>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-6">
              
              {/* Candidate Info Fields */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-1">
                  1. Candidate Personal Info
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Candidate Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Aarav Sharma"
                      required
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Father's Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleChange}
                      placeholder="e.g. Rajesh Sharma"
                      required
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="10-digit Mobile"
                      required
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender || 'Male'}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs font-medium bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="student@example.com"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Academic Stream (HSS Ladhu)
                    </label>
                    <select
                      name="courseApplied"
                      value={formData.courseApplied}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs font-medium bg-white"
                    >
                      <option value="Science Stream (Medical: Physics, Chemistry, Biology)">Science Stream (Medical: Physics, Chemistry, Biology)</option>
                      <option value="Science Stream (Non-Medical: Physics, Chemistry, Math)">Science Stream (Non-Medical: Physics, Chemistry, Math)</option>
                      <option value="Humanities Stream (Education, Economics, History, Pol Sci, Urdu, Math)">Humanities Stream (Education, Economics, History, Pol Sci, Urdu, Math)</option>
                      <option value="Vocational Stream (IT & ITES / Tourism & Hospitality)">Vocational Stream (IT & ITES / Tourism & Hospitality)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs font-medium bg-white"
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Category Specific Extra Fields */}
              {selectedFormCategory === 'hostel' && (
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-amber-700" />
                    Hostel & Mess Specific Fields
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hostel Block Preference</label>
                      <select
                        name="hostelBlock"
                        value={formData.hostelBlock}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Block A (Boys Hostel)">Block A (Boys Hostel)</option>
                        <option value="Block B (Boys PG Hostel)">Block B (Boys PG Hostel)</option>
                        <option value="Block C (Girls Hostel)">Block C (Girls Hostel)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Room Occupancy Type</label>
                      <select
                        name="roomType"
                        value={formData.roomType}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Double Occupancy with Study Table">Double Occupancy (Shared)</option>
                        <option value="Single AC Room with Bath">Single AC Room</option>
                        <option value="Triple Occupancy Economy">Triple Occupancy</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedFormCategory === 'scholarship' && (
                <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-700" />
                    Scholarship & Income Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Scholarship Name</label>
                      <input
                        type="text"
                        name="scholarshipName"
                        value={formData.scholarshipName}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Annual Family Income (INR)</label>
                      <input
                        type="text"
                        name="familyIncome"
                        value={formData.familyIncome}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Declaration Checkbox */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="flex items-start gap-2.5 text-xs text-slate-800 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={declarationChecked}
                    onChange={(e) => setDeclarationChecked(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    DECLARATION BY APPLICANT: I certify that all information provided in this uploaded form is authentic and accurate. I agree to abide by all rules of Boys Higher Secondary School Ladhoo Pampore.
                  </span>
                </label>
              </div>

              {/* Submit / Print Block */}
              <div className="pt-4 border-t border-slate-200">
                {!declarationChecked ? (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-3 text-amber-900 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <span>Check the <strong>Declaration Box</strong> above to enable saving in PDF & A4 print format.</span>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-200 text-amber-900 font-bold rounded text-[10px] uppercase shrink-0">
                      Required
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-500 font-medium">
                      Saves in PDF & A4 printable format to <code className="text-emerald-700 font-mono font-bold">/data/candidates.xlsx</code>
                    </span>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing & Saving...
                        </>
                      ) : (
                        <>
                          <Printer className="w-4 h-4" />
                          Save Application in PDF / Print in A4
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
