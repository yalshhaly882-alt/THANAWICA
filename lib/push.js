import { getMessaging } from "firebase-admin/messaging";
import { db } from "./firebase";
import { getDoc } from "./data";

// عند إضافة محاضرة جديدة: يسجّل إشعار داخل المنصة (🔔) ويبعت إشعار على أجهزة الطلاب المفعّلين
// بيحترم كتم المواد والمدرسين، ويتجاهل الاشتراكات المنتهية والموقوفة.
export async function notifyNewLecture(lecture, origin = "") {
  const chapter = await getDoc("chapters", lecture.chapterId);
  const teacher = chapter && (await getDoc("teachers", chapter.teacherId));
  const subject = teacher && (await getDoc("subjects", teacher.subjectId));
  const year = subject && (await getDoc("years", subject.yearId));
  if (!teacher || !subject || !year) return { sent: 0, total: 0 };

  const link = `/lectures/${lecture.id}`;
  const title = `محاضرة جديدة — ${subject.name}`;
  const body = `${teacher.name}: ${lecture.name}`;

  // 1) إشعار داخل المنصة
  await db().collection("notifications").add({
    divisionId: year.divisionId,
    subjectId: subject.id,
    teacherId: teacher.id,
    title,
    body,
    link,
    createdAt: Date.now(),
  });

  // 2) إشعار الأجهزة
  const [tokSnap, codeSnap] = await Promise.all([
    db().collection("pushTokens").where("divisionId", "==", year.divisionId).get(),
    db().collection("codes").where("divisionId", "==", year.divisionId).get(),
  ]);
  const students = Object.fromEntries(codeSnap.docs.map((d) => [d.id, d.data()]));
  const now = Date.now();

  const targets = new Map(); // token -> ref
  for (const d of tokSnap.docs) {
    const t = d.data();
    const st = students[t.studentId];
    if (!st || st.blocked || !st.expiresAt || st.expiresAt < now) continue;
    if ((st.mutedSubjects || []).includes(subject.id)) continue;
    if ((st.mutedTeachers || []).includes(teacher.id)) continue;
    targets.set(t.token, d.ref);
  }
  const tokens = [...targets.keys()];
  if (!tokens.length) return { sent: 0, total: 0 };

  const webpush = origin.startsWith("https://") ? { fcmOptions: { link: origin + link } } : undefined;
  let sent = 0;
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const res = await getMessaging().sendEach(
      batch.map((token) => ({ token, notification: { title, body }, data: { link }, webpush }))
    );
    for (let k = 0; k < res.responses.length; k++) {
      const r = res.responses[k];
      if (r.success) sent++;
      else if (/not-registered|invalid-argument|invalid-registration/.test(r.error?.code || "")) {
        await targets.get(batch[k]).delete().catch(() => {});
      }
    }
  }
  return { sent, total: tokens.length };
}
