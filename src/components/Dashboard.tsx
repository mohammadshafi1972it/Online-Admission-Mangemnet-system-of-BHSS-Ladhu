import React, { useState } from 'react';
import { Candidate, ActiveTab } from '../types';
import { 
  UserPlus, 
  FileCheck, 
  FileSpreadsheet, 
  QrCode, 
  FileText, 
  Users, 
  CheckCircle2, 
  Clock, 
  IndianRupee,
  ArrowRight,
  Sparkles,
  Download,
  XCircle,
  Filter
} from 'lucide-react';

interface DashboardProps {
  candidates: Candidate[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDocuments: (candidate: Candidate, docType: string) => void;
  onOpenQR: (candidate: Candidate) => void;
  onShowStudentQR?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  candidates,
  setActiveTab,
  onOpenDocuments,
  onOpenQR,
  onShowStudentQR,
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const totalCandidates = candidates.length;
  const pendingCount = candidates.filter((c) => c.status === 'Pending').length;
  const approvedCount = candidates.filter((c) => c.status === 'Admitted' || c.status === 'Approved' || c.status === 'Fee Deposited').length;
  const rejectedCount = candidates.filter((c) => c.status === 'Rejected').length;
  const totalFeesCollected = candidates
    .filter((c) => c.feeStatus === 'Paid')
    .reduce((sum, c) => sum + (c.feeAmount || 0), 0);

  const filteredCandidates = candidates.filter((c) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Pending') return c.status === 'Pending';
    if (statusFilter === 'Approved') return c.status === 'Admitted' || c.status === 'Approved' || c.status === 'Fee Deposited';
    if (statusFilter === 'Rejected') return c.status === 'Rejected';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Central Campus Admission & Certificate Automation System
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Online Admission Forms & Auto-Certificates
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Complete workflow for online admission applications, Discharge Certificate (DC) requests, student QR code validation, and real-time backend synchronization with institutional Excel spreadsheets.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('apply-admission')}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Apply Online for Admission
            </button>

            <button
              onClick={() => setActiveTab('apply-dc')}
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              Apply DC / Transfer
            </button>

            {onShowStudentQR && (
              <button
                onClick={onShowStudentQR}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm transition shadow-lg flex items-center gap-2 border border-purple-400 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-amber-300" />
                Print QR Admission Poster
              </button>
            )}

            <a
              href="/api/export-excel"
              download="Candidates_Admission_Database.xlsx"
              className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm transition shadow-lg flex items-center gap-2 border border-emerald-600 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              Export Excel DB
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Applicants */}
        <div 
          onClick={() => setStatusFilter('All')}
          className={`bg-white rounded-2xl p-5 shadow-md border transition cursor-pointer space-y-1 ${
            statusFilter === 'All' ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Applicants</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{totalCandidates}</p>
          <p className="text-[11px] text-slate-500">Click to show all candidates</p>
        </div>

        {/* Pending Review */}
        <div 
          onClick={() => setStatusFilter('Pending')}
          className={`bg-white rounded-2xl p-5 shadow-md border transition cursor-pointer space-y-1 ${
            statusFilter === 'Pending' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{pendingCount}</p>
          <p className="text-[11px] text-slate-500">Click to filter pending</p>
        </div>

        {/* Admitted / Approved */}
        <div 
          onClick={() => setStatusFilter('Approved')}
          className={`bg-white rounded-2xl p-5 shadow-md border transition cursor-pointer space-y-1 ${
            statusFilter === 'Approved' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Admitted / Approved</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{approvedCount}</p>
          <p className="text-[11px] text-slate-500">Click to filter approved</p>
        </div>

        {/* Fees Deposited */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200 space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Fees Deposited</span>
            <IndianRupee className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-teal-700 font-mono">
            ₹{(totalFeesCollected / 1000).toFixed(1)}k
          </p>
          <p className="text-[11px] text-slate-500">Total fees recorded</p>
        </div>
      </div>

      {/* Quick Automation Cards */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Quick Automation Workflows
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div 
            onClick={() => setActiveTab('apply-admission')}
            className="bg-white hover:bg-slate-50/80 rounded-2xl p-6 shadow-md border border-slate-200 transition cursor-pointer group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">Online Admission Form</h3>
              <p className="text-xs text-slate-500 mt-1">Submit personal & qualification details, auto-calculate fees, and generate instant application QR receipt.</p>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-blue-600">
              Apply Now <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => setActiveTab('generate-documents')}
            className="bg-white hover:bg-slate-50/80 rounded-2xl p-6 shadow-md border border-slate-200 transition cursor-pointer group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">Auto-Certificate Generator</h3>
              <p className="text-xs text-slate-500 mt-1">Auto-fetches candidate data from backend Excel DB to generate Discharge, Character, Provisional certs, Library cards & Bank fee slips.</p>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-indigo-600">
              Generate Certificates <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => setActiveTab('qr-scanner')}
            className="bg-white hover:bg-slate-50/80 rounded-2xl p-6 shadow-md border border-slate-200 transition cursor-pointer group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition">QR Code Validation</h3>
              <p className="text-xs text-slate-500 mt-1">Scan student QR code or enter Application ID to instantly verify candidate profile and generate documents on counter.</p>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-teal-600">
              Open Scanner <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Filterable Candidate Applications Table */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              Candidate Applications Directory
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono border border-slate-200">
                {filteredCandidates.length} {statusFilter === 'All' ? 'Total' : statusFilter}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter student applications by approval status or switch to full database manager.
            </p>
          </div>

          {/* Status Filter Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {/* All */}
            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                statusFilter === 'All' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalCandidates}
              </span>
            </button>

            {/* Pending */}
            <button
              type="button"
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-100/80'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                statusFilter === 'Pending' ? 'bg-amber-800 text-amber-100' : 'bg-amber-200/80 text-amber-900'
              }`}>
                {pendingCount}
              </span>
            </button>

            {/* Approved / Admitted */}
            <button
              type="button"
              onClick={() => setStatusFilter('Approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Approved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 hover:bg-emerald-100/80'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved / Admitted</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                statusFilter === 'Approved' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-200/80 text-emerald-900'
              }`}>
                {approvedCount}
              </span>
            </button>

            {/* Rejected */}
            <button
              type="button"
              onClick={() => setStatusFilter('Rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Rejected'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-800 hover:bg-rose-100/80'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                statusFilter === 'Rejected' ? 'bg-rose-800 text-rose-100' : 'bg-rose-200/80 text-rose-900'
              }`}>
                {rejectedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Table View */}
        {filteredCandidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Academic Stream</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{candidate.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{candidate.fullName}</td>
                    <td className="py-3 px-4 text-slate-700">{candidate.courseApplied}</td>
                    <td className="py-3 px-4 font-mono">{candidate.assignedRollNumber || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                        candidate.status === 'Admitted' || candidate.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : candidate.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onOpenDocuments(candidate, 'discharge')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition border border-indigo-200 text-[11px] cursor-pointer"
                      >
                        Certificates
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Filter className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No candidate records found matching "{statusFilter}" status.</p>
            <button
              onClick={() => setStatusFilter('All')}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Reset Filter to View All ({totalCandidates})
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setActiveTab('candidates-list')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
          >
            Manage Full Excel Database ({totalCandidates} Records) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

