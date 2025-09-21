import React from "react";

export function HomeIcon({
  size = 24,
  fill = "currentColor",
  className = "",
  ...props
}) {
  return (
    <svg
      className={`HomeIcon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Home"
      {...props}
    >
      <path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z"
        fill={fill}
      />
    </svg>
  );
}
