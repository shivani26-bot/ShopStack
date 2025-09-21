// cart-icon.tsx
import React from "react";

interface CartIconProps {
  size?: number;
  color?: string;
}

const CartIcon: React.FC<CartIconProps> = ({ size = 24, color = "#000" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Bag shape */}
      <path d="M6 7h12l1.5 14H4.5L6 7z" />

      {/* Bag handles */}
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
};

export default CartIcon;
