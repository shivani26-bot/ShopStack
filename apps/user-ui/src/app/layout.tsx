// This file runs once for the entire app.
//   Any page (/home, /about, /products) will be wrapped inside this layout:

import Header from "../shared/widgets/header";
import "./global.css";
import { Poppins, Roboto } from "next/font/google";
import Providers from "./providers";
import Footer from "../shared/widgets/footer";

// metadata helps with seo and browser tab labels
export const metadata = {
  title: "ShopStack", //Appears in the browser tab.
  description: "ShopStack", //Used by search engines.
};

// Roboto({...}) → Calls the loader function for the Roboto font.
// subsets: ["latin"] → Only downloads the characters needed for the Latin alphabet (smaller file size).
// weight: [...] → Preloads these font weights so you can use them in CSS (font-weight: 400 etc.).
// variable: "--font-roboto" → Creates a CSS custom property for the font so you can apply it in global or component styles.
// returned roboto object will have a className property and possibly variable that you can apply in your JSX.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600"],
  variable: "--font-poppins",
});

//This function is your root layout, meaning it wraps every page in your app.
// children →The nested page content that gets injected into the layout.
// Type annotation (: { children: React.ReactNode; }) is a TypeScript type that allows anything React can render (JSX, string, numbers, etc.).
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //   <html lang="en"> – Root HTML element, setting language to English (good for accessibility and SEO).
  // <body> – Where your visible content lives.
  // <Header /> – Your site’s header is included once for all pages.
  // {children} – Injects the current page’s content here.

  return (
    <html lang="en">
      <body className={`${roboto.variable} ${poppins.variable}`}>
        {/* Providers for tanstack query  */}
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
