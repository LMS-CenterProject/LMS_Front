import React from "react";

interface GlobalLoaderProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional text to show below the spinner */
  message?: string;
  /** Full screen overlay mode */
  fullScreen?: boolean;
  /** Center in parent container (default) */
  centered?: boolean;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({
  size = "md",
  message = "Loading...",
  fullScreen = false,
  centered = true,
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${centered ? "min-h-[200px]" : ""}`}
    >
      <div
        className={`${sizeClasses[size]} rounded-full border-4 border-[#6d28d9] border-t-transparent animate-spin`}
      />
      {message && (
        <p className="text-gray-500 text-sm tracking-widest uppercase font-medium">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[9999] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default GlobalLoader;
