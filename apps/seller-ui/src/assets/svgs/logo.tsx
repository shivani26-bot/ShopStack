"use client";

interface LogoProps {
  size?: number; // defaults to 25
  color?: string; // defaults to currentColor
  className?: string;
}

const Logo = ({ size = 25, color = "currentColor", className }: LogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer rounded square made of DOTS */}
      <rect
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="4"
        stroke={color}
        strokeWidth="1.6"
        strokeDasharray="0 3" // 0-length dash + 3 gap = dots
        strokeLinecap="round"
      />

      {/* 4 inner dots arranged in a square */}
      <g fill={color}>
        <circle cx="8" cy="8" r="1.7" />
        <circle cx="16" cy="8" r="1.7" />
        <circle cx="8" cy="16" r="1.7" />
        <circle cx="16" cy="16" r="1.7" />
      </g>
    </svg>
  );
};

export default Logo;
