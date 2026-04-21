import Link from "next/link";

import { problemCatalog } from "@/lib/problem-catalog";

const proofTracks = [
  {
    title: "질문 통제",
    description:
      "문제별 기준 정보 안에서만 질문을 이어가며, 왜 이 질문이 나왔는지와 무엇을 묻지 않는지를 함께 보여줍니다.",
  },
  {
    title: "분기 검증",
    description:
      "좋은 풀이, 느린 풀이, 오류 코드가 서로 다른 질문 흐름으로 갈라지는 장면을 한 문제 안에서 비교합니다.",
  },
  {
    title: "리포트 완주성",
    description:
      "3축 피드백은 대화 로그와 코드 신호를 함께 근거로 남겨, 외부 모델 상태와 관계없이 끝까지 이어집니다.",
  },
  {
    title: "기관 활용성",
    description:
      "개인 피드백으로 끝나지 않고, 약점 유형과 분기 이력을 반복 훈련 데이터로 회수하는 구조를 설명합니다.",
  },
];

const journeyStages = [
  "문제 선택",
  "코드 변형 비교",
  "근거 기반 분기",
  "후속 질문 4턴",
  "3축 피드백",
];

const DIFFICULTY_LABEL = {
  easy: "기초",
  medium: "표준",
  hard: "심화",
} as const;

export default function HomePage() {
  const featuredProblem = problemCatalog.find((problem) => problem.flagship) ?? problemCatalog[0];
  const supportingProblems = problemCatalog.filter((problem) => problem.id !== featuredProblem.id);

  return (
    <main className="container">
      <section className="hero hero-shell flagship-shell">
        <div className="hero-panel">
          <div className="eyebrow">AI Champion 시연</div>
          <h1>같은 문제라도 코드가 다르면 질문이 달라집니다</h1>
          <p className="hero-copy">
            Socratic Deep-Dive는 제출 코드와 문제 기준 정보를 함께 읽어, 코딩 테스트 직후의
            설명 역량을 점검하는 통제형 기술면접 데모입니다. 질문 근거, 분기 기준, 피드백 구조를
            한 흐름 안에서 보여주도록 구성했습니다.
          </p>
          <div className="hero-cta-row">
            <Link className="primary hero-cta" href={`/problems/${featuredProblem.id}`}>
              대표 데모 보기
            </Link>
            <a className="secondary-button" href="#proof-tracks">
              구조 먼저 보기
            </a>
          </div>
          <div className="hero-actions">
            <span className="hero-badge">질문 근거 노출</span>
            <span className="hero-badge">코드 기반 분기</span>
            <span className="hero-badge">리포트까지 완주</span>
          </div>
        </div>

        <aside className="hero-aside card">
          <div className="eyebrow">대표 시연 문제</div>
          <h2>{featuredProblem.title}</h2>
          <p className="muted">{featuredProblem.elevatorPitch}</p>
          <div className="featured-demo featured-demo-stack">
            <div className="eyebrow">이 문제로 보는 핵심</div>
            <strong>{featuredProblem.demoFocus}</strong>
            <ul className="signal-list compact-list">
              {featuredProblem.comparisonPreview?.map((preview) => (
                <li key={preview.label}>
                  {preview.label}: {preview.expectedFlow}
                </li>
              ))}
            </ul>
          </div>
          <Link className="inline-link" href={`/problems/${featuredProblem.id}`}>
            {featuredProblem.pattern} 데모 열기
          </Link>
        </aside>
      </section>

      <section id="proof-tracks" className="journey-card card">
        <div className="panel-header">
          <div>
            <div className="eyebrow">증명 항목</div>
            <h2>심사위원이 화면만 보고도 이해해야 할 네 가지 포인트</h2>
          </div>
          <p className="journey-copy">
            기능 수보다 중요한 것은 이 데모가 무엇을 검증하려는지 한 번에 읽히는 구조입니다.
          </p>
        </div>
        <div className="proof-track-grid">
          {proofTracks.map((track) => (
            <article key={track.title} className="proof-card proof-track-card">
              <div className="eyebrow">핵심 포인트</div>
              <h2>{track.title}</h2>
              <p className="muted">{track.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="journey-card card">
        <div className="panel-header">
          <div>
            <div className="eyebrow">대표 데모 여정</div>
            <h2>한 문제 안에서 질문 통제와 분기 기준을 함께 보여주는 흐름</h2>
          </div>
          <p className="journey-copy">
            대표 문제는 단순한 진입점이 아니라, 같은 문제에 다른 코드를 넣었을 때 질문 방향이
            어떻게 달라지는지 설명하는 비교 시연 화면입니다.
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

      <section className="comparison-section">
        <div className="catalog-header">
          <div>
            <div className="eyebrow">동일 문제 비교</div>
            <h2>대표 시연에서 바로 비교할 세 가지 코드 상태</h2>
          </div>
          <p className="muted catalog-copy">
            왜 같은 문제라도 다른 질문이 나오는지 설명하는 핵심 비교 프리뷰입니다.
          </p>
        </div>
        <div className="comparison-grid">
          {featuredProblem.comparisonPreview?.map((preview) => (
            <article key={preview.label} className="card comparison-card">
              <div className="eyebrow">{preview.label}</div>
              <h2>{preview.expectedFlow}</h2>
              <p>{preview.purpose}</p>
              <span className="comparison-signal">{preview.signal}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="catalog-header">
        <div>
          <div className="eyebrow">보조 시나리오</div>
          <h2>다른 문제 유형도 같은 구조로 확장될 수 있어야 합니다</h2>
        </div>
        <p className="muted catalog-copy">
          대표 데모는 하나로 집중하되, 나머지 문제들은 패턴 확장성과 질문 구조의 일관성을 보여주는
          보조 근거로 둡니다.
        </p>
      </section>

      <section className="grid">
        {supportingProblems.map((problem) => (
          <Link key={problem.id} className="card link-card" href={`/problems/${problem.id}`}>
            <div className="eyebrow">{problem.pattern}</div>
            <div className={`difficulty-pill ${problem.difficulty}`}>
              {DIFFICULTY_LABEL[problem.difficulty]}
            </div>
            <h2>{problem.title}</h2>
            <p className="problem-pitch">{problem.elevatorPitch}</p>
            <p className="muted">{problem.demoFocus}</p>
            <div className="card-arrow">시나리오 열기</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
