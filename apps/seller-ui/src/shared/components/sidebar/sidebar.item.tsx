import Link from "next/link";
import React from "react";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href: string;
}
const SidebarItem = ({ icon, title, isActive, href }: Props) => {
  return (
    <Link href={href} className="my-2 block">
      {/* transform: scale(0.98);:CSS transform scaling of 98%.Makes the element slightly smaller (like a "pressed" effect). 
      fill-blue-200 Applies blue-200 color to SVG fill ,fill: rgb(191 219 254); /* Tailwind’s blue-200 
      On hover, change the background color to #0f3158d6 (same navy but with some transparency).
      ! before bg means important override.
Ensures this hover color always wins over any other hover:bg defined elsewhere.
      */}
      <div
        className={`flex gap-2 w-full min-h-12 h-full items-center px-[13px] rounded-lg cursor-pointer transition hover:bg-[#2b2f31]
          ${
            isActive &&
            "scale-[.98] bg-[#0f3158] fill-blue-200 hover:!bg-[#0f3158d6]"
          }
          `}
      >
        {icon}
        <h5 className="text-slate-200 text-lg">{title}</h5>
      </div>
    </Link>
  );
};

export default SidebarItem;
