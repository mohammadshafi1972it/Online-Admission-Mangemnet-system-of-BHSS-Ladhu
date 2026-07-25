import React from 'react';
import { Candidate } from '../types';
import { calculateGradeAndPercentage } from '../utils/grade';
import { triggerPrint } from '../utils/print';
import { Printer, X, Check } from 'lucide-react';

interface PrintableAdmissionFormProps {
  candidate: Candidate;
  qrCodeUrl?: string;
  onClose?: () => void;
}

export const PrintableAdmissionForm: React.FC<PrintableAdmissionFormProps> = ({
  candidate,
  qrCodeUrl,
  onClose,
}) => {
  const isSecondary = candidate.classWishToJoin === '9th Class' || candidate.classWishToJoin === '10th Class';
  const gradeCalc = calculateGradeAndPercentage(candidate.marksObtained, candidate.totalMarks);

  // Helper to test if a subject is in the candidate's selected major/elective subjects
  const isSubjectSelected = (subjectName: string): boolean => {
    if (!candidate.majorSubjects) return false;
    const subjects = candidate.majorSubjects.toLowerCase();
    const target = subjectName.toLowerCase();

    if (target === 'physics') return subjects.includes('physics');
    if (target === 'chemistry') return subjects.includes('chemistry');
    if (target === 'biology') return subjects.includes('biology');
    if (target === 'mathematics') return subjects.includes('math') || subjects.includes('mathematics');
    if (target === 'education') return subjects.includes('education');
    if (target === 'economics') return subjects.includes('economics');
    if (target === 'political science') return subjects.includes('political') || subjects.includes('pol');
    if (target === 'history') return subjects.includes('history');
    if (target === 'urdu') return subjects.includes('urdu');
    if (target.includes('it') || target.includes('ites')) return subjects.includes('it') || subjects.includes('ites');
    if (target.includes('tourism') || target.includes('hospitality')) return subjects.includes('tourism') || subjects.includes('hospitality');

    return subjects.includes(target);
  };

  // Clean stream name helper
  const rawStream = candidate.streamOpted || candidate.courseApplied || '';
  let cleanStreamName = rawStream;
  if (rawStream.toLowerCase().includes('science')) {
    cleanStreamName = 'Science Stream';
  } else if (rawStream.toLowerCase().includes('humanities') || rawStream.toLowerCase().includes('arts')) {
    cleanStreamName = 'Humanities / Arts Stream';
  } else if (rawStream.toLowerCase().includes('vocational') || rawStream.toLowerCase().includes('skill')) {
    cleanStreamName = 'Vocational Stream';
  } else if (isSecondary) {
    cleanStreamName = `Secondary (${candidate.classWishToJoin || '9th/10th'})`;
  }

  // Helper to extract clean list of selected subjects without duplicate stream names
  const getSelectedSubjectsList = (): string[] => {
    if (!candidate.majorSubjects) return ['General English'];
    const parts = candidate.majorSubjects
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .filter((s) => !s.toLowerCase().includes('stream') && !s.toLowerCase().includes('medical'));

    // Deduplicate case-insensitively
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const item of parts) {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(item);
      }
    }
    return unique.length > 0 ? unique : ['General English'];
  };

  const selectedSubjectsList = getSelectedSubjectsList();

  return (
    <div id="printable-admission-form" className="bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-4xl mx-auto shadow-2xl border border-slate-300 print:shadow-none print:border-none print:p-0">
      {/* Print Trigger Bar for Screen View */}
      <div className="print:hidden mb-6 bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border border-slate-800">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            Official BHSS Ladhoo Pampore Admission Form
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">Prints only submitted candidate information within institutional template</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => triggerPrint('printable-admission-form')}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Close Preview
            </button>
          )}
        </div>
      </div>

      {/* FORM CONTAINER - PAGE 1 */}
      <div className="border-2 border-slate-800 p-6 relative bg-white">
        {/* Header Block */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4">
          <div className="w-20 h-20 flex items-center justify-center shrink-0">
            <div className="w-16 h-16 rounded-full border-2 border-amber-600 flex items-center justify-center bg-amber-50">
              <span className="text-[10px] font-black text-amber-900 text-center uppercase leading-tight">
                BHSS<br />LADHOO
              </span>
            </div>
          </div>

          <div className="text-center flex-1 px-2">
            <h1 className="text-2xl font-extrabold uppercase tracking-wide text-slate-900">
              ADMISSION FORM
            </h1>
            <h2 className="text-lg font-black tracking-wider uppercase text-slate-900 mt-1">
              BOYS HIGHER SECONDARY SCHOOL LADHOO
            </h2>
            <h3 className="text-base font-bold uppercase tracking-widest text-slate-800 mt-0.5">
              PAMPORE
            </h3>
          </div>

          <div className="shrink-0 text-right">
            <div className="border-2 border-slate-900 px-3 py-1 text-center bg-slate-50">
              <span className="text-[10px] font-bold uppercase block text-slate-700">Adm. No.</span>
              <span className="text-sm font-mono font-bold text-slate-900">{candidate.admNo || candidate.id || '—'}</span>
            </div>
          </div>
        </div>

        {/* Class Wish to Join & Session Row */}
        <div className="flex items-center justify-between my-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">Class You Wish to Join:</span>
            <div className="border-2 border-slate-900 px-4 py-1 text-sm font-bold min-w-[120px] text-center bg-slate-50">
              {candidate.classWishToJoin || candidate.courseApplied || '—'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">Session:</span>
            <div className="border-2 border-slate-900 px-4 py-1 text-sm font-bold min-w-[100px] text-center bg-slate-50">
              {candidate.session || '2026-2027'}
            </div>
          </div>
        </div>

        {/* Basic Information Title */}
        <div className="text-center my-3">
          <h2 className="text-xl font-bold uppercase underline tracking-wider text-slate-900">
            Basic Information
          </h2>
        </div>

        {/* Board Reg, Aadhaar, Bank A/C & Photograph Section */}
        <div className="grid grid-cols-12 gap-3 mb-4">
          <div className="col-span-8 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase w-44 shrink-0">Board Registration No:</span>
              <div className="flex-1 border-2 border-slate-900 px-3 py-1 font-mono text-xs font-bold bg-slate-50 h-8 flex items-center">
                {candidate.boardRegNo || '—'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase w-44 shrink-0">Aadhaar No:</span>
              <div className="flex-1 border-2 border-slate-900 px-3 py-1 font-mono text-xs font-bold bg-slate-50 h-8 flex items-center">
                {candidate.aadharNumber || '—'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase w-44 shrink-0">Bank A/C:</span>
              <div className="flex-1 border-2 border-slate-900 px-3 py-1 font-mono text-xs font-bold bg-slate-50 h-8 flex items-center">
                {candidate.bankAccountNo || '—'}
              </div>
            </div>
          </div>

          {/* Candidate Photograph */}
          <div className="col-span-4 flex flex-col items-center justify-center">
            <div className="w-32 h-36 border-2 border-dashed border-slate-800 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 relative shadow-sm">
              {candidate.photoUrl ? (
                <img src={candidate.photoUrl} alt="Candidate" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">PHOTOGRAPH</span>
                  <span className="text-[9px] text-slate-400 block">TO BE PASTED</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields 1 to 11 */}
        <div className="space-y-2 text-xs font-semibold text-slate-900 leading-tight">
          <div className="flex border-b border-slate-300 pb-1">
            <span className="w-6 font-bold">1.</span>
            <span className="w-64 font-bold">Name of the Candidate (Capital Letters):</span>
            <span className="flex-1 font-bold uppercase text-slate-900 text-sm tracking-wide">{candidate.fullName || '—'}</span>
          </div>

          <div className="flex border-b border-slate-300 pb-1">
            <span className="w-6 font-bold">2.</span>
            <span className="w-64 font-bold">Father's Name:</span>
            <span className="flex-1 font-bold uppercase text-slate-900">{candidate.fatherName || '—'}</span>
          </div>

          <div className="flex border-b border-slate-300 pb-1">
            <span className="w-6 font-bold">3.</span>
            <span className="w-64 font-bold">Mother's Name:</span>
            <span className="flex-1 font-bold uppercase text-slate-900">{candidate.motherName || '—'}</span>
          </div>

          <div className="flex border-b border-slate-300 pb-1">
            <span className="w-6 font-bold">4.</span>
            <span className="w-64 font-bold">Permanent Home Address:</span>
            <span className="flex-1 text-slate-900">{candidate.address || '—'}</span>
          </div>

          <div className="flex border-b border-slate-300 pb-1">
            <span className="w-6 font-bold">5.</span>
            <span className="w-64 font-bold">Occupation of the Father:</span>
            <span className="flex-1 text-slate-900">{candidate.fatherOccupation || '—'}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">6. Blood Group:</span>
              <span className="border-2 border-slate-900 px-3 py-0.5 text-center font-bold bg-slate-50 min-w-[80px]">
                {candidate.bloodGroup || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">Height:</span>
              <span className="border-2 border-slate-900 px-3 py-0.5 text-center font-bold bg-slate-50 min-w-[80px]">
                {candidate.height || '—'}
              </span>
            </div>
          </div>

          <div className="flex border-b border-slate-300 pb-1 items-center gap-2">
            <span className="w-6 font-bold">7.</span>
            <span className="w-40 font-bold">PEN Number:</span>
            <div className="flex-1 border-2 border-slate-900 px-3 py-0.5 font-mono font-bold bg-slate-50">
              {candidate.penNumber || '—'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">8. Ration Card Detail:</span>
              <span className="border-2 border-slate-900 px-3 py-0.5 font-bold bg-slate-50">
                {candidate.rationCardDetail || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">Social Category:</span>
              <span className="border-2 border-slate-900 px-3 py-0.5 font-bold bg-slate-50 min-w-[80px] text-center">
                {candidate.socialCategory || candidate.category || 'General'}
              </span>
            </div>
          </div>

          <div className="flex border-b border-slate-300 pb-1 items-center gap-2">
            <span className="w-6 font-bold">9.</span>
            <span className="w-40 font-bold">Parent Contact No:</span>
            <div className="flex-1 border-2 border-slate-900 px-3 py-0.5 font-mono font-bold bg-slate-50">
              {candidate.parentContactNo || candidate.mobile || '—'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-1">
            <div className="flex items-center gap-2">
              <span className="w-6 font-bold">10.</span>
              <span className="font-bold">Date of Birth:</span>
              <span className="border-2 border-slate-900 px-3 py-0.5 font-mono font-bold bg-slate-50">
                {candidate.dob || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">Gender:</span>
              <span className="border-2 border-slate-900 px-3 py-0.5 font-bold uppercase bg-slate-50">
                {candidate.gender || '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">11. Disability if any:</span>
              <span className="border-2 border-slate-900 px-3 py-0.5 font-bold bg-slate-50">
                {candidate.hasDisability || 'NO'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">Disability Type:</span>
              <span className="flex-1 border-2 border-slate-900 px-3 py-0.5 bg-slate-50">
                {candidate.disabilityType || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Stream & Selected Subject Combination (Printed ONLY for selected choices - No Duplication) */}
        {isSecondary ? (
          <div className="mt-4 border-2 border-slate-900 p-3 bg-white space-y-2">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <span className="font-extrabold text-xs uppercase text-slate-900">Academic Level & Stream:</span>
              <span className="font-black text-xs uppercase tracking-wider text-blue-900 px-3 py-0.5 bg-slate-100 border border-slate-900">
                {cleanStreamName}
              </span>
            </div>
            <p className="font-extrabold text-xs uppercase text-slate-900 mt-2">12. Selected Secondary Subject Combination:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedSubjectsList.map((sub, idx) => (
                <div key={idx} className="border-2 border-slate-900 px-3 py-1 font-extrabold text-xs bg-slate-50 text-slate-900 flex items-center gap-1.5 shadow-sm">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>{sub}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 border-2 border-slate-900 p-3 bg-white space-y-2">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <span className="font-extrabold text-xs uppercase text-slate-900">13. Stream Opted:</span>
              <span className="font-black text-sm uppercase tracking-wider text-blue-900 px-4 py-1 bg-slate-100 border-2 border-slate-900">
                {cleanStreamName}
              </span>
            </div>

            <div className="pt-2">
              <p className="font-extrabold text-xs uppercase text-slate-900 mb-2">14. Selected Subject Combination (Only Opted Subjects):</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-2 border-slate-900 p-3 bg-slate-50">
                <div className="col-span-2 sm:col-span-3 pb-1 border-b border-slate-300 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Compulsory Subject:</span>
                  <span className="text-xs font-black text-blue-900 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded">✓ General English</span>
                </div>
                {selectedSubjectsList.map((sub, idx) => (
                  <div key={idx} className="p-2 bg-white border-2 border-slate-900 rounded font-black text-xs text-slate-900 flex items-center gap-2 shadow-sm">
                    <span className="text-emerald-600 font-bold text-sm">✓</span>
                    <span>{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FORM CONTAINER - PAGE 2 */}
      <div className="my-6 print:my-0 border-t-2 border-dashed border-slate-400 print:border-none print:break-before-page pt-4 print:pt-0">
        <div className="border-2 border-slate-800 p-6 relative bg-white">
          <div className="space-y-3">

            {/* 15 Previous Academic Record Table */}
            <div className="mt-4">
              <p className="font-bold text-xs uppercase mb-1">15 Previous Academic Record:</p>
              <table className="w-full border-2 border-slate-900 text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-200 border-b-2 border-slate-900 font-bold uppercase">
                    <th className="border-r-2 border-slate-900 p-1.5">Class</th>
                    <th className="border-r-2 border-slate-900 p-1.5">Session</th>
                    <th className="border-r-2 border-slate-900 p-1.5">Roll No.</th>
                    <th className="border-r-2 border-slate-900 p-1.5">Marks & %</th>
                    <th className="border-r-2 border-slate-900 p-1.5">Grade / Division</th>
                    <th className="p-1.5">Name of Board</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-semibold">
                    <td className="border-r-2 border-slate-900 p-2">{candidate.previousQualification || 'Matriculation'}</td>
                    <td className="border-r-2 border-slate-900 p-2">{candidate.passingYear || '—'}</td>
                    <td className="border-r-2 border-slate-900 p-2 font-mono">{candidate.prevRollNumber || '—'}</td>
                    <td className="border-r-2 border-slate-900 p-2 font-bold">
                      {candidate.marksObtained ? `${candidate.marksObtained} / ${candidate.totalMarks || 500} (${candidate.percentage || gradeCalc.percentageFormatted}%)` : '—'}
                    </td>
                    <td className="border-r-2 border-slate-900 p-2 text-emerald-800 font-black">
                      {candidate.marksObtained ? `Grade ${candidate.grade || gradeCalc.grade} (${candidate.division || gradeCalc.division})` : '—'}
                    </td>
                    <td className="p-2">{candidate.boardUniversity || 'JKBOSE'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Enclosures & Declaration Block */}
            <div className="grid grid-cols-12 gap-4 mt-4 pt-2 border-t-2 border-slate-900">
              {/* Enclosures List */}
              <div className="col-span-6 border-r-2 border-slate-900 pr-3 space-y-1">
                <p className="font-bold text-[11px] uppercase underline text-slate-900">
                  ENCLOSURE TO BE ATTACHED WITH APPLICATION FORM:
                </p>
                <ol className="list-decimal list-inside text-[10px] space-y-0.5 font-medium text-slate-800">
                  <li>Marks Certificate</li>
                  <li>Discharge Certificate</li>
                  <li>Character Certificate</li>
                  <li>Aadhaar Card (Photocopy)</li>
                  <li>Ration Card (Front page Photocopy)</li>
                  <li>Bank Passbook (FrontPage Photocopy)</li>
                  <li>3 Photographs</li>
                </ol>
              </div>

              {/* Student Declaration */}
              <div className="col-span-6 space-y-1">
                <p className="font-bold text-[11px] uppercase underline text-slate-900">
                  DECLARATION BY STUDENT:
                </p>
                <ul className="text-[9.5px] space-y-1 text-slate-800 font-medium">
                  <li className="flex items-start gap-1">
                    <span>✓</span> I will obey all rules and regulations of the institute.
                  </li>
                  <li className="flex items-start gap-1">
                    <span>✓</span> I will attend the classes regularly and qualify the attendance prescribed by the Board/Institute.
                  </li>
                  <li className="flex items-start gap-1">
                    <span>✓</span> I will not make use of cell phone during the school hour's.
                  </li>
                  <li className="flex items-start gap-1">
                    <span>✓</span> All the particulars filled in above are correct to the best of my knowledge.
                  </li>
                </ul>
              </div>
            </div>

            {/* Signatures & QR Code Section */}
            <div className="pt-8 flex items-end justify-between border-t border-slate-300 mt-6">
              <div className="text-center w-40">
                <div className="border-b-2 border-slate-800 h-8"></div>
                <span className="text-[10px] font-bold uppercase text-slate-800 block mt-1">In charge Admission</span>
              </div>

              {qrCodeUrl && (
                <div className="flex flex-col items-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 object-contain border p-1 bg-white" />
                  <span className="text-[8px] font-mono text-slate-600 mt-0.5">Scan to Verify</span>
                </div>
              )}

              <div className="text-center w-40">
                <div className="border-b-2 border-slate-800 h-8"></div>
                <span className="text-[10px] font-bold uppercase text-slate-800 block mt-1">Signature of Student</span>
              </div>

              <div className="text-center w-40">
                <div className="border-b-2 border-slate-800 h-8"></div>
                <span className="text-[10px] font-bold uppercase text-slate-800 block mt-1">Principal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

