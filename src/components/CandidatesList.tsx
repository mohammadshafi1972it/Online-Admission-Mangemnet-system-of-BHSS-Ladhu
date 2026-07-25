import React, { useState } from 'react';
import { Candidate } from '../types';
import { calculateGradeAndPercentage } from '../utils/grade';
import { updateCandidateRecord, deleteCandidateRecord, clearAllCandidateRecords } from '../utils/api';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  QrCode, 
  Eye, 
  IndianRupee, 
  GraduationCap,
  Sparkles,
  RefreshCw,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface CandidatesListProps {
  candidates: Candidate[];
  onRefresh: () => void;
  onOpenDocuments: (candidate: Candidate, docType: string) => void;
  onOpenQR: (candidate: Candidate) => void;
}

export const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  onRefresh,
  onOpenDocuments,
  onOpenQR,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Unique list of courses for filtering dropdown
  const courses = Array.from(new Set(candidates.map((c) => c.courseApplied)));

  const filteredCandidates = candidates.filter((c) => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchTerm ||
      c.id.toLowerCase().includes(searchLower) ||
      c.fullName.toLowerCase().includes(searchLower) ||
      c.fatherName.toLowerCase().includes(searchLower) ||
      c.mobile.includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      (c.assignedRollNumber && c.assignedRollNumber.toLowerCase().includes(searchLower)) ||
      (c.enrolmentNumber && c.enrolmentNumber.toLowerCase().includes(searchLower));

    const matchesCourse = !courseFilter || c.courseApplied === courseFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const handleStatusUpdate = async (candidate: Candidate, newStatus: Candidate['status']) => {
    setLoadingId(candidate.id);
    try {
      await updateCandidateRecord(candidate.id, { status: newStatus });
      onRefresh();
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setLoadingId(null);
    }
  };

  const handleFeePaymentToggle = async (candidate: Candidate) => {
    setLoadingId(candidate.id);
    const newFeeStatus = candidate.feeStatus === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      await updateCandidateRecord(candidate.id, { 
        feeStatus: newFeeStatus,
        status: newFeeStatus === 'Paid' ? 'Admitted' : candidate.status 
      });
      onRefresh();
    } catch (err) {
      alert('Failed to update fee status');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteCandidate = async (candidate: Candidate) => {
    if (window.confirm(`Are you sure you want to permanently delete student record for "${candidate.fullName}" (${candidate.id})?`)) {
      setLoadingId(candidate.id);
      try {
        await deleteCandidateRecord(candidate.id);
        onRefresh();
      } catch (err) {
        alert('Failed to delete candidate record');
      } finally {
        setLoadingId(null);
      }
    }
  };

  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleConfirmClearAll = async () => {
    setClearing(true);
    try {
      await clearAllCandidateRecords();
      setShowClearModal(false);
      onRefresh();
      alert('All student candidate records have been deleted successfully.');
    } catch (err) {
      alert('Failed to clear candidate records.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <FileSpreadsheet className="w-4 h-4" />
            Live Excel Backend Database
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Student Candidate Records</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Data is dynamically synchronized with the backend <code className="font-mono bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded">candidates.xlsx</code> file.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={onRefresh}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title="Reload backend records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload DB
          </button>

          <a
            href="/api/export-excel"
            download="Candidates_Admission_Database.xlsx"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </a>

          <button
            onClick={() => setShowClearModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-extrabold text-xs transition shadow-md flex items-center gap-1.5 border border-rose-500/40 cursor-pointer"
            title="Admission Incharge: Erase All Student Records"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Name, Application ID, Roll No, Mobile..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            Filters:
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
          >
            <option value="">All Streams ({courses.length})</option>
            {courses.map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Admitted">Admitted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Student & Application ID</th>
                <th className="py-3.5 px-4">Father & Contact</th>
                <th className="py-3.5 px-4">Stream & Marks</th>
                <th className="py-3.5 px-4">Assigned Roll & Enrolment</th>
                <th className="py-3.5 px-4">Admission Status</th>
                <th className="py-3.5 px-4">Fee Payment</th>
                <th className="py-3.5 px-4 text-center">QR & Auto Documents</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-medium">
                    No candidates found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50/80 transition">
                    {/* Name & Application ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center shrink-0 text-sm">
                          {candidate.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{candidate.fullName}</p>
                          <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-200">
                            {candidate.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Father & Contact */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-semibold">{candidate.fatherName}</p>
                      <p className="text-slate-500">{candidate.mobile}</p>
                    </td>

                    {/* Course & Marks */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{candidate.courseApplied}</p>
                      {(() => {
                        const g = calculateGradeAndPercentage(candidate.marksObtained, candidate.totalMarks);
                        return (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-emerald-700 font-extrabold text-xs">
                              {candidate.percentage || g.percentageFormatted}% ({candidate.marksObtained}/{candidate.totalMarks})
                            </span>
                            <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-amber-100 text-amber-900 border border-amber-300">
                              Grade {candidate.grade || g.grade}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Assigned Roll & Enrolment */}
                    <td className="py-3.5 px-4 font-mono">
                      {candidate.assignedRollNumber ? (
                        <div>
                          <p className="font-bold text-slate-900">Roll: {candidate.assignedRollNumber}</p>
                          <p className="text-[10px] text-slate-500">Enr: {candidate.enrolmentNumber}</p>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-sans italic text-[11px]">Pending Approval</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase ${
                          candidate.status === 'Admitted'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : candidate.status === 'Approved'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {candidate.status}
                        </span>

                        {candidate.status === 'Pending' && (
                          <button
                            onClick={() => handleStatusUpdate(candidate, 'Approved')}
                            disabled={loadingId === candidate.id}
                            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] transition"
                            title="Approve and assign Roll Number"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Fee Payment */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleFeePaymentToggle(candidate)}
                        disabled={loadingId === candidate.id}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition border flex items-center gap-1 ${
                          candidate.feeStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        <IndianRupee className="w-3 h-3" />
                        {candidate.feeStatus === 'Paid' ? 'Paid (₹' + candidate.feeAmount + ')' : 'Mark Paid'}
                      </button>
                    </td>

                    {/* Quick Document Generator Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenQR(candidate)}
                          className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition border border-teal-200"
                          title="View Student Verification QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenDocuments(candidate, 'discharge')}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition border border-amber-200 text-[11px] font-bold"
                          title="Generate Discharge Certificate (DC)"
                        >
                          DC
                        </button>

                        <button
                          onClick={() => onOpenDocuments(candidate, 'character')}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200 text-[11px] font-bold"
                          title="Generate Character Certificate"
                        >
                          Char
                        </button>

                        <button
                          onClick={() => onOpenDocuments(candidate, 'provisional')}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200 text-[11px] font-bold"
                          title="Generate Provisional Certificate"
                        >
                          Prov
                        </button>

                        <button
                          onClick={() => onOpenDocuments(candidate, 'library')}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition border border-slate-300 text-[11px] font-bold"
                          title="Generate Library Form & Pass"
                        >
                          Lib
                        </button>

                        <button
                          onClick={() => onOpenDocuments(candidate, 'bank-slip')}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition border border-emerald-200 text-[11px] font-bold"
                          title="Generate Bank Fee Deposition Slip"
                        >
                          Slip
                        </button>

                        <button
                          onClick={() => handleDeleteCandidate(candidate)}
                          disabled={loadingId === candidate.id}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 transition border border-rose-200"
                          title="Delete Student Record"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLEAR ALL DATA MODAL FOR INCHARGE ADMISSION */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Incharge Admission Data Erasure</h3>
                <p className="text-xs text-rose-600 font-bold">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to <strong>delete all candidate records</strong> from the system and clear the backend Excel database? All student records, roll numbers, and admission forms will be purged.
            </p>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-[11px] text-rose-800 font-semibold space-y-1">
              <p>• Total records to erase: <strong>{candidates.length}</strong></p>
              <p>• Backup recommended before proceeding (Use Export Excel).</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmClearAll}
                disabled={clearing}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition shadow flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {clearing ? 'Deleting All...' : 'Yes, Permanently Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
