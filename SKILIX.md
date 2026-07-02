# **SKILIX Product Requirements Document (PRD)**

**Version:** 2.0 (MVP)  
 **Product:** Skilix – Cohort-Based Learning Management System  
 **Goal:** Build a modern LMS for bootcamps and academies that manages the entire student lifecycle from application to graduation.

---

# **1\. Product Vision**

Skilix is a cohort-based learning platform designed for bootcamps, academies, and training organizations. It enables organizations to manage applications, admissions, cohorts, instructors, course delivery, assessments, grading, and student progress in one system.

Unlike traditional LMS platforms, Skilix is centered around **Programs** and **Cohorts**, ensuring structured learning experiences while keeping administration simple.

---

# **2\. Objectives**

The platform should allow an academy to:

* Accept student applications  
* Review and approve applicants  
* Assign students to cohorts  
* Assign teachers to cohorts  
* Deliver weekly learning content  
* Collect assignments  
* Grade student work  
* Communicate with students  
* Track progress and performance  
* Scale across multiple programs and cohorts

---

# **3\. Core Principles**

### **Program First**

Students apply to a Program, not directly to a cohort.

Example:

AI Engineering  
   Cohort 1  
   Cohort 2  
   Cohort 3

Full Stack Development  
   Cohort 1  
   Cohort 2

UI/UX Design  
   Cohort 1  
---

### **Every Student Belongs to One Cohort**

A student belongs to exactly one active cohort.

All content, assignments, grades, and announcements are filtered by cohort.

---

### **Multiple Teachers Per Cohort**

Each cohort can have multiple teachers.

Examples

* Lead Instructor  
* Assistant Instructor  
* Mentor

---

### **Cohort Isolation**

Students never access another cohort's data.

All API endpoints automatically filter using

user.cohortId  
---

# **4\. User Roles**

## **Super Admin**

Responsible for platform administration.

Can

* Manage admins  
* Manage programs  
* View all cohorts  
* View analytics  
* Configure platform settings

---

## **Admin**

Responsible for academy operations.

Can

* Create programs  
* Create cohorts  
* Review applications  
* Approve students  
* Reject students  
* Assign teachers  
* Publish announcements  
* Manage content  
* View reports

Cannot

* Manage platform settings

---

## **Teacher**

Responsible for academic delivery.

Can

* View assigned cohorts  
* Create weekly content  
* Edit weekly content  
* Publish lessons (optional permission)  
* Grade assignments  
* View student profiles  
* View leaderboard  
* Create announcements

Cannot

* Approve students  
* Manage payments  
* Delete cohorts  
* Create programs

---

## **Student**

Can

* Access course  
* Submit assignments  
* View grades  
* View announcements  
* View leaderboard  
* Edit profile

---

# **5\. Student Lifecycle**

Visitor

↓

Application

↓

Admin Review

↓

Approved

↓

Invitation Email

↓

Account Creation

↓

Email Verification

↓

Active Student

↓

Course Progress

↓

Graduation  
---

# **6\. System Modules**

## **Module 1 — Programs**

Programs represent the curriculum offered.

Examples

* AI Engineering  
* Full Stack Web Development  
* UI/UX Design

Each program contains

* Name  
* Description  
* Duration  
* Price  
* Level  
* Thumbnail  
* Status

---

## **Module 2 — Cohorts**

Each program contains multiple cohorts.

Example

AI Engineering

├── January 2027

├── March 2027

└── July 2027

Each cohort has

* Name  
* Program  
* Start Date  
* End Date  
* Duration  
* Current Week  
* Status  
* Leaderboard Enabled

---

## **Module 3 — Applications**

Visitors apply directly on the website.

Application Form

* Full Name  
* Email  
* Phone  
* Country  
* Program  
* Experience Level  
* Motivation  
* Resume (optional)  
* Payment Proof (optional)

Status

Pending

Approved

Rejected

Withdrawn  
---

## **Module 4 — Invitations**

When approved

Admin selects

* Cohort  
* Teachers (already assigned)  
* Start Date

System sends invitation email.

Invitation contains

* Secure token  
* Expiration  
* Program  
* Cohort  
* Create Password button

Only after invitation acceptance is the User account created.

---

## **Module 5 — Authentication**

Flow

Invitation

↓

Create Password

↓

Verify Email

↓

Active Account

User Status

Unverified

Pending

Active

Rejected

Suspended

Only Active users can log in.

---

## **Module 6 — Teacher Assignment**

Teachers are assigned separately.

Relationship

Teacher

↓

Teacher Assignment

↓

Cohort

Assignment Roles

* Lead Teacher  
* Assistant Teacher  
* Mentor

---

## **Module 7 — Weekly Learning Content**

Hierarchy

Program

↓

Cohort

↓

Week

↓

Resources

Each week contains

* Title  
* Learning Objectives  
* Session 1 Notes  
* Session 2 Notes  
* Assignment  
* Resources  
* Recording  
* Publish Date

Status

Draft

Published

Archived  
---

## **Module 8 — Assignments**

Students submit

* GitHub  
* Behance  
* Figma  
* Live Demo  
* Google Drive  
* Notes

Rules

* One submission per week  
* Editable until graded  
* Locked after grading  
* Late submissions flagged automatically

---

## **Module 9 — Grading**

Teacher opens

Grades

↓

Cohort

↓

Week

↓

Student

↓

Submission

Teacher enters

* Score  
* Feedback

Submission becomes locked.

Student receives notification.

---

## **Module 10 — Dashboard**

### **Student Dashboard**

Displays

* Current Week  
* Progress  
* Latest Grade  
* Upcoming Deadline  
* Announcements  
* Leaderboard Position

---

### **Teacher Dashboard**

Displays

* Assigned Cohorts  
* Pending Grading  
* Upcoming Sessions  
* Recent Announcements  
* Student Count

---

### **Admin Dashboard**

Displays

* Applications  
* Active Students  
* Active Teachers  
* Active Cohorts  
* Programs  
* Recent Activity

---

## **Module 11 — Announcements**

Teachers and Admins can create

* Title  
* Message  
* Meeting Link  
* Date  
* Schedule

Scope

* Entire Program  
* Single Cohort

Students receive

* Email  
* Dashboard notification

---

## **Module 12 — Leaderboard**

Based on

Average assignment score

Returns

* Rank  
* Student  
* Average  
* Submission Count

Visibility controlled per cohort.

---

# **7\. Database Architecture**

Programs  
│  
├── Cohorts  
│      │  
│      ├── Weeks  
│      │      ├── Resources  
│      │      └── Assignments  
│      │  
│      ├── Students  
│      ├── TeacherAssignments  
│      ├── Announcements  
│      └── Leaderboard  
│  
Applications  
│  
└── Invitations  
       │  
       └── Users  
---

# **8\. Database Schema**

Users  
\-----  
id  
name  
email  
password  
role  
status  
photo  
bio  
cohortId  
createdAt  
Programs  
\--------  
id  
title  
slug  
description  
durationWeeks  
price  
level  
thumbnail  
status  
createdAt  
Cohorts  
\-------  
id  
programId  
name  
startDate  
endDate  
durationWeeks  
currentWeek  
leaderboardVisible  
status  
Applications  
\------------  
id  
name  
email  
phone  
country  
experience  
motivation  
programId  
paymentProof  
resume  
status  
submittedAt  
reviewedBy  
reviewedAt  
Invitations  
\-----------  
id  
email  
cohortId  
token  
expiresAt  
acceptedAt  
status  
TeacherAssignments  
\------------------  
id  
teacherId  
cohortId  
role  
assignedAt  
Weeks  
\-----  
id  
cohortId  
weekNumber  
title  
objectives  
notes  
assignment  
recording  
status  
publishDate  
createdBy  
publishedBy  
Resources  
\---------  
id  
weekId  
title  
url  
order  
Submissions  
\-----------  
id  
weekId  
studentId  
primaryLink  
secondaryLink  
notes  
submittedAt  
isLate  
isLocked  
score  
feedback  
gradedBy  
gradedAt  
Announcements  
\-------------  
id  
programId (nullable)  
cohortId (nullable)  
createdBy  
title  
message  
meetingLink  
scheduledFor  
---

# **9\. API Modules**

Authentication  
Applications  
Programs  
Cohorts  
Teachers  
Students  
Weeks  
Resources  
Assignments  
Grades  
Announcements  
Dashboard  
Leaderboard  
Profile  
---

# **10\. Recommended Tech Stack**

### **Frontend**

* Next.js (App Router)  
* TypeScript  
* Tailwind CSS  
* shadcn/ui  
* React Query  
* TipTap Editor  
* React Hook Form  
* Zod

### **Backend**

* Django  
* Django REST Framework  
* Simple JWT  
* Celery \+ Redis (background jobs)  
* Django Filters

### **Database**

* PostgreSQL

### **Object Storage**

* Cloudinary (profile images, resumes, optional assets)

### **Email**

* Resend

### **Deployment**

* Frontend: Vercel  
* Backend: Railway or Render  
* Database: Supabase PostgreSQL or Railway PostgreSQL

