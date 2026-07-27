import React, { useState, useEffect } from 'react';
import { Candidate, ActiveTab, DocumentType, UserRole } from './types';
import { fetchCandidates } from './utils/api';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ApplyAdmission } from './components/ApplyAdmission';
import { CandidatesList } from './components/CandidatesList';
import { DocumentGenerator } from './components/DocumentGenerator';
import { QRScannerView } from './components/QRScannerView';
import { ExcelManager } from './components/ExcelManager';
import { UploadedFormsManager } from './components/UploadedFormsManager';
import { StudentQRModal } from './components/StudentQRModal';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('incharge');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [activeDocType, setActiveDocType] = useState<DocumentType>('discharge');
  const [isStudentQRModalOpen, setIsStudentQRModalOpen] = useState<boolean>(false);

  // Detect URL parameter for Student Mode (e.g. from scanning Student QR Code on mobile or Gmail)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchStr = window.location.search || '';
      const hashStr = window.location.hash || '';
      const fullUrl = window.location.href || '';

      const params = new URLSearchParams(searchStr);
      const hashParams = new URLSearchParams(hashStr.replace(/^#\/?/, '?'));

      const isStudentRole = 
        params.get('role') === 'student' || 
        params.get('mode') === 'student' || 
        params.get('form') === 'admission' ||
        hashParams.get('role') === 'student' ||
        hashParams.get('mode') === 'student' ||
        hashParams.get('form') === 'admission' ||
        fullUrl.includes('role=student') ||
        fullUrl.includes('mode=student') ||
        fullUrl.includes('form=admission');

      if (isStudentRole) {
        setUserRole('student');
        setActiveTab('apply-admission');
      }
    }
  }, []);

  // Strict Enforcement: In Student Mode, ONLY Admission Form is accessible. Rest of features are disabled.
  useEffect(() => {
    if (userRole === 'student' && activeTab !== 'apply-admission') {
      setActiveTab('apply-admission');
    }
  }, [userRole, activeTab]);

  const loadCandidatesData = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchCandidates();
      setCandidates(data);
      if (data.length > 0 && !selectedCandidate) {
        setSelectedCandidate(data[0]);
      }
    } catch (err) {
      console.error('Error loading candidates:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidatesData(true);

    // Real-Time Server-Sent Events (SSE) listener for immediate live updates
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type && parsed.type !== 'connected') {
            console.log('[Real-Time Sync] Live event received:', parsed.type);
            loadCandidatesData(false);
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };
      eventSource.onerror = () => {
        // Soft fail gracefully if proxy drops connection
      };
    } catch (err) {
      console.warn('EventSource setup warning:', err);
    }

    // Auto-sync polling every 4 seconds for bulletproof backup sync
    const interval = setInterval(() => {
      loadCandidatesData(false);
    }, 4000);

    const handleFocus = () => {
      loadCandidatesData(false);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleOpenDocuments = (candidate: Candidate, docType = 'discharge') => {
    if (userRole === 'student') return;
    setSelectedCandidate(candidate);
    setActiveDocType(docType as DocumentType);
    setActiveTab('generate-documents');
  };

  const handleOpenQR = (candidate: Candidate) => {
    if (userRole === 'student') return;
    setSelectedCandidate(candidate);
    setActiveTab('qr-scanner');
  };

  const pendingCount = candidates.filter((c) => c.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        userRole={userRole}
        setUserRole={setUserRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        onShowStudentQR={() => setIsStudentQRModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className={`flex-1 pb-16 ${isStudentQRModalOpen ? 'print:hidden' : ''}`}>
        {loading && candidates.length === 0 ? (
          <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Connecting to Backend Excel Storage...</p>
          </div>
        ) : (
          <>
            {/* INCHARGE ADMISSION TABS */}
            {userRole === 'incharge' && (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard
                    candidates={candidates}
                    setActiveTab={setActiveTab}
                    onOpenDocuments={handleOpenDocuments}
                    onOpenQR={handleOpenQR}
                    onShowStudentQR={() => setIsStudentQRModalOpen(true)}
                  />
                )}

                {activeTab === 'candidates-list' && (
                  <CandidatesList
                    candidates={candidates}
                    onRefresh={loadCandidatesData}
                    onOpenDocuments={handleOpenDocuments}
                    onOpenQR={handleOpenQR}
                  />
                )}

                {activeTab === 'generate-documents' && (
                  <DocumentGenerator
                    candidates={candidates}
                    selectedCandidate={selectedCandidate}
                    defaultDocType={activeDocType}
                    onSelectCandidate={setSelectedCandidate}
                  />
                )}

                {activeTab === 'qr-scanner' && (
                  <QRScannerView
                    onShowStudentQR={() => setIsStudentQRModalOpen(true)}
                    onSelectCandidate={(candidate, docType) => {
                      setSelectedCandidate(candidate);
                      if (docType) {
                        setActiveDocType(docType as DocumentType);
                        setActiveTab('generate-documents');
                      }
                    }}
                  />
                )}

                {activeTab === 'excel-manage' && (
                  <ExcelManager
                    candidates={candidates}
                    onRefresh={loadCandidatesData}
                  />
                )}
              </>
            )}

            {/* SHARED / STUDENT ACCESSIBLE FORM TABS */}
            {activeTab === 'apply-admission' && (
              <ApplyAdmission
                onSuccessSubmitted={(newCandidate) => {
                  loadCandidatesData();
                  setSelectedCandidate(newCandidate);
                }}
                onOpenDocuments={userRole === 'incharge' ? handleOpenDocuments : undefined}
                userRole={userRole}
              />
            )}

            {activeTab === 'uploaded-forms' && (
              <UploadedFormsManager
                candidates={candidates}
                onSuccessSubmitted={(newCandidate) => {
                  loadCandidatesData();
                  setSelectedCandidate(newCandidate);
                }}
                onOpenDocuments={userRole === 'incharge' ? handleOpenDocuments : undefined}
              />
            )}
          </>
        )}
      </main>

      {/* Student QR Poster Modal for Incharge Admission */}
      <StudentQRModal
        isOpen={isStudentQRModalOpen}
        onClose={() => setIsStudentQRModalOpen(false)}
        onSwitchToStudentView={() => {
          setUserRole('student');
          setActiveTab('apply-admission');
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Campus Admission & Auto-Certificate Management Portal</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Linked File: <code className="text-emerald-400 font-mono">/data/candidates.xlsx</code></span>
            <span>Mode: <strong className={userRole === 'student' ? 'text-amber-400' : 'text-emerald-400'}>{userRole === 'student' ? 'Student Form View' : 'Incharge Admission (Admin)'}</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
