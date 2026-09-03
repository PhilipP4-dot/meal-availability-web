import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Sweet & Spicy African Foods | Available now",
  description: "See which home-cooked West African meals are available from Sweet & Spicy African Foods.",
  openGraph: {
    title: "Sweet & Spicy African Foods",
    description: "See which home-cooked West African meals are available right now.",
    images: [{ url: "/media/welcome-english.png", width: 2048, height: 1024, alt: "Welcome to Sweet & Spicy African Foods" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sweet & Spicy African Foods",
    description: "See which home-cooked West African meals are available right now.",
    images: ["/media/welcome-english.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
