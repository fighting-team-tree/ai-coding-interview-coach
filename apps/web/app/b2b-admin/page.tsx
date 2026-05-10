import Link from "next/link";

const demotedReasons = [
  "현재 제품 설명의 중심은 관리자 대시보드가 아니라 한 학습자의 훈련 세션입니다.",
  "실제 cohort 통계, 비용 절감, PDF 다운로드, 외부 연동은 아직 제공 범위로 전면에 두지 않습니다.",
  "운영 화면은 향후 확장 방향을 설명할 때만 참고하는 개요 화면입니다.",
] as const;

export default function B2BAdminPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[960px] flex-col justify-center gap-8 px-6 py-20 text-text-primary">
      <section className="linear-card p-8 md:p-10 flex flex-col gap-8 border-border-subtle bg-panel-dark">
        <div className="flex flex-col gap-4 max-w-3xl">
          <span className="text-[12px] font-[510] uppercase tracking-[0.14em] text-text-tertiary">
            후순위 운영 화면
          </span>
          <h1 className="text-[40px] font-[510] leading-[1.08] tracking-[-0.704px] text-text-primary">
            이 제품의 신뢰 근거는 대시보드가 아니라 학습자 세션입니다.
          </h1>
          <p className="text-[16px] leading-[1.7] text-text-secondary">
            기존 관리자 화면은 실제 운영 지표처럼 보일 위험이 있어 대표 흐름에서 분리했습니다.
            먼저 확인해야 할 것은 코드 제출, 코드 기반 질문, 3축 리포트, 강사 코칭 메모로 이어지는
            대표 세션입니다.
          </p>
        </div>

        <ul className="grid gap-3">
          {demotedReasons.map((reason) => (
            <li key={reason} className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-4 text-[14px] leading-[1.6] text-text-secondary">
              {reason}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3 border-t border-border-subtle pt-6">
          <Link href="/problems/two-pointer-window" className="btn-primary px-6 py-3 text-[15px]">
            대표 학습자 세션 보기
          </Link>
          <Link href="/" className="btn-ghost px-6 py-3 text-[15px]">
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
