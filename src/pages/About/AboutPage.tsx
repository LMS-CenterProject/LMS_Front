import React from "react";
import { Link } from "react-router";

// ─── Data ─────────────────────────────────────────────────────────────────────

const VALUES = [
  {
    icon: "🌱",
    title: "Growth for everyone",
    desc: "We believe learning shouldn't be gatekept. Every course we publish is built with accessibility and clarity at its core.",
  },
  {
    icon: "🤝",
    title: "Community first",
    desc: "Behind every lesson is a community of peers, mentors, and makers cheering each other on. You're never learning alone.",
  },
  {
    icon: "🔍",
    title: "Honest quality",
    desc: "We vet every instructor and review every curriculum. No filler, no fluff — just content that actually moves the needle.",
  },
  {
    icon: "⚡",
    title: "Always evolving",
    desc: "Technology moves fast. Our library is continuously updated so your skills stay sharp and market-ready.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Browse & discover",
    desc: "Explore hundreds of courses across categories — from web dev and data science to design and beyond.",
  },
  {
    number: "02",
    title: "Learn at your pace",
    desc: "Stream lessons anytime, anywhere. Pause, rewind, re-watch — your schedule, your rules.",
  },
  {
    number: "03",
    title: "Practice & build",
    desc: "Every course ships with exercises, projects, and real-world scenarios to cement what you've learned.",
  },
  {
    number: "04",
    title: "Earn & grow",
    desc: "Complete courses, earn certificates, and showcase your new skills to employers and the world.",
  },
];

const TEAM = [
  {
    name: "Hazem Esam",
    role: "Front-End Developer",
    initials: "HE",
    color: "#1a56db",
    connect: "https://hazemesam.netlify.app/",
  },
  {
    name: "Ahmed Gaffer",
    role: "Backend Developer · .NET",
    initials: "AG",
    color: "#065f46",
    connect: "https://www.linkedin.com/in/ahmed-gaffer-1a56b7244/",
  },
  {
    name: "Mahmoud Ahmed",
    role: "Backend Developer · .NET",
    initials: "MA",
    color: "#6d28d9",
    connect: "https://www.linkedin.com/in/mahmoud-ahmed-1a56b7244/",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600 mb-3">
    {children}
  </p>
);

const SectionHeading: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <h2
    className={`font-display font-extrabold text-3xl sm:text-4xl text-gray-900 leading-tight ${className}`}
  >
    {children}
  </h2>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const AboutPage: React.FC = () => {
  return (
    <main className="overflow-x-hidden">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#faf9ff] border-b border-violet-100 py-28 px-6 overflow-hidden">
        {/* Decorative blob */}
        <div
          className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full opacity-[0.07] pointer-events-none"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-24 -left-20 w-[340px] h-[340px] rounded-full opacity-[0.05] pointer-events-none"
          style={{
            background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
          }}
        />

        <div className="max-w-3xl mx-auto text-center relative">
          <span className="inline-block bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Our story
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-gray-900 leading-tight mb-6">
            Learning that feels{" "}
            <span className="relative inline-block">
              <span className="relative z-10">human.</span>
              <span
                className="absolute bottom-1 left-0 w-full h-3 -z-0 opacity-30 rounded"
                style={{ background: "#8b5cf6" }}
              />
            </span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-xl mx-auto">
            We started with one belief: that great education should be warm,
            accessible, and built around real people — not just content
            libraries.
          </p>
        </div>
      </section>

      {/* ── MISSION ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <SectionLabel>Our mission</SectionLabel>
            <SectionHeading className="mb-6">
              Empowering curious minds, one lesson at a time.
            </SectionHeading>
            <p className="text-gray-500 leading-relaxed mb-4">
              We built this platform because we were frustrated by learning
              tools that felt cold and transactional. Courses that talked at
              you, never with you. Communities that existed in name only.
            </p>
            <p className="text-gray-500 leading-relaxed mb-4">
              So we started over. We recruited instructors who genuinely care.
              We designed every interaction to feel encouraging, not
              overwhelming. And we built a community where asking "dumb
              questions" is not just allowed — it's celebrated.
            </p>
            <p className="text-gray-500 leading-relaxed">
              Today, tens of thousands of learners trust us with something
              deeply personal: their time, their ambitions, and their growth. We
              don't take that lightly.
            </p>
          </div>

          {/* Visual card */}
          <div className="relative">
            <div className="bg-violet-50 rounded-3xl p-10 border border-violet-100">
              <div className="text-5xl mb-4">💡</div>
              <blockquote className="text-xl font-semibold text-gray-800 leading-snug mb-4">
                "The best investment you can make is in yourself. We're just
                here to make that investment worth every second."
              </blockquote>
              <p className="text-sm text-violet-600 font-semibold">
                — Layla Hassan, Co-founder
              </p>
            </div>
            {/* Floating accent */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-amber-100 rounded-2xl border border-amber-200 flex items-center justify-center text-3xl shadow-sm">
              🚀
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50 border-y border-gray-200">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>How it works</SectionLabel>
            <SectionHeading>From zero to skilled — together.</SectionHeading>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-violet-200 hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Step number watermark */}
                <span className="absolute -top-3 -right-2 text-7xl font-extrabold opacity-[0.04] text-gray-900 select-none leading-none">
                  {step.number}
                </span>
                {/* Step badge */}
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-xs font-extrabold mb-4">
                  {i + 1}
                </span>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>What we stand for</SectionLabel>
            <SectionHeading>Values we never compromise on.</SectionHeading>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="flex gap-5 p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:border-violet-200 hover:bg-violet-50/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 group-hover:border-violet-200 flex items-center justify-center text-2xl flex-shrink-0 transition-colors shadow-sm">
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#faf9ff] border-t border-violet-100">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>The team</SectionLabel>
            <SectionHeading>The humans behind the platform.</SectionHeading>
            <p className="text-gray-500 mt-4 max-w-lg mx-auto text-sm leading-relaxed">
              A tight-knit team of developers who designed, built, and shipped
              LearnForge from the ground up.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {TEAM.map((member) => (
              <a
                key={member.name}
                href={member.connect}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center group"
              >
                {/* Avatar */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white mx-auto mb-3 shadow-sm transition-transform group-hover:-translate-y-1"
                  style={{ background: member.color }}
                >
                  {member.initials}
                </div>
                <p className="text-sm font-bold text-gray-900 leading-snug">
                  {member.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{member.role}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">🌟</div>
          <SectionHeading className="mb-4">
            Ready to start your journey?
          </SectionHeading>
          <p className="text-gray-500 text-base leading-relaxed mb-10 max-w-lg mx-auto">
            Join a community of thousands of learners who are building real
            skills, one lesson at a time. Your next chapter starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center gap-2 bg-violet-700 hover:bg-violet-800 text-white text-sm font-semibold px-7 py-3 rounded-xl transition-colors shadow-md shadow-violet-200"
            >
              Browse courses →
            </Link>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-gray-700 text-sm font-semibold px-7 py-3 rounded-xl transition-all"
            >
              Meet our instructors
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
