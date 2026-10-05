import crypto from "crypto";
import { db } from "@/lib/firebase";
import { getDoc } from "@/lib/data";
import { json, readBody, withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export const GET = withAdmin(async () => {
  const s = await db().collection("codes").orderBy("createdAt", "desc").limit(3000).get();
  return json({ items: s.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

export const POST = withAdmin(async (req) => {
  const b = await readBody(req);
  const type = b.type === "monthly" ? "monthly" : "trial";
  const count = Math.min(Math.max(parseInt(b.count) || 1, 1), 100);
  const divisionId = String(b.divisionId || "");
  if (!(await getDoc("divisions", divisionId))) return json({ error: "اختار الشعبة" }, 400);
  const durationMs = type === "trial" ? HOUR : 30 * DAY;
  const name = String(b.name || "").trim().slice(0, 80);

  const made = [];
  for (let i = 0; i < count; i++) {
    let code;
    for (let tries = 0; tries < 20; tries++) {
      const c = String(crypto.randomInt(10000000, 100000000));
      const ex = await db().collection("codes").where("code", "==", c).limit(1).get();
      if (ex.empty && !made.includes(c)) {
        code = c;
        break;
      }
    }
    if (!code) return json({ error: "تعذر توليد كود فريد، جرب تاني" }, 500);
    await db().collection("codes").add({
      code,
      name,
      type,
      divisionId,
      durationMs,
      createdAt: Date.now(),
      activatedAt: null,
      expiresAt: null,
      deviceId: null,
      blocked: false,
    });
    made.push(code);
  }
  return json({ codes: made });
});
