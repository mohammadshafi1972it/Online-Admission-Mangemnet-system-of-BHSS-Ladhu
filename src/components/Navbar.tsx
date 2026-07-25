import React, { useState } from 'react';
import { ActiveTab, UserRole } from '../types';
import { downloadExcelDatabase } from '../utils/exportExcel';
import { InchargeLoginModal } from './InchargeLoginModal';
import { 
  GraduationCap, 
  FileSpreadsheet, 
  QrCode, 
  FileText, 
  UserPlus, 
  FileCheck, 
  LayoutDashboard,
  Download,
  ShieldCheck,
  Upload,
  User,
  ShieldAlert,
  ArrowRightLeft,
  Lock,
  KeyRound,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingCount: number;
  onShowStudentQR: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  userRole, 
  setUserRole, 
  activeTab, 
  setActiveTab, 
  pendingCount,
  onShowStudentQR
}) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Role Identity */}
          <div 
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => setActiveTab(userRole === 'student' ? 'apply-admission' : 'dashboard')}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-colors ${
              userRole === 'student' ? 'bg-amber-600 group-hover:bg-amber-500' : 'bg-blue-600 group-hover:bg-blue-500'
            }`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-slate-100 tracking-tight flex items-center gap-2">
                {userRole === 'student' ? 'STUDENT ADMISSION PORTAL' : 'CAMPUS PORTAL'}
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  userRole === 'student'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {userRole === 'student' ? (
                    <>
                      <User className="w-3 h-3 text-amber-400" />
                      Student Form Mode
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Incharge Admission
                    </>
                  )}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                {userRole === 'student'
                  ? 'Official Student Online Application & Document Upload Portal'
                  : 'Admission Control, Password Protected Admin & Backend Excel Hub'}
              </p>
            </div>
          </div>

          {/* Action Tools & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {userRole === 'incharge' ? (
              <>
                {/* Generate Student QR Code Button */}
                <button
                  onClick={onShowStudentQR}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm border border-indigo-500 flex items-center gap-1.5"
                  title="Generate QR code for students to scan on their mobile devices"
                >
                  <QrCode className="w-4 h-4 text-amber-300" />
                  <span className="hidden md:inline">Student Form QR</span>
                </button>

                {/* Export Excel DB */}
                <button
                  onClick={() => downloadExcelDatabase()}
                  className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition shadow-sm border border-emerald-600 cursor-pointer"
                  title="Download live Excel spreadsheet from backend server"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  Export Excel DB
                </button>

                {/* Change Security PIN */}
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition"
                  title="Change Incharge Admission Access Password / PIN"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  <span>PIN Settings</span>
                </button>

                {/* Lock Session / Switch to Student View */}
                <button
                  onClick={() => {
                    setUserRole('student');
                    setActiveTab('apply-admission');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center gap-1.5"
                  title="Lock session & switch preview to Student Form view"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Lock / Student View</span>
                </button>
              </>
            ) : (
              <>
                {/* Student Mode Header Notice */}
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 px-3 py-1 rounded-lg">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Password Protected Admin Portal</span>
                </div>

                {/* Switch to Incharge Admission Mode Modal Trigger */}
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs transition shadow-md border border-blue-500 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-emerald-300" />
                  <span>Incharge Admission Login</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800 text-xs sm:text-sm font-medium">
          
          {userRole === 'student' ? (
            /* STUDENT ONLY NAVIGATION: ONLY ADMISSION FORM IS VISIBLE */
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <button
                onClick={() => setActiveTab('apply-admission')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white font-bold shadow text-xs sm:text-sm"
              >
                <UserPlus className="w-4 h-4 text-amber-200" />
                Online Student Admission Form
              </button>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-3 py-1.5 rounded-xl">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>QR Mode Active: Only Admission Form Visible (All Admin & DB Features Disabled)</span>
              </div>
            </div>
          ) : (
            /* INCHARGE ADMISSION FULL NAVIGATION TABS */
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab('apply-admission')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'apply-admission'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4 text-blue-400" />
                Apply Admission
              </button>


              <button
                onClick={() => setActiveTab('candidates-list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'candidates-list'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Backend Excel DB
                {pendingCount > 0 && (
                  <span className="ml-1 bg-amber-500 text-slate-950 font-bold text-xs px-1.5 py-0.2 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('generate-documents')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'generate-documents'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                Auto Certificates & Forms
              </button>

              <button
                onClick={() => setActiveTab('qr-scanner')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'qr-scanner'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4 text-teal-400" />
                QR Scanner & Lookup
              </button>

              <button
                onClick={() => setActiveTab('excel-manage')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'excel-manage'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Download className="w-4 h-4 text-cyan-400" />
                Excel Sync & Import
              </button>

              <button
                onClick={() => setActiveTab('uploaded-forms')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                  activeTab === 'uploaded-forms'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4 text-purple-400" />
                Uploaded Form Hub
              </button>
            </>
          )}

        </div>
      </div>

      {/* Incharge Admission Password / PIN Login Modal */}
      <InchargeLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setUserRole('incharge');
          setActiveTab('dashboard');
        }}
      />
    </header>
  );
};

