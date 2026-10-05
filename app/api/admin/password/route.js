import { cookies } from "next/headers";
import { db } from "@/lib/firebase";
import { ADMIN_COOKIE, adminToken, checkPassword, cookieOpts, hashPassword } from "@/lib/auth";
import { json, readBody, withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = withAdmin(async (req, _ctx, admin) => {
  const { current, next } = await readBody(req);
  if (String(next || "").length < 8) return json({ error: "كلمة المرور الجديدة لازم تكون 8 حروف على الأقل" }, 400);

  const ref = db().collection("admins").doc(admin.id);
  const d = (await ref.get()).data();
  if (!checkPassword(String(current || ""), d.passHash)) return json({ error: "كلمة المرور الحالية غلط" }, 403);

  const tv = (d.tokenVersion || 0) + 1; // بيطلّع أي جلسة قديمة
  await ref.update({ passHash: hashPassword(String(next)), tokenVersion: tv });
  cookies().set(ADMIN_COOKIE, adminToken(admin.id, tv), cookieOpts(7 * 24 * 3600 * 1000));
  return json({ ok: true });
});
