import Link from "next/link";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Socratic Deep-Dive | AI Champion",
  description:
    "같은 문제에 다른 코드를 넣었을 때 질문과 피드백이 어떻게 달라지는지 증명하는 통제형 기술면접 평가 시스템 (Socratic Deep-Dive)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="app-shell">
        <header className="app-header">
          <div className="app-header-inner">
            <Link href="/" className="app-brand">
              <span className="app-brand-eyebrow">통제형 기술면접 평가 시스템</span>
              <strong className="app-brand-name">Socratic Deep-Dive</strong>
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
