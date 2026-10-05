import crypto from "crypto";
import { db } from "@/lib/firebase";
import { getStudent } from "@/lib/auth";
import { json, readBody } from "@/lib/api";

export const dynamic = "force-dynamic";
const idOf = (t) => crypto.createHash("sha256").update(t).digest("hex").slice(0, 40);

export async function POST(req) {
  const r = await getStudent();
  if (r.status !== "ok") return json({ error: "سجل دخولك الأول" }, 401);
  const { token } = await readBody(req);
  if (typeof token !== "string" || token.length < 20 || token.length > 4096) return json({ error: "توكن غير صالح" }, 400);

  // جهاز واحد لكل طالب: امسح التوكنز القديمة
  const old = await db().collection("pushTokens").where("studentId", "==", r.student.id).get();
  await Promise.all(old.docs.filter((d) => d.id !== idOf(token)).map((d) => d.ref.delete()));
  await db().collection("pushTokens").doc(idOf(token)).set({
    token,
    studentId: r.student.id,
    divisionId: r.student.divisionId,
    createdAt: Date.now(),
  });
  return json({ ok: true });
}

export async function DELETE(req) {
  const r = await getStudent();
  if (r.status !== "ok") return json({ error: "سجل دخولك الأول" }, 401);
  const { token } = await readBody(req);
  if (typeof token === "string") {
    const ref = db().collection("pushTokens").doc(idOf(token));
    const s = await ref.get();
    if (s.exists && s.data().studentId === r.student.id) await ref.delete();
  }
  return json({ ok: true });
}
