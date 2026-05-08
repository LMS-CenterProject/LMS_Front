import React from "react";

const FOOTER_COLS = [
  {
    title: "Learn",
    links: ["Courses", "Paths", "Certifications", "Free Courses"],
  },
  {
    title: "Teach",
    links: ["Become Instructor", "Instructor Hub", "Resources", "Blog"],
  },
  { title: "Company", links: ["About", "Careers", "Press", "Affiliates"] },
  { title: "Support", links: ["Help Center", "Contact", "Privacy", "Terms"] },
];

const Footer: React.FC = () => (
  <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 px-6">
    <div className="max-w-[1240px] mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#6d28d9] flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg">
              Learn<span className="text-[#a78bfa]">Forge</span>
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Expert-led online learning for ambitious professionals.
          </p>
        </div>

        {/* Link columns */}
        {FOOTER_COLS.map((col) => (
          <div key={col.title}>
            <h4 className="text-white font-semibold text-sm mb-4">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          © 2026 LearnForge Inc. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {["Twitter", "LinkedIn", "YouTube"].map((s) => (
            <a
              key={s}
              href="#"
              className="text-gray-600 hover:text-white text-sm transition-colors"
            >
              {s}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
