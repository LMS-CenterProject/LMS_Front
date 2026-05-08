import type { Testimonial, Stat } from "./types";

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Frontend Engineer",
    company: "Stripe",
    companyLogo: "S",
    text: "I landed my dream job at Stripe after completing the React bootcamp. The course quality and depth of content is unlike anything else I've tried — totally worth it.",
    avatar: "SC",
    rating: 5,
  },
  {
    name: "Marcus Webb",
    role: "ML Engineer",
    company: "DeepMind",
    companyLogo: "D",
    text: "The ML curriculum here is genuinely rigorous. The instructors are real practitioners, not just people reading slides. Got my first ML role within 4 months of finishing.",
    avatar: "MW",
    rating: 5,
  },
  {
    name: "Priya Nair",
    role: "Design Lead",
    company: "Figma",
    companyLogo: "F",
    text: "I went from a junior designer to leading a design system team. The UX courses gave me both hard skills and the vocabulary to communicate with engineers and stakeholders.",
    avatar: "PN",
    rating: 5,
  },
];

export const STATS: Stat[] = [
  { value: "120,000+", label: "Active learners", icon: "👩‍💻" },
  { value: "2,400+", label: "Expert-led courses", icon: "🎓" },
  { value: "180+", label: "Instructors worldwide", icon: "🌍" },
  { value: "98%", label: "Completion rate", icon: "🏆" },
];

export const COMPANIES = [
  "Google",
  "Microsoft",
  "Meta",
  "Amazon",
  "Netflix",
  "Airbnb",
  "Spotify",
  "Stripe",
];
