import { UserRole, Assignment, Submission } from '../types';

export const can = {
  // Admins and Super Admins can approve or reject student signups.
  approveApplications: (role: UserRole): boolean => {
    return role === 'super_admin' || role === 'admin';
  },

  // Only Super Admins can manage platform settings. Admins cannot.
  manageSettings: (role: UserRole): boolean => {
    return role === 'super_admin';
  },

  // Admins and Super Admins manage structural program and cohort records.
  managePrograms: (role: UserRole): boolean => {
    return role === 'super_admin' || role === 'admin';
  },

  manageCohorts: (role: UserRole): boolean => {
    return role === 'super_admin' || role === 'admin';
  },

  // Teachers, Admins, and Super Admins can create and edit assignments.
  manageAssignments: (role: UserRole): boolean => {
    return role === 'super_admin' || role === 'admin' || role === 'teacher';
  },

  manageCurriculum: (role: UserRole): boolean => {
    return role === 'super_admin' || role === 'admin' || role === 'teacher';
  },

  // Teachers, Admins, and Super Admins can grade submissions.
  gradeSubmissions: (role: UserRole): boolean => {
    return role === 'super_admin' || role === 'admin' || role === 'teacher';
  },

  manageAttendance: (role: UserRole): boolean => {
    return role === 'super_admin' || role === 'admin' || role === 'teacher';
  },

  // Students can submit assignments, others cannot.
  submitAssignment: (role: UserRole): boolean => {
    return role === 'student';
  },

  // Teachers, Admins, and Super Admins can create announcements. Students cannot.
  createAnnouncements: (role: UserRole): boolean => {
    return role === 'super_admin' || role === 'admin' || role === 'teacher';
  },

  // Graded submissions are locked for student edits, while teachers can update the grade.
  isSubmissionLocked: (submission?: Submission): boolean => {
    return submission?.status === 'graded';
  }
};
