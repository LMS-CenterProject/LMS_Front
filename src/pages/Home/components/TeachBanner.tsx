import React from "react";

const TeachBanner: React.FC = () => (
  <section className="bg-amber-50 border-y border-amber-200 py-16 px-6">
    <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center gap-8">
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-2">
          For Instructors
        </p>
        <h2 className="font-display font-extrabold text-3xl text-gray-900 mb-3">
          Teach what you know.
          <br />
          Earn doing it.
        </h2>
        <p className="text-gray-600 text-base leading-relaxed max-w-md">
          Join 180+ instructors who are already monetizing their expertise on
          LearnForge. Our tools make it easy to create, publish, and grow your
          audience.
        </p>
      </div>
      <div className="shrink-0">
        <a
          href="#"
          className="inline-flex items-center gap-2 bg-gray-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-gray-800 transition-all text-base"
        >
          Start teaching today
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </a>
      </div>
    </div>
  </section>
);

export default TeachBanner;
