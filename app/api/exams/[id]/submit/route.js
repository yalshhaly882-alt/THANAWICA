import { db } from "@/lib/firebase";
import { getStudent } from "@/lib/auth";
import { getDoc } from "@/lib/data";
import { json, readBody } from "@/lib/api";

export const dynamic = "force-dynamic";
const GRACE = 30000;

export async function POST(req, { params }) {
  const r = await getStudent();
  if (r.status !== "ok") return json({ error: "سجل دخولك الأول" }, 401);
  const st = r.student;
  const { attemptId, answers } = await readBody(req);

  const exam = await getDoc("exams", params.id);
  if (!exam) return json({ error: "الامتحان مش موجود" }, 404);

  const ref = db().collection("attempts").doc(String(attemptId || "x"));
  const snap = await ref.get();
  if (!snap.exists) return json({ error: "المحاولة مش موجودة" }, 404);
  const a = snap.data();
  if (a.studentId !== st.id || a.examId !== exam.id) return json({ error: "غير مصرح" }, 403);
  if (a.submitted) return json({ error: "المحاولة دي اتسلمت قبل كده" }, 409);

  const now = Date.now();
  const late = now > a.endsAt + GRACE;
  const qs = exam.questions || [];
  let score = 0;
  const review = qs.map((q, i) => {
    const y = answers && typeof answers[i] === "number" ? answers[i] : null;
    const correct = (q.correct || 1) - 1;
    const ok = !late && y === correct;
    if (ok) score++;
    return { correct, yours: y, ok };
  });

  await ref.update({
    submitted: true,
    submittedAt: now,
    score,
    total: qs.length,
    late,
    answers: answers && typeof answers === "object" ? answers : {},
  });

  return json({ score, total: qs.length, late, review: exam.showAnswers === false ? null : review });
}
