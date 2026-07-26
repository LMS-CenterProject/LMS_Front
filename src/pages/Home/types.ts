export interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  rating: number;
  reviews: number;
  students: number;
  hours: number;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  price: number;
  originalPrice: number;
  icon: string;
  tag?: "Bestseller" | "Hot" | "New";
  tagColor?: string;
  thumbnailUrl?: string;
}

export interface Category {
  label: string;
  icon: string;
  count: string;
  color: string;
  bg: string;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  companyLogo: string;
  text: string;
  avatar: string;
  rating: number;
}

export interface Stat {
  value: string;
  label: string;
  icon: string;
}
