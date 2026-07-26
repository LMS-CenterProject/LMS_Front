import React from "react";
import Navbar from "./Navbar";
import { CoursesProvider, useCourses } from "../context/CoursesContext";

const LayoutInner: React.FC<{
  children: React.ReactNode;
  hideNav: boolean;
}> = ({ children, hideNav }) => {
  const { categories } = useCourses(); // ✅ now has data

  return (
    <div className="min-h-screen bg-white">
      {!hideNav && <Navbar categories={categories} />}
      <div className={hideNav ? "" : "pt-[64px]"}>{children}</div>
    </div>
  );
};

interface PublicLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  hideNav = false,
}) => (
  <CoursesProvider>
    <LayoutInner hideNav={hideNav}>{children}</LayoutInner>
  </CoursesProvider>
);

export default PublicLayout;
