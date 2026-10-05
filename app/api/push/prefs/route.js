import { db } from "@/lib/firebase";
import { getStudent } from "@/lib/auth";
import { json, readBody } from "@/lib/api";

export const dynamic = "force-dynamic";
const ids = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === "string" && x.length < 60).slice(0, 500) : []);

export async function POST(req) {
  const r = await getStudent();
  if (r.status !== "ok") return json({ error: "سجل دخولك الأول" }, 401);
  const b = await readBody(req);
  await db().collection("codes").doc(r.student.id).update({
    mutedSubjects: ids(b.mutedSubjects),
    mutedTeachers: ids(b.mutedTeachers),
  });
  return json({ ok: true });
}
