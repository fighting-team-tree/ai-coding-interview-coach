import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Socratic Deep-Dive | AI Champion",
  description:
    "같은 문제에 다른 코드를 넣었을 때 질문과 피드백이 어떻게 달라지는지 증명하는 통제형 기술면접 평가 시스템 (Socratic Deep-Dive)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`dark ${inter.variable}`}>
      <body className="bg-marketing-black text-text-primary antialiased selection:bg-brand-indigo/30 selection:text-white">
        <div className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '88px 88px',
          maskImage: 'linear-gradient(180deg, rgba(0, 0, 0, 0.48), transparent 84%)'
        }} />
        <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-marketing-black/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <div className="flex flex-col">
                <span className="text-brand-indigo text-[10px] font-[510] tracking-widest">
                  통제형 기술면접 평가 시스템
                </span>
                <strong className="text-text-primary font-[510] tracking-tight">Socratic Deep-Dive</strong>
              </div>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/#practice-problems" className="text-text-secondary hover:text-text-primary text-[13px] font-[510] transition-colors">
                시연 문제
              </Link>
              <Link href="#" className="btn-ghost text-[13px] py-1.5 px-3">
                저장소 보기
              </Link>
            </nav>
          </div>
        </header>
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
