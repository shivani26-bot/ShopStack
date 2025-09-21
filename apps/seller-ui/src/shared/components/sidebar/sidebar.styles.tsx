"use client";
import styled from "styled-components";

// Default state: hidden (transform: translate(-100%)) → sidebar is off-screen.
// position: fixed → it overlays the page.
// overflow-y: auto → makes it scrollable.
// Uses CSS variables (var(--background), etc.) for theme consistency.
// @media (min-width:768px) → On tablet/desktop, sidebar becomes static, visible, vertical full height.
// props.collapsed → Allows dynamic toggling via React props.
export const SidebarWrapper = styled.div`
  background-color: var(--background); //update your css variables as needed
  transition: transform 0.2s ease;
  height: 100%;
  position: fixed;
  transform: translate(-100%);
  width: 16rem;
  flex-shrink: 0;
  z-index: 202;
  overflow-y: auto;
  border-right: 1px solid var(--border);
  flex-direction: column;
  padding-top: var(--space-10); //convert design token to css variables
  padding-bottom: var(--space-10);
  padding-left: var(--space-6);
  padding-right: var(--space-6);

  ::-webkit-scrollbar {
    display: none;
  }
  @media (min-width: 768px) {
    margin-left: 0;
    display: flex;
    position: static;
    height: 100vh;
    transform: translateX(0);
  }

  //   variants for collapsed
  ${(props: any) =>
    props.collapsed &&
    `display:inherit;
margin-left:0;
transform:translateX(0)
`}
`;

// A semi-transparent background overlay behind the sidebar.
// Covers full screen (top/right/bottom/left: 0).
// Fades in/out using opacity.
// Hidden on desktop (display: none in media query).
//overlay component
export const Overlay = styled.div`
  background-color: rgba(15, 23, 42, 0.3);
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 201;
  transition: opacity 0.3s ease;
  opacity: 0.8;
  @media (min-width;768px) {
    display: none;
    z-index: auto; //unnecessary, since display: none already hides it.
    opacity: 1;
  }
`;
// header component
export const Header = styled.div`
  display: flex;
  gap: var(--space-10);
  align-items: center;
  padding-left: var(--space-10);
  padding-right: var(--space-10);
`;
//body component
export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  margin-top: var(--space-13);
  padding-left: var(--space-4);
  padding-right: var(--space-4);
`;

// footer component
export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-12);
  padding-top: var(--space-18); //convert design token to css variables
  padding-bottom: var(--space-8);
  padding-left: var(--space-8);
  padding-right: var(--space-8);

  @media (min-width;768px) {
    padding-top: 0; //convert design token to css variables
    padding-bottom: 0;
  }
`;

export const Sidebar = {
  Wrapper: SidebarWrapper,
  Header,
  Body,
  Overlay,
  Footer,
};

// styled components:
// CSS-in-JS library for React.
// Lets you write actual CSS inside your JavaScript/TypeScript files.
// You create styled versions of HTML elements or components (styled.div, styled.button, etc.)
// Styling is scoped → each component gets a unique className, so styles don’t leak globally.
// Supports:
// Props-based styling (${props => props.active && "background:red;"})
// Media queries
// Nesting & pseudo-selectors (:hover, ::before, etc.)
// Theming via <ThemeProvider>.
