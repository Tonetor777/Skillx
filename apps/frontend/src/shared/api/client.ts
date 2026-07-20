import { ApiErrorResponse, User, Application, Program, Cohort, Assignment, Submission, Announcement, Module, Lesson, LessonImage, Resource, AttendanceSession } from '../types';
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

function isPaginatedResponse(value: unknown): value is { results: unknown[] } {
  if (typeof value !== 'object' || value === null || !('results' in value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.count === 'number'
    && 'next' in candidate
    && 'previous' in candidate
    && Array.isArray(candidate.results)
  );
}

function unwrapPaginatedResponse(value: unknown): unknown {
  return isPaginatedResponse(value) ? value.results : value;
}

export function getStoredTokens(): TokenState {
  const access = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!storedUser) {
    return { access, refresh, user: null };
  }

  try {
    return {
      access,
      refresh,
      user: JSON.parse(storedUser) as User,
    };
  } catch {
    clearStoredTokens();
    return { access: null, refresh: null, user: null };
  }
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

let refreshPromise: Promise<boolean> | null = null;

function dispatchUnauthorizedSession() {
  clearStoredTokens();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('skilix-unauthorized'));
  }
}

export function scopeProgramsForAuthUser(programs: Program[], user: User | null, cohorts: Cohort[]): Program[] {
  if (user?.role !== 'student') {
    return programs;
  }
  if (!user.cohort_id) {
    return [];
  }
  const enrolledCohort = cohorts.find(cohort => cohort.id === user.cohort_id);
  if (!enrolledCohort) {
    return [];
  }
  return programs.filter(program => program.id === enrolledCohort.program_id);
}

// Dynamic simulation handler to provide flawless local experience when DRF server is not online
function handleMockRequest(method: string, endpoint: string, body?: any): any {
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

      if (endpoint.includes('/reinvite')) {
        const index = apps.findIndex(a => a.id === appId);
        if (index > -1) {
          if (apps[index].status !== 'approved') {
            throw new ApiError(400, 'Only approved applications can be reinvited.', {
              detail: 'Only approved applications can be reinvited.',
            });
          }
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
        phone: body.phone,
        age: Number(body.age),
        experience: body.experience,
        program_id: body.program_id,
        program_name: prog.name,
        expectations: body.expectations,
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
    if (endpoint.includes('/programs/public')) {
      return prgs.filter(program => program.status !== 'archived');
    }
    const cohorts = MockDatabase.get<Cohort>('cohorts');
    const authUser = getStoredTokens().user;
    const scopedPrograms = scopeProgramsForAuthUser(prgs, authUser, cohorts);
    const idMatch = endpoint.match(/\/programs\/([^\/]+)/);
    if (idMatch) {
      const progId = idMatch[1];
      const progIndex = prgs.findIndex(p => p.id === progId);
      if (progIndex > -1) {
        if (method === 'GET' && authUser?.role === 'student' && !scopedPrograms.some(program => program.id === progId)) {
          throw new ApiError(404, 'Program not found');
        }
        if (endpoint.includes('/archive')) {
          prgs[progIndex] = {
            ...prgs[progIndex],
            status: 'archived'
          };
          MockDatabase.set('programs', prgs);
          return prgs[progIndex];
        }
        if (method === 'PUT' || method === 'PATCH') {
          prgs[progIndex] = {
            ...prgs[progIndex],
            ...body
          };
          MockDatabase.set('programs', prgs);
          return prgs[progIndex];
        }
        if (method === 'DELETE') {
          const cohorts = MockDatabase.get<Cohort>('cohorts');
          const apps = MockDatabase.get<Application>('applications');
          const hasCohorts = cohorts.some(cohort => cohort.program_id === progId);
          const hasApplications = apps.some(app => app.program_id === progId);
          if (hasCohorts || hasApplications) {
            throw new ApiError(400, 'Program cannot be deleted while it has cohorts or applications.', {
              detail: 'Program cannot be deleted while it has cohorts or applications.',
            });
          }
          MockDatabase.set('programs', prgs.filter(program => program.id !== progId));
          return null;
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
    return scopedPrograms;
  }

  // Cohort Endpoints
  if (endpoint.includes('/cohorts')) {
    const cohs = MockDatabase.get<Cohort>('cohorts');
    const idMatch = endpoint.match(/\/cohorts\/([^\/]+)/);
    if (idMatch) {
      if (endpoint.includes('/grade-settings')) {
        const index = cohs.findIndex(c => c.id === idMatch[1]);
        if (index === -1) throw new ApiError(404, 'Cohort not found');
        if (method === 'PATCH') {
          cohs[index] = { ...cohs[index], ...body };
          MockDatabase.set('cohorts', cohs);
        }
        return {
          assignment_weight: cohs[index].assignment_weight,
          attendance_weight: cohs[index].attendance_weight
        };
      }
      const found = cohs.find(c => c.id === idMatch[1]);
      if (found) {
        if (method === 'PATCH') {
          const index = cohs.findIndex(c => c.id === idMatch[1]);
          cohs[index] = { ...found, ...body };
          MockDatabase.set('cohorts', cohs);
          return cohs[index];
        }
        if (method === 'DELETE') {
          const modules = MockDatabase.get<Module>('modules');
          const assignments = MockDatabase.get<Assignment>('assignments');
          const sessions = MockDatabase.get<AttendanceSession>('attendance_sessions');
          const hasCurriculum = modules.some(module => module.cohort_id === found.id);
          const hasAssignments = assignments.some(assignment => assignment.cohort_id === found.id);
          const hasAttendance = sessions.some(session => session.cohort_id === found.id);
          if (found.students_count > 0 || found.teachers.length > 0 || hasCurriculum || hasAssignments || hasAttendance) {
            throw new ApiError(400, 'Cohort cannot be deleted while it has students, teacher assignments, curriculum, assignments, or attendance.', {
              detail: 'Cohort cannot be deleted while it has students, teacher assignments, curriculum, assignments, or attendance.',
            });
          }
          MockDatabase.set('cohorts', cohs.filter(cohort => cohort.id !== found.id));
          return null;
        }
        return found;
      }
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
        leaderboard_visible: true,
        assignment_weight: 90,
        attendance_weight: 10
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
    const modules = MockDatabase.get<Module>('modules');
    const resolveLessonScope = (lessonId?: string) => {
      if (!lessonId) return null;
      for (const module of modules) {
        const lesson = module.lessons.find(item => item.id === lessonId);
        if (lesson) return { module, lesson };
      }
      return null;
    };
    if (idMatch) {
      const assignmentId = idMatch[1];
      const assignmentIndex = asgs.findIndex(a => a.id === assignmentId);
      const found = asgs[assignmentIndex];
      if (found) {
        if (method === 'PATCH') {
          const scope = body.lesson_id ? resolveLessonScope(body.lesson_id) : null;
          asgs[assignmentIndex] = {
            ...found,
            ...body,
            module_id: scope?.module.id ?? found.module_id,
            module_title: scope?.module.title ?? found.module_title,
            lesson_id: scope?.lesson.id ?? found.lesson_id,
            lesson_title: scope?.lesson.title ?? found.lesson_title,
          };
          MockDatabase.set('assignments', asgs);
          return asgs[assignmentIndex];
        }
        if (method === 'DELETE') {
          const subs = MockDatabase.get<Submission>('submissions');
          const hasSubmissions = subs.some(sub => sub.assignment_id === assignmentId);
          if (hasSubmissions) {
            asgs[assignmentIndex] = { ...found, is_locked: true };
            MockDatabase.set('assignments', asgs);
            return asgs[assignmentIndex];
          }
          MockDatabase.set('assignments', asgs.filter(a => a.id !== assignmentId));
          return null;
        }
        return found;
      }
      throw new ApiError(404, 'Assignment not found');
    }
    if (method === 'POST') {
      const cohorts = MockDatabase.get<Cohort>('cohorts');
      const scope = resolveLessonScope(body.lesson_id);
      const cohortId = scope?.module.cohort_id || body.cohort_id;
      const coh = cohorts.find(c => c.id === cohortId) || cohorts[0];
      const newAsg: Assignment = {
        id: `asg_${Math.random().toString(36).substr(2, 9)}`,
        title: body.title,
        description: body.description,
        max_points: body.max_points,
        due_date: body.due_date,
        cohort_id: cohortId || coh.id,
        cohort_name: coh.name,
        module_id: scope?.module.id || body.module_id,
        module_title: scope?.module.title,
        lesson_id: scope?.lesson.id || body.lesson_id,
        lesson_title: scope?.lesson.title,
        resource_id: body.resource_id,
        is_locked: false
      };
      asgs.push(newAsg);
      MockDatabase.set('assignments', asgs);
      return newAsg;
    }
    return asgs;
  }

  // Module Endpoints
  if (endpoint.includes('/modules')) {
    const modules = MockDatabase.get<Module>('modules');
    const idMatch = endpoint.match(/\/modules\/([^\/]+)/);
    if (idMatch) {
      const moduleId = idMatch[1];
      const moduleIndex = modules.findIndex(module => module.id === moduleId);
      if (moduleIndex > -1) {
        if (endpoint.includes('/publish')) {
          modules[moduleIndex] = {
            ...modules[moduleIndex],
            status: 'published',
            publish_date: new Date().toISOString(),
            published_by_name: 'Current User'
          };
          MockDatabase.set('modules', modules);
          return modules[moduleIndex];
        }
        if (method === 'PATCH') {
          modules[moduleIndex] = { ...modules[moduleIndex], ...body };
          MockDatabase.set('modules', modules);
          return modules[moduleIndex];
        }
        if (method === 'DELETE') {
          MockDatabase.set('modules', modules.filter(module => module.id !== moduleId));
          return null;
        }
        return modules[moduleIndex];
      }
      throw new ApiError(404, 'Module not found');
    }
    if (method === 'POST') {
      const cohorts = MockDatabase.get<Cohort>('cohorts');
      const cohort = cohorts.find(item => item.id === body.cohort_id) || cohorts[0];
      const newModule: Module = {
        id: `mod_${Math.random().toString(36).substr(2, 9)}`,
        cohort_id: cohort.id,
        cohort_name: cohort.name,
        module_number: body.module_number,
        title: body.title,
        description: body.description,
        notes: body.notes,
        status: body.status || 'draft',
        lessons: []
      };
      modules.push(newModule);
      MockDatabase.set('modules', modules);
      return newModule;
    }
    return modules;
  }

  // Lesson Endpoints
  if (endpoint.includes('/lessons')) {
    const modules = MockDatabase.get<Module>('modules');
    const lessons = modules.flatMap(module => module.lessons);
    const idMatch = endpoint.match(/\/lessons\/([^\/]+)/);
    if (idMatch) {
      const lessonId = idMatch[1];
      const currentLesson = lessons.find(lesson => lesson.id === lessonId);
      if (!currentLesson) throw new ApiError(404, 'Lesson not found');
      if (method === 'PATCH') {
        const nextModules = modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => (
            lesson.id === lessonId ? { ...lesson, ...body } : lesson
          ))
        }));
        MockDatabase.set('modules', nextModules);
        return { ...currentLesson, ...body };
      }
      if (method === 'DELETE') {
        const nextModules = modules.map(module => ({
          ...module,
          lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
        }));
        MockDatabase.set('modules', nextModules);
        return null;
      }
      return currentLesson;
    }
    if (method === 'POST') {
      const moduleIndex = modules.findIndex(module => module.id === body.module_id);
      if (moduleIndex < 0) throw new ApiError(404, 'Module not found');
      const newLesson: Lesson = {
        id: `les_${Math.random().toString(36).substr(2, 9)}`,
        module_id: body.module_id,
        title: body.title,
        objectives: body.objectives,
        content: body.content,
        recording: body.recording,
        order: body.order,
        resources: []
      };
      modules[moduleIndex].lessons.push(newLesson);
      MockDatabase.set('modules', modules);
      return newLesson;
    }
    const moduleId = endpoint.includes('?module_id=') ? new URLSearchParams(endpoint.split('?')[1]).get('module_id') : null;
    return moduleId ? lessons.filter(lesson => lesson.module_id === moduleId) : lessons;
  }

  // Lesson Image Endpoints
  if (endpoint.includes('/lesson-images')) {
    const modules = MockDatabase.get<Module>('modules');
    const lessonImages = modules.flatMap(module => module.lessons.flatMap(lesson => lesson.images ?? []));
    const idMatch = endpoint.match(/\/lesson-images\/([^\/]+)/);
    if (idMatch && method === 'DELETE') {
      const imageId = idMatch[1];
      const nextModules = modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          images: (lesson.images ?? []).filter(image => image.id !== imageId),
        })),
      }));
      MockDatabase.set('modules', nextModules);
      return null;
    }
    if (method === 'POST') {
      const formData = body instanceof FormData ? body : null;
      const lessonId = formData?.get('lesson_id')?.toString() ?? '';
      const file = formData?.get('image');
      const newImage: LessonImage = {
        id: `img_${Math.random().toString(36).substr(2, 9)}`,
        lesson_id: lessonId,
        image_url: file instanceof File ? URL.createObjectURL(file) : '',
        alt_text: formData?.get('alt_text')?.toString() ?? '',
        uploaded_by_id: getStoredTokens().user?.id ?? 'usr_teacher',
        created_at: new Date().toISOString(),
      };
      const nextModules = modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => (
          lesson.id === lessonId ? { ...lesson, images: [...(lesson.images ?? []), newImage] } : lesson
        )),
      }));
      MockDatabase.set('modules', nextModules);
      return newImage;
    }
    const lessonId = endpoint.includes('?lesson_id=') ? new URLSearchParams(endpoint.split('?')[1]).get('lesson_id') : null;
    return lessonId ? lessonImages.filter(image => image.lesson_id === lessonId) : lessonImages;
  }

  // Resource Endpoints
  if (endpoint.includes('/resources')) {
    const modules = MockDatabase.get<Module>('modules');
    const resources = modules.flatMap(module => module.lessons.flatMap(lesson => lesson.resources));
    const idMatch = endpoint.match(/\/resources\/([^\/]+)/);
    if (idMatch && method === 'PATCH') {
      const resourceId = idMatch[1];
      const currentResource = resources.find(resource => resource.id === resourceId);
      if (!currentResource) throw new ApiError(404, 'Resource not found');
      const nextModules = modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          resources: lesson.resources.map(resource => (
            resource.id === resourceId ? { ...resource, ...body } : resource
          ))
        }))
      }));
      MockDatabase.set('modules', nextModules);
      return { ...currentResource, ...body };
    }
    if (idMatch && method === 'DELETE') {
      const resourceId = idMatch[1];
      const nextModules = modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          resources: lesson.resources.filter(resource => resource.id !== resourceId)
        }))
      }));
      MockDatabase.set('modules', nextModules);
      return null;
    }
    if (method === 'POST') {
      const newResource: Resource = {
        id: `res_${Math.random().toString(36).substr(2, 9)}`,
        lesson_id: body.lesson_id,
        title: body.title,
        type: body.type || 'link',
        url: body.url,
        description: body.description,
        order: body.order ?? 0
      };
      const nextModules = modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => (
          lesson.id === body.lesson_id ? { ...lesson, resources: [...lesson.resources, newResource] } : lesson
        ))
      }));
      MockDatabase.set('modules', nextModules);
      return newResource;
    }
    const lessonId = endpoint.includes('?lesson_id=') ? new URLSearchParams(endpoint.split('?')[1]).get('lesson_id') : null;
    return lessonId ? resources.filter(resource => resource.lesson_id === lessonId) : resources;
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
      if (asg.is_locked) throw new ApiError(400, 'This assignment is locked and no longer accepts submissions.');
      
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

  // Attendance Endpoints
  if (endpoint.includes('/attendance-sessions')) {
    const sessions = MockDatabase.get<AttendanceSession>('attendance_sessions');
    const idMatch = endpoint.match(/\/attendance-sessions\/([^\/]+)/);
    if (idMatch) {
      const index = sessions.findIndex(session => session.id === idMatch[1]);
      if (index === -1) throw new ApiError(404, 'Attendance session not found');
      if (endpoint.includes('/records') && method === 'POST') {
        const users = MockDatabase.get<User>('users');
        const records = (body.records || []).map((record: { student_id: string; status: string; note?: string }) => {
          const student = users.find(u => u.id === record.student_id);
          const credit = record.status === 'late' ? 0.5 : record.status === 'absent' ? 0 : 1;
          return {
            id: `att_rec_${record.student_id}`,
            student_id: record.student_id,
            student_name: `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || student?.email || 'Student',
            student_email: student?.email || '',
            status: record.status,
            note: record.note || '',
            credit,
            updated_at: new Date().toISOString()
          };
        });
        sessions[index] = { ...sessions[index], records, updated_at: new Date().toISOString() };
        MockDatabase.set('attendance_sessions', sessions);
        return sessions[index];
      }
      if (method === 'PATCH') {
        sessions[index] = { ...sessions[index], ...body, updated_at: new Date().toISOString() };
        MockDatabase.set('attendance_sessions', sessions);
      }
      return sessions[index];
    }
    if (method === 'POST') {
      const cohorts = MockDatabase.get<Cohort>('cohorts');
      const cohort = cohorts.find(c => c.id === body.cohort_id);
      const newSession: AttendanceSession = {
        id: `att_${Math.random().toString(36).substr(2, 9)}`,
        cohort_id: body.cohort_id,
        cohort_name: cohort?.name || 'Cohort',
        date: body.date,
        title: body.title || '',
        recorded_by_name: 'Mock Teacher',
        records: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      sessions.push(newSession);
      MockDatabase.set('attendance_sessions', sessions);
      return newSession;
    }
    const cohortId = endpoint.includes('?cohort_id=') ? new URLSearchParams(endpoint.split('?')[1]).get('cohort_id') : null;
    return cohortId ? sessions.filter(session => session.cohort_id === cohortId) : sessions;
  }

  // Dashboard Summary Endpoint
  if (endpoint.includes('/dashboard/summary')) {
    const authUser = getStoredTokens().user;
    const submissions = MockDatabase.get<Submission>('submissions').filter(sub => sub.student_id === authUser?.id);
    const assignments = MockDatabase.get<Assignment>('assignments');
    const cohorts = MockDatabase.get<Cohort>('cohorts');
    const cohort = cohorts.find(c => c.id === authUser?.cohort_id);
    const graded = submissions.filter(sub => sub.status === 'graded');
    const earned = graded.reduce((total, sub) => total + (sub.grade || 0), 0);
    const possible = graded.reduce((total, sub) => total + (assignments.find(asg => asg.id === sub.assignment_id)?.max_points || 0), 0);
    const assignmentPercent = possible ? (earned / possible) * 100 : 0;
    return {
      role: authUser?.role || 'student',
      progress: {
        assignments_total: assignments.filter(asg => asg.cohort_id === authUser?.cohort_id).length,
        submissions_total: submissions.length,
        graded_total: graded.length
      },
      grades: {
        average: graded.length ? earned / graded.length : 0,
        assignment_percent: assignmentPercent,
        attendance_percent: 0,
        total_percent: assignmentPercent * ((cohort?.assignment_weight || 90) / 100),
        assignment_weight: cohort?.assignment_weight || 90,
        attendance_weight: cohort?.attendance_weight || 10
      },
      announcements: 0
    };
  }

  // Announcement Endpoints
  if (endpoint.includes('/announcements')) {
    const anns = MockDatabase.get<Announcement>('announcements');
    const authUser = getStoredTokens().user;
    const readStorageKey = `skilix_announcement_reads_${authUser?.id || 'anonymous'}`;
    const getReadIds = () => new Set<string>(JSON.parse(localStorage.getItem(readStorageKey) || '[]') as string[]);
    const setReadIds = (readIds: Set<string>) => localStorage.setItem(readStorageKey, JSON.stringify(Array.from(readIds)));
    const withReadState = (announcements: Announcement[]) => {
      const readIds = getReadIds();
      return announcements.map(ann => ({ ...ann, is_read: readIds.has(ann.id) }));
    };

    if (endpoint.includes('/unread-count')) {
      const readIds = getReadIds();
      return { count: anns.filter(ann => !readIds.has(ann.id)).length };
    }
    if (endpoint.includes('/mark-all-read') && method === 'POST') {
      setReadIds(new Set(anns.map(ann => ann.id)));
      return { marked_read: anns.length, count: 0 };
    }
    const markReadMatch = endpoint.match(/\/announcements\/([^\/]+)\/mark-read/);
    if (markReadMatch && method === 'POST') {
      const readIds = getReadIds();
      readIds.add(markReadMatch[1]);
      setReadIds(readIds);
      return { is_read: true };
    }

    if (method === 'POST') {
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
        is_read: false,
        created_at: new Date().toISOString()
      };
      anns.push(newAnn);
      MockDatabase.set('announcements', anns);
      return newAnn;
    }
    return withReadState(anns);
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

async function request(method: string, endpoint: string, body?: any, retryOnUnauthorized = true): Promise<any> {
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

    if (response.status === 401) {
      if (retryOnUnauthorized) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return request(method, normalizedEndpoint, body, false);
        }
      }
      dispatchUnauthorizedSession();
      throw new ApiError(401, 'Session expired. Please log in again.');
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
    return unwrapPaginatedResponse(await response.json());

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
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = attemptTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

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
  } catch {
    return false;
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
