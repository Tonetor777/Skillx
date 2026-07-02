import React from 'react';
import { useAuth } from '../../features/authentication/context/AuthContext';
import { useCohorts } from '../../features/cohorts/api/cohorts';
import { usePrograms } from '../../features/programs/api/programs';
import { useApplications } from '../../features/applications/api/applications';
import { useAssignments } from '../../features/assignments/api/assignments';
import { useSubmissions } from '../../features/submissions/api/submissions';
import { useAnnouncements } from '../../features/announcements/api/announcements';
import { can } from '../../shared/permissions/can';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Award, 
  Megaphone, 
  PlusCircle, 
  CheckCircle, 
  ArrowRight,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Overview() {
  const { user } = useAuth();
  
  // Fetch data
  const { data: cohorts, isLoading: cohortsLoading } = useCohorts();
  const { data: programs, isLoading: programsLoading } = usePrograms();
  const { data: applications, isLoading: appsLoading } = useApplications();
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments(user?.cohort_id);
  const { data: submissions, isLoading: submissionsLoading } = useSubmissions();
  const { data: announcements, isLoading: announcementsLoading } = useAnnouncements();

  if (!user) return null;

  // Derive metrics
  const activeCohortsCount = cohorts?.filter(c => c.is_active).length || 0;
  const totalProgramsCount = programs?.length || 0;
  const pendingAppsCount = applications?.filter(a => a.status === 'pending').length || 0;
  const pendingGradesCount = submissions?.filter(s => s.status === 'pending').length || 0;

  // Stagger configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8" id="overview-view-container">
      {/* Welcome Banner */}
      <div className="skx-surface bg-white/90 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="skx-page-label">Workspace Overview</p>
          <h1 className="mt-3 text-4xl md:text-5xl skx-amharic-title">
            እንኳን በደህና መጡ, {user.first_name}
          </h1>
          <p className="mt-2 font-display text-lg font-bold text-[#141414]">Welcome back, {user.first_name}!</p>
          <p className="text-[#5f5f5a] text-sm mt-2 font-sans">
            Here is what is happening across your cohort-based workspace today.
          </p>
        </div>
        <div className="flex gap-3">
          {can.createAnnouncements(user.role) && (
            <Link 
              to="/dashboard/announcements" 
              className="skx-primary-btn"
            >
              <PlusCircle className="w-4 h-4" />
              Post Announcement
            </Link>
          )}
          {can.approveApplications(user.role) && (
            <Link 
              to="/dashboard/applications" 
              className="skx-secondary-btn"
            >
              Review Applications
              {pendingAppsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {pendingAppsCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      {user.role !== 'student' && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          id="overview-metrics-grid"
        >
          {/* Card 1: Programs */}
          <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Programs</span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block">
                {programsLoading ? '...' : totalProgramsCount}
              </span>
            </div>
          </motion.div>

          {/* Card 2: Cohorts */}
          <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Cohorts</span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block">
                {cohortsLoading ? '...' : activeCohortsCount}
              </span>
            </div>
          </motion.div>

          {/* Card 3: Pending Applications */}
          <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Applications</span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block">
                {appsLoading ? '...' : pendingAppsCount}
              </span>
            </div>
          </motion.div>

          {/* Card 4: Grading Queue */}
          <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Grading Queue</span>
              <span className="text-2xl font-bold text-indigo-600 mt-1 block">
                {submissionsLoading ? '...' : pendingGradesCount}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column (2 cols wide on desktop): Contextual Action Center & Progress */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Student Specific Cohort & Due Assignments Overview */}
          {user.role === 'student' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">My Cohort</h3>
                  <p className="text-xs text-slate-500">You are enrolled in exactly one active bootcamp class.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Enrolled & Active
                </span>
              </div>

              {/* Enrolled cohort info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Program:</span>
                  <span className="text-sm font-semibold text-slate-800 mt-1 block">Frontend Web Engineering</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Cohort:</span>
                  <span className="text-sm font-semibold text-slate-800 mt-1 block">Frontend Cohort Alpha</span>
                </div>
              </div>

              {/* Assignment due next */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Upcoming Due Checkpoints
                </h4>
                {assignmentsLoading ? (
                  <div className="text-sm text-gray-500 py-3">Loading assignments...</div>
                ) : !assignments || assignments.length === 0 ? (
                  <div className="text-sm text-gray-500 py-3 italic">No upcoming course checkpoints. Check back later!</div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map(asg => {
                      const isOverdue = new Date() > new Date(asg.due_date);
                      return (
                        <div key={asg.id} className="border border-slate-100 rounded-lg p-4 flex justify-between items-center hover:border-indigo-200 transition-all bg-white shadow-xs">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">Week {asg.week_number} Task</span>
                            <h5 className="font-bold text-sm text-slate-800 mt-2">{asg.title}</h5>
                            <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              Max Points: {asg.max_points} • Due: {new Date(asg.due_date).toLocaleDateString()}
                            </span>
                          </div>
                          <Link 
                            to={`/dashboard/assignments`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Submit
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teacher/Admin Specific Core Grading queue check */}
          {can.gradeSubmissions(user.role) && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Grading Queue</h3>
                  <p className="text-xs text-slate-500">Evaluate homework, assign scores, and give specific constructive feedback.</p>
                </div>
                <Link to="/dashboard/assignments" className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
                  View All Assignments
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {submissionsLoading ? (
                <div className="text-sm text-slate-500 py-4 text-center">Loading submissions...</div>
              ) : !submissions || submissions.filter(s => s.status === 'pending').length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-lg py-8 text-center bg-slate-50/50">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <span className="text-sm font-semibold text-slate-800 block">Inboxes completely empty!</span>
                  <p className="text-xs text-slate-400 mt-1">Excellent! No submissions require grading at this time.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {submissions.filter(s => s.status === 'pending').map((sub) => (
                    <div key={sub.id} className="py-3.5 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{sub.assignment_title}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Submitted by <span className="font-semibold text-slate-700">{sub.student_name}</span> ({sub.student_email})
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
                            Pending Evaluation
                          </span>
                          {sub.is_late && (
                            <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">
                              Late Submission
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/dashboard/submissions/${sub.id}/grade`}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-xs"
                      >
                        Grade Work
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Guidance / Roadmap card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-2">Program Quick Guide</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Welcome to the Skilix Workspace. This applet supports program coordination, cohort isolation, syllabus resource distribution, application approval, homework submission lockers, grading checks, and announcements channels.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-slate-100 rounded-lg p-3.5 bg-slate-50/50">
                <span className="font-semibold text-sm text-slate-800 block">Syllabus-focused Weeks</span>
                <span className="text-xs text-slate-500 mt-1 block">Course modules contain weeks defining primary curriculum objectives and assets.</span>
              </div>
              <div className="border border-slate-100 rounded-lg p-3.5 bg-slate-50/50">
                <span className="font-semibold text-sm text-slate-800 block">Assignment Locks</span>
                <span className="text-xs text-slate-500 mt-1 block">Submissions remain pending until reviewed. Graded submissions lock immediately.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column (1 col wide on desktop): Announcements Feed */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                Latest Notices
              </h3>
              <Link to="/dashboard/announcements" className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-500">
                View Feed
              </Link>
            </div>

            {announcementsLoading ? (
              <div className="text-sm text-gray-500 text-center py-6">Loading announcements...</div>
            ) : !announcements || announcements.length === 0 ? (
              <div className="text-xs text-gray-400 italic py-6 text-center">
                No recent announcements or notifications are posted.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.slice(0, 3).map((ann) => {
                  const isSystem = ann.target_type === 'system';
                  return (
                    <div key={ann.id} className="border-l-2 border-indigo-500 pl-3.5 py-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase">
                          {isSystem ? 'Global' : 'Cohort Specific'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(ann.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mt-1.5">{ann.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                        {ann.content}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-2 font-medium">
                        Posted by {ann.author_name} ({ann.author_role.replace('_', ' ')})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
