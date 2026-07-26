import React, { useState, useEffect } from "react";
import { Navigate, useParams, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { enrollmentsApi } from "../api/EnrollmentsApi";
import { coursesApi } from "../api/CoursesApi";
import type { Role } from "../utils/rbac";
import GlobalLoader from "./GlobalLLoader";

interface CourseGuardProps {
  children?: React.ReactNode;
}

export default function CourseGuard({ children }: CourseGuardProps) {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !token || !isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        const userRole = user.role as Role;

        // Admins have full access
        if (["Admin", "SuperAdmin"].includes(userRole)) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // Check course ownership for Instructors
        if (userRole === "Instructor") {
          const myCourses = await coursesApi.getMyCourses(token);
          const owns = myCourses.some((c) => c.id === courseId);
          if (owns) {
            setHasAccess(true);
          } else {
            setError("You can only manage your own courses.");
          }
          setLoading(false);
          return;
        }
        // Students: Check enrollment
        if (userRole === "Student") {
          const enrollments = await enrollmentsApi.getMyEnrollments(token);
          const isEnrolled = enrollments.some((e) => e.courseId === courseId);

          if (isEnrolled) {
            setHasAccess(true);
          } else {
            setError("You are not enrolled in this course.");
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to verify course access.");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [courseId, token, user, isAuthenticated]);

  if (loading) return <GlobalLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <h1 className="text-6xl font-black text-gray-200 mb-4">403</h1>
          <p className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </p>
          <p className="text-gray-600 mb-6">
            {error || "You don't have permission to view this course."}
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-[#6d28d9] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#5b21b6]"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
