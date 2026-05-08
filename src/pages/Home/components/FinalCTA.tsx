import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
const FinalCTA: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-24 px-6 lf-hero-grad relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
      </div>
      <div className="max-w-2xl mx-auto text-center relative z-10">
        <p className="text-sm font-semibold text-[#6d28d9] uppercase tracking-widest mb-3">
          Get started today
        </p>
        <h2 className="font-display font-extrabold text-4xl md:text-5xl text-gray-900 mb-5 leading-tight">
          Your next chapter
          <br />
          starts here.
        </h2>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Join 120,000+ learners who are already upskilling with LearnForge.
          Free to start — upgrade when you're ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-[#6d28d9] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#5b21b6] transition-all shadow-lg shadow-purple-200 text-base"
          >
            Create free account
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
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center bg-white text-gray-900 font-semibold px-8 py-4 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all text-base"
            >
              Go to dashboard
            </Link>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
