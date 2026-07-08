import { UserRole, Assignment, Submission } from '../types';

export const can = {
  // Teachers cannot approve applications. Only Admins and Super Admins can.
  approveApplications: (role: UserRole): boolean => {
    return role === 'super_admin' || role === 'admin';
  },

  // Only Super Admins can manage platform settings. Admins cannot.
  manageSettings: (role: UserRole): boolean => {
    return role === 'super_admin';
  },

  // Teachers, Admins, and Super Admins can create programs and cohorts. Students cannot.
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

  // Students can submit assignments, others cannot.
  submitAssignment: (role: UserRole): boolean => {
    return role === 'student';
  },

  // Teachers, Admins, and Super Admins can create announcements. Students cannot.
  createAnnouncements: (role: UserRole): boolean => {
    return role === 'super_admin' || role === 'admin' || role === 'teacher';
  },

  // Assignments lock after grading (i.e., if a submission is graded, the assignment/submission is locked).
  isSubmissionLocked: (submission?: Submission): boolean => {
    return submission?.status === 'graded';
  }
};
