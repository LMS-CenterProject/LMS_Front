import React, { useState, useEffect } from "react";
import CourseCard from "./CourseCard";
import { type Course } from "../../../api/CoursesApi";

interface Props {
  courses: Course[];
  loading: boolean;
  error: string | null;
}

const FeaturedCourses: React.FC<Props> = ({ courses, loading, error }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    // ✅ Read URL on first render — before any effect runs
    return new URLSearchParams(window.location.search).get("category") ?? "";
  });

  // Build category list from courses
  useEffect(() => {
    const cats = Array.from(
      new Set(courses.map((c) => c.categoryName).filter(Boolean)),
    );
    setCategories(cats);

    // Only fall back to first category if nothing is selected from URL/event
    setActiveTab((prev) =>
      prev && cats.includes(prev) ? prev : (cats[0] ?? ""),
    );
  }, [courses]);

  // Listen for category changes from Navbar / CategoryGrid / browser back-forward
  useEffect(() => {
    const onCategoryChange = (e: Event) => {
      const category = (e as CustomEvent<{ category: string }>).detail
        ?.category;
      if (category) setActiveTab(category);
    };

    const onPopState = () => {
      const category = new URLSearchParams(window.location.search).get(
        "category",
      );
      if (category) setActiveTab(category);
    };

    window.addEventListener("categorychange", onCategoryChange);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("categorychange", onCategoryChange);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const handleTabClick = (cat: string) => {
    setActiveTab(cat);
    history.pushState(null, "", `?category=${encodeURIComponent(cat)}`);
    window.dispatchEvent(
      new CustomEvent("categorychange", { detail: { category: cat } }),
    );
  };

  const visible = activeTab
    ? courses.filter((c) => c.categoryName === activeTab)
    : courses;

  return (
    <section
      id="courses"
      className="bg-gray-50 border-y border-gray-200 py-20 px-6"
    >
      <div className="max-w-[1240px] mx-auto">
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display font-extrabold text-3xl text-gray-900">
            Featured Courses
          </h2>
    
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleTabClick(cat)}
                className={`shrink-0 text-sm font-medium px-4 py-2 rounded-full cursor-pointer transition-all ${
                  activeTab === cat
                    ? "bg-[#6d28d9] text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-sm text-red-500">{error}</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            No courses found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ">
            {visible.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-4">
          <p className="text-gray-500 text-sm">Can't find what you need?</p>
          <a
            href="#"
            className="text-sm font-semibold text-[#6d28d9] hover:text-[#5b21b6] border border-[#6d28d9] px-4 py-2 rounded-xl hover:bg-purple-50 transition-all"
          >
            Request a course
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCourses;
