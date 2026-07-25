import * as XLSXModule from 'xlsx';
import { Candidate } from '../types';
import { fetchCandidates } from './api';

const XLSX = (XLSXModule as any).default || XLSXModule;

export async function downloadExcelDatabase(customCandidatesList?: Candidate[]) {
  try {
    let candidates = customCandidatesList;
    if (!candidates || candidates.length === 0) {
      candidates = await fetchCandidates();
    }

    // Attempt downloading directly via server API first
    try {
      const res = await fetch('/api/export-excel');
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Candidates_Admission_Database.xlsx';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
          return;
        }
      }
    } catch (apiErr) {
      console.warn('Backend export route failed, generating client-side XLSX file:', apiErr);
    }

    // Client-side XLSX generation fallback
    const excelRows = (candidates || []).map((c) => ({
      'Application ID': c.id,
      'Full Name': c.fullName,
      'Father Name': c.fatherName,
      'Mother Name': c.motherName,
      'Date of Birth': c.dob,
      'Gender': c.gender,
      'Category': c.category,
      'Email': c.email,
      'Mobile': c.mobile,
      'Aadhar Number': c.aadharNumber,
      'Address': c.address,
      'Previous Qualification': c.previousQualification,
      'Board / University': c.boardUniversity,
      'Prev Roll Number': c.prevRollNumber,
      'Passing Year': c.passingYear,
      'Marks Obtained': c.marksObtained,
      'Total Marks': c.totalMarks,
      'Percentage (%)': c.percentage,
      'Course Applied': c.courseApplied,
      'Major Subjects': c.majorSubjects,
      'Session': c.session,
      'Assigned Roll No': c.assignedRollNumber || 'N/A',
      'Enrolment No': c.enrolmentNumber || 'N/A',
      'Admission Status': c.status,
      'Fee Amount (INR)': c.feeAmount,
      'Fee Payment Status': c.feeStatus,
      'Bank Challan No': c.bankChallanNo || 'N/A',
      'DC Application Status': c.dcStatus,
      'DC Reason': c.dcReason || 'N/A',
      'Conduct Rating': c.conductRating || 'Good',
      'Application Date': c.applicationDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Admission_Records');

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Candidates_Admission_Database.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to export Excel database:', err);
    alert('Error generating Excel file for download.');
  }
}
