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

const proofSteps = [
  {
    eyebrow: "Step 01",
    title: "문제를 고른 뒤 코드를 제출합니다.",
    detail: "같은 문제라도 AST 신호와 trap에 따라 질문 출발점이 달라집니다.",
  },
  {
    eyebrow: "Step 02",
    title: "질문은 통제 범위 안에서만 이어집니다.",
    detail: "주제 이탈 없이 복잡도, 불변식, 개선 방향을 차례로 확인합니다.",
  },
  {
    eyebrow: "Step 03",
    title: "세션이 끝나면 3축 피드백으로 정리됩니다.",
    detail: "정의, 해결, 설명 축에서 다음 연습 포인트까지 남깁니다.",
  },
] as const;

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

      <section className="service-home-hero">
        <article className="service-home-intro">
          <div className="eyebrow">대표 증명 시나리오</div>
          <h1 className="service-home-title">
            <span>코드 신호에 따라</span>
            <span>질문 흐름이</span>
            <span>달라집니다.</span>
          </h1>
          <p className="hero-copy">
            이 제품이 보여줘야 하는 것은 AI와 대화하는 장면 자체가 아닙니다. 코드에서
            잡힌 신호가 질문 흐름을 어떻게 통제하고, 마지막에 어떤 피드백으로 정리되는지를
            짧은 장면 안에서 설득력 있게 보여주는 것이 핵심입니다.
          </p>

          <div className="service-home-featured">
            <div className="service-featured-meta">
              <span className={`difficulty-pill ${featuredProblem.difficulty}`}>
                {DIFFICULTY_LABEL[featuredProblem.difficulty]}
              </span>
              <span className="pill">{featuredProblem.pattern}</span>
            </div>
            <h2>{featuredProblem.title}</h2>
            <p>{featuredProblem.elevatorPitch}</p>
          </div>

          <div className="service-home-actions">
            <Link className="primary hero-cta" href={`/problems/${featuredProblem.id}`}>
              대표 분기 시연 시작
            </Link>
            <Link className="secondary-button" href="#practice-problems">
              추가 시연 문제 보기
            </Link>
          </div>

          <div className="service-proof-strip" aria-label="핵심 증거">
            {homeMetrics.map((metric) => (
              <div key={metric.label} className="service-proof-item">
                <span className="eyebrow">{metric.label}</span>
                <strong>{metric.value}</strong>
                <span>{metric.note}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className="service-demo-rail">
          <div className="service-demo-card">
            <div className="eyebrow">질문 통제 구조</div>
            <h2>왜 주제 이탈 없이 질문이 이어지는가</h2>
            <p className="muted">
              질문은 문제별 근거 범위를 벗어나지 않습니다. 따라서 모든 질문은 코드 신호와
              문제 기준으로 다시 추적할 수 있습니다.
            </p>
            <div className="service-feature-tags">
              {controlHighlights.map((item) => (
                <span key={item} className="pill">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="service-demo-list">
            {(featuredProblem.comparisonPreview ?? []).map((preview) => (
              <div key={preview.label} className="service-demo-step">
                <span className="eyebrow">{preview.label}</span>
                <strong>{preview.expectedFlow}</strong>
                <p>{preview.purpose}</p>
                <small>{preview.signal}</small>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="service-proof-band">
        <article className="card service-proof-card">
          <div className="eyebrow">기관 운영 비교</div>
          <h2>강사 1인 30명 = 15시간 vs API $3</h2>
          <p className="muted">
            사업성 수치는 보조 증거로만 배치합니다. 먼저 데모 흐름을 이해한 뒤, 같은 세션을
            훨씬 낮은 운영 비용으로 반복할 수 있다는 점을 뒷받침합니다.
          </p>

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

        <article className="card service-proof-card">
          <div className="eyebrow">대표 시연에서 바로 보이는 것</div>
          <h2>첫 화면에서 이해해야 하는 메시지</h2>
          <div className="service-proof-list">
            {proofSteps.map((step) => (
              <div key={step.title} className="service-proof-step">
                <span className="eyebrow">{step.eyebrow}</span>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            ))}
          </div>
        </article>
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
