import Link from "next/link";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Champion | Socratic Deep-Dive",
  description:
    "코드 제출 직후 설명 면접이 어떻게 달라지는지 보여주는 Socratic Deep-Dive 인터랙티브 데모",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="app-shell">
        <header className="app-header">
          <div className="app-header-inner">
            <Link href="/" className="app-brand">
              <span className="app-brand-eyebrow">Socratic Deep-Dive</span>
              <strong className="app-brand-name">AI Champion</strong>
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
