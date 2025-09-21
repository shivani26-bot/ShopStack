import { create } from "zustand";

// TypeScript type for your store.
// Your store will contain:
// isLoggedIn: a boolean flag (true/false).
// setLoggedIn: a function to update isLoggedIn.
type AuthState = {
  isLoggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
};

// create<AuthState>
// Tells TypeScript that the store follows the shape of AuthState.

// (set) => ({ ... })
// This function defines the initial state of the store.
// set is a function provided by Zustand to update state.

// isLoggedIn: true
// The initial value of isLoggedIn is true.

// setLoggedIn: (value) => set({ isLoggedIn: value })
// setLoggedIn is a function that updates isLoggedIn.
// When you call it with true or false, Zustand will update the store and re-render any subscribed components.
export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: true,
  setLoggedIn: (value) => set({ isLoggedIn: value }),
}));

// Zustand;
//  is a small, fast state management library for React. It lets you create a global store (like Redux, but simpler) that any component can access.
// create is used to define a global store.
