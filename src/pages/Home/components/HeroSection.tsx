import React from "react";
import { Link } from "react-router-dom";
import Stars from "../../../components/Stars";

const AVATARS = [
  { i: "SC", c: "#6d28d9" },
  { i: "MW", c: "#0891b2" },
  { i: "PN", c: "#059669" },
  { i: "JD", c: "#d97706" },
  { i: "AR", c: "#db2777" },
];

const HeroSection: React.FC = () => (
  <section
    id="hero"
    className=" lf-hero-grad py-20 px-6 overflow-hidden relative"
  >
    {/* Decorative blobs */}
    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/30 blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#6d28d9]/10 blur-3xl pointer-events-none" />

    <div className="max-w-[1240px] mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
      {/* Left text */}
      <div className="flex-1 text-center lg:text-left">
        <div className="lf-anim-1 inline-flex items-center gap-2 bg-white border border-purple-200 text-[#6d28d9] text-xs font-semibold px-4 py-2 rounded-full mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6d28d9] animate-pulse" />
          2,400+ courses — new ones added every week
        </div>

        <h1 className="lf-anim-2 font-display font-extrabold text-5xl lg:text-6xl xl:text-7xl text-gray-900 leading-[1.05] tracking-tight mb-6">
          Learn the skills
          <br />
          that move your
          <br />
          <span className="text-[#6d28d9]">career forward.</span>
        </h1>

        <p className="lf-anim-3 text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
          Expert-led courses in development, design, data, and more. Learn at
          your pace, earn certificates, and land the roles you want.
        </p>

        <div className="lf-anim-4 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-[#6d28d9] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#5b21b6] transition-all shadow-lg shadow-purple-200 text-base"
          >
            Start learning free
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
          </Link>
          <a
            href="#courses"
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold px-8 py-4 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all text-base"
          >
            Browse courses
          </a>
        </div>

        {/* Social proof */}
        <div className="lf-anim-4 flex items-center gap-4 mt-8 justify-center lg:justify-start">
          <div className="flex -space-x-2">
            {AVATARS.map(({ i, c }, idx) => (
              <div
                key={idx}
                className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ background: c }}
              >
                {i[0]}
              </div>
            ))}
          </div>
          <div>
            <Stars rating={5} size="md" />
            <p className="text-sm text-gray-600 mt-0.5">
              <span className="font-bold text-gray-900">120,000+</span> learners
              enrolled
            </p>
          </div>
        </div>
      </div>

      {/* Right card stack */}
      <div className="flex-1 flex justify-center lg:justify-end">
        <div className="relative w-80">
          {/* Back cards */}
          <div className="absolute -top-4 -left-4 right-4 bottom-4 bg-white rounded-2xl border border-gray-200 shadow-md opacity-50" />
          <div className="absolute -top-2 -left-2 right-2 bottom-2 bg-white rounded-2xl border border-gray-200 shadow-md opacity-70" />

          {/* Main card */}
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                ⚛️
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  React Development
                </p>
                <p className="text-gray-400 text-xs">52 hours · All Levels</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {[
                { label: "Fundamentals", pct: 100 },
                { label: "Hooks & State", pct: 88 },
                { label: "Advanced Patterns", pct: 64 },
                { label: "Testing", pct: 32 },
              ].map(({ label, pct }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{label}</span>
                    <span className="text-xs font-semibold text-[#6d28d9]">
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6d28d9] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div>
                <div className="font-display text-2xl font-extrabold text-gray-900">
                  71%
                </div>
                <div className="text-xs text-gray-400">Overall progress</div>
              </div>
              <button className="bg-[#6d28d9] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#5b21b6] transition-colors">
                Resume →
              </button>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -top-5 -right-5 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            🎉 Certificate Earned!
          </div>
          <div className="absolute -bottom-5 -left-5 bg-white border border-gray-200 text-xs px-3 py-2 rounded-xl text-gray-700 shadow-lg flex items-center gap-1.5">
            ✅ Lesson 38 of 52 done
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
