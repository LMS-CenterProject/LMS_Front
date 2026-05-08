import React from "react";
import AnimatedStat from "./AnimatedStat";
import { STATS } from "../data";

const StatsSection: React.FC = () => (
  <section className="max-w-[1240px] mx-auto px-6 py-20">
    <div className="bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] rounded-3xl p-12 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />

      <div className="relative z-10">
        <p className="text-purple-300 text-sm font-semibold uppercase tracking-widest text-center mb-2">
          Impact
        </p>
        <h2 className="font-display font-extrabold text-3xl text-white text-center mb-12">
          Numbers that speak for themselves
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <AnimatedStat
              key={stat.label}
              value={stat.value}
              label={stat.label}
              icon={stat.icon}
              delay={i * 100}
            />
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default StatsSection;
