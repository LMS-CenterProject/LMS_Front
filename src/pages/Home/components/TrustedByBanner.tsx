import React from "react";
import { COMPANIES } from "../data";

const TrustedByBanner: React.FC = () => (
  <section className="bg-gray-50 border-y border-gray-200 py-6 overflow-hidden">
    <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
      Trusted by learners at
    </p>
    <div className="overflow-hidden">
      <div className="lf-marquee-track flex gap-12 items-center whitespace-nowrap w-max">
        {[...COMPANIES, ...COMPANIES].map((c, i) => (
          <span
            key={i}
            className="text-xl font-black text-gray-300 tracking-tighter select-none"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default TrustedByBanner;
