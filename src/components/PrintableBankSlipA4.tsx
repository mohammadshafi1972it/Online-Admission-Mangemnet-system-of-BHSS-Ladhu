import React, { useState } from 'react';
import { Candidate } from '../types';
import { calculateCourseFees, numberToWords } from '../utils/feeCalculator';
import { triggerPrint } from '../utils/print';
import { Printer, Building2, CreditCard, X, Check, Edit2 } from 'lucide-react';

interface PrintableBankSlipA4Props {
  candidate: Candidate;
  onClose?: () => void;
}

export const PrintableBankSlipA4: React.FC<PrintableBankSlipA4Props> = ({
  candidate,
  onClose,
}) => {
  const [bankAccountNo, setBankAccountNo] = useState<string>(
    candidate.bankAccountNo || '0241040100001234'
  );
  const [bankBranch, setBankBranch] = useState<string>('J&K Bank Branch Ladhoo Pampore');
  const [ifscCode, setIfscCode] = useState<string>('JAKA0LADHOO');

  const fees = calculateCourseFees(
    candidate.courseApplied,
    candidate.category || candidate.socialCategory,
    candidate.gender,
    candidate.classWishToJoin
  );

  const feeAmount = candidate.feeAmount || fees.totalFee;
  const amountInWords = numberToWords(feeAmount);

  const challanNo = candidate.bankChallanNo || `CHAL-${candidate.id.replace('ADM-', '')}`;

  const copies = [
    { title: '1. BANK COPY', subtitle: 'To be retained by J&K Bank Branch' },
    { title: '2. STUDENT COPY', subtitle: 'To be retained by Student' },
    { title: '3. SCHOOL COPY', subtitle: 'To be submitted to BHSS Ladhoo Admission Cell' },
  ];

  return (
    <div id="printable-bank-slip" className="bg-slate-100 text-slate-900 min-h-screen p-4 sm:p-6 print:p-0 print:bg-white print:min-h-0">
      {/* Top Action Bar (Screen Only) */}
      <div className="max-w-7xl mx-auto mb-4 bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-white">Official 3-Part Bank Fee Deposition Slip (A4 Format)</h2>
            <p className="text-xs text-slate-400">
              Fetched for <strong className="text-emerald-400">{candidate.fullName}</strong> ({candidate.classWishToJoin || candidate.courseApplied}) • Gender: <strong>{candidate.gender || 'Male'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => triggerPrint('printable-bank-slip')}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print A4 Bank Slip
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          )}
        </div>
      </div>

      {/* Editable Bank Details Control Panel (Screen Only) */}
      <div className="max-w-7xl mx-auto mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Edit2 className="w-3.5 h-3.5 text-blue-600" /> J&K Bank Account Number:
          </label>
          <input
            type="text"
            value={bankAccountNo}
            onChange={(e) => setBankAccountNo(e.target.value)}
            placeholder="Enter Bank Account No."
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Bank Branch Name:</label>
          <input
            type="text"
            value={bankBranch}
            onChange={(e) => setBankBranch(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">IFSC Code:</label>
          <input
            type="text"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 uppercase"
          />
        </div>
      </div>

      {/* A4 PRINTABLE CONTAINER */}
      <div className="max-w-7xl mx-auto bg-white p-4 sm:p-6 shadow-2xl rounded-sm border border-slate-300 print:shadow-none print:p-0 print:border-none print:max-w-none">
        {/* Main Header Banner for the Sheet */}
        <div className="text-center pb-3 border-b-2 border-slate-900 mb-4">
          <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
            THE JAMMU & KASHMIR BANK LIMITED - FEE DEPOSITION CHALLAN (TR-6)
          </h1>
          <p className="text-xs font-bold text-slate-700 uppercase">
            GOVT. BOYS HIGHER SECONDARY SCHOOL LADHOO PAMPORE (PULWAMA)
          </p>
          <p className="text-[11px] text-slate-600 font-mono mt-0.5">
            Credit to A/C No: <strong className="text-slate-900 text-xs px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300">{bankAccountNo}</strong> | Branch: <strong>{bankBranch}</strong> | IFSC: <strong className="font-mono">{ifscCode}</strong>
          </p>
        </div>

        {/* 3 EQUAL COPIES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bank-slip-grid text-[11px]">
          {copies.map((copy) => (
            <div
              key={copy.title}
              className="border-2 border-slate-900 p-2.5 rounded bg-white relative flex flex-col justify-between space-y-2 bank-slip-card print:border-slate-900"
            >
              {/* Copy Designation Tag */}
              <div className="text-center border-b-2 border-slate-900 pb-2 bg-slate-50 -mx-3 -mt-3 p-2 rounded-t">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded shadow-sm inline-block">
                  {copy.title}
                </span>
                <p className="text-[9px] font-semibold text-slate-600 italic mt-0.5">{copy.subtitle}</p>
                <div className="flex items-center justify-between px-2 mt-1 font-mono text-[10px] text-slate-800">
                  <span>Challan No: <strong>{challanNo}</strong></span>
                  <span>Date: <strong>____/____/2026</strong></span>
                </div>
              </div>

              {/* Student Basic Information fetched from form */}
              <div className="space-y-1 bg-slate-50/70 p-2 rounded border border-slate-200">
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500 font-medium">App / Adm No:</span>
                  <span className="font-mono font-extrabold text-slate-900">{candidate.admNo || candidate.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500 font-medium">Candidate Name:</span>
                  <span className="font-bold text-slate-900 uppercase truncate max-w-[130px]">{candidate.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500 font-medium">Father Name:</span>
                  <span className="font-semibold text-slate-800 uppercase truncate max-w-[130px]">{candidate.fatherName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500 font-medium">Class & Stream:</span>
                  <span className="font-bold text-blue-900 truncate max-w-[130px]">{candidate.classWishToJoin || candidate.courseApplied}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-500 font-medium">Session / Category:</span>
                  <span className="font-semibold text-slate-800">{candidate.session || '2026-27'} ({candidate.gender || 'Male'} / {candidate.category || 'Gen'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Parent Contact:</span>
                  <span className="font-mono text-slate-900 font-bold">{candidate.parentContactNo || candidate.mobile}</span>
                </div>
              </div>

              {/* Total Fee Section (Non-itemized as requested) */}
              <div className="border-2 border-slate-900 rounded overflow-hidden bg-amber-50/80 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                    Total Fee Payable:
                  </span>
                  <span className="font-mono font-black text-blue-950 text-base">
                    ₹{feeAmount.toLocaleString('en-IN')}/-
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-600 mt-1 font-medium">
                  (Fee calculated based on Class: <strong className="text-slate-900">{candidate.classWishToJoin || candidate.courseApplied}</strong> & Gender: <strong className="text-slate-900">{candidate.gender || 'Male'}</strong>)
                </p>
              </div>

              {/* Amount In Words */}
              <div className="bg-slate-100 p-1.5 rounded border border-slate-300 text-[10px]">
                <span className="text-slate-500 font-bold uppercase block text-[9px]">Amount in Words:</span>
                <span className="font-bold text-slate-900 italic">{amountInWords}</span>
              </div>

              {/* Bank Account Space Notice */}
              <div className="border border-dashed border-slate-400 p-1.5 rounded text-[9.5px]">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">J&K Bank A/C No:</span>
                  <span className="font-mono font-bold text-slate-900">{bankAccountNo}</span>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-slate-600 font-medium">Scroll / Trans. ID:</span>
                  <span className="font-mono underline text-slate-400">________________</span>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-2 text-[9px] text-center font-bold text-slate-800">
                <div>
                  <div className="h-6"></div>
                  <p className="border-t border-slate-500 pt-0.5">Depositor Signature</p>
                </div>
                <div>
                  <div className="h-6"></div>
                  <p className="border-t border-slate-900 pt-0.5 uppercase">Bank Cashier & Stamp</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tear Off Cut Line Instruction */}
        <div className="mt-4 pt-3 border-t border-dashed border-slate-400 text-center text-[10px] text-slate-500 font-mono print:block hidden">
          ✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - text-center
          Official J&K Bank Fee Deposition Slip • Government Boys Higher Secondary School Ladhoo Pampore (Pulwama J&K)
        </div>
      </div>
    </div>
  );
};
