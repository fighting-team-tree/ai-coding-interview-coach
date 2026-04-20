import Link from "next/link";

import { problemCatalog } from "@/lib/problem-catalog";

const productSignals = [
  {
    title: "Controlled Interview AI",
    description: "문제별 Fact/Trap 가이드 안에서만 질문을 이어가며 면접 주제 이탈을 줄입니다.",
  },
  {
    title: "Code-Native Evidence",
    description: "제출 코드의 AST, 복잡도, 위험 연산 신호를 면접 질문의 근거로 직접 노출합니다.",
  },
  {
    title: "B2B-Ready Feedback",
    description: "개인 리포트가 끝이 아니라, 교육기관이 약점 분포를 회수할 수 있는 데이터 구조를 전제합니다.",
  },
];

const journeyStages = [
  "문제 선택",
  "코드 제출",
  "AST/Trap 분석",
  "Socratic interview",
  "3축 리포트",
];

export default function HomePage() {
  const featuredProblem = problemCatalog[0];

  return (
    <main className="container">
      <section className="hero hero-shell">
        <div className="hero-panel">
          <div className="eyebrow">AI Champion MVP</div>
          <h1>코딩 테스트 직후, AI가 내 코드의 약점을 근거로 압박 면접을 만든다</h1>
          <p className="hero-copy">
            Socratic Deep-Dive는 단순한 문제 풀이 사이트가 아니라, 제출된 코드의 AST 신호와
            문제별 Fact/Trap 가드레일을 바탕으로 질문 전략을 바꾸는 면접형 데모입니다.
          </p>
          <div className="hero-cta-row">
            <Link className="primary hero-cta" href={`/problems/${featuredProblem.id}`}>
              대표 데모 시작하기
            </Link>
            <a className="secondary-button" href="#demo-scenarios">
              시나리오 먼저 보기
            </a>
          </div>
          <div className="hero-actions">
            <span className="hero-badge">Fact/Trap controlled</span>
            <span className="hero-badge">AST evidence visible</span>
            <span className="hero-badge">기관용 feedback story</span>
          </div>
          <div className="hero-proof-grid">
            {productSignals.map((signal) => (
              <article key={signal.title} className="proof-card">
                <div className="eyebrow">핵심 근거</div>
                <h2>{signal.title}</h2>
                <p className="muted">{signal.description}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="hero-aside card">
          <div className="eyebrow">심사 포인트</div>
          <h2>심사위원이 바로 이해해야 할 차별점</h2>
          <ul className="signal-list">
            <li>왜 이 질문이 나왔는지 AST와 trap 근거가 보인다.</li>
            <li>좋은 풀이와 나쁜 풀이가 서로 다른 interview flow로 분기된다.</li>
            <li>리포트가 개인 피드백을 넘어 교육기관 데이터 자산으로 이어진다.</li>
          </ul>
          <div className="featured-demo">
            <div className="eyebrow">대표 시나리오</div>
            <strong>{featuredProblem.title}</strong>
            <p className="muted">{featuredProblem.demoFocus}</p>
            <Link className="inline-link" href={`/problems/${featuredProblem.id}`}>
              {featuredProblem.pattern} 데모 열기
            </Link>
          </div>
        </aside>
      </section>

      <section className="journey-card card">
        <div className="panel-header">
          <div>
            <div className="eyebrow">데모 여정</div>
            <h2>문제 풀이가 끝나는 순간부터 면접이 시작되도록 설계</h2>
          </div>
          <p className="journey-copy">
            홈에서 보여줘야 할 핵심은 기능 나열이 아니라, 코테에서 면접으로 자연스럽게 이어지는
            단일 사용자 여정입니다.
          </p>
        </div>
        <div className="journey-strip">
          {journeyStages.map((stage, index) => (
            <div key={stage} className="journey-stage">
              <span className="journey-index">0{index + 1}</span>
              <strong>{stage}</strong>
            </div>
          ))}
        </div>
      </section>

      <section id="demo-scenarios" className="catalog-header">
        <div>
          <div className="eyebrow">데모 시나리오</div>
          <h2>어떤 문제를 선택해도 면접 질문의 근거와 흐름이 보여야 합니다</h2>
        </div>
        <p className="muted catalog-copy">
          각 카드는 단순 문제 링크가 아니라, 어떤 종류의 면접 드라마를 시연하는지 설명하는 데모
          엔트리여야 합니다.
        </p>
      </section>

      <section className="grid">
        {problemCatalog.map((problem) => (
          <Link key={problem.id} className="card link-card" href={`/problems/${problem.id}`}>
            <div className="eyebrow">{problem.pattern}</div>
            <div className={`difficulty-pill ${problem.difficulty}`}>{problem.difficulty}</div>
            <h2>{problem.title}</h2>
            <p className="problem-pitch">{problem.elevatorPitch}</p>
            <p className="muted">{problem.demoFocus}</p>
            <div className="card-arrow">문제 풀이 → AST 분석 → Socratic interview</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
