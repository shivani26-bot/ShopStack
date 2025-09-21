"use client";

interface IconProps {
  size?: number;
  fill?: string;
  className?: string;
}

export const HomeIcon = ({
  size = 24,
  fill = "currentColor",
  className,
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-10.5Z" />
  </svg>
);
