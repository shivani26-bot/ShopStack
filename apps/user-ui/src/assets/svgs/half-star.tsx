import React from "react";

const HalfStar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    {...props}
  >
    {/* Gray star */}
    <path
      d="M12 .587l3.668 7.568L24 9.423l-6 5.847 1.417 8.273L12 18.896 4.583 23.543 6 15.27 0 9.423l8.332-1.268L12 .587z"
      fill="#e4e5e9"
    />
    {/* Left-half gold */}
    <defs>
      <clipPath id="half-left">
        <rect x="0" y="0" width="12" height="24" />
      </clipPath>
    </defs>
    <path
      d="M12 .587l3.668 7.568L24 9.423l-6 5.847 1.417 8.273L12 18.896 4.583 23.543 6 15.27 0 9.423l8.332-1.268L12 .587z"
      fill="#ffc107"
      clipPath="url(#half-left)"
    />
  </svg>
);

export default HalfStar;
