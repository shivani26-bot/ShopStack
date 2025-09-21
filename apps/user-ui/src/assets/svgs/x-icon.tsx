import React from "react";

type Props = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
  title?: string;
};

export default function XIcon({ size = 24, title = "X", ...props }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>{title}</title>
      <rect width="24" height="24" rx="4" fill="black" />
      <path
        d="M17.47 6H15.2l-2.54 3.33L10.2 6H6l4.77 6.6L6.5 18h2.27l2.93-3.9L14.6 18h4.2l-5.02-6.94L17.47 6z"
        fill="white"
      />
    </svg>
  );
}
