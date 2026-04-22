import Link from "next/link";

import { problemCatalog } from "@/lib/problem-catalog";

const DIFFICULTY_LABEL = {
  easy: "기초",
  medium: "표준",
  hard: "심화",
} as const;

const homeMetrics = [
  {
    label: "세션 비용",
    value: "≤ $0.10",
    note: "30명 cohort 모의면접을 $3 선에서 운영",
  },
  {
    label: "강사 시간 절감",
    value: "15h → 0h",
    note: "강사 1인 30명 기준 15시간 기술면접을 자동화",
  },
  {
    label: "질문 통제",
    value: "이탈 ≤ 5%",
    note: "Fact/Trap/Forbidden 범위 안에서만 질문 생성",
  },
] as const;

const operatingCostBars = [
  { label: "강사 직접 운영 (30명)", unit: "15h", percent: 100 },
  { label: "본 시스템 (30세션)", unit: "$3", percent: 3 },
] as const;

const controlHighlights = ["Fact", "Trap", "Follow-up Goal", "Forbidden Boundary"] as const;

export default function HomePage() {
  const featuredProblem = problemCatalog.find((problem) => problem.flagship) ?? problemCatalog[0];

  return (
    <main className="container service-home">
      <section className="service-topbar">
        <div className="service-brand">
          <div className="eyebrow">Socratic Deep-Dive</div>
          <strong>통제형 기술면접 평가 시스템</strong>
        </div>
        <Link className="secondary-button" href={`/problems/${featuredProblem.id}`}>
          대표 시연 열기
        </Link>
      </section>

      <section className="service-home-grid">
        <article className="card service-hero-card">
          <div className="service-hero-head">
            <div className="service-hero-copy">
              <div className="eyebrow">대표 증명 시나리오</div>
              <h1>{featuredProblem.title}</h1>
              <p className="hero-copy">
                같은 문제에 세 가지 코드를 넣어 질문과 피드백이 어떻게 달라지는지
                증명합니다. 핵심은 AI와 대화하는 장면이 아니라, 코드 신호에 따라 질문
                흐름이 통제되고 그 근거를 역추적할 수 있다는 점입니다.
              </p>
            </div>

            <div className="service-hero-badges">
              <span className={`difficulty-pill ${featuredProblem.difficulty}`}>
                {DIFFICULTY_LABEL[featuredProblem.difficulty]}
              </span>
              <span className="pill">{featuredProblem.pattern}</span>
            </div>
          </div>

          <div className="service-home-actions">
            <Link className="primary hero-cta" href={`/problems/${featuredProblem.id}`}>
              대표 분기 시연 시작
            </Link>
            <Link className="secondary-button" href="#practice-problems">
              추가 시연 문제 보기
            </Link>
          </div>

          <div className="service-metric-row">
            {homeMetrics.map((metric) => (
              <div key={metric.label} className="service-metric-card">
                <span className="eyebrow">{metric.label}</span>
                <strong>{metric.value}</strong>
                <span>{metric.note}</span>
              </div>
            ))}
          </div>
        </article>

        <div className="service-side-column">
          <article className="card service-summary-card">
            <div className="service-summary-header">
              <div className="eyebrow">기관 운영 비교</div>
              <h2>강사 1인 30명 = 15시간 vs API $3</h2>
              <p className="muted">
                부트캠프 한 기수(30명) 모의 기술면접을 강사가 직접 운영하면 약 15시간이
                필요합니다. 본 시스템은 동일 규모를 세션당 $0.10의 API 비용으로 처리해
                운영 비용을 97% 이상 절감합니다.
              </p>
            </div>

            <ul className="service-score-list">
              {operatingCostBars.map((bar) => (
                <li key={bar.label}>
                  <span>{bar.label}</span>
                  <div className="service-score-bar" aria-hidden="true">
                    <span style={{ width: `${bar.percent}%` }} />
                  </div>
                  <strong>{bar.unit}</strong>
                </li>
              ))}
            </ul>
          </article>

          <article className="card service-quick-card">
            <div className="eyebrow">질문 통제 구조</div>
            <h2>왜 주제 이탈 없이 질문이 이어지는가</h2>
            <div className="service-feature-tags">
              {controlHighlights.map((item) => (
                <span key={item} className="pill">
                  {item}
                </span>
              ))}
            </div>
            <div className="service-signal-strip">
              {(featuredProblem.comparisonPreview ?? []).map((preview) => (
                <div key={preview.label} className="service-signal-card">
                  <span className="eyebrow">{preview.label}</span>
                  <strong>{preview.expectedFlow}</strong>
                  <small>{preview.signal}</small>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section id="practice-problems" className="service-problem-shelf">
        <div className="service-section-header">
          <div>
            <div className="eyebrow">추가 검증 시나리오</div>
            <h2>같은 구조로 재현 가능한 추가 시연 문제</h2>
          </div>
          <span className="status-chip active">{problemCatalog.length}개 문제 시연 준비됨</span>
        </div>

        <div className="service-problem-grid">
          {problemCatalog.map((problem) => (
            <Link
              key={problem.id}
              className={`card service-problem-card ${problem.flagship ? "featured" : ""}`}
              href={`/problems/${problem.id}`}
            >
              <div className="service-problem-meta">
                <span className="eyebrow">{problem.pattern}</span>
                <span className={`difficulty-pill ${problem.difficulty}`}>
                  {DIFFICULTY_LABEL[problem.difficulty]}
                </span>
              </div>

              <div className="service-problem-copy">
                <h3>{problem.title}</h3>
                <p className="problem-pitch">{problem.elevatorPitch}</p>
              </div>

              <div className="service-problem-footer">
                <span className="pill">시연 열기</span>
                {problem.flagship ? <span className="status-chip active">추천</span> : null}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
