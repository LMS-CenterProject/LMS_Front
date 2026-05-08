import React from "react";
import { useCourses } from "../../context/CoursesContext";
import HeroSection from "./components/HeroSection";
import TrustedByBanner from "./components/TrustedByBanner";
import CategoryGrid from "./components/CategoryGrid";
import FeaturedCourses from "./components/FeaturedCourses";
import StatsSection from "./components/StatsSection";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import TeachBanner from "./components/TeachBanner";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

const HomePage: React.FC = () => {
  const { courses, categories, loading, error } = useCourses(); // ✅ same data, no extra fetch

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="lf-home">
        <HeroSection />
        <TrustedByBanner />
        <CategoryGrid categories={categories} />
        <FeaturedCourses courses={courses} loading={loading} error={error} />
        <StatsSection />
        <HowItWorks />
        <Testimonials />
        <TeachBanner />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
