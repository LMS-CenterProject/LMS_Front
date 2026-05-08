import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { coursesApi, type Course } from "../api/CoursesApi";

interface CoursesContextValue {
  courses: Course[];
  categories: string[];
  loading: boolean;
  error: string | null;
}

const CoursesContext = createContext<CoursesContextValue>({
  courses: [],
  categories: [],
  loading: true,
  error: null,
});

export const CoursesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    coursesApi
      .getAll()
      .then(setCourses)
      .catch(() => setError("Failed to load courses."))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () =>
      Array.from(new Set(courses.map((c) => c.categoryName).filter(Boolean))),
    [courses],
  );

  return (
    <CoursesContext.Provider value={{ courses, categories, loading, error }}>
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = () => useContext(CoursesContext);
