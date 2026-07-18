import { User, Program, Cohort, Assignment, Submission, Application, Announcement, Module } from '../types';

// Initial seed data
const initialUsers: User[] = [
  {
    id: 'usr_superadmin',
    email: 'superadmin@skilix.com',
    first_name: 'Sarah',
    last_name: 'Connor',
    role: 'super_admin',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'usr_admin',
    email: 'admin@skilix.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100&q=80',
    created_at: '2026-01-02T00:00:00Z'
  },
  {
    id: 'usr_teacher',
    email: 'teacher@skilix.com',
    first_name: 'David',
    last_name: 'Malan',
    role: 'teacher',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100&q=80',
    created_at: '2026-01-03T00:00:00Z'
  },
  {
    id: 'usr_student',
    email: 'student@skilix.com',
    first_name: 'Alex',
    last_name: 'Mercer',
    role: 'student',
    cohort_id: 'coh_react_active',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&h=100&q=80',
    created_at: '2026-01-04T00:00:00Z'
  }
];

const initialPrograms: Program[] = [
  {
    id: 'prg_frontend',
    name: 'Frontend Web Engineering',
    description: 'A comprehensive program focusing on modern frontend web standards, React, TypeScript, state management, and dense performance optimizations.',
    cohorts_count: 1,
    status: 'active',
    created_at: '2026-01-10T00:00:00Z',
    weeks: [
      {
        number: 1,
        title: 'Advanced Core JavaScript',
        objective: 'Master closures, prototypes, event loops, async-await, and memory profiling.',
        resources: [
          { id: 'res_js_doc', title: 'ES6+ Execution Contexts & Closures Guide', type: 'document', url: 'https://example.com/js-closures' },
          { id: 'res_js_video', title: 'JS Event Loop Under the Hood', type: 'video', url: 'https://example.com/js-loop-video' }
        ]
      },
      {
        number: 2,
        title: 'TypeScript & Type Safety',
        objective: 'Implement sophisticated generic structures, conditional types, and schema mapping.',
        resources: [
          { id: 'res_ts_pdf', title: 'TypeScript Handbook: Intermediate and Advanced Types', type: 'pdf', url: 'https://example.com/ts-advanced.pdf' }
        ]
      },
      {
        number: 3,
        title: 'React 19 Deep Dive',
        objective: 'Understand the Compiler, server components, Suspense architecture, and custom hooks.',
        resources: [
          { id: 'res_react_link', title: 'React 19 New Features Blog', type: 'link', url: 'https://react.dev/blog/2024/12/05/react-19' }
        ]
      }
    ]
  },
  {
    id: 'prg_ai',
    name: 'AI & Large Language Model Engineering',
    description: 'Master fine-tuning, prompt engineering, agentic workflow architectures, vector indexing, and embedding-based search tools using modern SDKs.',
    cohorts_count: 1,
    status: 'active',
    created_at: '2026-01-12T00:00:00Z',
    weeks: [
      {
        number: 1,
        title: 'Introduction to Transformers',
        objective: 'Understand attention mechanisms, embeddings, and foundational tokenization theory.',
        resources: [
          { id: 'res_transformer_doc', title: 'Attention Is All You Need Paper Analysis', type: 'pdf', url: 'https://example.com/attention.pdf' }
        ]
      },
      {
        number: 2,
        title: 'RAG Systems and Vector DBs',
        objective: 'Integrate external databases with LLMs using semantic embeddings and ranking models.',
        resources: [
          { id: 'res_rag_video', title: 'Building Reliable RAG Engines', type: 'video', url: 'https://example.com/rag-video' }
        ]
      }
    ]
  }
];

const initialCohorts: Cohort[] = [
  {
    id: 'coh_react_active',
    name: 'Frontend Cohort Alpha',
    program_id: 'prg_frontend',
    program_name: 'Frontend Web Engineering',
    start_date: '2026-05-01',
    end_date: '2026-08-01',
    is_active: true,
    students_count: 18,
    students: [
      {
        id: 'usr_student',
        email: 'student@skilix.com',
        first_name: 'Alex',
        last_name: 'Mercer',
        name: 'Alex Mercer'
      }
    ],
    teachers: [initialUsers[2]], // David Malan
    status: 'active',
    current_week: 6,
    duration_weeks: 12,
    leaderboard_visible: true,
    assignment_weight: 90,
    attendance_weight: 10
  },
  {
    id: 'coh_ai_upcoming',
    name: 'AI Core Cohort One',
    program_id: 'prg_ai',
    program_name: 'AI & Large Language Model Engineering',
    start_date: '2026-09-15',
    end_date: '2026-12-15',
    is_active: false,
    students_count: 24,
    students: [],
    teachers: [initialUsers[2]],
    status: 'upcoming',
    current_week: 1,
    duration_weeks: 12,
    leaderboard_visible: true,
    assignment_weight: 90,
    attendance_weight: 10
  }
];

const initialAssignments: Assignment[] = [
  {
    id: 'asg_js_closures',
    title: 'Functional Utility Suite in JS',
    description: 'Implement a comprehensive library replicating lodash closures including `memoize`, `debounce`, `throttle`, and custom async queues. Write comprehensive test logs verifying concurrency control.',
    max_points: 100,
    due_date: '2026-06-15T23:59:59Z',
    cohort_id: 'coh_react_active',
    cohort_name: 'Frontend Cohort Alpha',
    module_id: 'mod_frontend_foundations',
    module_title: 'JavaScript Foundations',
    lesson_id: 'les_js_execution',
    lesson_title: 'Execution Contexts and Closures',
    resource_id: 'res_js_doc',
    resource_title: 'ES6+ Execution Contexts & Closures Guide',
    is_locked: false
  },
  {
    id: 'asg_ts_generics',
    title: 'Type-Safe ORM Interface',
    description: 'Design a TypeScript-powered virtual repository schema compiler matching type specifications with strict validation. Must leverage conditional mappings, generic signatures, and mapped types.',
    max_points: 100,
    due_date: '2026-07-20T23:59:59Z',
    cohort_id: 'coh_react_active',
    cohort_name: 'Frontend Cohort Alpha',
    module_id: 'mod_frontend_typescript',
    module_title: 'TypeScript Systems',
    lesson_id: 'les_ts_generics',
    lesson_title: 'Generics and Schema Mapping',
    is_locked: false
  }
];

const initialModules: Module[] = [
  {
    id: 'mod_frontend_foundations',
    cohort_id: 'coh_react_active',
    cohort_name: 'Frontend Cohort Alpha',
    module_number: 1,
    title: 'JavaScript Foundations',
    description: 'Master the JavaScript runtime features needed for production frontend work.',
    notes: '',
    status: 'published',
    publish_date: '2026-05-01T09:00:00Z',
    published_by_name: 'David Malan',
    lessons: [
      {
        id: 'les_js_execution',
        module_id: 'mod_frontend_foundations',
        title: 'Execution Contexts and Closures',
        objectives: 'Understand closures, event loop behavior, and async execution.',
        content: 'Read the guide, watch the runtime walkthrough, then complete the functional utility assignment.',
        recording: 'https://example.com/js-loop-video',
        order: 1,
        resources: [
          {
            id: 'res_js_doc',
            lesson_id: 'les_js_execution',
            title: 'ES6+ Execution Contexts & Closures Guide',
            type: 'document',
            url: 'https://example.com/js-closures',
            order: 1
          }
        ]
      }
    ]
  },
  {
    id: 'mod_frontend_typescript',
    cohort_id: 'coh_react_active',
    cohort_name: 'Frontend Cohort Alpha',
    module_number: 2,
    title: 'TypeScript Systems',
    description: 'Design type-safe frontend data layers with strict schemas.',
    notes: '',
    status: 'published',
    publish_date: '2026-05-08T09:00:00Z',
    published_by_name: 'David Malan',
    lessons: [
      {
        id: 'les_ts_generics',
        module_id: 'mod_frontend_typescript',
        title: 'Generics and Schema Mapping',
        objectives: 'Apply advanced generics and mapped types to API-facing models.',
        content: '',
        recording: '',
        order: 1,
        resources: [
          {
            id: 'res_ts_pdf',
            lesson_id: 'les_ts_generics',
            title: 'TypeScript Handbook: Intermediate and Advanced Types',
            type: 'pdf',
            url: 'https://example.com/ts-advanced.pdf',
            order: 1
          }
        ]
      }
    ]
  }
];

const initialSubmissions: Submission[] = [
  {
    id: 'sub_js_001',
    assignment_id: 'asg_js_closures',
    assignment_title: 'Functional Utility Suite in JS',
    student_id: 'usr_student',
    student_name: 'Alex Mercer',
    student_email: 'student@skilix.com',
    content: 'https://github.com/alexmercer/skilix-assignment-1\n\nI have successfully implemented the utility suite. All throttling and debouncing assertions are passing. Let me know what you think!',
    submitted_at: '2026-06-14T18:30:00Z',
    status: 'graded',
    grade: 95,
    feedback: 'Excellent work Alex. The debounce leading edge edge-case behaves appropriately, and code comments are exceptionally clear.',
    graded_by_id: 'usr_teacher',
    graded_by_name: 'David Malan',
    graded_at: '2026-06-16T10:00:00Z',
    is_late: false
  }
];

const initialApplications: Application[] = [
  {
    id: 'app_001',
    first_name: 'Amara',
    last_name: 'Okafor',
    email: 'amara.okafor@gmail.com',
    phone: '+251900000001',
    age: 24,
    experience: 'BEGINNER',
    program_id: 'prg_frontend',
    program_name: 'Frontend Web Engineering',
    expectations: 'I expect mentor support, practical projects, and a clear transition from UI design into full development.',
    status: 'pending',
    created_at: '2026-06-28T09:15:00Z'
  },
  {
    id: 'app_002',
    first_name: 'Kofi',
    last_name: 'Anan',
    email: 'kofi.anan@yahoo.com',
    phone: '+251900000002',
    age: 29,
    experience: 'INTERMEDIATE',
    program_id: 'prg_ai',
    program_name: 'AI & Large Language Model Engineering',
    expectations: 'I expect to scale my analytical models using large language agents and vector retrieval databases.',
    status: 'pending',
    created_at: '2026-07-01T14:20:00Z'
  },
  {
    id: 'app_003',
    first_name: 'Michael',
    last_name: 'Schulz',
    email: 'm.schulz@outlook.com',
    phone: '+251900000003',
    age: 31,
    experience: 'ADVANCED',
    program_id: 'prg_frontend',
    program_name: 'Frontend Web Engineering',
    expectations: 'I expect to level up to TypeScript and enterprise React framework layout standards.',
    status: 'approved',
    created_at: '2026-06-20T11:00:00Z',
    reviewed_by_id: 'usr_admin',
    reviewed_by_name: 'John Doe',
    reviewed_at: '2026-06-22T09:00:00Z'
  }
];

const initialAnnouncements: Announcement[] = [
  {
    id: 'ann_001',
    title: 'Platform System Maintenance Window',
    content: 'We will be migrating our database infrastructure on July 10th at 02:00 UTC. The platform is expected to experience brief service interruptions lasting no longer than 15 minutes. Please save all ongoing work.',
    target_type: 'system',
    author_id: 'usr_superadmin',
    author_name: 'Sarah Connor',
    author_role: 'super_admin',
    is_read: false,
    created_at: '2026-06-30T12:00:00Z'
  },
  {
    id: 'ann_002',
    title: 'Midterm Portfolio Review Submissions Due',
    content: 'A gentle reminder that Frontend Cohort Alpha portfolios are scheduled for review starting next week. Ensure all project assignments are committed to your individual sandbox branches.',
    target_type: 'cohort',
    target_id: 'coh_react_active',
    target_name: 'Frontend Cohort Alpha',
    author_id: 'usr_teacher',
    author_name: 'David Malan',
    author_role: 'teacher',
    is_read: false,
    created_at: '2026-07-01T15:45:00Z'
  }
];

export class MockDatabase {
  static init() {
    if (!localStorage.getItem('skilix_users')) {
      localStorage.setItem('skilix_users', JSON.stringify(initialUsers));
      localStorage.setItem('skilix_programs', JSON.stringify(initialPrograms));
      localStorage.setItem('skilix_cohorts', JSON.stringify(initialCohorts));
      localStorage.setItem('skilix_modules', JSON.stringify(initialModules));
      localStorage.setItem('skilix_assignments', JSON.stringify(initialAssignments));
      localStorage.setItem('skilix_submissions', JSON.stringify(initialSubmissions));
      localStorage.setItem('skilix_applications', JSON.stringify(initialApplications));
      localStorage.setItem('skilix_announcements', JSON.stringify(initialAnnouncements));
      localStorage.setItem('skilix_settings', JSON.stringify({ branding_name: 'Nexus Academy LMS', theme: 'zinc' }));
    }
  }

  static get<T>(key: string): T[] {
    this.init();
    return JSON.parse(localStorage.getItem(`skilix_${key}`) || '[]');
  }

  static set<T>(key: string, data: T[]): void {
    localStorage.setItem(`skilix_${key}`, JSON.stringify(data));
  }

  static getSettings(): { branding_name: string; theme: string } {
    this.init();
    return JSON.parse(localStorage.getItem('skilix_settings') || '{"branding_name":"Nexus Academy LMS","theme":"zinc"}');
  }

  static setSettings(settings: { branding_name: string; theme: string }): void {
    localStorage.setItem('skilix_settings', JSON.stringify(settings));
  }
}
export default MockDatabase;
