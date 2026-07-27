import React, { useState, useEffect } from 'react';
import { Candidate } from '../types';
import { calculateGradeAndPercentage } from '../utils/grade';
import { updateCandidateRecord, deleteCandidateRecord } from '../utils/api';
import { triggerPrint } from '../utils/print';
import { compressPhotoUnder50KB, getPhotoSizeKB } from '../utils/imageUtils';
import { 
  X, 
  Save, 
  CheckCircle2, 
  UserCheck, 
  User, 
  GraduationCap, 
  ShieldCheck, 
  FileText, 
  IndianRupee, 
  Image as ImageIcon,
  Sparkles,
  Award,
  AlertCircle,
  Printer,
  CheckSquare,
  Square,
  ClipboardCheck,
  Trash2
} from 'lucide-react';

interface EditCandidateModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedCandidate: Candidate) => void;
}

export const EditCandidateModal: React.FC<EditCandidateModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [formData, setFormData] = useState<Partial<Candidate>>({});
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'verification' | 'photo'>('personal');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (candidate) {
      setFormData({ ...candidate });
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      const numVal = Number(value);
      setFormData((prev) => {
        const next = { ...prev, [name]: numVal };
        // Recalculate percentage if marksObtained or totalMarks changes
        if (name === 'marksObtained' || name === 'totalMarks') {
          const marks = name === 'marksObtained' ? numVal : Number(prev.marksObtained || 0);
          const total = name === 'totalMarks' ? numVal : Number(prev.totalMarks || 500);
          if (total > 0) {
            const calc = calculateGradeAndPercentage(marks, total);
            next.percentage = calc.percentage;
            next.grade = calc.grade;
          }
        }
        return next;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMessage('');
      try {
        const compressed = await compressPhotoUnder50KB(file);
        setFormData((prev) => ({ ...prev, photoUrl: compressed.dataUrl }));
      } catch (err: any) {
        setErrorMessage(err.message || 'Selected photo could not be compressed under 50KB limit.');
      }
    }
  };

  const handleAutoAssignRoll = () => {
    const randomRoll = formData.assignedRollNumber || `2026-${Math.floor(100 + Math.random() * 900)}`;
    const randomEnr = formData.enrolmentNumber || `JKB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomAdm = formData.admNo || `BHSS-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    setFormData((prev) => ({
      ...prev,
      assignedRollNumber: randomRoll,
      enrolmentNumber: randomEnr,
      admNo: randomAdm,
      status: 'Approved',
      verifiedBy: prev.verifiedBy || 'Incharge Admission Cell',
      verifiedDate: prev.verifiedDate || today,
      verificationRemarks: prev.verificationRemarks || 'All original certificates & credentials physically verified by Admission Cell.',
      verifiedDocuments: {
        marksCertificate: true,
        aadhaarProof: true,
        categoryCertificate: true,
        characterCertificate: true,
        photoMatched: true,
        ...prev.verifiedDocuments,
      },
    }));
  };

  const handleQuickAdmit = () => {
    const randomRoll = formData.assignedRollNumber || `2026-${Math.floor(100 + Math.random() * 900)}`;
    const randomEnr = formData.enrolmentNumber || `JKB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomAdm = formData.admNo || `BHSS-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    setFormData((prev) => ({
      ...prev,
      assignedRollNumber: randomRoll,
      enrolmentNumber: randomEnr,
      admNo: randomAdm,
      status: 'Admitted',
      feeStatus: 'Paid',
      verifiedBy: prev.verifiedBy || 'Incharge Admission Cell',
      verifiedDate: prev.verifiedDate || today,
      verificationRemarks: prev.verificationRemarks || 'Fee paid & Admission confirmed by Admission Incharge.',
      verifiedDocuments: {
        marksCertificate: true,
        aadhaarProof: true,
        categoryCertificate: true,
        characterCertificate: true,
        photoMatched: true,
        ...prev.verifiedDocuments,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updated = await updateCandidateRecord(candidate.id, formData);
      setSuccessMessage('Student record verified & updated successfully in backend Excel storage!');
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update student record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!candidate) return;
    if (!window.confirm(`Are you sure you want to permanently delete student record for "${candidate.fullName}" (${candidate.id})?`)) return;

    setSaving(true);
    try {
      await deleteCandidateRecord(candidate.id);
      onSaved({ ...candidate, status: 'Deleted' });
      onClose();
    } catch (err) {
      alert('Failed to delete student record');
    } finally {
      setSaving(false);
    }
  };

  // Autocalculated percentage display
  const currentMarks = Number(formData.marksObtained || 0);
  const currentTotal = Number(formData.totalMarks || 500);
  const gradeCalc = calculateGradeAndPercentage(currentMarks, currentTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                  {candidate.id}
                </span>
                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                  formData.status === 'Admitted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  formData.status === 'Approved' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {formData.status || 'Pending'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold mt-0.5 text-white">
                Verify & Modify Student Application: <span className="text-emerald-400">{formData.fullName}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>In-charge Verification Controls:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoAssignRoll}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Assign Roll & Enrolment No.
            </button>

            <button
              type="button"
              onClick={handleQuickAdmit}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Quick Verify & Mark Admitted
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'personal'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            1. Personal & Identity Info
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'academic'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            2. Academic Qualification & Marks
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'verification'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            3. Admission Status & Fee Ledger
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`px-4 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'photo'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            4. Student Pic
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="m-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Modal Body Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Father's Name *</label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender || 'Male'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    name="category"
                    value={formData.category || 'General'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="General">General (OM)</option>
                    <option value="RBA">RBA (Reserved Backward Area)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="OBC">OBC / OSC</option>
                    <option value="EWS">EWS</option>
                    <option value="PSP">PSP / ALC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / Contact Number *</label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aadhar Card Number</label>
                  <input
                    type="text"
                    name="aadharNumber"
                    value={formData.aadharNumber || ''}
                    onChange={handleChange}
                    placeholder="12-digit Aadhar No."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <input
                    type="text"
                    name="bloodGroup"
                    value={formData.bloodGroup || ''}
                    onChange={handleChange}
                    placeholder="e.g. O+, A+, B+"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Father Occupation</label>
                  <input
                    type="text"
                    name="fatherOccupation"
                    value={formData.fatherOccupation || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PEN Number (Student)</label>
                  <input
                    type="text"
                    name="penNumber"
                    value={formData.penNumber || ''}
                    onChange={handleChange}
                    placeholder="Permanent Education Number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address *</label>
                <textarea
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  rows={2}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC QUALIFICATION & MARKS */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Marks Obtained</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">{currentMarks} / {currentTotal}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Calculated Percentage</span>
                  <span className="text-base font-extrabold text-emerald-700 font-mono">{gradeCalc.percentageFormatted}%</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Grade & Division</span>
                  <span className="text-base font-extrabold text-amber-800 font-mono">Grade {gradeCalc.grade} ({gradeCalc.division})</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class / Stream Applied *</label>
                  <select
                    name="courseApplied"
                    value={formData.courseApplied || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Science Stream (Medical: Physics, Chemistry, Biology)">11th/12th Science Stream (Medical)</option>
                    <option value="Science Stream (Non-Medical: Physics, Chemistry, Maths)">11th/12th Science Stream (Non-Medical)</option>
                    <option value="Arts / Humanities Stream">11th/12th Arts / Humanities Stream</option>
                    <option value="Commerce Stream">11th/12th Commerce Stream</option>
                    <option value="Class 10th (Secondary)">Class 10th Secondary</option>
                    <option value="Class 9th (Secondary)">Class 9th Secondary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Session *</label>
                  <input
                    type="text"
                    name="session"
                    value={formData.session || '2026-2027'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Previous Qualification *</label>
                  <input
                    type="text"
                    name="previousQualification"
                    value={formData.previousQualification || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Board / University *</label>
                  <input
                    type="text"
                    name="boardUniversity"
                    value={formData.boardUniversity || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Previous Exam Roll No</label>
                  <input
                    type="text"
                    name="prevRollNumber"
                    value={formData.prevRollNumber || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Board Registration No.</label>
                  <input
                    type="text"
                    name="boardRegNo"
                    value={formData.boardRegNo || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Passing Year</label>
                  <input
                    type="text"
                    name="passingYear"
                    value={formData.passingYear || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marks Obtained *</label>
                  <input
                    type="number"
                    name="marksObtained"
                    value={formData.marksObtained ?? 0}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Maximum Marks *</label>
                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks ?? 500}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Major Subjects Selected</label>
                <input
                  type="text"
                  name="majorSubjects"
                  value={formData.majorSubjects || ''}
                  onChange={handleChange}
                  placeholder="e.g. Physics, Chemistry, Biology, General English"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: VERIFICATION & ADMISSION STATUS */}
          {activeTab === 'verification' && (
            <div className="space-y-4">
              {/* Document Verification Checklist */}
              <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-emerald-400 flex items-center gap-1.5">
                    <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                    Incharge Document Verification Checklist
                  </h3>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono border border-emerald-800">
                    Admission Cell Duty
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: 'marksCertificate', label: '10th/12th Original Marks Certificate' },
                    { key: 'aadhaarProof', label: 'Aadhaar Card / Photo ID Proof' },
                    { key: 'categoryCertificate', label: 'Category / Domicile Certificate' },
                    { key: 'characterCertificate', label: 'School Discharge / Character Cert.' },
                    { key: 'photoMatched', label: 'Candidate Photograph Cross-Matched' },
                  ].map((doc) => {
                    const isChecked = !!(formData.verifiedDocuments as any)?.[doc.key];
                    return (
                      <label
                        key={doc.key}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            verifiedDocuments: {
                              ...prev.verifiedDocuments,
                              [doc.key]: !isChecked,
                            },
                          }));
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="text-[11px] font-semibold">{doc.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Incharge Sign-off & Verification Remarks */}
              <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Incharge Admission Sign-Off & Verification
                  </h3>
                  <button
                    type="button"
                    onClick={handleAutoAssignRoll}
                    className="text-[11px] font-bold text-blue-800 underline hover:text-blue-900 cursor-pointer"
                  >
                    Auto-Verify & Assign Roll
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Admission Status *</label>
                    <select
                      name="status"
                      value={formData.status || 'Pending'}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-emerald-400 rounded-lg text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    >
                      <option value="Pending">Pending Verification</option>
                      <option value="Approved">Approved (Roll Assigned)</option>
                      <option value="Fee Deposited">Fee Deposited</option>
                      <option value="Admitted">Fully Admitted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Assigned Roll Number</label>
                    <input
                      type="text"
                      name="assignedRollNumber"
                      value={formData.assignedRollNumber || ''}
                      onChange={handleChange}
                      placeholder="e.g. 2026-104"
                      className="w-full px-3 py-2 border border-emerald-400 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Enrolment Number</label>
                    <input
                      type="text"
                      name="enrolmentNumber"
                      value={formData.enrolmentNumber || ''}
                      onChange={handleChange}
                      placeholder="e.g. JKB-2026-9481"
                      className="w-full px-3 py-2 border border-emerald-400 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Admission No (Adm No)</label>
                    <input
                      type="text"
                      name="admNo"
                      value={formData.admNo || ''}
                      onChange={handleChange}
                      placeholder="e.g. BHSS-4812"
                      className="w-full px-3 py-2 border border-emerald-400 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Verified By (Incharge Officer)</label>
                    <input
                      type="text"
                      name="verifiedBy"
                      value={formData.verifiedBy || 'Incharge Admission Cell'}
                      onChange={handleChange}
                      placeholder="Name / Designation of Incharge"
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Verification Date</label>
                    <input
                      type="date"
                      name="verifiedDate"
                      value={formData.verifiedDate || new Date().toISOString().split('T')[0]}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">Incharge Verification Remarks</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            verificationRemarks: 'All original certificates & credentials physically verified. Approved for admission.',
                          }))
                        }
                        className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded hover:bg-emerald-300 cursor-pointer"
                      >
                        + Approved Preset
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            verificationRemarks: 'Provisionally verified subject to submission of pending Domicile / Category certificate.',
                          }))
                        }
                        className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded hover:bg-amber-300 cursor-pointer"
                      >
                        + Provisional Preset
                      </button>
                    </div>
                  </div>
                  <textarea
                    name="verificationRemarks"
                    value={formData.verificationRemarks || ''}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Enter official comments or verification notes for student record..."
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Fee & Accounts Ledger */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-800" />
                  Fee Ledger & Payment Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fee Payment Status *</label>
                    <select
                      name="feeStatus"
                      value={formData.feeStatus || 'Unpaid'}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fee Amount (₹ INR)</label>
                    <input
                      type="number"
                      name="feeAmount"
                      value={formData.feeAmount ?? 1400}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Challan No</label>
                    <input
                      type="text"
                      name="bankChallanNo"
                      value={formData.bankChallanNo || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Conduct Rating</label>
                    <select
                      name="conductRating"
                      value={formData.conductRating || 'Very Good'}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="Excellent">Excellent</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                      <option value="Satisfactory">Satisfactory</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Discharge Certificate (DC) Status */}
              <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl space-y-3">
                <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-800" />
                  Discharge Certificate (DC) Clearance Status
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">DC Clearance Status</label>
                    <select
                      name="dcStatus"
                      value={formData.dcStatus || 'Not Requested'}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    >
                      <option value="Not Requested">Not Requested</option>
                      <option value="Requested">DC Requested by Student</option>
                      <option value="Approved">Dues Cleared / Approved</option>
                      <option value="Issued">DC Certificate Issued</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">DC Request Reason</label>
                    <input
                      type="text"
                      name="dcReason"
                      value={formData.dcReason || ''}
                      onChange={handleChange}
                      placeholder="e.g. Higher Education / Transfer"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STUDENT PHOTOGRAPH */}
          {activeTab === 'photo' && (
            <div className="space-y-4 text-center">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                <div className="relative">
                  <div className="w-32 h-40 border-2 border-slate-800 rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center mb-2">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-slate-400 font-bold text-xs">
                        No Photo Available
                      </div>
                    )}
                  </div>
                  {formData.photoUrl && (
                    <span className="inline-block bg-slate-900 text-emerald-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/30 shadow mb-3">
                      Size: {getPhotoSizeKB(formData.photoUrl)} (&lt;50KB)
                    </span>
                  )}
                </div>

                <label className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-2 mt-1">
                  <ImageIcon className="w-4 h-4" />
                  Upload Pic (&lt;50KB)
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <p className="text-[11px] text-slate-600 mt-2 font-medium">
                  Photos are auto-compressed strictly under <strong>50KB</strong> and stored on backend disk storage (<code>/uploads/photos/</code>).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-left">Or Enter Photo Image URL / Storage Path directly:</label>
                <input
                  type="text"
                  name="photoUrl"
                  value={formData.photoUrl || ''}
                  onChange={handleChange}
                  placeholder="/uploads/photos/... or https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteRecord}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Permanently Delete Candidate Record"
              >
                <Trash2 className="w-4 h-4" />
                Delete Record
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  const roll = formData.assignedRollNumber || `2026-${Math.floor(100 + Math.random() * 900)}`;
                  const enr = formData.enrolmentNumber || `JKB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                  const adm = formData.admNo || `BHSS-${Math.floor(1000 + Math.random() * 9000)}`;
                  setFormData((prev) => ({
                    ...prev,
                    status: 'Approved',
                    assignedRollNumber: roll,
                    enrolmentNumber: enr,
                    admNo: adm,
                    verifiedBy: prev.verifiedBy || 'Incharge Admission Cell',
                    verifiedDate: prev.verifiedDate || today,
                    verificationRemarks: prev.verificationRemarks || 'Physically verified & approved by Admission Incharge.',
                  }));
                }}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow flex items-center gap-1.5 transition cursor-pointer"
                title="Set Status to Approved and assign Roll Number"
              >
                Approve Application
              </button>

              <button
                type="button"
                onClick={() => {
                  const reason = window.prompt('Enter rejection reason for this student:', 'Incomplete documents / Ineligible criteria');
                  if (reason !== null) {
                    const today = new Date().toISOString().split('T')[0];
                    setFormData((prev) => ({
                      ...prev,
                      status: 'Rejected',
                      verifiedBy: prev.verifiedBy || 'Incharge Admission Cell',
                      verifiedDate: prev.verifiedDate || today,
                      verificationRemarks: `REJECTED: ${reason || 'Incomplete criteria'}`,
                    }));
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow flex items-center gap-1.5 transition cursor-pointer"
                title="Set Status to Rejected"
              >
                Reject Application
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-lg flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving Changes...' : 'Save & Update Record'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
