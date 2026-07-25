import React, { useState } from 'react';
import { Candidate } from '../types';
import { fetchCandidateByIdentifier, submitDCApplication } from '../utils/api';
import { 
  FileCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Building, 
  GraduationCap, 
  ArrowRight, 
  ShieldCheck,
  FileText
} from 'lucide-react';

interface ApplyDCProps {
  onSuccessDC: (candidate: Candidate) => void;
  onOpenDocuments: (candidate: Candidate, docType: string) => void;
  onTriggerQRScan: () => void;
}

export const ApplyDC: React.FC<ApplyDCProps> = ({ onSuccessDC, onOpenDocuments, onTriggerQRScan }) => {
  const [identifier, setIdentifier] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [searchError, setSearchError] = useState('');

  const [dcReason, setDcReason] = useState('Completion of studies / Higher Education');
  const [duesCleared, setDuesCleared] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dcSuccess, setDcSuccess] = useState<Candidate | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setSearchError('Please enter Application ID, Roll Number, or Enrolment Number');
      return;
    }

    setSearching(true);
    setSearchError('');
    setCandidate(null);

    try {
      const found = await fetchCandidateByIdentifier(identifier);
      if (!found) {
        setSearchError(`No candidate found in backend Excel DB with ID/Roll No: "${identifier}"`);
      } else {
        setCandidate(found);
      }
    } catch (err) {
      setSearchError('Error fetching student record from backend');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmitDC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;
    if (!duesCleared) {
      alert('Dues Clearance confirmation is required before submitting Discharge Certificate application.');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await submitDCApplication(candidate.id, dcReason);
      setDcSuccess(updated);
      onSuccessDC(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to submit Discharge Certificate application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (dcSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-amber-800 text-white p-6 sm:p-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-100 bg-amber-900/40 px-2.5 py-0.5 rounded-full">
                  DC Request Registered
                </span>
                <h2 className="text-2xl font-extrabold mt-1">Discharge Application Submitted</h2>
                <p className="text-amber-100 text-xs">Updated in Backend Excel Database</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
              <p className="text-sm font-bold text-amber-900">
                Application details for {dcSuccess.fullName}:
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs text-amber-800 font-medium">
                <div><span className="text-slate-500">Student ID:</span> {dcSuccess.id}</div>
                <div><span className="text-slate-500">Roll No:</span> {dcSuccess.assignedRollNumber || 'N/A'}</div>
                <div><span className="text-slate-500">Course:</span> {dcSuccess.courseApplied}</div>
                <div><span className="text-slate-500">DC Application Status:</span> <span className="font-bold text-amber-900">{dcSuccess.dcStatus}</span></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => onOpenDocuments(dcSuccess, 'discharge')}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition shadow-md"
              >
                <FileText className="w-4 h-4" />
                Preview & Print Discharge Certificate
              </button>

              <button
                onClick={() => {
                  setDcSuccess(null);
                  setCandidate(null);
                  setIdentifier('');
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition"
              >
                Apply Another DC
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">Online Discharge Certificate (DC) Portal</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Auto-fetches candidate profile from backend Excel database by Application ID or Roll Number.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Step 1: Candidate Lookup */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              Step 1: Lookup Student in Backend Excel DB
            </h3>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter Application ID (ADM-2026-1001) or Roll No (26BSC101)..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
              </div>

              <button
                type="submit"
                disabled={searching}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow flex items-center justify-center gap-2 shrink-0"
              >
                {searching ? 'Fetching...' : 'Auto-Fetch Details'}
              </button>

              <button
                type="button"
                onClick={onTriggerQRScan}
                className="px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shrink-0"
                title="Scan QR Code to Auto-Fetch Student"
              >
                <QrCode className="w-4 h-4" />
                Scan QR
              </button>
            </form>

            {searchError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {searchError}
              </div>
            )}
          </div>

          {/* Step 2: Auto-Fetched Student Information */}
          {candidate && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-200">
                      {candidate.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{candidate.fullName}</h4>
                      <p className="text-xs text-slate-500">Father Name: {candidate.fatherName}</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                    candidate.status === 'Admitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {candidate.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Application ID</span>
                    <span className="font-bold text-slate-800 font-mono">{candidate.id}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Assigned Roll No</span>
                    <span className="font-bold text-slate-800 font-mono">{candidate.assignedRollNumber || 'Pending'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Enrolment Number</span>
                    <span className="font-bold text-slate-800 font-mono">{candidate.enrolmentNumber || 'Pending'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Current Course</span>
                    <span className="font-bold text-blue-700">{candidate.courseApplied}</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Discharge Application Form */}
              <form onSubmit={handleSubmitDC} className="space-y-5 bg-amber-50/50 border border-amber-200 rounded-2xl p-5 sm:p-6">
                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-700" />
                  Step 2: Enter Reason & Dues Clearance Confirmation
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Reason for Requesting Discharge / Transfer Certificate
                  </label>
                  <select
                    value={dcReason}
                    onChange={(e) => setDcReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 text-sm font-medium bg-white"
                  >
                    <option value="Completion of Course / Passing Final Exam">Completion of Course / Passing Final Exam</option>
                    <option value="Joining Higher Education Institution / University">Joining Higher Education Institution / University</option>
                    <option value="Personal Reasons / Relocation">Personal Reasons / Relocation</option>
                    <option value="Transfer to Other School / Institution">Transfer to Other School / Institution</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={duesCleared}
                      onChange={(e) => setDuesCleared(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Confirm No Dues Clearance</span>
                      <span className="text-slate-500">
                        I certify that all library books, laboratory equipment, and tuition fees have been cleared with zero outstanding dues.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-7 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition shadow flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Discharge Certificate Application'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
