import React from "react";

const STEPS = [
  {
    step: "01",
    icon: "🔍",
    title: "Browse",
    desc: "Search from 2,400+ expert-led courses across 12 categories.",
  },
  {
    step: "02",
    icon: "🎯",
    title: "Enroll",
    desc: "Pick your course and start immediately — no waiting.",
  },
  {
    step: "03",
    icon: "📖",
    title: "Learn",
    desc: "HD video, coding exercises, quizzes, and live sessions.",
  },
  {
    step: "04",
    icon: "🏆",
    title: "Certify",
    desc: "Earn a shareable certificate to showcase on LinkedIn.",
  },
];

const HowItWorks: React.FC = () => (
  <section className="bg-gray-50 border-y border-gray-200 py-20 px-6">
    <div className="max-w-[1240px] mx-auto">
      <div className="text-center mb-14">
        <p className="text-sm font-semibold text-[#6d28d9] uppercase tracking-widest mb-2">
          Process
        </p>
        <h2 className="font-display font-extrabold text-3xl text-gray-900">
          How LearnForge works
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
        {/* Connector line */}
        <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200" />

        {STEPS.map(({ step, icon, title, desc }) => (
          <div
            key={step}
            className="relative flex flex-col items-center text-center px-4"
          >
            <div className="relative w-20 h-20 mb-5">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-purple-200 flex items-center justify-center text-3xl shadow-md">
                {icon}
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#6d28d9] text-white text-[10px] font-bold flex items-center justify-center">
                {step}
              </span>
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
