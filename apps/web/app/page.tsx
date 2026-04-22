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
    <main className="mx-auto w-full max-w-[1200px] px-6 pb-32 pt-24 text-text-primary flex flex-col gap-32">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center max-w-3xl mx-auto gap-8">
        <div className="flex flex-col items-center gap-4">
          <span className="text-brand-indigo text-[13px] font-[510] uppercase tracking-[0.18em]">
            대표 증명 시나리오
          </span>
          <h1 className="text-[72px] leading-tight font-[510] tracking-[-1.584px] text-text-primary text-balance">
            <span className="block">코드 신호에 따라</span>
            <span className="block text-text-secondary">질문 흐름이 달라집니다.</span>
          </h1>
          <p className="text-[18px] leading-[1.6] text-text-secondary tracking-[-0.165px] max-w-2xl text-balance mt-4">
            이 제품이 보여줘야 하는 것은 AI와 대화하는 장면 자체가 아닙니다. 코드에서 잡힌 신호가 
            질문 흐름을 어떻게 통제하고, 마지막에 어떤 피드백으로 정리되는지를 보여주는 것이 핵심입니다.
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <Link className="btn-primary text-[15px]" href={`/problems/${featuredProblem.id}`}>
            대표 분기 시연 시작
          </Link>
          <Link className="btn-ghost text-[15px]" href="#practice-problems">
            추가 시연 문제 보기
          </Link>
        </div>
      </section>

      {/* Featured Problem Panel */}
      <section className="linear-card p-1">
        <div className="bg-panel-dark/50 rounded-[calc(var(--radius-card)-4px)] p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left: Intro */}
            <div className="flex flex-col justify-between gap-10">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <span className={`pill ${featuredProblem.difficulty === 'easy' ? 'text-status-emerald border-status-emerald/30' : featuredProblem.difficulty === 'hard' ? 'text-security-lavender border-security-lavender/30' : ''}`}>
                    {DIFFICULTY_LABEL[featuredProblem.difficulty]}
                  </span>
                  <span className="badge-subtle bg-white/[0.02] border-white/[0.05] text-text-secondary">{featuredProblem.pattern}</span>
                </div>
                <div className="flex flex-col gap-3">
                  <h2 className="text-[32px] font-[400] leading-[1.13] tracking-[-0.704px] text-text-primary">
                    {featuredProblem.title}
                  </h2>
                  <p className="text-[16px] leading-[1.5] text-text-secondary">
                    {featuredProblem.elevatorPitch}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 border-t border-border-subtle pt-8 mt-auto">
                {homeMetrics.map((metric) => (
                  <div key={metric.label} className="flex flex-col gap-1">
                    <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-[510]">{metric.label}</span>
                    <strong className="text-[20px] font-[590] text-text-primary tracking-[-0.24px]">{metric.value}</strong>
                    <span className="text-[13px] text-text-quaternary mt-1 leading-[1.4]">{metric.note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Demo Rail */}
            <div className="flex flex-col gap-6 bg-[#131415] border border-border-subtle rounded-panel p-8 shadow-inset">
              <div className="flex flex-col gap-2 mb-2">
                <span className="text-[12px] text-text-tertiary uppercase tracking-[0.1em] font-[510]">질문 통제 구조</span>
                <h3 className="text-[20px] font-[590] tracking-[-0.24px]">왜 주제 이탈 없이 이어지는가</h3>
                <p className="text-[14px] text-text-secondary mt-1">질문은 문제별 근거 범위를 벗어나지 않습니다. 모든 질문은 코드 신호와 문제 기준으로 다시 추적할 수 있습니다.</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {controlHighlights.map((item) => (
                  <span key={item} className="pill bg-white/[0.02] border-border-subtle">
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-5 border-t border-border-subtle pt-6">
                {(featuredProblem.comparisonPreview ?? []).map((preview) => (
                  <div key={preview.label} className="flex flex-col gap-1">
                    <span className="text-accent-violet text-[12px] font-[510] uppercase tracking-[0.05em]">{preview.label}</span>
                    <strong className="text-[15px] font-[510] text-text-primary">{preview.expectedFlow}</strong>
                    <p className="text-[14px] text-text-secondary">{preview.purpose}</p>
                    <div className="mt-2">
                      <code className="text-[12px] text-text-tertiary font-mono px-2 py-1 bg-white/[0.03] border border-border-subtle rounded-micro">
                        {preview.signal}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Proof Steps */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="linear-card p-8 flex flex-col gap-8 shadow-subtle hover:bg-white/2">
          <div className="flex flex-col gap-3">
            <span className="text-[12px] text-text-tertiary font-[510] tracking-[0.1em] uppercase">대표 시연에서 바로 보이는 것</span>
            <h2 className="text-[24px] font-[400] tracking-[-0.288px] text-text-primary">첫 화면에서 이해해야 하는 메시지</h2>
          </div>
          <div className="flex flex-col gap-8">
            {proofSteps.map((step) => (
              <div key={step.title} className="flex gap-5 relative">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2 h-2 rounded-full border border-border-secondary bg-white/[0.02]"></div>
                  <div className="w-[1px] h-full bg-border-subtle mt-2"></div>
                </div>
                <div className="flex flex-col gap-1 pb-6">
                  <span className="text-[12px] text-text-tertiary font-[510]">{step.eyebrow}</span>
                  <strong className="text-[16px] font-[510] text-text-primary">{step.title}</strong>
                  <p className="text-[15px] text-text-secondary leading-[1.6] mt-1">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="linear-card p-8 flex flex-col gap-8 shadow-subtle hover:bg-white/2">
          <div className="flex flex-col gap-3">
            <span className="text-[12px] text-text-tertiary font-[510] tracking-[0.1em] uppercase">기관 운영 비교</span>
            <h2 className="text-[24px] font-[400] tracking-[-0.288px] text-text-primary">강사 1인 30명 = 15시간 vs API $3</h2>
            <p className="text-[15px] text-text-secondary leading-[1.6]">
              사업성 수치는 보조 증거로만 배치합니다. 먼저 데모 흐름을 이해한 뒤, 같은 세션을
              훨씬 낮은 운영 비용으로 반복할 수 있다는 점을 뒷받침합니다.
            </p>
          </div>

          <ul className="flex flex-col gap-6 mt-4">
            {operatingCostBars.map((bar) => (
              <li key={bar.label} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-[14px] font-[510] text-text-primary">{bar.label}</span>
                  <strong className="text-[14px] font-mono text-text-secondary">{bar.unit}</strong>
                </div>
                <div className="h-1.5 bg-white/[0.03] border border-border-subtle rounded-full overflow-hidden" aria-hidden="true">
                  <div 
                    className="h-full bg-text-secondary transition-all duration-1000 ease-out rounded-full opacity-60" 
                    style={{ width: `${bar.percent}%` }} 
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {/* Practice Problems */}
      <section id="practice-problems" className="flex flex-col gap-8 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-subtle pb-6">
          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-text-tertiary font-[510] tracking-[0.1em] uppercase">추가 검증 시나리오</span>
            <h2 className="text-[32px] font-[400] tracking-[-0.704px] text-text-primary">같은 구조로 재현 가능한 추가 시연 문제</h2>
          </div>
          <div className="pill bg-white/[0.02] border-border-subtle flex items-center gap-2 py-1.5 px-3">
            <div className="w-1.5 h-1.5 rounded-full bg-status-emerald animate-pulse"></div>
            <span className="text-text-secondary font-[400] text-[13px]">{problemCatalog.length}개 문제 준비됨</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problemCatalog.map((problem) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.id}`}
              className={`linear-card p-6 flex flex-col gap-4 group ${problem.flagship ? "ring-1 ring-border-standard bg-white/[0.03]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider">{problem.pattern}</span>
                <span className={`pill text-[10px] ${problem.difficulty === 'easy' ? 'text-status-emerald border-status-emerald/30 bg-status-emerald/10' : problem.difficulty === 'hard' ? 'text-security-lavender border-security-lavender/30 bg-security-lavender/10' : 'bg-white/5 border-white/10'}`}>
                  {DIFFICULTY_LABEL[problem.difficulty]}
                </span>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <h3 className="text-[18px] font-[510] tracking-tight group-hover:text-white transition-colors">{problem.title}</h3>
                <p className="text-[14px] text-text-secondary line-clamp-2 leading-[1.5] mt-1">{problem.elevatorPitch}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
