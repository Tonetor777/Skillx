export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url?: string;
  cohort_id?: string; // Standard students belong to exactly one cohort
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'document';
  url: string;
  description?: string;
}

export interface Week {
  id?: string;
  cohort_id?: string;
  cohort_name?: string;
  number: number;
  week_number?: number;
  title: string;
  objective?: string;
  objectives?: string;
  notes?: string;
  assignment?: string;
  recording?: string;
  status?: 'draft' | 'published' | 'archived';
  publish_date?: string;
  published_by_name?: string;
  resources: Resource[];
  start_date?: string;
  end_date?: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  weeks: Week[];
  cohorts_count: number;
  status: 'draft' | 'active' | 'archived';
  cohorts?: Array<{
    id: string;
    name: string;
    status: string;
    current_week: number;
    students_count: number;
    start_date: string;
    end_date: string;
  }>;
  created_at: string;
}

export interface Cohort {
  id: string;
  name: string;
  program_id: string;
  program_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  students_count: number;
  teachers: User[];
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  current_week: number;
  duration_weeks: number;
  leaderboard_visible: boolean;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  teacher: User;
  cohort_id: string;
  cohort_name: string;
  role: 'lead' | 'assistant' | 'mentor';
  assigned_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  max_points: number;
  due_date: string;
  week_number: number;
  cohort_id: string;
  cohort_name: string;
  is_locked: boolean; // Locked after grading
}

export interface Submission {
  id: string;
  assignment_id: string;
  assignment_title: string;
  student_id: string;
  student_name: string;
  student_email: string;
  content: string; // URL, text answer, or document submission
  submitted_at: string;
  status: 'pending' | 'graded';
  grade?: number;
  feedback?: string;
  graded_by_id?: string;
  graded_by_name?: string;
  graded_at?: string;
  is_late: boolean; // Flagged automatically if submitted_at > due_date
}

export interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  program_id: string;
  program_name: string;
  motivation: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_by_id?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_type: 'system' | 'program' | 'cohort';
  target_id?: string; // ID of program or cohort, if applicable
  target_name?: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ApiErrorResponse {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: string[] | string | undefined;
}
