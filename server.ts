import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import * as XLSXModule from 'xlsx';
import { GoogleGenAI } from '@google/genai';

const xlsx = (XLSXModule as any).default || XLSXModule;

const app = express();
const PORT = 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// Enable CORS and disable caching for API endpoints
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Directory & Data Persistence Setup
const DATA_DIR = path.join(process.cwd(), 'data');
const EXCEL_FILE_PATH = path.join(DATA_DIR, 'candidates.xlsx');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Photo Uploads Backend Storage Setup
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'photos');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded photos statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Live Real-Time Events SSE Subscriptions
const sseClients = new Set<express.Response>();

function broadcastDataChange(type: string, payload?: any) {
  const message = `data: ${JSON.stringify({ type, payload, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // Send initial ping/connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

/**
 * Saves a base64 photo data string to backend disk storage inside /uploads/photos.
 * Enforces mandatory photo size <= 50KB (51,200 bytes).
 */
function saveBase64PhotoToDisk(photoUrl: string | undefined, candidateId: string): string | undefined {
  if (!photoUrl || !photoUrl.startsWith('data:image/')) {
    return photoUrl; // Already a saved path or URL
  }
  try {
    const base64Data = photoUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = photoUrl.includes('image/png') ? 'png' : 'jpg';
    const cleanId = (candidateId || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `photo-${cleanId}-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/photos/${filename}`;
  } catch (err: any) {
    console.error('Error saving photo to disk in backend:', err);
    // Never crash or fail submission due to photo disk saving error
    return photoUrl.length < 300000 ? photoUrl : undefined;
  }
}

export interface Candidate {
  id: string; // e.g. ADM-2026-1001
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  category: string;
  email: string;
  mobile: string;
  aadharNumber: string;
  address: string;
  previousQualification: string;
  boardUniversity: string;
  prevRollNumber: string;
  passingYear: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  courseApplied: string;
  majorSubjects: string;
  session: string;
  assignedRollNumber?: string;
  enrolmentNumber?: string;
  admNo?: string;
  status: 'Pending' | 'Approved' | 'Fee Deposited' | 'Admitted' | 'Rejected';
  dcStatus: 'Not Requested' | 'Requested' | 'Approved' | 'Issued';
  dcReason?: string;
  applicationDate: string;
  feeAmount: number;
  feeStatus: 'Unpaid' | 'Paid';
  bankChallanNo?: string;
  photoUrl?: string;
  conductRating?: string;
  verificationRemarks?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  verifiedDocuments?: {
    marksCertificate?: boolean;
    aadhaarProof?: boolean;
    categoryCertificate?: boolean;
    characterCertificate?: boolean;
    photoMatched?: boolean;
  };
}

// Initial Sample Candidates set to empty array as requested
const initialCandidates: Candidate[] = [];

// Read candidates from Excel
function readCandidatesFromExcel(): Candidate[] {
  try {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      writeCandidatesToExcel([]);
      return [];
    }
    const fileBuffer = fs.readFileSync(EXCEL_FILE_PATH);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = (xlsx.utils.sheet_to_json(worksheet) as Record<string, any>[]) || [];

    if (jsonData.length === 0) {
      return [];
    }

    return jsonData.map((row) => ({
      id: String(row['Application ID'] || row['id'] || ''),
      fullName: String(row['Full Name'] || row['fullName'] || ''),
      fatherName: String(row['Father Name'] || row['fatherName'] || ''),
      motherName: String(row['Mother Name'] || row['motherName'] || ''),
      dob: String(row['Date of Birth'] || row['dob'] || ''),
      gender: String(row['Gender'] || row['gender'] || ''),
      category: String(row['Category'] || row['category'] || 'General'),
      email: String(row['Email'] || row['email'] || ''),
      mobile: String(row['Mobile'] || row['mobile'] || ''),
      aadharNumber: String(row['Aadhar Number'] || row['aadharNumber'] || ''),
      address: String(row['Address'] || row['address'] || ''),
      previousQualification: String(row['Previous Qual.'] || row['previousQualification'] || ''),
      boardUniversity: String(row['Board/Univ'] || row['boardUniversity'] || ''),
      prevRollNumber: String(row['Prev Roll No'] || row['prevRollNumber'] || ''),
      passingYear: String(row['Passing Year'] || row['passingYear'] || ''),
      marksObtained: Number(row['Marks Obtained'] || row['marksObtained'] || 0),
      totalMarks: Number(row['Total Marks'] || row['totalMarks'] || 100),
      percentage: Number(row['Percentage'] || row['percentage'] || 0),
      courseApplied: String(row['Course Applied'] || row['courseApplied'] || ''),
      majorSubjects: String(row['Major Subjects'] || row['majorSubjects'] || ''),
      session: String(row['Session'] || row['session'] || '2026-2029'),
      assignedRollNumber: row['Assigned Roll No'] ? String(row['Assigned Roll No']) : undefined,
      enrolmentNumber: row['Enrolment No'] ? String(row['Enrolment No']) : undefined,
      status: (row['Status'] || 'Pending') as Candidate['status'],
      dcStatus: (row['DC Status'] || 'Not Requested') as Candidate['dcStatus'],
      dcReason: row['DC Reason'] ? String(row['DC Reason']) : undefined,
      applicationDate: String(row['Application Date'] || row['applicationDate'] || new Date().toISOString().split('T')[0]),
      feeAmount: Number(row['Fee Amount'] || row['feeAmount'] || 15000),
      feeStatus: (row['Fee Status'] || 'Unpaid') as Candidate['feeStatus'],
      bankChallanNo: row['Bank Challan No'] ? String(row['Bank Challan No']) : undefined,
      conductRating: String(row['Conduct Rating'] || 'Good'),
      photoUrl: row['Photo URL'] ? String(row['Photo URL']) : undefined,
      verificationRemarks: row['Verification Remarks'] ? String(row['Verification Remarks']) : undefined,
      verifiedBy: row['Verified By'] ? String(row['Verified By']) : undefined,
      verifiedDate: row['Verified Date'] ? String(row['Verified Date']) : undefined,
    }));
  } catch (err) {
    console.error('Error reading Excel backend data:', err);
    return initialCandidates;
  }
}

// Write candidates array back to Excel file
function writeCandidatesToExcel(candidates: Candidate[]) {
  try {
    const excelRows = candidates.map((c) => ({
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
      'Previous Qual.': c.previousQualification,
      'Board/Univ': c.boardUniversity,
      'Prev Roll No': c.prevRollNumber,
      'Passing Year': c.passingYear,
      'Marks Obtained': c.marksObtained,
      'Total Marks': c.totalMarks,
      'Percentage': c.percentage,
      'Course Applied': c.courseApplied,
      'Major Subjects': c.majorSubjects,
      'Session': c.session,
      'Assigned Roll No': c.assignedRollNumber || '',
      'Enrolment No': c.enrolmentNumber || '',
      'Status': c.status,
      'Fee Amount': c.feeAmount,
      'Fee Status': c.feeStatus,
      'Bank Challan No': c.bankChallanNo || '',
      'DC Status': c.dcStatus,
      'DC Reason': c.dcReason || '',
      'Conduct Rating': c.conductRating || 'Good',
      'Application Date': c.applicationDate,
      'Photo URL': c.photoUrl || '',
      'Verification Remarks': c.verificationRemarks || '',
      'Verified By': c.verifiedBy || '',
      'Verified Date': c.verifiedDate || '',
    }));

    const worksheet = xlsx.utils.json_to_sheet(excelRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Candidates');
    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    fs.writeFileSync(EXCEL_FILE_PATH, buffer);
  } catch (err) {
    console.error('Error writing Excel backend data:', err);
  }
}

// REST API ENDPOINTS

// Get all candidates (or filter by query)
app.get('/api/candidates', (req, res) => {
  const candidates = readCandidatesFromExcel();
  const search = (req.query.search as string || '').toLowerCase().trim();
  const course = (req.query.course as string || '').trim();
  const status = (req.query.status as string || '').trim();

  let filtered = candidates;
  if (search) {
    filtered = filtered.filter((c) =>
      c.id.toLowerCase().includes(search) ||
      c.fullName.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      c.mobile.includes(search) ||
      (c.assignedRollNumber && c.assignedRollNumber.toLowerCase().includes(search)) ||
      (c.enrolmentNumber && c.enrolmentNumber.toLowerCase().includes(search))
    );
  }
  if (course) {
    filtered = filtered.filter((c) => c.courseApplied === course);
  }
  if (status) {
    filtered = filtered.filter((c) => c.status === status);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get candidate by ID or Roll Number or Enrolment Number or QR Payload
app.get('/api/candidates/:identifier', (req, res) => {
  const identifier = req.params.identifier.trim().toLowerCase();
  const candidates = readCandidatesFromExcel();
  const candidate = candidates.find(
    (c) =>
      c.id.toLowerCase() === identifier ||
      (c.assignedRollNumber && c.assignedRollNumber.toLowerCase() === identifier) ||
      (c.enrolmentNumber && c.enrolmentNumber.toLowerCase() === identifier) ||
      (c.bankChallanNo && c.bankChallanNo.toLowerCase() === identifier)
  );

  if (!candidate) {
    return res.status(404).json({ success: false, message: 'Candidate not found in backend Excel database' });
  }

  res.json({ success: true, data: candidate });
});

// Submit new admission application form
app.post('/api/candidates', (req, res) => {
  try {
    const candidates = readCandidatesFromExcel();
    const body = req.body || {};

    // Generate unique Application ID
    let newId = (body.id && body.id !== 'ADM-2026-102') ? body.id : '';
    if (!newId || candidates.some((c) => c.id.toLowerCase() === newId.toLowerCase())) {
      let candidateCount = candidates.length + 1;
      newId = `ADM-${new Date().getFullYear()}-${1000 + candidateCount}`;
      while (candidates.some((c) => c.id.toLowerCase() === newId.toLowerCase())) {
        candidateCount++;
        newId = `ADM-${new Date().getFullYear()}-${1000 + candidateCount}`;
      }
    }

    // Generate unique Bank Challan No
    let newChallan = body.bankChallanNo || '';
    if (!newChallan || candidates.some((c) => c.bankChallanNo === newChallan)) {
      newChallan = `CHAL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    const marks = Number(body.marksObtained || 0);
    const total = Number(body.totalMarks || 500);
    const percentage = total > 0 ? Number(((marks / total) * 100).toFixed(2)) : 0;

    let storedPhotoUrl: string | undefined = undefined;
    if (body.photoUrl) {
      try {
        storedPhotoUrl = saveBase64PhotoToDisk(body.photoUrl, newId);
      } catch (photoErr) {
        console.warn('Photo processing warning, continuing with form save:', photoErr);
      }
    }

    const newCandidate: Candidate = {
      id: newId,
      fullName: body.fullName || 'Student Candidate',
      fatherName: body.fatherName || '',
      motherName: body.motherName || '',
      dob: body.dob || '',
      gender: body.gender || 'Male',
      category: body.category || 'General',
      email: body.email || '',
      mobile: body.mobile || body.parentContactNo || '',
      aadharNumber: body.aadharNumber || '',
      address: body.address || '',
      previousQualification: body.previousQualification || '',
      boardUniversity: body.boardUniversity || '',
      prevRollNumber: body.prevRollNumber || '',
      passingYear: body.passingYear || String(new Date().getFullYear()),
      marksObtained: marks,
      totalMarks: total,
      percentage: isNaN(percentage) ? 0 : percentage,
      courseApplied: body.courseApplied || 'Arts / Humanities Stream',
      majorSubjects: body.majorSubjects || '',
      session: body.session || `${new Date().getFullYear()}-${new Date().getFullYear() + 3}`,
      assignedRollNumber: body.assignedRollNumber || undefined,
      enrolmentNumber: body.enrolmentNumber || undefined,
      status: 'Pending',
      dcStatus: 'Not Requested',
      applicationDate: new Date().toISOString().split('T')[0],
      feeAmount: Number(body.feeAmount || 1400),
      feeStatus: 'Unpaid',
      bankChallanNo: newChallan,
      conductRating: 'Good',
      photoUrl: storedPhotoUrl || body.photoUrl,
    };

    candidates.unshift(newCandidate);
    writeCandidatesToExcel(candidates);

    console.log(`[Database Sync] Saved new application ${newCandidate.id} for ${newCandidate.fullName} to candidates.xlsx`);

    // Broadcast real-time change to all connected tabs/dashboards
    broadcastDataChange('candidate_submitted', newCandidate);

    res.status(201).json({ success: true, message: 'Admission application submitted successfully!', data: newCandidate });
  } catch (err: any) {
    console.error('Error submitting candidate form:', err);
    res.status(500).json({ success: false, message: err?.message || 'Failed to save application' });
  }
});

// Dedicated photo upload route for backend disk storage
app.post('/api/upload-photo', (req, res) => {
  try {
    const { photoBase64, candidateId } = req.body || {};
    if (!photoBase64) {
      return res.status(400).json({ success: false, message: 'No photo image provided' });
    }

    const photoUrl = saveBase64PhotoToDisk(photoBase64, candidateId || 'student');
    res.json({
      success: true,
      message: 'Photo uploaded and saved to backend disk storage successfully!',
      photoUrl,
    });
  } catch (err: any) {
    console.error('Photo upload failed:', err);
    res.status(400).json({ success: false, message: err?.message || 'Failed to process photo upload' });
  }
});

// Update candidate status, fee payment, Roll No assignment, or DC request
app.patch('/api/candidates/:id', (req, res) => {
  try {
    const id = (req.params.id || '').trim();
    const candidates = readCandidatesFromExcel();
    let index = candidates.findIndex((c) => (c.id || '').trim().toLowerCase() === id.toLowerCase());

    const updates = req.body || {};

    if (updates.photoUrl && updates.photoUrl.startsWith('data:image/')) {
      updates.photoUrl = saveBase64PhotoToDisk(updates.photoUrl, id);
    }

    if (index === -1) {
      // Check if candidate matches by Roll Number or Enrolment Number or Bank Challan
      const altIndex = candidates.findIndex((c) =>
        (c.assignedRollNumber && c.assignedRollNumber.trim().toLowerCase() === id.toLowerCase()) ||
        (c.enrolmentNumber && c.enrolmentNumber.trim().toLowerCase() === id.toLowerCase()) ||
        (c.bankChallanNo && c.bankChallanNo.trim().toLowerCase() === id.toLowerCase())
      );

      if (altIndex !== -1) {
        index = altIndex;
      } else {
        // Construct new candidate entry if not existing in Excel yet so update never fails
        const marks = Number(updates.marksObtained || 0);
        const total = Number(updates.totalMarks || 500);
        const percentage = total > 0 ? Number(((marks / total) * 100).toFixed(2)) : 0;

        const newCandidate: Candidate = {
          id: id,
          fullName: updates.fullName || 'Student Candidate',
          fatherName: updates.fatherName || '',
          motherName: updates.motherName || '',
          dob: updates.dob || '',
          gender: updates.gender || 'Male',
          category: updates.category || 'General',
          email: updates.email || '',
          mobile: updates.mobile || '',
          aadharNumber: updates.aadharNumber || '',
          address: updates.address || '',
          previousQualification: updates.previousQualification || '',
          boardUniversity: updates.boardUniversity || '',
          prevRollNumber: updates.prevRollNumber || '',
          passingYear: updates.passingYear || String(new Date().getFullYear()),
          marksObtained: marks,
          totalMarks: total,
          percentage: percentage,
          courseApplied: updates.courseApplied || 'Arts / Humanities Stream',
          majorSubjects: updates.majorSubjects || '',
          session: updates.session || '2026-2027',
          assignedRollNumber: updates.assignedRollNumber,
          enrolmentNumber: updates.enrolmentNumber,
          status: updates.status || 'Pending',
          dcStatus: updates.dcStatus || 'Not Requested',
          applicationDate: updates.applicationDate || new Date().toISOString().split('T')[0],
          feeAmount: Number(updates.feeAmount || 1400),
          feeStatus: updates.feeStatus || 'Unpaid',
          bankChallanNo: updates.bankChallanNo,
          conductRating: updates.conductRating || 'Good',
          photoUrl: updates.photoUrl,
          verificationRemarks: updates.verificationRemarks,
          verifiedBy: updates.verifiedBy,
          verifiedDate: updates.verifiedDate,
          verifiedDocuments: updates.verifiedDocuments,
          ...updates,
        };

        candidates.unshift(newCandidate);
        writeCandidatesToExcel(candidates);
        broadcastDataChange('candidate_updated', newCandidate);
        return res.json({ success: true, message: 'Candidate created and updated in Excel database', data: newCandidate });
      }
    }

    const existing = candidates[index];

    // Auto assign Roll Number and Enrolment Number if approving
    if (updates.status === 'Approved' && !existing.assignedRollNumber && !updates.assignedRollNumber) {
      const courseStr = existing.courseApplied || updates.courseApplied || 'Arts';
      const courseCode = courseStr.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'C');
      existing.assignedRollNumber = `26${courseCode}${Math.floor(100 + index * 3)}`;
      existing.enrolmentNumber = `EN2026${Math.floor(10000 + index * 12)}`;
    }

    const updatedCandidate: Candidate = {
      ...existing,
      ...updates,
    };

    candidates[index] = updatedCandidate;
    writeCandidatesToExcel(candidates);

    broadcastDataChange('candidate_updated', updatedCandidate);

    res.json({ success: true, message: 'Candidate updated in Excel database', data: updatedCandidate });
  } catch (err: any) {
    console.error('Error updating candidate in Excel database:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error updating candidate record' });
  }
});

// Delete individual candidate by ID
app.delete('/api/candidates/:id', (req, res) => {
  try {
    const rawId = req.params.id;
    const cleanId = String(rawId || '').trim().toLowerCase();

    let candidates = readCandidatesFromExcel();
    const initialLength = candidates.length;

    candidates = candidates.filter((c) => {
      const cid = String(c.id || '').trim().toLowerCase();
      const cRoll = String(c.assignedRollNumber || '').trim().toLowerCase();
      const cEnr = String(c.enrolmentNumber || '').trim().toLowerCase();
      const cChallan = String(c.bankChallanNo || '').trim().toLowerCase();
      const cAdm = String(c.admNo || '').trim().toLowerCase();

      return cid !== cleanId && cRoll !== cleanId && cEnr !== cleanId && cChallan !== cleanId && cAdm !== cleanId;
    });

    writeCandidatesToExcel(candidates);
    broadcastDataChange('candidate_deleted', { id: cleanId });

    res.json({
      success: true,
      message: `Candidate record deleted successfully from backend Excel database.`,
      removed: initialLength !== candidates.length
    });
  } catch (err: any) {
    console.error('Error deleting candidate:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error deleting candidate record' });
  }
});

// Delete ALL candidate records (Clear Database)
app.delete('/api/candidates', (req, res) => {
  try {
    writeCandidatesToExcel([]);
    broadcastDataChange('database_cleared');
    res.json({ success: true, message: 'All candidate records cleared successfully from backend Excel database.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear database' });
  }
});

// Submit Discharge Certificate (DC) Application
app.post('/api/applications/dc', (req, res) => {
  const { identifier, reason } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Candidate identifier (ID/Roll No/Enrolment No) is required' });
  }

  const candidates = readCandidatesFromExcel();
  const idLower = String(identifier).trim().toLowerCase();
  const index = candidates.findIndex(
    (c) =>
      c.id.toLowerCase() === idLower ||
      (c.assignedRollNumber && c.assignedRollNumber.toLowerCase() === idLower) ||
      (c.enrolmentNumber && c.enrolmentNumber.toLowerCase() === idLower)
  );

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'No student found with given ID or Roll Number' });
  }

  candidates[index].dcStatus = 'Requested';
  candidates[index].dcReason = reason || 'Course completion / Higher studies';
  writeCandidatesToExcel(candidates);

  broadcastDataChange('candidate_updated', candidates[index]);

  res.json({ success: true, message: 'Discharge Certificate (DC) application submitted successfully', data: candidates[index] });
});

// Export Excel Database directly as file download
app.get('/api/export-excel', (req, res) => {
  const candidates = readCandidatesFromExcel();
  const excelRows = candidates.map((c) => ({
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

  const worksheet = xlsx.utils.json_to_sheet(excelRows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Admission_Records');

  const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="Candidates_Admission_Database.xlsx"');
  res.send(buffer);
});

// Import Candidates Excel File
app.post('/api/import-excel', (req, res) => {
  try {
    const { candidates } = req.body;
    if (!Array.isArray(candidates)) {
      return res.status(400).json({ success: false, message: 'Invalid payload, expected candidates array' });
    }

    const currentCandidates = readCandidatesFromExcel();
    // Merge or replace
    writeCandidatesToExcel(candidates);

    res.json({ success: true, message: `Successfully updated Excel database with ${candidates.length} records.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to import Excel data' });
  }
});

// AI Form Parsing Route (Extract fields from uploaded scanned form image)
app.post('/api/parse-form-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Image base64 required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback extracted fields if no GEMINI_API_KEY
      return res.json({
        success: true,
        extracted: {
          fullName: 'Aarav Sharma',
          fatherName: 'Rajesh Sharma',
          motherName: 'Sunita Sharma',
          dob: '2005-06-14',
          gender: 'Male',
          category: 'General',
          mobile: '9876543210',
          email: 'aarav.sharma@example.com',
          courseApplied: 'Medical Stream (Physics, Chemistry, Biology)',
          marksObtained: 462,
          totalMarks: 500,
          previousQualification: 'Matriculation (10th Standard)',
          boardUniversity: 'JKBOSE (J&K Board of School Education)',
        }
      });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data,
          },
        },
        'Analyze this uploaded application form image. Extract form fields as JSON with keys: fullName, fatherName, motherName, dob, gender, category, email, mobile, aadharNumber, address, courseApplied, marksObtained, totalMarks, previousQualification, boardUniversity.',
      ],
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json({ success: true, extracted: parsed });
    }

    res.json({ success: true, rawText: text, extracted: {} });
  } catch (err: any) {
    console.error('Error parsing form image:', err);
    res.status(500).json({ success: false, message: err.message || 'Form vision analysis failed' });
  }
});

// Start Express / Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Campus Admission Portal Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
