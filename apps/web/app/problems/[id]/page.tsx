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
    <main className="container">
      <ProblemWorkspace problemId={id} />
    </main>
  );
}

