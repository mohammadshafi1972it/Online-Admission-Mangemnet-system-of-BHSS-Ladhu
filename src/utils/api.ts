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
    
    // Sync candidates to local storage if fetching full list
    if (!search && !course && !status) {
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
  const cleanId = id.trim();
  try {
    const res = await fetch(`/api/candidates/${encodeURIComponent(cleanId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        saveCandidateToLocal(json.data);
        return json.data;
      }
    } else {
      console.warn('API returned non-OK status during candidate update, syncing locally:', res.status);
    }
  } catch (err) {
    console.warn('API update request error, syncing locally:', err);
  }

  // Fallback update in local storage so operations never crash
  const localRaw = localStorage.getItem('candidates_fallback_db');
  const list: Candidate[] = localRaw ? JSON.parse(localRaw) : [];
  const index = list.findIndex((c) => (c.id || '').trim().toLowerCase() === cleanId.toLowerCase());

  if (index >= 0) {
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    localStorage.setItem('candidates_fallback_db', JSON.stringify(list));
    return updated;
  }

  // If candidate is missing from local storage as well, construct updated object
  const fallbackCandidate: Candidate = {
    id: cleanId,
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
    marksObtained: updates.marksObtained || 0,
    totalMarks: updates.totalMarks || 500,
    percentage: updates.percentage || 0,
    courseApplied: updates.courseApplied || 'Arts / Humanities Stream',
    majorSubjects: updates.majorSubjects || '',
    session: updates.session || '2026-2027',
    assignedRollNumber: updates.assignedRollNumber,
    enrolmentNumber: updates.enrolmentNumber,
    status: updates.status || 'Pending',
    dcStatus: updates.dcStatus || 'Not Requested',
    applicationDate: updates.applicationDate || new Date().toISOString().split('T')[0],
    feeAmount: updates.feeAmount || 1400,
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

  saveCandidateToLocal(fallbackCandidate);
  return fallbackCandidate;
}

export async function deleteCandidateRecord(id: string): Promise<boolean> {
  const cleanId = (id || '').trim();
  if (!cleanId) return true;

  try {
    const res = await fetch(`/api/candidates/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      console.warn('API returned non-OK status during candidate delete, syncing local state:', res.status);
    }
  } catch (err) {
    console.warn('API delete request failed, syncing local state:', err);
  }

  // Always sync and delete from local fallback storage
  const localRaw = localStorage.getItem('candidates_fallback_db');
  if (localRaw) {
    try {
      const list: Candidate[] = JSON.parse(localRaw);
      const target = cleanId.toLowerCase();
      const filtered = list.filter((c) => {
        const cid = (c.id || '').trim().toLowerCase();
        const cRoll = (c.assignedRollNumber || '').trim().toLowerCase();
        const cEnr = (c.enrolmentNumber || '').trim().toLowerCase();
        const cAdm = (c.admNo || '').trim().toLowerCase();
        return cid !== target && cRoll !== target && cEnr !== target && cAdm !== target;
      });
      localStorage.setItem('candidates_fallback_db', JSON.stringify(filtered));
    } catch (e) {
      console.error('Error cleaning up local storage fallback on delete:', e);
    }
  }

  return true;
}

export async function clearAllCandidateRecords(): Promise<boolean> {
  try {
    const res = await fetch('/api/candidates', {
      method: 'DELETE',
    });
    if (!res.ok) {
      console.warn('API clear candidates returned non-OK status:', res.status);
    }
  } catch (err) {
    console.warn('API clear candidates request failed:', err);
  }

  localStorage.setItem('candidates_fallback_db', JSON.stringify([]));
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

export async function uploadPhotoToBackend(photoBase64: string, candidateId?: string): Promise<string> {
  const res = await fetch('/api/upload-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoBase64, candidateId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to upload photo to backend storage server');
  }

  const json = await res.json();
  return json.photoUrl;
}
