import React from "react";

const StarFilled: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="#ffc107"
    viewBox="0 0 24 24"
    stroke="none"
    width="20"
    height="20"
    {...props}
  >
    <path d="M12 .587l3.668 7.568L24 9.423l-6 5.847 1.417 8.273L12 18.896 4.583 23.543 6 15.27 0 9.423l8.332-1.268L12 .587z" />
  </svg>
);

export default StarFilled;
