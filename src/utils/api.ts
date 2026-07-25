import { Candidate } from '../types';

export async function fetchCandidates(search = '', course = '', status = ''): Promise<Candidate[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (course) params.append('course', course);
    if (status) params.append('status', status);

    const res = await fetch(`/api/candidates?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch from backend API');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('API connection offline or error, falling back to window storage:', err);
    const local = localStorage.getItem('candidates_fallback_db');
    return local ? JSON.parse(local) : [];
  }
}

export async function fetchCandidateByIdentifier(identifier: string): Promise<Candidate | null> {
  try {
    const res = await fetch(`/api/candidates/${encodeURIComponent(identifier.trim())}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('Fetch candidate error:', err);
    return null;
  }
}

export async function submitAdmissionForm(candidateData: Partial<Candidate>): Promise<Candidate> {
  const res = await fetch('/api/candidates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidateData),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || 'Error submitting application');
  }

  const json = await res.json();
  return json.data;
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
