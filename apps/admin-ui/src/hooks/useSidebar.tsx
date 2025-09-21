"use client"; //client component in Next.js 13+. Required because jotai hooks (useAtom) depend on React state, which runs only on the client.
import { useAtom } from "jotai";
import { activeSideBarItem } from "../configs/contants";

// useAtom is a hook from Jotai.
// Similar to React’s useState, but for global state.
// Here, activeSideBarItem is the atom you defined earlier (atom<string>("/dashboard")).
// This returns a tuple:
// activeSidebar → the current value (string, e.g. "/dashboard")
// setActiveSidebar → a function to update it
const useSidebar = () => {
  const [activeSidebar, setActiveSidebar] = useAtom(activeSideBarItem);

  return { activeSidebar, setActiveSidebar };
};

export default useSidebar;

// Instead of calling useAtom everywhere,wrap it inside useSidebar.
// This makes your code cleaner and reusable.
