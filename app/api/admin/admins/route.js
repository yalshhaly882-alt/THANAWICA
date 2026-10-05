import { db } from "@/lib/firebase";
import { hashPassword } from "@/lib/auth";
import { json, readBody, withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async () => {
  const s = await db().collection("admins").get();
  return json({
    items: s.docs.map((d) => ({ id: d.id, username: d.data().username, role: d.data().role, createdAt: d.data().createdAt })),
  });
});

export const POST = withAdmin(
  async (req) => {
    const { username, password } = await readBody(req);
    const u = String(username || "").trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,30}$/.test(u)) return json({ error: "اسم المستخدم: حروف إنجليزي وأرقام (3 إلى 30)" }, 400);
    if (String(password || "").length < 8) return json({ error: "كلمة المرور 8 حروف على الأقل" }, 400);
    const ex = await db().collection("admins").where("username", "==", u).limit(1).get();
    if (!ex.empty) return json({ error: "اسم المستخدم موجود" }, 409);
    await db().collection("admins").add({
      username: u,
      passHash: hashPassword(String(password)),
      role: "admin",
      tokenVersion: 0,
      createdAt: Date.now(),
    });
    return json({ ok: true });
  },
  { ownerOnly: true }
);
