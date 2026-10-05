import { db } from "@/lib/firebase";
import { SCHEMA, clean } from "@/lib/schema";
import { cascadeDelete, getDoc } from "@/lib/data";
import { json, readBody, withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const PUT = withAdmin(async (req, { params }) => {
  const sc = SCHEMA[params.col];
  if (!sc) return json({ error: "غير موجود" }, 404);
  const ref = db().collection(params.col).doc(params.id);
  if (!(await ref.get()).exists) return json({ error: "غير موجود" }, 404);

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
  data.updatedAt = Date.now();
  await ref.update(data);
  return json({ ok: true });
});

export const DELETE = withAdmin(async (_req, { params }) => {
  if (!SCHEMA[params.col]) return json({ error: "غير موجود" }, 404);
  await cascadeDelete(params.col, params.id);
  return json({ ok: true });
});
