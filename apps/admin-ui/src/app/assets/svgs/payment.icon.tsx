import React from "react";

export function PaymentIcon({
  size = 24,
  fill = "currentColor",
  className = "",
  ...props
}) {
  return (
    <svg
      className={`PaymentIcon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Payment"
      {...props}
    >
      {/* Card outline */}
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        ry="2"
        stroke={fill}
        fill="none"
        strokeWidth="2"
      />

      {/* Card stripe */}
      <line x1="2" y1="9" x2="22" y2="9" stroke={fill} strokeWidth="2" />

      {/* Two small rectangles to represent card details */}
      <rect x="6" y="13" width="4" height="2" fill={fill} />
      <rect x="12" y="13" width="6" height="2" fill={fill} />
    </svg>
  );
}
