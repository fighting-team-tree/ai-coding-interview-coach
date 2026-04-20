import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Champion | Socratic Deep-Dive",
  description:
    "코딩 테스트 직후 AST 근거와 Fact/Trap 가드레일로 AI 심층 면접을 이어가는 AI Champion 데모",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="app-shell">{children}</body>
    </html>
  );
}
