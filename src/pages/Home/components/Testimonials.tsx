import React from "react";
import Stars from "../../../components/Stars";
import { TESTIMONIALS } from "../data";

const Testimonials: React.FC = () => (
  <section className="max-w-[1240px] mx-auto px-6 py-20">
    <div className="text-center mb-14">
      <p className="text-sm font-semibold text-[#6d28d9] uppercase tracking-widest mb-2">
        Reviews
      </p>
      <h2 className="font-display font-extrabold text-3xl text-gray-900">
        What our learners say
      </h2>
      <div className="flex items-center justify-center gap-2 mt-3">
        <Stars rating={5} size="md" />
        <span className="text-gray-500 text-sm">
          4.9 average from 100,000+ reviews
        </span>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {TESTIMONIALS.map((t) => (
        <div
          key={t.name}
          className="lf-card-hover bg-white border border-gray-200 rounded-2xl p-6 flex flex-col"
        >
          <Stars rating={t.rating} size="md" />
          <p className="text-gray-700 text-sm leading-relaxed mt-4 mb-6 flex-1">
            "{t.text}"
          </p>
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <div className="w-10 h-10 rounded-full bg-[#6d28d9] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {t.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-400">
                {t.role} · {t.company}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Testimonials;
