import Link from "next/link";

import { problemCatalog } from "@/lib/problem-catalog";

const DIFFICULTY_LABEL = {
  easy: "기초",
  medium: "표준",
  hard: "심화",
} as const;

const homeMetrics = [
  {
    label: "예상 소요",
    value: "12분",
    note: "코드 제출부터 피드백까지 한 번에 진행",
  },
  {
    label: "질문 방식",
    value: "꼬리 질문 4턴",
    note: "설명 빈틈이 보이면 바로 후속 질문으로 이어짐",
  },
  {
    label: "결과물",
    value: "3축 피드백",
    note: "논리 구조, 기술 정확도, 설명 명료도 요약 제공",
  },
] as const;

const recentFeedbackAxes = [
  { label: "논리 구조", score: 7.8 },
  { label: "기술 정확도", score: 7.2 },
  { label: "설명 명료도", score: 6.9 },
] as const;

const practiceHighlights = ["코드 제출", "꼬리 질문", "3축 피드백"] as const;

export default function HomePage() {
  const featuredProblem = problemCatalog.find((problem) => problem.flagship) ?? problemCatalog[0];

  return (
    <main className="container service-home">
      <section className="service-topbar">
        <div className="service-brand">
          <div className="eyebrow">Socratic Deep-Dive</div>
          <strong>AI Champion Interview Prep</strong>
        </div>
        <Link className="secondary-button" href={`/problems/${featuredProblem.id}`}>
          추천 문제 열기
        </Link>
      </section>

      <section className="service-home-grid">
        <article className="card service-hero-card">
          <div className="service-hero-head">
            <div className="service-hero-copy">
              <div className="eyebrow">오늘의 추천 인터뷰</div>
              <h1>{featuredProblem.title}</h1>
              <p className="hero-copy">
                문제를 푼 뒤 설명 면접까지 바로 이어서 연습합니다. 답을 맞히는 것보다
                왜 그렇게 풀었는지 끝까지 설명하는 장면에 집중합니다.
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
              바로 시작
            </Link>
            <Link className="secondary-button" href="#practice-problems">
              다른 문제 보기
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
              <div className="eyebrow">최근 피드백 요약</div>
              <h2>설명 명료도를 먼저 끌어올릴 차례입니다</h2>
              <p className="muted">
                최근 대표 문제 기준으로는 풀이 전환 근거를 더 짧고 선명하게 말하는 연습이 다음
                액션으로 추천됩니다.
              </p>
            </div>

            <ul className="service-score-list">
              {recentFeedbackAxes.map((axis) => (
                <li key={axis.label}>
                  <span>{axis.label}</span>
                  <div className="service-score-bar" aria-hidden="true">
                    <span style={{ width: `${axis.score * 10}%` }} />
                  </div>
                  <strong>{axis.score}</strong>
                </li>
              ))}
            </ul>
          </article>

          <article className="card service-quick-card">
            <div className="eyebrow">오늘의 연습 흐름</div>
            <h2>{featuredProblem.demoFocus}</h2>
            <div className="service-feature-tags">
              {practiceHighlights.map((item) => (
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
            <div className="eyebrow">지금 연습할 문제</div>
            <h2>설명 면접을 바로 시작할 문제를 고르세요</h2>
          </div>
          <span className="status-chip active">{problemCatalog.length}개 문제 준비됨</span>
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
                <span className="pill">이 문제 시작</span>
                {problem.flagship ? <span className="status-chip active">추천</span> : null}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
