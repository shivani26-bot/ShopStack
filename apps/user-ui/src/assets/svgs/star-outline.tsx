import React from "react";

const StarOutline: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="#ffc107"
    strokeWidth={2}
    viewBox="0 0 24 24"
    width="20"
    height="20"
    {...props}
  >
    <path d="M12 17.27l6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73-1.64 7.03L12 17.27z" />
  </svg>
);

export default StarOutline;
