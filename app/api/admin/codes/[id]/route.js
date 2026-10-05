import { db } from "@/lib/firebase";
import { json, readBody, withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";
const DAY = 24 * 3600 * 1000;

export const PATCH = withAdmin(async (req, { params }) => {
  const ref = db().collection("codes").doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return json({ error: "الكود مش موجود" }, 404);
  const c = snap.data();
  const { action, days, name } = await readBody(req);

  if (action === "reset") {
    await ref.update({ deviceId: null });
  } else if (action === "block") {
    await ref.update({ blocked: true });
  } else if (action === "unblock") {
    await ref.update({ blocked: false });
  } else if (action === "rename") {
    await ref.update({ name: String(name || "").trim().slice(0, 80) });
  } else if (action === "extend") {
    const d = Math.min(Math.max(parseInt(days) || 30, 1), 400) * DAY;
    if (c.activatedAt) {
      await ref.update({ expiresAt: Math.max(Date.now(), c.expiresAt || 0) + d, type: "monthly" });
    } else {
      await ref.update({ durationMs: (c.durationMs || 0) + d, type: "monthly" });
    }
  } else {
    return json({ error: "إجراء غير معروف" }, 400);
  }
  return json({ ok: true });
});

export const DELETE = withAdmin(async (_req, { params }) => {
  await db().collection("codes").doc(params.id).delete();
  return json({ ok: true });
});
