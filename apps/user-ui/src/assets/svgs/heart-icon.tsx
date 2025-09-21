// heart-icon.tsx
import React from "react";

interface HeartIconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

const HeartIcon: React.FC<HeartIconProps> = ({
  size = 24,
  color = "#000",
  filled = false,
}) => {
  return filled ? (
    // Filled Heart (with padding fix)
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill={color}
    >
      <path d="M13 23s-7.2-5-10.5-9.8C-1 6.9 3.8 2 9.4 5.4c1.1.7 2.1 1.7 3.6 3.1 1.5-1.4 2.5-2.4 3.6-3.1C22.2 2 27 6.9 23.5 13.2 20.2 18 13 23 13 23z" />
    </svg>
  ) : (
    // Outline Heart (with padding fix)
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.8 5.6c-1.5-1.4-3.6-2.1-5.6-1.9-1.7.1-3.3.9-4.2 2.3-.9-1.4-2.5-2.2-4.2-2.3-2-.2-4.1.5-5.6 1.9-2.1 2-2.3 5.3-.4 7.5 3.1 4 10.4 8.8 10.4 8.8s7.3-4.8 10.4-8.8c1.9-2.3 1.7-5.6-.4-7.5z" />
    </svg>
  );
};

export default HeartIcon;
