import React from "react";

// type contract for your component.
// title: string → You must pass a string as the title (e.g., "Main Menu").
// children: React.ReactNode → Any valid React content (text, JSX elements, components) can be passed as children.
interface Props {
  title: string;
  children: React.ReactNode;
}
// ({ title, children }: Props) → This destructures title and children from props, and also ensures they follow the Props interface.
const SidebarMenu = ({ title, children }: Props) => {
  return (
    <div className="block">
      {/* tracking-[0.04rem] → custom letter spacing. */}
      <h3 className="text-xs tracking-[0.04rem] pl-1">{title}</h3>
      {/* Renders whatever you pass inside <SidebarMenu>...</SidebarMenu>. */}
      {children}
    </div>
  );
};

export default SidebarMenu;
