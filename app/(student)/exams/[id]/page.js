import { notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import { requireStudent } from "@/lib/auth";
import { getDoc } from "@/lib/data";
import { fmt } from "@/components/ui";
import ExamRunner from "./ExamRunner";

export default async function ExamPage({ params }) {
  const s = await requireStudent();
  const exam = await getDoc("exams", params.id);
  if (!exam) notFound();

  const snap = await db()
    .collection("attempts")
    .where("studentId", "==", s.id)
    .where("examId", "==", exam.id)
    .get();
  const attempts = snap.docs.map((d) => d.data()).sort((a, b) => b.startedAt - a.startedAt);
  const max = exam.maxAttempts || 5;
  const open = attempts.some((a) => !a.submitted && a.endsAt > Date.now());
  const history = attempts
    .filter((a) => a.submitted)
    .map((a) => ({ at: fmt(a.submittedAt), score: a.score, total: a.total }));

  return (
    <ExamRunner
      examId={exam.id}
      title={exam.title}
      durationMin={exam.durationMin || 60}
      count={(exam.questions || []).length}
      max={max}
      used={attempts.length}
      history={history}
      canStart={open || attempts.length < max}
      resume={open}
      backHref={`/lectures/${exam.lectureId}`}
    />
  );
}
