import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { coursesApi, type Course } from "../api/CoursesApi";
import { useAuth } from "./AuthContext";

interface CoursesContextValue {
  courses: Course[];
  categories: string[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const CoursesContext = createContext<CoursesContextValue>({
  courses: [],
  categories: [],
  loading: true,
  error: null,
  refresh: () => {},
});

export const CoursesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    coursesApi
      .getAll(token ?? undefined)
      .then(setCourses)
      .catch(() => setError("Failed to load courses."))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const categories = useMemo(
    () =>
      Array.from(new Set(courses.map((c) => c.categoryName).filter(Boolean))),
    [courses],
  );

  return (
    <CoursesContext.Provider
      value={{ courses, categories, loading, error, refresh: fetch }}
    >
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = () => useContext(CoursesContext);
