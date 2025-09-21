import React from "react";

type Props = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
  title?: string;
};

export default function YoutubeIcon({
  size = 24,
  title = "YouTube",
  ...props
}: Props) {
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
      <rect x="1.5" y="4" width="21" height="16" rx="4" ry="4" fill="#FF0000" />
      <polygon points="10.2,8.5 16.5,12 10.2,15.5" fill="#fff" />
    </svg>
  );
}
