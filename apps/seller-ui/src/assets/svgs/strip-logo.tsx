// StripeIcon.tsx
import React from "react";

export default function StripeLogo() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="25" height="25" rx="6" fill="#635BFF" />
      {/* Letter S */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="bold"
        fontSize="14"
        fill="white"
      >
        S
      </text>
    </svg>
  );
}
