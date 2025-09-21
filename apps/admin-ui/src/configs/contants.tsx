import { atom } from "jotai";
export const activeSideBarItem = atom<string>("/dashboard");

// atom: This comes from Jotai, a state management library for React.
// An atom is like a small, self-contained state unit.
// You can read and update this atom from any component without prop-drilling

// atom<string> means this atom will hold a string value only.
// If you try to assign a number or object, TypeScript will throw an error.

// "/dashboard" is the initial state.
// So, when your app starts, the default active sidebar item is /dashboard.
