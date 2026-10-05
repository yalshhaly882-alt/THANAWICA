import { db } from "@/lib/firebase";
import { getStudent } from "@/lib/auth";
import { getDoc } from "@/lib/data";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(_req, { params }) {
  const r = await getStudent();
  if (r.status !== "ok") return json({ error: "سجل دخولك الأول" }, 401);
  const st = r.student;

  const exam = await getDoc("exams", params.id);
  if (!exam) return json({ error: "الامتحان مش موجود" }, 404);

  const now = Date.now();
  const snap = await db()
    .collection("attempts")
    .where("studentId", "==", st.id)
    .where("examId", "==", exam.id)
    .get();
  const attempts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let open = attempts.find((a) => !a.submitted && a.endsAt > now);
  if (!open) {
    if (attempts.length >= (exam.maxAttempts || 5)) {
      return json({ error: "استنفدت كل المحاولات المسموحة" }, 403);
    }
    const endsAt = now + (exam.durationMin || 60) * 60000;
    const ref = await db().collection("attempts").add({
      studentId: st.id,
      examId: exam.id,
      startedAt: now,
      endsAt,
      submitted: false,
    });
    open = { id: ref.id, endsAt };
  }

  const questions = (exam.questions || []).map((q) => ({
    imageUrl: q.imageUrl || "",
    text: q.text || "",
    choices: q.choices || [],
    count: (q.choices && q.choices.length) || q.choicesCount || 4,
  }));
  return json({ attemptId: open.id, endsAt: open.endsAt, now, questions });
}
