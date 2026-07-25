import { Candidate } from '../types';

function saveCandidateToLocal(candidate: Candidate) {
  try {
    const raw = localStorage.getItem('candidates_fallback_db');
    const existing: Candidate[] = raw ? JSON.parse(raw) : [];
    const index = existing.findIndex((c) => c.id.toLowerCase() === candidate.id.toLowerCase());
    if (index >= 0) {
      existing[index] = candidate;
    } else {
      existing.unshift(candidate);
    }
    localStorage.setItem('candidates_fallback_db', JSON.stringify(existing));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export async function fetchCandidates(search = '', course = '', status = ''): Promise<Candidate[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (course) params.append('course', course);
    if (status) params.append('status', status);

    const res = await fetch(`/api/candidates?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch from backend API');
    const json = await res.json();
    const serverCandidates: Candidate[] = json.data || [];
    
    // Sync candidates to local storage
    if (serverCandidates.length > 0) {
      localStorage.setItem('candidates_fallback_db', JSON.stringify(serverCandidates));
    }
    return serverCandidates;
  } catch (err) {
    console.warn('API connection offline or error, falling back to window storage:', err);
    const local = localStorage.getItem('candidates_fallback_db');
    let candidates: Candidate[] = local ? JSON.parse(local) : [];

    const searchLower = search.toLowerCase().trim();
    if (searchLower) {
      candidates = candidates.filter((c) =>
        c.id.toLowerCase().includes(searchLower) ||
        c.fullName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.mobile.includes(searchLower) ||
        (c.assignedRollNumber && c.assignedRollNumber.toLowerCase().includes(searchLower)) ||
        (c.enrolmentNumber && c.enrolmentNumber.toLowerCase().includes(searchLower))
      );
    }
    if (course) candidates = candidates.filter((c) => c.courseApplied === course);
    if (status) candidates = candidates.filter((c) => c.status === status);
    return candidates;
  }
}

export async function fetchCandidateByIdentifier(identifier: string): Promise<Candidate | null> {
  const cleanId = identifier.trim().toLowerCase();
  try {
    const res = await fetch(`/api/candidates/${encodeURIComponent(cleanId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    console.error('Fetch candidate error:', err);
  }

  // Fallback to local storage if API is unreachable or returned 404
  try {
    const local = localStorage.getItem('candidates_fallback_db');
    if (local) {
      const list: Candidate[] = JSON.parse(local);
      const found = list.find(
        (c) =>
          c.id.toLowerCase() === cleanId ||
          (c.assignedRollNumber && c.assignedRollNumber.toLowerCase() === cleanId) ||
          (c.enrolmentNumber && c.enrolmentNumber.toLowerCase() === cleanId) ||
          (c.bankChallanNo && c.bankChallanNo.toLowerCase() === cleanId)
      );
      if (found) return found;
    }
  } catch (e) {
    // ignore
  }

  return null;
}

export async function submitAdmissionForm(candidateData: Partial<Candidate>): Promise<Candidate> {
  try {
    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        saveCandidateToLocal(json.data);
        return json.data;
      }
    } else {
      const errorJson = await res.json().catch(() => ({}));
      console.warn('Backend returned non-OK status during form submission:', res.status, errorJson);
    }
  } catch (err: any) {
    console.warn('API submission network error, saving candidate locally:', err);
  }

  // Fallback candidate creation so submission never crashes or throws
  const localRaw = localStorage.getItem('candidates_fallback_db');
  const existing: Candidate[] = localRaw ? JSON.parse(localRaw) : [];
  const nextNumber = 1000 + existing.length + 1;
  const newId = candidateData.id || `ADM-${new Date().getFullYear()}-${nextNumber}`;
  const newChallan = candidateData.bankChallanNo || `CHAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const marksObtained = Number(candidateData.marksObtained || 0);
  const totalMarks = Number(candidateData.totalMarks || 500);
  const percentage = totalMarks > 0 ? Number(((marksObtained / totalMarks) * 100).toFixed(2)) : 0;

  const fallbackCandidate: Candidate = {
    id: newId,
    fullName: candidateData.fullName || 'Student Candidate',
    fatherName: candidateData.fatherName || '',
    motherName: candidateData.motherName || '',
    dob: candidateData.dob || '2005-01-01',
    gender: candidateData.gender || 'Male',
    category: candidateData.category || 'General',
    email: candidateData.email || '',
    mobile: candidateData.mobile || (candidateData as any).parentContactNo || '',
    aadharNumber: candidateData.aadharNumber || '',
    address: candidateData.address || '',
    previousQualification: candidateData.previousQualification || '10th Standard',
    boardUniversity: candidateData.boardUniversity || 'JKBOSE',
    prevRollNumber: candidateData.prevRollNumber || '',
    passingYear: candidateData.passingYear || String(new Date().getFullYear()),
    marksObtained: marksObtained,
    totalMarks: totalMarks,
    percentage: percentage,
    courseApplied: candidateData.courseApplied || 'Arts / Humanities Stream',
    majorSubjects: candidateData.majorSubjects || '',
    session: candidateData.session || '2026-2027',
    assignedRollNumber: candidateData.assignedRollNumber,
    enrolmentNumber: candidateData.enrolmentNumber,
    status: 'Pending',
    dcStatus: 'Not Requested',
    applicationDate: new Date().toISOString().split('T')[0],
    feeAmount: Number(candidateData.feeAmount || 1400),
    feeStatus: 'Unpaid',
    bankChallanNo: newChallan,
    conductRating: 'Good',
    photoUrl: candidateData.photoUrl,
  };

  saveCandidateToLocal(fallbackCandidate);
  return fallbackCandidate;
}

export async function updateCandidateRecord(id: string, updates: Partial<Candidate>): Promise<Candidate> {
  const res = await fetch(`/api/candidates/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    throw new Error('Failed to update candidate record');
  }

  const json = await res.json();
  return json.data;
}

export async function deleteCandidateRecord(id: string): Promise<boolean> {
  const res = await fetch(`/api/candidates/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete candidate record');
  }
  return true;
}

export async function clearAllCandidateRecords(): Promise<boolean> {
  const res = await fetch('/api/candidates', {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to clear all candidate records');
  }
  return true;
}

export async function submitDCApplication(identifier: string, reason: string): Promise<Candidate> {
  const res = await fetch('/api/applications/dc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, reason }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit DC application');
  }

  const json = await res.json();
  return json.data;
}

export async function importExcelData(candidatesList: Candidate[]): Promise<boolean> {
  const res = await fetch('/api/import-excel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidates: candidatesList }),
  });

  return res.ok;
}

export async function parseFormImage(imageBase64: string): Promise<Record<string, any>> {
  try {
    const res = await fetch('/api/parse-form-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!res.ok) throw new Error('Form parsing request failed');
    const json = await res.json();
    return json.extracted || {};
  } catch (err) {
    console.warn('Form image parsing error, returning empty extracted object', err);
    return {};
  }
}
