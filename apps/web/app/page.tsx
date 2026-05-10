import Link from "next/link";
import { problemCatalog } from "@/lib/problem-catalog";

const DIFFICULTY_LABEL = {
  easy: "기초",
  medium: "표준",
  hard: "심화",
} as const;

const buyerPains = [
  "합격 코드는 있어도 풀이 근거를 말하지 못합니다.",
  "강사는 제출 코드마다 꼬리 질문을 새로 만들기 어렵습니다.",
  "운영자는 약한 축을 세션 뒤에야 확인합니다.",
] as const;

const operatingLoop = [
  {
    eyebrow: "01",
    title: "대표 문제로 훈련을 시작",
    detail: "학습자는 실제 면접처럼 코드를 제출합니다.",
  },
  {
    eyebrow: "02",
    title: "제출 코드에서 신호를 포착",
    detail: "코드 신호가 질문 흐름을 정합니다.",
  },
  {
    eyebrow: "03",
    title: "코드 기반 꼬리 질문 진행",
    detail: "복잡도, 불변식, 판단 근거를 말하게 합니다.",
  },
  {
    eyebrow: "04",
    title: "강사가 바로 코칭할 리포트 정리",
    detail: "3축 피드백과 다음 코칭 메모를 남깁니다.",
  },
] as const;

const buyerTakeaways = [
  { label: "대표 세션", value: "코드 제출이 질문 흐름을 정합니다." },
  { label: "3축 피드백", value: "정의·해결·설명 중 약한 축이 보입니다." },
  { label: "강사 메모", value: "다음 코칭 질문과 연습 포인트가 남습니다." },
] as const;

export default function HomePage() {
  const featuredProblem = problemCatalog.find((problem) => problem.flagship) ?? problemCatalog[0];

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-6 pb-32 pt-16 text-text-primary">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end">
        <div className="flex flex-col gap-6">
          <span className="text-brand-indigo text-[13px] font-[510] uppercase tracking-[0.18em]">
            부트캠프·교육기관용 면접 훈련 시스템
          </span>
          <div className="flex flex-col gap-4">
            <h1 className="max-w-3xl text-[64px] font-[510] leading-[1] tracking-[-1.408px] text-text-primary">
              강사의 반복 질문을
              <span className="block text-text-secondary">학습자별 훈련 세션으로 바꿉니다.</span>
            </h1>
            <p className="max-w-2xl text-[18px] leading-[1.65] text-text-secondary tracking-[-0.165px]">
              코딩테스트 이후의 가장 큰 공백은 정답 코드가 아니라, 왜 그렇게 풀었는지 말하는
              훈련입니다. 이 화면은 한 명의 대표 학습자가 코드를 제출하고, 코드 기반 질문을
              받은 뒤, 강사가 바로 볼 수 있는 3축 리포트로 이어지는 흐름을 보여줍니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/problems/${featuredProblem.id}`}
              data-video-cta="featured-problem"
              className="btn-primary px-6 py-3 text-[15px]"
            >
              대표 학습자 세션 보기
            </Link>
            <Link className="btn-ghost px-5 py-3 text-[15px]" href="#operating-loop">
              운영 흐름 확인
            </Link>
          </div>
        </div>

        <aside className="linear-card flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-[510] uppercase tracking-[0.14em] text-text-tertiary">
              기관의 반복 부담
            </span>
            <strong className="text-[20px] font-[590] tracking-[-0.24px] text-text-primary">
              개인화 면접 훈련은 필요하지만, 강사의 시간은 반복 질문에 묶입니다.
            </strong>
          </div>
          <ul className="grid gap-3">
            {buyerPains.map((pain) => (
              <li key={pain} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-4 text-[14px] leading-[1.6] text-text-secondary">
                {pain}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section id="operating-loop" className="linear-card p-1 relative overflow-hidden">
        <div className="bg-panel-dark rounded-[calc(var(--radius-card)-4px)] p-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-12">
            <div className="flex flex-col justify-between gap-8">
              <div className="flex flex-col gap-4">
                <span className="text-[12px] text-brand-indigo font-[510] tracking-[0.1em] uppercase">
                  운영 루프
                </span>
                <h2 className="text-[32px] font-[400] leading-[1.13] tracking-[-0.704px] text-text-primary">
                  한 번의 훈련 후, 강사는 다음에 무엇을 물어볼지 바로 압니다.
                </h2>
                <p className="text-[16px] leading-[1.65] text-text-secondary">
                  제출 코드, 질문, 답변, 리포트가 한 학습자의 훈련 기록으로 이어집니다.
                </p>
              </div>

              <div className="rounded-panel border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="text-[11px] font-[510] uppercase tracking-[0.12em] text-text-tertiary">
                  대표 세션
                </div>
                <h3 className="mt-2 text-[20px] font-[590] tracking-[-0.24px] text-text-primary">
                  {featuredProblem.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary">
                  {featuredProblem.elevatorPitch}
                </p>
                <Link href={`/problems/${featuredProblem.id}`} className="btn-primary mt-5 px-5 py-2.5 text-[14px]">
                  이 세션으로 들어가기
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              {operatingLoop.map((step) => (
                <article key={step.title} className="flex gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-comfortable border border-brand-indigo/30 bg-brand-indigo/10 text-[12px] font-[590] text-brand-indigo">
                    {step.eyebrow}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <strong className="text-[16px] font-[510] text-text-primary">{step.title}</strong>
                    <p className="text-[14px] leading-[1.6] text-text-secondary">{step.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="linear-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-accent-violet font-[510] tracking-[0.1em] uppercase">
              구매자 takeaway
            </span>
              <h2 className="text-[24px] font-[400] tracking-[-0.288px] text-text-primary">
                훈련이 끝나면 학생별 약점과 다음 질문이 바로 보입니다
              </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {buyerTakeaways.map((takeaway) => (
              <div key={takeaway.label} className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
                <div className="text-[11px] font-[510] uppercase tracking-[0.12em] text-text-tertiary">
                  {takeaway.label}
                </div>
                <p className="mt-2 text-[14px] leading-[1.5] text-text-secondary">{takeaway.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="practice-problems" className="flex flex-col gap-8 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-subtle pb-6">
          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-text-tertiary font-[510] tracking-[0.1em] uppercase">
              훈련 문제
            </span>
            <h2 className="text-[32px] font-[400] tracking-[-0.704px] text-text-primary">
              같은 운영 흐름으로 반복할 수 있는 문제들
            </h2>
          </div>
          <div className="pill bg-white/[0.02] border-border-subtle flex items-center gap-2 py-1.5 px-3">
            <div className="w-1.5 h-1.5 rounded-full bg-status-emerald" />
            <span className="text-text-secondary font-[400] text-[13px]">{problemCatalog.length}개 훈련 문제</span>
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
                <span className={`pill text-[10px] ${problem.difficulty === "easy" ? "text-status-emerald border-status-emerald/30 bg-status-emerald/10" : problem.difficulty === "hard" ? "text-security-lavender border-security-lavender/30 bg-security-lavender/10" : "bg-white/5 border-white/10"}`}>
                  {DIFFICULTY_LABEL[problem.difficulty]}
                </span>
              </div>
              <div className="flex flex-col gap-2 mt-2 relative z-10 flex-1">
                <h3 className="text-[18px] font-[510] tracking-tight group-hover:text-white transition-colors">
                  {problem.title}
                </h3>
                <p className="text-[14px] text-text-secondary line-clamp-2 leading-[1.5] mt-1">
                  {problem.elevatorPitch}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
