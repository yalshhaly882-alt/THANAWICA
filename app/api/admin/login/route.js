import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/firebase";
import {
  ADMIN_COOKIE,
  adminToken,
  checkPassword,
  clearFails,
  clientIp,
  cookieOpts,
  hashPassword,
  isLocked,
  registerFail,
} from "@/lib/auth";
import { json, readBody } from "@/lib/api";

export const dynamic = "force-dynamic";
const WINDOW = 15 * 60 * 1000;

const same = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export async function POST(req) {
  const { username, password } = await readBody(req);
  const key = "adm:" + clientIp(req);

  if (await isLocked(key, 6, WINDOW)) {
    return json({ error: "محاولات كتير. استنى 15 دقيقة." }, 429);
  }

  const u = String(username || "").trim().toLowerCase();
  const p = String(password || "");
  const col = db().collection("admins");
  let snap = await col.where("username", "==", u).limit(1).get();

  // أول مرة: لو مفيش أي أدمن، أنشئ المالك من متغيرات البيئة
  if (snap.empty) {
    const any = await col.limit(1).get();
    const envU = String(process.env.ADMIN_USERNAME || "").trim().toLowerCase();
    const envP = String(process.env.ADMIN_PASSWORD || "");
    if (any.empty && envU && envP && same(u, envU) && same(p, envP)) {
      await col.add({
        username: envU,
        passHash: hashPassword(envP),
        role: "owner",
        tokenVersion: 0,
        createdAt: Date.now(),
      });
      snap = await col.where("username", "==", u).limit(1).get();
    }
  }

  if (snap.empty || !checkPassword(p, snap.docs[0].data().passHash)) {
    await registerFail(key, WINDOW);
    return json({ error: "اسم المستخدم أو كلمة المرور غلط" }, 401);
  }

  const d = snap.docs[0];
  await clearFails(key);
  cookies().set(ADMIN_COOKIE, adminToken(d.id, d.data().tokenVersion || 0), cookieOpts(7 * 24 * 3600 * 1000));
  return json({ ok: true });
}
