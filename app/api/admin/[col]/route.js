import { db } from "@/lib/firebase";
import { SCHEMA, clean } from "@/lib/schema";
import { getDoc } from "@/lib/data";
import { notifyNewLecture } from "@/lib/push";
import { json, readBody, withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async (_req, { params }) => {
  if (!SCHEMA[params.col]) return json({ error: "غير موجود" }, 404);
  const s = await db().collection(params.col).get();
  return json({ items: s.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

export const POST = withAdmin(async (req, { params }) => {
  const sc = SCHEMA[params.col];
  if (!sc) return json({ error: "غير موجود" }, 404);
  const body = await readBody(req);
  const data = clean(sc.fields, body);

  for (const f of sc.fields) {
    if (f.req && !data[f.k]) return json({ error: "املا الحقول المطلوبة" }, 400);
  }
  if (sc.parent) {
    const pid = String(body[sc.parent.fk] || "");
    if (!(await getDoc(sc.parent.col, pid))) return json({ error: `اختار ${sc.parent.l}` }, 400);
    data[sc.parent.fk] = pid;
  }
  data.createdAt = Date.now();
  const ref = await db().collection(params.col).add(data);

  let push = null;
  if (params.col === "lectures" && body.notify !== false) {
    try {
      push = await notifyNewLecture({ id: ref.id, ...data }, new URL(req.url).origin);
    } catch (e) {
      console.error("notify failed", e);
      push = { sent: 0, failed: true };
    }
  }
  return json({ id: ref.id, push });
});
