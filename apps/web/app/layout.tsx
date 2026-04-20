import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Socratic Deep-Dive MVP",
  description: "Coding test to interview bridge demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

