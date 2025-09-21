"use client";

interface IconProps {
  size?: number;
  fill?: string;
  className?: string;
}

export const AccountIcon = ({
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
    <path d="M12 2a6 6 0 1 0 0 12a6 6 0 0 0 0-12Zm-8 18c0-4 4-6 8-6s8 2 8 6v2H4v-2Z" />
  </svg>
);
