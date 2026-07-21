import type { FacultyItem, FetchResponse } from '../types';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
console.log("API_BASE =", API_BASE);

const getFetchOptions = (method: string = 'GET', body?: any) => {
  const options: RequestInit = {
    method,
    credentials: 'include',
  };
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'any-value',
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  options.headers = headers;
  return options;
};

export async function fetchFacultyList(): Promise<FacultyItem[]> {
  const res = await fetch(`${API_BASE}/faculty`, getFetchOptions('GET'));
  if (!res.ok) throw new Error('Failed to load faculty list');
  return res.json();
}

export async function fetchRecentReports(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/recent`, getFetchOptions('GET'));
  if (!res.ok) return [];
  return res.json();
}

export async function startFetchJob(faculty: string, force_refresh: boolean = false): Promise<{ job_id: string; cached: boolean }> {
  const res = await fetch(`${API_BASE}/fetch/start`, getFetchOptions('POST', { faculty, force_refresh }));
  if (!res.ok) throw new Error('Failed to start extraction job');
  return res.json();
}

export async function fetchPortfolioData(faculty: string, force_refresh: boolean = false): Promise<FetchResponse> {
  const res = await fetch(`${API_BASE}/fetch`, getFetchOptions('POST', { faculty, force_refresh }));
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Extraction failed' }));
    throw new Error(err.detail || 'Failed to fetch academic portfolio');
  }
  return res.json();
}

export async function fetchHealthStatus() {
  const res = await fetch(`${API_BASE}/health`, getFetchOptions('GET'));
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}
