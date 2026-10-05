import { db } from "./firebase";

export const byOrder = (a, b) =>
  (a.order ?? 999) - (b.order ?? 999) ||
  String(a.name || a.title || "").localeCompare(String(b.name || b.title || ""), "ar");

export async function getDoc(col, id) {
  if (!id) return null;
  const s = await db().collection(col).doc(String(id)).get();
  return s.exists ? { id: s.id, ...s.data() } : null;
}

export async function listBy(col, field, val) {
  const s = await db().collection(col).where(field, "==", val).get();
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder);
}

const CHILDREN = {
  divisions: [["years", "divisionId"]],
  years: [["subjects", "yearId"]],
  subjects: [["teachers", "subjectId"]],
  teachers: [["chapters", "teacherId"]],
  chapters: [["lectures", "chapterId"]],
  lectures: [["exams", "lectureId"]],
  exams: [["attempts", "examId"]],
};

export async function cascadeDelete(col, id) {
  for (const [c, fk] of CHILDREN[col] || []) {
    const s = await db().collection(c).where(fk, "==", id).get();
    for (const d of s.docs) await cascadeDelete(c, d.id);
  }
  await db().collection(col).doc(id).delete();
}

export async function countBy(col, field, val) {
  const s = await db().collection(col).where(field, "==", val).count().get();
  return s.data().count;
}
