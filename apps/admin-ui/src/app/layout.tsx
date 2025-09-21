import "./global.css";
import { Poppins } from "next/font/google";
import Providers from "./providers";

export const metadata = {
  title: "ShopStack Admin",
  description: "Admin ui",
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen bg-slate-900 font-sans antialiased ${poppins.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
