import React, { useState } from 'react';
import * as XLSXModule from 'xlsx';
import { Candidate } from '../types';

const XLSX = (XLSXModule as any).default || XLSXModule;
import { importExcelData, clearAllCandidateRecords } from '../utils/api';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Database,
  FileText,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface ExcelManagerProps {
  candidates: Candidate[];
  onRefresh: () => void;
}

export const ExcelManager: React.FC<ExcelManagerProps> = ({ candidates, onRefresh }) => {
  const [importing, setImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setSuccessMsg('');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const jsonData = (XLSX.utils.sheet_to_json(ws) as Record<string, any>[]) || [];

        if (jsonData.length === 0) {
          setErrorMsg('Uploaded Excel sheet contains no rows.');
          setImporting(false);
          return;
        }

        const parsedCandidates: Candidate[] = jsonData.map((row, index) => ({
          id: String(row['Application ID'] || row['id'] || `ADM-2026-${2000 + index}`),
          fullName: String(row['Full Name'] || row['fullName'] || 'Sample Student'),
          fatherName: String(row['Father Name'] || row['fatherName'] || ''),
          motherName: String(row['Mother Name'] || row['motherName'] || ''),
          dob: String(row['Date of Birth'] || row['dob'] || '2005-01-01'),
          gender: String(row['Gender'] || row['gender'] || 'Male'),
          category: String(row['Category'] || row['category'] || 'General'),
          email: String(row['Email'] || row['email'] || ''),
          mobile: String(row['Mobile'] || row['mobile'] || ''),
          aadharNumber: String(row['Aadhar Number'] || row['aadharNumber'] || ''),
          address: String(row['Address'] || row['address'] || ''),
          previousQualification: String(row['Previous Qualification'] || row['previousQualification'] || '10+2'),
          boardUniversity: String(row['Board / University'] || row['boardUniversity'] || 'State Board'),
          prevRollNumber: String(row['Prev Roll Number'] || row['prevRollNumber'] || ''),
          passingYear: String(row['Passing Year'] || row['passingYear'] || '2025'),
          marksObtained: Number(row['Marks Obtained'] || row['marksObtained'] || 400),
          totalMarks: Number(row['Total Marks'] || row['totalMarks'] || 500),
          percentage: Number(row['Percentage (%)'] || row['percentage'] || 80),
          courseApplied: String(row['Course Applied'] || row['courseApplied'] || 'B.Sc Computer Science'),
          majorSubjects: String(row['Major Subjects'] || row['majorSubjects'] || 'Computer Science'),
          session: String(row['Session'] || row['session'] || '2026-2029'),
          assignedRollNumber: row['Assigned Roll No'] ? String(row['Assigned Roll No']) : undefined,
          enrolmentNumber: row['Enrolment No'] ? String(row['Enrolment No']) : undefined,
          status: (row['Admission Status'] || row['status'] || 'Pending') as Candidate['status'],
          feeAmount: Number(row['Fee Amount (INR)'] || row['feeAmount'] || 15000),
          feeStatus: (row['Fee Payment Status'] || row['feeStatus'] || 'Unpaid') as Candidate['feeStatus'],
          bankChallanNo: row['Bank Challan No'] ? String(row['Bank Challan No']) : undefined,
          dcStatus: (row['DC Application Status'] || row['dcStatus'] || 'Not Requested') as Candidate['dcStatus'],
          dcReason: row['DC Reason'] ? String(row['DC Reason']) : undefined,
          conductRating: String(row['Conduct Rating'] || 'Good'),
          applicationDate: String(row['Application Date'] || row['applicationDate'] || new Date().toISOString().split('T')[0]),
        }));

        await importExcelData(parsedCandidates);
        setSuccessMsg(`Successfully imported ${parsedCandidates.length} candidate records into backend Excel storage.`);
        onRefresh();
      } catch (err: any) {
        setErrorMsg('Failed to parse uploaded Excel file. Ensure valid columns.');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Database className="w-4 h-4" />
            Backend File Management
          </div>
          <h2 className="text-2xl font-extrabold mt-1">Excel Spreadsheet Database Control</h2>
          <p className="text-slate-400 text-xs mt-1">
            Backend storage is stored in <code className="text-emerald-300 font-mono">/data/candidates.xlsx</code>.
          </p>
        </div>

        <a
          href="/api/export-excel"
          download="Candidates_Admission_Database.xlsx"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Candidates.xlsx
        </a>
      </div>

      {/* Upload and Import Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            Upload Custom Candidates Excel Sheet (.xlsx / .csv)
          </h3>

          <p className="text-xs text-slate-600">
            Select an Excel file from your computer to update or import new student records directly into the backend storage.
          </p>

          <label className="border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center">
            <FileSpreadsheet className="w-10 h-10 text-blue-600 mb-2" />
            <span className="text-xs font-bold text-blue-900">Click to Select Excel Spreadsheet</span>
            <span className="text-[10px] text-slate-500 mt-1">Supports .xlsx, .xls, .csv</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
            />
          </label>

          {importing && (
            <p className="text-xs text-blue-600 font-bold animate-pulse text-center">
              Processing & Importing Excel Sheet...
            </p>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Database Overview Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Excel Columns Standard Schema
          </h3>

          <div className="text-xs text-slate-600 space-y-2">
            <p>Your uploaded Excel spreadsheet should include these column headers for auto-mapping:</p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] leading-relaxed text-slate-800">
              Application ID, Full Name, Father Name, Date of Birth, Gender, Category, Email, Mobile, Course Applied, Marks Obtained, Total Marks, Assigned Roll No, Admission Status, Fee Payment Status
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Total Records in Excel:</span>
            <span className="text-base font-extrabold text-blue-700 font-mono">{candidates.length} Students</span>
          </div>

          <div className="pt-4 border-t border-rose-100 bg-rose-50/60 p-4 rounded-xl space-y-2 border">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Incharge Admission Data Erasure
            </div>
            <p className="text-[11px] text-slate-600">
              Permanently wipe all candidate records from the backend Excel database.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm('CRITICAL WARNING: Are you sure you want to permanently delete ALL student data from the Excel database?')) {
                  try {
                    await clearAllCandidateRecords();
                    onRefresh();
                    setSuccessMsg('Successfully cleared all candidate records from Excel database.');
                  } catch (err) {
                    setErrorMsg('Failed to clear database records.');
                  }
                }
              }}
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-lg transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Excel Database Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
