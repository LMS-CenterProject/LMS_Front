import React, { useState, useEffect, useRef, useCallback } from "react";

interface CategoryGridProps {
  categories: string[];
}

const scrollToCourses = (category: string) => {
  history.pushState(null, "", `?category=${encodeURIComponent(category)}`);
  window.dispatchEvent(
    new CustomEvent("categorychange", { detail: { category } }),
  );
  const el = document.getElementById("courses");
  if (el) el.scrollIntoView({ behavior: "smooth" });
};

const getIcon = (name: string) => {
  const icons = ["💻", "📊", "🎨", "🧠", "📱", "🔒", "🌐", "🚀"];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  return icons[hash % icons.length];
};

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories }) => {
  const [itemsPerView, setItemsPerView] = useState(4);
  // currentIndex is into the *real* list (0-based), separate from DOM position
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Responsive breakpoints
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 480) setItemsPerView(1);
      else if (window.innerWidth < 640) setItemsPerView(2);
      else if (window.innerWidth < 1024) setItemsPerView(3);
      else setItemsPerView(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Clones: last N items prepended, first N items appended
  const cloneCount = itemsPerView;
  const clonesBefore = categories.slice(-cloneCount);
  const clonesAfter = categories.slice(0, cloneCount);
  const fullList = [...clonesBefore, ...categories, ...clonesAfter];

  // DOM position = cloneCount offset + real index
  const domIndex = cloneCount + currentIndex;
  const translateX = (domIndex * 100) / itemsPerView;

  const goNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => prev + 1);
  }, [isAnimating]);

  const goPrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => prev - 1);
  }, [isAnimating]);

  // After transition: snap silently if we've gone past the real bounds
  const handleTransitionEnd = () => {
    setCurrentIndex((prev) => {
      if (prev >= categories.length) return 0;
      if (prev < 0) return categories.length - 1;
      return prev;
    });
    setIsAnimating(false);
  };

  // Auto-play
  useEffect(() => {
    const timer = setInterval(goNext, 3500);
    return () => clearInterval(timer);
  }, [goNext]);

  const itemWidth = `${100 / itemsPerView}%`;

  return (
    <section className="max-w-[1240px] mx-auto px-8 py-20">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">
            Explore
          </p>
          <h2 className="font-extrabold text-3xl text-gray-900">
            Top Categories
          </h2>
        </div>
      </div>

      {/* Carousel + Arrows */}
      <div className="relative">
        {/* Prev Arrow */}
        <button
          onClick={goPrev}
          aria-label="Previous"
          className="sm:-translate-x-1/2
            absolute left-[-21px] top-1/2 -translate-y-1/2 z-10
            w-[42px] h-[42px] rounded-full bg-white
            border border-violet-100 shadow-md
            flex items-center justify-center
            text-violet-700 hover:bg-violet-700 hover:text-white
            transition-all duration-150
          "
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Track */}
        <div className="overflow-hidden rounded-2xl">
          <div
            ref={trackRef}
            onTransitionEnd={handleTransitionEnd}
            className="flex"
            style={{
              transform: `translateX(-${translateX}%)`,
              transition: isAnimating
                ? "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)"
                : "none",
            }}
          >
            {fullList.map((cat, i) => (
              <div
                key={i}
                style={{ width: itemWidth, flexShrink: 0 }}
                className="p-2"
              >
                <button
                  onClick={() => scrollToCourses(cat)}
                  className="
                    flex items-center gap-4
                    bg-white border border-violet-100 rounded-2xl
                    p-4 w-full text-left
                    hover:shadow-lg hover:border-violet-300 hover:-translate-y-0.5
                    transition-all duration-200
                  "
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-violet-50 shrink-0">
                    {getIcon(cat)}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{cat}</p>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Next Arrow */}
        <button
          onClick={goNext}
          aria-label="Next"
          className="
            absolute right-[-21px] top-1/2 -translate-y-1/2 sm:translate-x-1/2 z-10
            w-[42px] h-[42px] rounded-full bg-white
            border border-violet-100 shadow-md
            flex items-center justify-center
            text-violet-700 hover:bg-violet-700 hover:text-white
            transition-all duration-150
          "
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default CategoryGrid;
