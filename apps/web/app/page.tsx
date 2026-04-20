import Link from "next/link";

import { problemCatalog } from "@/lib/problem-catalog";

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <div className="eyebrow">AI Champion MVP</div>
        <h1>코딩 테스트 직후, 바로 기술 면접으로 넘어가는 데모</h1>
        <p className="hero-copy">
          문제 선택부터 코드 제출, AI 꼬리 질문 4턴, 3축 피드백 리포트까지 한 번에 보여주는
          text-first MVP입니다.
        </p>
      </section>

      <section className="grid">
        {problemCatalog.map((problem) => (
          <Link key={problem.id} className="card link-card" href={`/problems/${problem.id}`}>
            <div className="eyebrow">{problem.pattern}</div>
            <h2>{problem.title}</h2>
            <p className="muted">문제 풀이 → AST 분석 → Socratic interview → report</p>
          </Link>
        ))}
      </section>
    </main>
  );
}

