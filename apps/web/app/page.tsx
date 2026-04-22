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
    note: "30명 기준 모의면접을 약 $3로 반복 운영",
  },
  {
    label: "강사 시간 절감",
    value: "15h → 0h",
    note: "강사 1명이 맡던 초반 질의응답을 자동 진행",
  },
  {
    label: "질문 통제",
    value: "이탈 ≤ 5%",
    note: "문제 범위를 벗어나지 않도록 질문 유지",
  },
] as const;

const operatingCostBars = [
  { label: "강사 직접 운영 (30명)", unit: "15h", percent: 100 },
  { label: "본 시스템 (30세션)", unit: "$3", percent: 3 },
] as const;

const controlHighlights = ["문제 기준", "코드 신호", "질문 방향", "제한 범위"] as const;

const proofSteps = [
  {
    eyebrow: "Step 01",
    title: "문제를 고른 뒤 코드를 제출합니다.",
    detail: "같은 문제라도 제출한 코드에 따라 첫 질문이 달라집니다.",
  },
  {
    eyebrow: "Step 02",
    title: "질문은 통제 범위 안에서만 이어집니다.",
    detail: "복잡도, 판단 근거, 개선 방향을 순서대로 확인합니다.",
  },
  {
    eyebrow: "Step 03",
    title: "세션이 끝나면 3축 피드백으로 정리됩니다.",
    detail: "세 축 점수와 다음 연습 포인트를 한 번에 정리합니다.",
  },
] as const;

export default function HomePage() {
  const featuredProblem = problemCatalog.find((problem) => problem.flagship) ?? problemCatalog[0];

  return (
    <main className="mx-auto w-full max-w-[1200px] px-6 pb-32 pt-24 text-text-primary flex flex-col gap-24">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center max-w-3xl mx-auto gap-8">
        <div className="flex flex-col items-center gap-4">
          <span className="text-brand-indigo text-[13px] font-[510] uppercase tracking-[0.18em]">
            대표 시연
          </span>
          <h1 className="text-[72px] leading-tight font-[510] tracking-[-1.584px] text-text-primary text-balance">
            <span className="block">코드 신호에 따라</span>
            <span className="block text-text-secondary">질문 흐름이 달라집니다.</span>
          </h1>
          <p className="text-[18px] leading-[1.6] text-text-secondary tracking-[-0.165px] max-w-2xl text-balance mt-4">
            보여줘야 하는 것은 대화 장면이 아니라, 제출한 코드에 따라 질문이 어떻게 달라지고
            마지막에 어떤 피드백이 남는지입니다.
          </p>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <Link className="btn-ghost text-[15px] px-8 py-3 bg-white/[0.03] hover:bg-white/[0.08]" href="#practice-problems">
            문제 둘러보기 ↓
          </Link>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

      {/* Featured Problem Panel */}
      <section className="linear-card-highlight p-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/10 to-transparent pointer-events-none" />
        <div className="bg-panel-dark/80 backdrop-blur-sm rounded-[calc(var(--radius-card)-4px)] p-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left: Intro */}
            <div className="flex flex-col justify-between gap-10 bg-transparent">
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

              <div className="grid grid-cols-3 gap-4 border-t border-border-subtle pt-8 mt-auto relative z-10">
                {homeMetrics.map((metric) => (
                  <div key={metric.label} className="flex flex-col justify-between gap-3 bg-black/40 border border-white/[0.05] rounded-xl p-5 shadow-inner">
                    <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-[510]">{metric.label}</span>
                    <div className="flex flex-col gap-1">
                      <strong className="text-[22px] font-[590] text-text-primary tracking-[-0.24px]">{metric.value}</strong>
                      <span className="text-[12px] text-text-quaternary leading-[1.4] line-clamp-2">{metric.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Demo Rail */}
            <div className="flex flex-col relative rounded-panel p-[1px] bg-gradient-to-b from-brand-indigo/40 via-border-standard to-border-standard shadow-[0_0_30px_-5px_rgba(94,106,210,0.3)]">
              <div className="flex flex-col h-full bg-[#0a0b0d] rounded-[calc(var(--radius-panel)-1px)] p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[120px] bg-gradient-to-b from-brand-indigo/10 to-transparent pointer-events-none" />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex items-center justify-center w-2.5 h-2.5">
                        <div className="absolute w-full h-full bg-status-emerald rounded-full animate-ping opacity-75"></div>
                        <div className="relative w-1.5 h-1.5 bg-status-emerald rounded-full"></div>
                      </div>
                      <span className="text-[12px] text-text-primary uppercase tracking-[0.1em] font-[590]">대표 시연 흐름</span>
                    </div>
                    <h3 className="text-[20px] font-[590] tracking-[-0.24px] text-white">질문이 달라지는 기준</h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8 relative z-10">
                  {controlHighlights.map((item) => (
                    <span key={item} className="pill bg-brand-indigo/10 border-brand-indigo/30 text-brand-indigo text-[11px] font-[590] shadow-[0_0_10px_rgba(94,106,210,0.15)]">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-0 relative z-10 flex-1">
                  {(featuredProblem.comparisonPreview ?? []).map((preview, idx, arr) => (
                    <div key={preview.label} className="flex gap-4 relative">
                      <div className="flex flex-col items-center mt-2">
                        <div className="w-2.5 h-2.5 rounded-full border-[2px] border-marketing-black bg-brand-indigo ring-1 ring-brand-indigo/50 shadow-[0_0_8px_rgba(94,106,210,0.6)] relative z-10"></div>
                        {idx !== arr.length - 1 && (
                          <div className="w-[1.5px] h-full bg-gradient-to-b from-brand-indigo/50 to-border-subtle my-1"></div>
                        )}
                      </div>
                      <div className={`flex flex-col gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex-1 ${idx !== arr.length - 1 ? 'mb-6' : ''} shadow-sm backdrop-blur-sm`}>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-indigo text-[11px] font-[590] uppercase tracking-[0.05em] px-2 py-0.5 bg-brand-indigo/10 rounded-micro">{preview.label}</span>
                        </div>
                        <strong className="text-[15px] font-[510] text-text-primary leading-tight">{preview.expectedFlow}</strong>
                        <p className="text-[14px] text-text-secondary leading-snug">{preview.purpose}</p>
                        <div className="mt-2 bg-[#050505] rounded-md border border-white/[0.05] p-3 font-mono">
                          <div className="text-[10px] text-text-tertiary mb-1 flex items-center gap-2">
                            <span className="text-accent-violet">❯</span> 포착된 신호
                          </div>
                          <code className="text-[12px] text-[#a5b4fc] block">
                            {preview.signal}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-border-subtle relative z-10">
                  <Link 
                    href={`/problems/${featuredProblem.id}`}
                    className="w-full btn-primary bg-brand-indigo text-white hover:bg-accent-hover font-[590] py-3 text-[15px] shadow-[0_0_24px_rgba(94,106,210,0.4)] hover:shadow-[0_0_32px_rgba(94,106,210,0.6)] transition-all duration-300"
                  >
                    대표 문제 시작하기 →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

      {/* Proof Steps */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="linear-card p-8 flex flex-col gap-8 shadow-sm hover:bg-white/[0.05] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="flex flex-col gap-3 relative z-10">
            <span className="text-[12px] text-brand-indigo font-[510] tracking-[0.1em] uppercase">이 화면에서 확인할 것</span>
            <h2 className="text-[24px] font-[400] tracking-[-0.288px] text-text-primary">첫 화면에서 바로 읽히는 흐름</h2>
          </div>
          <div className="flex flex-col gap-4">
            {proofSteps.map((step, idx) => (
              <div key={step.title} className="flex gap-4 relative">
                <div className="flex flex-col items-center mt-3">
                  <div className="w-2.5 h-2.5 rounded-full border border-brand-indigo bg-brand-indigo/20 shadow-[0_0_8px_rgba(94,106,210,0.4)]"></div>
                  {idx !== proofSteps.length - 1 && (
                    <div className="w-[1px] h-full bg-gradient-to-b from-brand-indigo/40 to-transparent mt-2"></div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 bg-white/[0.02] border border-white/[0.04] rounded-lg p-5 flex-1 hover:bg-white/[0.04] transition-colors">
                  <span className="text-[12px] text-text-tertiary font-[510] tracking-wide">{step.eyebrow}</span>
                  <strong className="text-[16px] font-[510] text-text-primary">{step.title}</strong>
                  <p className="text-[15px] text-text-secondary leading-[1.6] mt-1">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="linear-card p-8 flex flex-col gap-8 shadow-sm hover:bg-white/[0.05] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="flex flex-col gap-3 relative z-10">
            <span className="text-[12px] text-accent-violet font-[510] tracking-[0.1em] uppercase">운영 기준</span>
            <h2 className="text-[24px] font-[400] tracking-[-0.288px] text-text-primary">같은 흐름을 더 적은 운영 부담으로 반복합니다</h2>
            <p className="text-[15px] text-text-secondary leading-[1.6]">
              핵심 흐름을 보여준 뒤에는, 같은 세션을 더 적은 비용과 시간으로 운영할 수 있다는 점도
              함께 확인합니다.
            </p>
          </div>

          <ul className="flex flex-col gap-4 mt-4 relative z-10">
            {operatingCostBars.map((bar) => (
              <li key={bar.label} className="flex flex-col gap-3 bg-black/20 border border-white/[0.05] rounded-lg p-5">
                <div className="flex justify-between items-end">
                  <span className="text-[14px] font-[510] text-text-primary">{bar.label}</span>
                  <strong className="text-[16px] font-mono text-accent-violet">{bar.unit}</strong>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden" aria-hidden="true">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-indigo to-accent-violet transition-all duration-1000 ease-out rounded-full opacity-80" 
                    style={{ width: `${bar.percent}%` }} 
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

      {/* Practice Problems */}
      <section id="practice-problems" className="flex flex-col gap-8 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-subtle pb-6">
          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-text-tertiary font-[510] tracking-[0.1em] uppercase">다른 연습 문제</span>
            <h2 className="text-[32px] font-[400] tracking-[-0.704px] text-text-primary">같은 흐름으로 확인할 추가 문제</h2>
          </div>
          <div className="pill bg-white/[0.02] border-border-subtle flex items-center gap-2 py-1.5 px-3">
            <div className="w-1.5 h-1.5 rounded-full bg-status-emerald animate-pulse"></div>
            <span className="text-text-secondary font-[400] text-[13px]">{problemCatalog.length}개 문제 수록</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {problemCatalog.map((problem) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.id}`}
              className={`${problem.flagship ? "linear-card-highlight" : "linear-card"} p-6 flex flex-col gap-4 group relative overflow-hidden`}
            >
              <div className="flex items-center justify-between relative z-10 pb-4 border-b border-white/[0.05]">
                <span className="text-[11px] font-mono text-text-tertiary uppercase tracking-wider">{problem.pattern}</span>
                <span className={`pill text-[10px] ${problem.difficulty === 'easy' ? 'text-status-emerald border-status-emerald/30 bg-status-emerald/10' : problem.difficulty === 'hard' ? 'text-security-lavender border-security-lavender/30 bg-security-lavender/10' : 'bg-white/5 border-white/10'}`}>
                  {DIFFICULTY_LABEL[problem.difficulty]}
                </span>
              </div>
              <div className="flex flex-col gap-2 mt-2 relative z-10 flex-1">
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
