import React, { useState } from 'react';
import { Candidate } from '../types';
import { calculateGradeAndPercentage } from '../utils/grade';
import { triggerPrint } from '../utils/print';
import { updateCandidateRecord, deleteCandidateRecord } from '../utils/api';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Edit, 
  ShieldCheck, 
  UserCheck, 
  FileText, 
  GraduationCap, 
  Award, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  CheckSquare, 
  Square, 
  IndianRupee,
  User,
  Hash,
  BookOpen,
  ClipboardCheck,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface ViewApplicantDataModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (candidate: Candidate) => void;
  onRefresh: () => void;
}

export const ViewApplicantDataModal: React.FC<ViewApplicantDataModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onEdit,
  onRefresh,
}) => {
  if (!isOpen || !candidate) return null;

  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const gradeInfo = calculateGradeAndPercentage(candidate.marksObtained, candidate.totalMarks);

  // Quick Action Handlers
  const handleApprove = async () => {
    if (!window.confirm(`Approve application for ${candidate.fullName}? This will automatically assign Roll & Enrolment numbers.`)) return;

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const roll = candidate.assignedRollNumber || `2026-${Math.floor(100 + Math.random() * 900)}`;
    const enr = candidate.enrolmentNumber || `JKB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const adm = candidate.admNo || `BHSS-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await updateCandidateRecord(candidate.id, {
        status: 'Approved',
        assignedRollNumber: roll,
        enrolmentNumber: enr,
        admNo: adm,
        verifiedBy: 'Incharge Admission Cell',
        verifiedDate: today,
        verificationRemarks: candidate.verificationRemarks || 'Application physically verified & approved by Incharge Admission.',
        verifiedDocuments: {
          marksCertificate: true,
          aadhaarProof: true,
          categoryCertificate: true,
          characterCertificate: true,
          photoMatched: true,
          ...candidate.verifiedDocuments,
        },
      });
      onRefresh();
      onClose();
    } catch (err) {
      alert('Failed to approve application.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAdmitted = async () => {
    if (!window.confirm(`Confirm full admission & fee payment for ${candidate.fullName}?`)) return;

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const roll = candidate.assignedRollNumber || `2026-${Math.floor(100 + Math.random() * 900)}`;
    const enr = candidate.enrolmentNumber || `JKB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const adm = candidate.admNo || `BHSS-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await updateCandidateRecord(candidate.id, {
        status: 'Admitted',
        feeStatus: 'Paid',
        assignedRollNumber: roll,
        enrolmentNumber: enr,
        admNo: adm,
        verifiedBy: 'Incharge Admission Cell',
        verifiedDate: today,
        verificationRemarks: 'Full admission confirmed & fee marked paid by Admission Incharge.',
        verifiedDocuments: {
          marksCertificate: true,
          aadhaarProof: true,
          categoryCertificate: true,
          characterCertificate: true,
          photoMatched: true,
          ...candidate.verifiedDocuments,
        },
      });
      onRefresh();
      onClose();
    } catch (err) {
      alert('Failed to confirm admission.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      await updateCandidateRecord(candidate.id, {
        status: 'Rejected',
        verifiedBy: 'Incharge Admission Cell',
        verifiedDate: today,
        verificationRemarks: `REJECTED: ${rejectReason}`,
      });
      setShowRejectBox(false);
      onRefresh();
      onClose();
    } catch (err) {
      alert('Failed to reject application.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete admission form record for "${candidate.fullName}" (${candidate.id})?`)) return;

    setLoading(true);
    try {
      await deleteCandidateRecord(candidate.id);
      onRefresh();
      onClose();
    } catch (err) {
      alert('Failed to delete application record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-300 my-auto overflow-hidden animate-fadeIn flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  Incharge Admission Verification Portal
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                  ID: {candidate.id}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Applicant Submission Record: {candidate.fullName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerPrint('applicant-docket-print-area')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Print Official Application Form Docket"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Print Docket</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* STATUS & QUICK DECISION TOOLBAR */}
        <div className="bg-slate-100 p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Current Decision:</span>
            <span
              className={`px-3 py-1 rounded-full font-black text-xs uppercase shadow-sm ${
                candidate.status === 'Admitted'
                  ? 'bg-emerald-600 text-white'
                  : candidate.status === 'Approved'
                  ? 'bg-blue-600 text-white'
                  : candidate.status === 'Rejected'
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-500 text-slate-950 font-black'
              }`}
            >
              {candidate.status}
            </span>

            {candidate.feeStatus === 'Paid' ? (
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold rounded-md">
                Fee Paid (₹{candidate.feeAmount || 1400})
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-extrabold rounded-md">
                Fee Pending
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onEdit(candidate)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Data
            </button>

            {candidate.status !== 'Approved' && candidate.status !== 'Admitted' && (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-extrabold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-blue-200" />
                Approve Application
              </button>
            )}

            {candidate.status !== 'Admitted' && (
              <button
                onClick={handleConfirmAdmitted}
                disabled={loading}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-extrabold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-emerald-200" />
                Confirm Admission
              </button>
            )}

            {candidate.status !== 'Rejected' && (
              <button
                onClick={() => setShowRejectBox(!showRejectBox)}
                disabled={loading}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-200" />
                Reject
              </button>
            )}
          </div>
        </div>

        {/* REJECTION REASON BOX (WHEN TOGGLED) */}
        {showRejectBox && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 space-y-2 animate-fadeIn shrink-0">
            <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Specify Rejection Reason for Official Student File:</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Ineligible percentage, Missing original marksheet, Incorrect stream criteria"
                className="flex-1 px-3 py-1.5 border border-rose-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              />
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow cursor-pointer shrink-0"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* MAIN APPLICATION SUMMARY BODY */}
        <div id="applicant-docket-print-area" className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
          {/* OFFICIAL HEADER PRINT DOCKET ONLY */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-4 text-center mb-4">
            <h1 className="text-xl font-black text-slate-900 uppercase">Govt. Model Higher Secondary School</h1>
            <p className="text-xs font-bold text-slate-700">Official Admission Office - Incharge Verification Record Docket</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1">Application ID: {candidate.id} | Date: {candidate.applicationDate}</p>
          </div>

          {/* 1. STUDENT IDENTITY & APPLIED COURSE */}
          <div className="bg-gradient-to-r from-slate-50 to-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
            {/* PHOTO */}
            <div className="w-24 h-28 rounded-xl bg-slate-200 border-2 border-slate-300 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
              {candidate.photoUrl ? (
                <img src={candidate.photoUrl} alt={candidate.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            {/* DETAILS */}
            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{candidate.fullName}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                  {candidate.gender}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Category: {candidate.category}
                </span>
              </div>

              <p className="text-xs font-extrabold text-emerald-800 flex items-center justify-center sm:justify-start gap-1">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Applied Course/Stream: {candidate.courseApplied}
              </p>

              {candidate.majorSubjects && (
                <p className="text-xs text-slate-600 font-semibold">
                  Subjects: <strong className="text-slate-800">{candidate.majorSubjects}</strong>
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs font-mono text-slate-700 border-t border-slate-200/80">
                <span>Roll No: <strong className="text-slate-900">{candidate.assignedRollNumber || 'Not Assigned'}</strong></span>
                <span>•</span>
                <span>Enrolment No: <strong className="text-slate-900">{candidate.enrolmentNumber || 'Not Assigned'}</strong></span>
                <span>•</span>
                <span>Admission No: <strong className="text-slate-900">{candidate.admNo || 'Not Assigned'}</strong></span>
              </div>
            </div>
          </div>

          {/* 2. PERSONAL & GUARDIAN PARTICULARS */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500 flex items-center gap-1.5 border-b pb-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              Personal & Parent Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Father's Name</span>
                <span className="font-bold text-slate-900 text-sm">{candidate.fatherName}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Mother's Name</span>
                <span className="font-bold text-slate-900 text-sm">{candidate.motherName || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Date of Birth</span>
                <span className="font-bold text-slate-900 text-sm">{candidate.dob}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Aadhaar Card No</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{candidate.aadharNumber}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Contact Mobile</span>
                <span className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  {candidate.mobile}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Email Address</span>
                <span className="font-semibold text-slate-900 text-xs truncate flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  {candidate.email || 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Permanent Residential Address</span>
              <span className="font-bold text-slate-900 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                {candidate.address}
              </span>
            </div>
          </div>

          {/* 3. ACADEMIC CREDENTIALS */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-500 flex items-center gap-1.5 border-b pb-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              Prior Academic Qualification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Qualification Level</span>
                <span className="font-bold text-slate-900">{candidate.previousQualification}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Board / University</span>
                <span className="font-bold text-slate-900">{candidate.boardUniversity}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Prev Roll No & Year</span>
                <span className="font-mono font-bold text-slate-900">
                  {candidate.prevRollNumber || 'N/A'} ({candidate.passingYear || '2025'})
                </span>
              </div>

              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                <span className="block text-[10px] font-bold text-emerald-800 uppercase">Marks & Grade</span>
                <span className="font-extrabold text-emerald-900 text-sm">
                  {candidate.marksObtained}/{candidate.totalMarks} ({candidate.percentage || gradeInfo.percentageFormatted}%)
                </span>
                <span className="block text-[10px] font-black text-amber-800 mt-0.5">
                  Grade: {candidate.grade || gradeInfo.grade}
                </span>
              </div>
            </div>
          </div>

          {/* 4. INCHARGE VERIFICATION & REMARKS */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-emerald-400 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                Physical Verification Checklist Status
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Verified By: <strong className="text-emerald-300">{candidate.verifiedBy || 'Incharge Admission Cell'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {[
                { key: 'marksCertificate', label: '10th/12th Marks Certificate' },
                { key: 'aadhaarProof', label: 'Aadhaar Card / Identity' },
                { key: 'categoryCertificate', label: 'Category / Domicile Certificate' },
                { key: 'characterCertificate', label: 'Discharge / Character Certificate' },
                { key: 'photoMatched', label: 'Photograph Cross-Matched' },
              ].map((doc) => {
                const isChecked = !!(candidate.verifiedDocuments as any)?.[doc.key];
                return (
                  <div
                    key={doc.key}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      isChecked
                        ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className="text-[11px] font-bold">{doc.label}</span>
                  </div>
                );
              })}
            </div>

            {candidate.verificationRemarks && (
              <div className="pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400 font-bold block mb-0.5">Incharge Official Remarks:</span>
                <p className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-semibold text-emerald-300">
                  {candidate.verificationRemarks}
                </p>
              </div>
            )}
          </div>

          {/* DOCKET SIGNATURE BLOCK FOR PRINT */}
          <div className="hidden print:grid grid-cols-2 gap-12 pt-12 text-center text-xs font-bold text-slate-800">
            <div>
              <div className="border-t border-slate-900 pt-1">Signature of Applicant</div>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-1">Incharge Admission Cell Signature & Stamp</div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            Submitted On: <strong className="text-slate-700 font-mono">{candidate.applicationDate}</strong>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Record
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition"
            >
              Close Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
