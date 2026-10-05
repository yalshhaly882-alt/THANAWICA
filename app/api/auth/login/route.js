import { cookies } from "next/headers";
import { db } from "@/lib/firebase";
import {
  STUDENT_COOKIE,
  clearFails,
  clientIp,
  cookieOpts,
  isLocked,
  registerFail,
  studentToken,
} from "@/lib/auth";
import { json, readBody } from "@/lib/api";

export const dynamic = "force-dynamic";
const WINDOW = 15 * 60 * 1000;

export async function POST(req) {
  const { code, deviceId } = await readBody(req);
  const ipKey = "stu:" + clientIp(req);

  if (await isLocked(ipKey, 40, WINDOW)) {
    return json({ error: "محاولات كتير غلط. استنى 15 دقيقة وجرب تاني." }, 429);
  }
  if (!/^\d{8}$/.test(String(code || "")) || !deviceId || String(deviceId).length < 16) {
    return json({ error: "اكتب كود الطالب المكون من 8 أرقام" }, 400);
  }

  const q = await db().collection("codes").where("code", "==", String(code)).limit(1).get();
  if (q.empty) {
    await registerFail(ipKey, WINDOW);
    return json({ error: "الكود غير صحيح" }, 404);
  }
  const ref = q.docs[0].ref;

  const result = await db().runTransaction(async (t) => {
    const snap = await t.get(ref);
    const c = snap.data();
    const now = Date.now();
    if (c.blocked) return { error: "الحساب موقوف. كلم الأدمن.", status: 403 };
    if (c.deviceId && c.deviceId !== deviceId) {
      return { error: "الكود ده مسجل على جهاز تاني. كلم الأدمن لو محتاج تغيّر الجهاز.", status: 403 };
    }
    if (!c.activatedAt) {
      t.update(ref, { activatedAt: now, expiresAt: now + c.durationMs, deviceId });
    } else {
      if (now > c.expiresAt) return { expired: true, status: 403 };
      if (!c.deviceId) t.update(ref, { deviceId });
    }
    return { ok: true, id: ref.id };
  });

  if (!result.ok) return json(result, result.status);

  await clearFails(ipKey);
  cookies().set(STUDENT_COOKIE, studentToken(result.id, deviceId), cookieOpts(365 * 24 * 3600 * 1000));
  return json({ ok: true });
}
