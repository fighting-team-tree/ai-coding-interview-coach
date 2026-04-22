import { notFound } from "next/navigation";

import { ProblemWorkspace } from "@/components/problem-workspace";
import { problemCatalog } from "@/lib/problem-catalog";

type ProblemPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return problemCatalog.map((problem) => ({ id: problem.id }));
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id } = await params;
  const knownProblem = problemCatalog.find((problem) => problem.id === id);

  if (!knownProblem) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-6 pb-32 pt-8 text-text-primary h-[calc(100vh-64px)]">
      <ProblemWorkspace problemId={id} />
    </main>
  );
}

