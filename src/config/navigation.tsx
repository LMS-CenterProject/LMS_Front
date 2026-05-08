import React from "react";
import type { Role } from "../utils/rbac";

// ─── Page components ──────────────────────────────────────────────────────────
import LMSDashboard from "../pages/Dashboard/DashboardPage";
import ProfilePage from "../pages/Profile/Profile";
import CoursesPage from "../pages/Courses/CoursesPage";
import EnrollmentsPage from "../pages/Enrollments/EnrollmentsPage";
import ContentPage from "../pages/ContentPage/ContentPage";
import QuizzesPage from "../pages/Quizzes/QuizzesPage";
import ProgressPage from "../pages/Progress/ProgressPage";
import CertificatesPage from "../pages/Certificates/CertificatesPage";
import ReviewsPage from "../pages/Reviews/ReviewsPage";
import UsersPage from "../pages/Users/UsersPage";
// import AnalyticsPage from "../pages/Analytics/AnalyticsPage";
// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  path: string;
  icon: React.FC<{ className?: string }>;
  component: React.FC;

  roles?: Role[];
  badge?: number | string;
}

export interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  Grid: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  Book: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  Trophy: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    </svg>
  ),
  Chart: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  User: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  Users: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  Enrollment: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  ),
  Folder: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      />
    </svg>
  ),
  Progress: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  ),
  Star: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  ),
  Quiz: ({ className }: { className?: string }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

// ─── THE config — edit roles here to control sidebar + route access together ──
//
//  roles: undefined          → all authenticated users
//  roles: ["Instructor"]     → Instructor, Admin, SuperAdmin  (hierarchy)
//  roles: ["Admin"]          → Admin, SuperAdmin only
//  roles: ["SuperAdmin"]     → SuperAdmin only
//

export const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: "Overview",
    items: [
      {
        icon: Icon.Grid,
        label: "Dashboard",
        path: "/dashboard",
        component: LMSDashboard,
        roles: ["Admin", "SuperAdmin", "Instructor", "Student"],
      },
      // {
      //   icon: Icon.Chart,
      //   label: "Analytics",
      //   path: "/analytics",
      //   component: AnalyticsPage,
      //   roles: ["Admin", "SuperAdmin", "Instructor"],
      // },
    ],
  },
  {
    groupLabel: "Learning",
    items: [
      {
        icon: Icon.Book,
        label: "Courses",
        path: "/courses",
        component: CoursesPage,
        // no roles → everyone
      },
      {
        icon: Icon.Enrollment,
        label: "Enrollments",
        path: "/enrollments",
        component: EnrollmentsPage,
        roles: ["Student"],
      },
      {
        icon: Icon.Folder,
        label: "Sections & Lessons",
        path: "/content",
        component: ContentPage,
      },
      {
        icon: Icon.Quiz,
        label: "Quizzes",
        path: "/quizzes",
        component: QuizzesPage,
      },
    ],
  },
  {
    groupLabel: "Tracking",
    items: [
      {
        icon: Icon.Progress,
        label: "Progress",
        path: "/progress",
        component: ProgressPage,
        roles: ["Student"],
      },
      {
        icon: Icon.Trophy,
        label: "Certificates",
        path: "/certificates",
        component: CertificatesPage,
        roles: ["Student"],
      },
      {
        icon: Icon.Star,
        label: "Reviews",
        path: "/reviews",
        component: ReviewsPage,
      },
    ],
  },
  {
    groupLabel: "Management",
    items: [
      {
        icon: Icon.Users,
        label: "Users",
        path: "/users",
        component: UsersPage,
        roles: ["Admin", "SuperAdmin"],
      },
    ],
  },
  {
    groupLabel: "Account",
    items: [
      {
        icon: Icon.User,
        label: "Profile",
        path: "/profile",
        component: ProfilePage,
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
