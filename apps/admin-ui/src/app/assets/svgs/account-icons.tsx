import React from "react";

export function AccountIcon({
  size = 24,
  fill = "currentColor",
  className = "",
  ...props
}) {
  return (
    <svg
      className={`AccountIcon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Account"
      {...props}
    >
      {/* Head (circle) */}
      <circle cx="12" cy="8" r="4" fill={fill} />

      {/* Shoulders / body */}
      <path
        d="M4 20c0-4 4-6 8-6s8 2 8 6"
        fill="none"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
