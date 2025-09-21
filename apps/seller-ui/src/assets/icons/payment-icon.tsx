"use client";

interface IconProps {
  size?: number;
  fill?: string;
  className?: string;
}

export const PaymentIcon = ({
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
    <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V6Zm0 4h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8Zm3 3v2h4v-2H6Z" />
  </svg>
);
