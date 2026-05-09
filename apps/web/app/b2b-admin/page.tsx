"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// --- Simple Icons as SVG Components ---
const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-indigo">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const DollarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-status-emerald">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// --- Stat Card Component with Count-up Effect ---
const StatCard = ({ title, value, unit, icon: Icon, delay = 0 }: any) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const end = value;
      const duration = 1500;
      const increment = Math.ceil(end / (duration / 16));
      
      const step = () => {
        start += increment;
        if (start < end) {
          setCount(start);
          requestAnimationFrame(step);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="linear-card p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between items-start">
        <div className="p-2 bg-white/5 rounded-comfortable">
          <Icon className="text-text-secondary" />
        </div>
        <span className="pill-success text-[10px] font-bold">+12%</span>
      </div>
      <div>
        <h3 className="text-text-tertiary text-sm mb-1">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-text-primary tracking-tight">
            {title.includes("비용") ? `₩${count.toLocaleString()}` : count.toLocaleString()}
          </span>
          <span className="text-text-tertiary text-sm">{unit}</span>
        </div>
      </div>
    </div>
  );
};

// --- Mock Data ---
const RECENT_INTERVIEWS = [
  { id: 1, name: "김철수", date: "2026-05-09", score: 92, status: "Pass", problem: "이진 트리 순회" },
  { id: 2, name: "이영희", date: "2026-05-09", score: 45, status: "Alert", problem: "LRU 캐시 구현" },
  { id: 3, name: "박지민", date: "2026-05-08", score: 88, status: "Pass", problem: "정렬된 배열 병합" },
  { id: 4, name: "최도현", date: "2026-05-08", score: 76, status: "Pass", problem: "동적 계획법: 계단 오르기" },
  { id: 5, name: "정미나", date: "2026-05-07", score: 32, status: "Fail", problem: "해시 테이블 충돌 처리" },
];

export default function B2BAdminPage() {
  const [selectedInterview, setSelectedInterview] = useState(RECENT_INTERVIEWS[0]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="bg-marketing-black min-height-screen" />;

  return (
    <div className="bg-marketing-black min-h-screen text-text-primary font-sans flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-primary bg-marketing-deep p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <LogoIcon />
          <span className="font-bold tracking-tight text-lg">Socratic AI</span>
        </div>

        <nav className="flex flex-col gap-1">
          <p className="text-[10px] font-bold text-text-quaternary uppercase tracking-widest mb-2 px-3">Main</p>
          <button className="flex items-center gap-3 px-3 py-2 rounded-comfortable bg-white/5 text-text-primary text-sm font-medium transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </button>
          <button className="flex items-center gap-3 px-3 py-2 rounded-comfortable hover:bg-white/5 text-text-secondary text-sm transition-all">
            <UsersIcon />
            Interviews
          </button>
          <button className="flex items-center gap-3 px-3 py-2 rounded-comfortable hover:bg-white/5 text-text-secondary text-sm transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Problem Set
          </button>
        </nav>

        <div className="mt-auto">
          <div className="bg-brand-indigo/10 border border-brand-indigo/20 rounded-panel p-4 mb-4">
            <p className="text-xs text-brand-indigo font-bold mb-1">Standard Plan</p>
            <p className="text-[10px] text-text-tertiary mb-3">수강생 42/100명 사용 중</p>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand-indigo w-[42%] rounded-full" />
            </div>
          </div>
          <button className="flex items-center gap-3 px-3 py-2 rounded-comfortable hover:bg-white/5 text-text-secondary text-sm w-full transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-marketing-black">
        <header className="h-16 border-b border-border-primary flex items-center justify-between px-8 bg-marketing-black/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="font-semibold text-lg">B2B 부트캠프 대시보드</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-quaternary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search candidates..." className="bg-white/5 border border-border-primary rounded-comfortable pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-brand-indigo transition-all w-64" />
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-indigo to-accent-violet border border-white/10" />
          </div>
        </header>

        <div className="p-8 flex flex-col gap-8 max-w-7xl mx-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="총 모의 면접 세션" value={1248} unit="회" icon={UsersIcon} delay={100} />
            <StatCard title="강사 리소스 절감 시간" value={312} unit="시간" icon={ClockIcon} delay={200} />
            <StatCard title="예상 채용 비용 절감액" value={4250000} unit="원" icon={DollarIcon} delay={300} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Interviews Table */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text-primary">최근 면접 기록</h3>
                <button className="text-xs text-brand-indigo hover:underline">모두 보기</button>
              </div>
              <div className="linear-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 border-b border-border-primary text-text-tertiary text-xs">
                    <tr>
                      <th className="px-6 py-3 font-medium">지원자</th>
                      <th className="px-6 py-3 font-medium">문제</th>
                      <th className="px-6 py-3 font-medium">날짜</th>
                      <th className="px-6 py-3 font-medium text-center">점수</th>
                      <th className="px-6 py-3 font-medium text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {RECENT_INTERVIEWS.map((interview, idx) => (
                      <tr 
                        key={interview.id} 
                        className={`hover:bg-white/5 cursor-pointer transition-all ${selectedInterview.id === interview.id ? 'bg-white/[0.03]' : ''}`}
                        onClick={() => setSelectedInterview(interview)}
                      >
                        <td className="px-6 py-4 font-medium text-text-primary">{interview.name}</td>
                        <td className="px-6 py-4 text-text-secondary">{interview.problem}</td>
                        <td className="px-6 py-4 text-text-tertiary text-xs">{interview.date}</td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-brand-indigo">{interview.score}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {interview.status === "Pass" && <div className="pill-success flex items-center gap-1"><CheckIcon /> <span>정상</span></div>}
                            {interview.status === "Alert" && <div className="bg-orange-400/10 text-orange-400 border border-orange-400/20 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><AlertIcon /> <span>주의</span></div>}
                            {interview.status === "Fail" && <div className="bg-red-400/10 text-red-400 border border-red-400/20 px-2 py-0.5 rounded-full text-[10px] font-bold">탈락</div>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Analysis Panel */}
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-text-primary">상세 분석 리포트</h3>
              <div className="linear-card-highlight p-6 flex flex-col gap-6 min-h-[400px]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-border-primary flex items-center justify-center text-lg font-bold text-brand-indigo">
                    {selectedInterview.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">{selectedInterview.name} 지원자</h4>
                    <p className="text-xs text-text-tertiary">{selectedInterview.problem}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-text-quaternary uppercase tracking-widest">3축 평가 지표</p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">문제 정의 능력</span>
                        <span className="text-brand-indigo font-bold">85%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-indigo rounded-full transition-all duration-1000" style={{ width: '85%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">해결 로직 전개</span>
                        <span className="text-accent-violet font-bold">92%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-violet rounded-full transition-all duration-1000" style={{ width: '92%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-secondary">기술적 설명력</span>
                        <span className="text-status-emerald font-bold">78%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-status-emerald rounded-full transition-all duration-1000" style={{ width: '78%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-comfortable border border-border-primary">
                  <div className="flex items-center gap-2 mb-2 text-status-emerald">
                    <CheckIcon />
                    <span className="text-xs font-bold">AI 인사이트</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    복잡한 알고리즘을 실생활 비유로 잘 설명함. 다만 시간 복잡도 개선에 대한 꼬리 질문 시 한 번 주춤하는 경향이 있음. 추가적인 성능 최적화 질문 훈련 권장.
                  </p>
                </div>

                <button className="btn-primary w-full mt-auto">
                  전체 리포트 PDF 다운로드
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-bottom {
          from { transform: translateY(1rem); }
          to { transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.5s ease-out forwards, slide-in-from-bottom 0.5s ease-out forwards;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
      `}</style>
    </div>
  );
}
