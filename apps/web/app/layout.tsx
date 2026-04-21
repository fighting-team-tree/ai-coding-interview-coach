import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Champion | Socratic Deep-Dive",
  description:
    "제출 코드와 문제 기준 정보를 바탕으로 질문 근거와 분기 흐름을 보여주는 AI Champion 기술면접 데모",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="app-shell">{children}</body>
    </html>
  );
}
