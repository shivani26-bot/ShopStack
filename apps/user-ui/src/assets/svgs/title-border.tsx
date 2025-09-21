import React from "react";
const TitleBorder = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={200}
    height={10}
    viewBox="0 0 200 10"
    fill="none"
    {...props}
  >
    <defs>
      <linearGradient id="ink-stroke" x1="0" y1="0" x2="200" y2="0">
        <stop offset="0%" stopColor="red" stopOpacity="1" />
        <stop offset="100%" stopColor="red" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    <path
      d="M0 5 C45 9, 150 1, 200 5"
      stroke="url(#ink-stroke)"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default TitleBorder;
