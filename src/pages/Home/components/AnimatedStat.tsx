import React, { useState, useEffect, useRef } from "react";

interface AnimatedStatProps {
  value: string;
  label: string;
  icon: string;
  delay: number;
}

const AnimatedStat: React.FC<AnimatedStatProps> = ({
  value,
  label,
  icon,
  delay,
}) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`text-center transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-3xl mb-1">{icon}</div>
      <div className="font-extrabold text-3xl text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
};

export default AnimatedStat;
