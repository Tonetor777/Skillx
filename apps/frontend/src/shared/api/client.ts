import { ApiErrorResponse, User, Application, Program, Cohort, Assignment, Submission, Announcement } from '../types';
import { MockDatabase } from './mockDb';

// Backend Base URL configuration
const ENV = (import.meta.env ?? {}) as Partial<ImportMetaEnv>;
const BASE_URL = ENV.VITE_API_URL || 'http://localhost:8000/api';
const USE_MOCK_API = ENV.VITE_USE_MOCK_API === 'true';

// Token Storage Keys
const ACCESS_TOKEN_KEY = 'skilix_access_token';
const REFRESH_TOKEN_KEY = 'skilix_refresh_token';
const AUTH_USER_KEY = 'skilix_auth_user';

export interface TokenState {
  access: string | null;
  refresh: string | null;
  user: User | null;
}

export function getStoredTokens(): TokenState {
  return {
    access: localStorage.getItem(ACCESS_TOKEN_KEY),
    refresh: localStorage.getItem(REFRESH_TOKEN_KEY),
    user: localStorage.getItem(AUTH_USER_KEY) ? JSON.parse(localStorage.getItem(AUTH_USER_KEY)!) : null,
  };
}

export function setStoredTokens(access: string, refresh: string, user: User) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  // Keep the mock DB synced as well
  const users = MockDatabase.get<User>('users');
  if (!users.some(u => u.id === user.id)) {
    users.push(user);
    MockDatabase.set('users', users);
  }
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

// Normalized Error Object for UI
export class ApiError extends Error {
  status: number;
  errors: Record<string, string[] | string>;

  constructor(status: number, message: string, errors: Record<string, string[] | string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Token refresh flag to avoid loops
let isRefreshing = false;

// Dynamic simulation handler to provide flawless local experience when DRF server is not online
function handleMockRequest(method: string, endpoint: string, body?: any): any {
  console.log(`[API MOCK] ${method} ${endpoint}`, body);
  
  // Login Endpoint
  if (endpoint.includes('/token/') || endpoint.includes('/auth/login/')) {
    const { email, password } = body || {};
    const users = MockDatabase.get<User>('users');
    const matchedUser = users.find(u => u.email === email);
    if (matchedUser) {
      return {
        access: 'mock_access_jwt_' + matchedUser.id,
        refresh: 'mock_refresh_jwt_' + matchedUser.id,
        user: matchedUser
      };
    }
    throw new ApiError(400, 'Invalid email or password credentials', { detail: ['Invalid email or password credentials.'] });
  }

  // Self User Profile
  if (endpoint.includes('/users/me') || endpoint.includes('/auth/me')) {
    const current = getStoredTokens().user;
    if (!current) throw new ApiError(401, 'Unauthorized access token expired');
    return current;
  }

  // Application Endpoints
  if (endpoint.includes('/applications')) {
    const apps = MockDatabase.get<Application>('applications');
    const idMatch = endpoint.match(/\/applications\/([^\/]+)/);
    
    if (idMatch) {
      const appId = idMatch[1];
      const found = apps.find(a => a.id === appId);
      
      if (endpoint.includes('/approve')) {
        const index = apps.findIndex(a => a.id === appId);
        if (index > -1) {
          const authUser = getStoredTokens().user;
          apps[index] = {
            ...apps[index],
            status: 'approved',
            reviewed_by_id: authUser?.id || 'usr_admin',
            reviewed_by_name: `${authUser?.first_name || 'Admin'} ${authUser?.last_name || 'User'}`,
            reviewed_at: new Date().toISOString()
          };
          MockDatabase.set('applications', apps);
          
          // Also automatically register a student profile in users
          const students = MockDatabase.get<User>('users');
          const email = apps[index].email;
          if (!students.some(s => s.email === email)) {
            const cohortId = 'coh_react_active'; // Default active cohort
            const newStudent: User = {
              id: `usr_${Math.random().toString(36).substr(2, 9)}`,
              email,
              first_name: apps[index].first_name,
              last_name: apps[index].last_name,
              role: 'student',
              cohort_id: cohortId,
              avatar_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?auto=format&fit=crop&w=100&h=100&q=80`,
              created_at: new Date().toISOString()
            };
            students.push(newStudent);
            MockDatabase.set('users', students);
          }
          return apps[index];
        }
      }
      
      if (endpoint.includes('/reject')) {
        const index = apps.findIndex(a => a.id === appId);
        if (index > -1) {
          const authUser = getStoredTokens().user;
          apps[index] = {
            ...apps[index],
            status: 'rejected',
            reviewed_by_id: authUser?.id || 'usr_admin',
            reviewed_by_name: `${authUser?.first_name || 'Admin'} ${authUser?.last_name || 'User'}`,
            reviewed_at: new Date().toISOString()
          };
          MockDatabase.set('applications', apps);
          return apps[index];
        }
      }

      if (found) return found;
      throw new ApiError(404, 'Application not found');
    }

    if (method === 'POST') {
      const programs = MockDatabase.get<Program>('programs');
      const prog = programs.find(p => p.id === body.program_id) || programs[0];
      const newApp: Application = {
        id: `app_${Math.random().toString(36).substr(2, 9)}`,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        program_id: body.program_id,
        program_name: prog.name,
        motivation: body.motivation,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      apps.push(newApp);
      MockDatabase.set('applications', apps);
      return newApp;
    }

    return apps;
  }

  // Program Endpoints
  if (endpoint.includes('/programs')) {
    const prgs = MockDatabase.get<Program>('programs');
    const idMatch = endpoint.match(/\/programs\/([^\/]+)/);
    if (idMatch) {
      const progId = idMatch[1];
      const progIndex = prgs.findIndex(p => p.id === progId);
      if (progIndex > -1) {
        if (method === 'PUT' || method === 'PATCH') {
          prgs[progIndex] = {
            ...prgs[progIndex],
            ...body
          };
          MockDatabase.set('programs', prgs);
          return prgs[progIndex];
        }
        return prgs[progIndex];
      }
      throw new ApiError(404, 'Program not found');
    }
    if (method === 'POST') {
      const newProg: Program = {
        id: `prg_${Math.random().toString(36).substr(2, 9)}`,
        name: body.name,
        description: body.description,
        weeks: body.weeks || [],
        cohorts_count: 0,
        status: 'active',
        created_at: new Date().toISOString()
      };
      prgs.push(newProg);
      MockDatabase.set('programs', prgs);
      return newProg;
    }
    return prgs;
  }

  // Cohort Endpoints
  if (endpoint.includes('/cohorts')) {
    const cohs = MockDatabase.get<Cohort>('cohorts');
    const idMatch = endpoint.match(/\/cohorts\/([^\/]+)/);
    if (idMatch) {
      const found = cohs.find(c => c.id === idMatch[1]);
      if (found) return found;
      throw new ApiError(404, 'Cohort not found');
    }
    if (method === 'POST') {
      const programs = MockDatabase.get<Program>('programs');
      const prog = programs.find(p => p.id === body.program_id) || programs[0];
      const teachers = MockDatabase.get<User>('users').filter(u => u.role === 'teacher');
      const newCoh: Cohort = {
        id: `coh_${Math.random().toString(36).substr(2, 9)}`,
        name: body.name,
        program_id: body.program_id,
        program_name: prog.name,
        start_date: body.start_date,
        end_date: body.end_date,
        is_active: body.is_active ?? true,
        students_count: 0,
        teachers: [teachers[0]],
        status: 'active',
        current_week: 1,
        duration_weeks: 12,
        leaderboard_visible: true
      };
      cohs.push(newCoh);
      MockDatabase.set('cohorts', cohs);
      return newCoh;
    }
    return cohs;
  }

  // Assignment Endpoints
  if (endpoint.includes('/assignments')) {
    const asgs = MockDatabase.get<Assignment>('assignments');
    const idMatch = endpoint.match(/\/assignments\/([^\/]+)/);
    if (idMatch) {
      const found = asgs.find(a => a.id === idMatch[1]);
      if (found) return found;
      throw new ApiError(404, 'Assignment not found');
    }
    if (method === 'POST') {
      const cohorts = MockDatabase.get<Cohort>('cohorts');
      const coh = cohorts.find(c => c.id === body.cohort_id) || cohorts[0];
      const newAsg: Assignment = {
        id: `asg_${Math.random().toString(36).substr(2, 9)}`,
        title: body.title,
        description: body.description,
        max_points: body.max_points,
        due_date: body.due_date,
        week_number: body.week_number,
        cohort_id: body.cohort_id,
        cohort_name: coh.name,
        is_locked: false
      };
      asgs.push(newAsg);
      MockDatabase.set('assignments', asgs);
      return newAsg;
    }
    return asgs;
  }

  // Submission Endpoints
  if (endpoint.includes('/submissions')) {
    const subs = MockDatabase.get<Submission>('submissions');
    const idMatch = endpoint.match(/\/submissions\/([^\/]+)/);
    if (idMatch) {
      const subIndex = subs.findIndex(s => s.id === idMatch[1]);
      if (subIndex > -1) {
        if (endpoint.includes('/grade')) {
          const authUser = getStoredTokens().user;
          subs[subIndex] = {
            ...subs[subIndex],
            status: 'graded',
            grade: body.grade,
            feedback: body.feedback,
            graded_by_id: authUser?.id || 'usr_teacher',
            graded_by_name: `${authUser?.first_name || 'David'} ${authUser?.last_name || 'Malan'}`,
            graded_at: new Date().toISOString()
          };
          MockDatabase.set('submissions', subs);
          return subs[subIndex];
        }
        return subs[subIndex];
      }
      throw new ApiError(404, 'Submission not found');
    }
    if (method === 'POST') {
      const asgs = MockDatabase.get<Assignment>('assignments');
      const authUser = getStoredTokens().user;
      const asg = asgs.find(a => a.id === body.assignment_id);
      if (!asg) throw new ApiError(404, 'Assignment not found');
      
      const isLate = new Date() > new Date(asg.due_date);
      const newSub: Submission = {
        id: `sub_${Math.random().toString(36).substr(2, 9)}`,
        assignment_id: body.assignment_id,
        assignment_title: asg.title,
        student_id: authUser?.id || 'usr_student',
        student_name: `${authUser?.first_name || 'Alex'} ${authUser?.last_name || 'Mercer'}`,
        student_email: authUser?.email || 'student@skilix.com',
        content: body.content,
        submitted_at: new Date().toISOString(),
        status: 'pending',
        is_late: isLate
      };
      subs.push(newSub);
      MockDatabase.set('submissions', subs);
      return newSub;
    }
    return subs;
  }

  // Announcement Endpoints
  if (endpoint.includes('/announcements')) {
    const anns = MockDatabase.get<Announcement>('announcements');
    if (method === 'POST') {
      const authUser = getStoredTokens().user;
      const newAnn: Announcement = {
        id: `ann_${Math.random().toString(36).substr(2, 9)}`,
        title: body.title,
        content: body.content,
        target_type: body.target_type,
        target_id: body.target_id,
        target_name: body.target_name,
        author_id: authUser?.id || 'usr_teacher',
        author_name: `${authUser?.first_name || 'David'} ${authUser?.last_name || 'Malan'}`,
        author_role: authUser?.role || 'teacher',
        created_at: new Date().toISOString()
      };
      anns.push(newAnn);
      MockDatabase.set('announcements', anns);
      return newAnn;
    }
    return anns;
  }

  // System Settings Endpoint
  if (endpoint.includes('/settings')) {
    const settings = MockDatabase.getSettings();
    if (method === 'POST' || method === 'PUT') {
      MockDatabase.setSettings(body);
      return body;
    }
    return settings;
  }

  // Generic Empty response
  return {};
}

// Global API Request handler
function normalizeEndpoint(endpoint: string): string {
  const [path, query] = endpoint.split('?');
  const normalizedPath = path.endsWith('/') ? path : `${path}/`;
  return query ? `${normalizedPath}?${query}` : normalizedPath;
}

async function request(method: string, endpoint: string, body?: any): Promise<any> {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  if (USE_MOCK_API) {
    await new Promise(r => setTimeout(r, 200));
    return handleMockRequest(method, normalizedEndpoint, body);
  }

  const { access } = getStoredTokens();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' };

  if (access) {
    headers['Authorization'] = `Bearer ${access}`;
  }

  const url = `${BASE_URL}${normalizedEndpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    if (response.status === 401 && !isRefreshing) {
      isRefreshing = true;
      try {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) {
          isRefreshing = false;
          // Retry the original request
          return request(method, normalizedEndpoint, body);
        }
      } catch (e) {
        // Refresh failed, do logout
        isRefreshing = false;
        clearStoredTokens();
        window.dispatchEvent(new Event('skilix-unauthorized'));
        throw new ApiError(401, 'Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      let errData: ApiErrorResponse = {};
      try {
        errData = await response.json();
      } catch (_) {}

      const message = errData.detail || errData.non_field_errors?.[0] || 'An unexpected error occurred.';
      throw new ApiError(response.status, message, errData as Record<string, string[] | string>);
    }

    if (response.status === 204) return null;
    return await response.json();

  } catch (error) {
    // Reraise specific API Errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Standardize other errors
    throw new ApiError(500, error instanceof Error ? error.message : 'Network failure');
  }
}

// Token Refresh Flow
async function attemptTokenRefresh(): Promise<boolean> {
  const { refresh } = getStoredTokens();
  if (!refresh) return false;

  try {
    const response = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      const current = getStoredTokens();
      if (current.user) {
        setStoredTokens(data.access, data.refresh || refresh, current.user);
        return true;
      }
    }
  } catch (e) {
    console.error('Failed to automatically refresh authentication token:', e);
  }
  return false;
}

export const apiClient = {
  get: (endpoint: string) => request('GET', endpoint),
  post: (endpoint: string, body: any) => request('POST', endpoint, body),
  put: (endpoint: string, body: any) => request('PUT', endpoint, body),
  patch: (endpoint: string, body: any) => request('PATCH', endpoint, body),
  delete: (endpoint: string) => request('DELETE', endpoint),
};
export default apiClient;
