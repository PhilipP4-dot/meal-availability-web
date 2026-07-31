import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Meal Board | Available now",
  description: "A simple board showing which home-cooked meals are available right now.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
