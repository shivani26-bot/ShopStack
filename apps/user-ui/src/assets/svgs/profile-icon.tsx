// profile-icon.tsx
import React from "react";

interface ProfileIconProps {
  size?: number;
  color?: string;
}

const ProfileIcon: React.FC<ProfileIconProps> = ({
  size = 24,
  color = "#000",
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Head */}
      <circle cx="12" cy="8" r="4" />
      {/* Shoulders */}
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
};

export default ProfileIcon;
