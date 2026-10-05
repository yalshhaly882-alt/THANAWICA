import { db } from "./firebase";
import { byOrder, listBy } from "./data";

async function inQuery(col, field, ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 10) {
    const s = await db().collection(col).where(field, "in", ids.slice(i, i + 10)).get();
    s.docs.forEach((d) => out.push({ id: d.id, ...d.data() }));
  }
  return out.sort(byOrder);
}

// مواد ومدرسين الشعبة (لإعدادات الإشعارات)
export async function catalogFor(divisionId) {
  if (!divisionId) return [];
  const years = await listBy("years", "divisionId", divisionId);
  if (!years.length) return [];
  const subs = await inQuery("subjects", "yearId", years.map((y) => y.id));
  if (!subs.length) return [];
  const teas = await inQuery("teachers", "subjectId", subs.map((s) => s.id));
  return subs.map((s) => ({
    id: s.id,
    name: s.name,
    year: years.find((y) => y.id === s.yearId)?.name || "",
    teachers: teas.filter((t) => t.subjectId === s.id).map((t) => ({ id: t.id, name: t.name })),
  }));
}
