import { db } from "@/lib/firebase";
import { json, withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";
const DAY = 86400000;
const cairoDay = (ms) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });

function lastDays(n, now) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push({ d: cairoDay(now - i * DAY), n: 0 });
  return out;
}
function bump(series, ms) {
  if (!ms) return;
  const k = cairoDay(ms);
  const row = series.find((x) => x.d === k);
  if (row) row.n++;
}

export const GET = withAdmin(async () => {
  const now = Date.now();
  const col = (c) => db().collection(c);
  const [codeSnap, attSnap, divSnap, lecSnap, counts] = await Promise.all([
    col("codes").limit(5000).get(),
    col("attempts").orderBy("startedAt", "desc").limit(5000).get(),
    col("divisions").get(),
    col("lectures").get(),
    Promise.all(
      ["divisions", "years", "subjects", "teachers", "chapters", "lectures", "exams"].map(async (c) => [c, (await col(c).count().get()).data().count])
    ),
  ]);
  const codes = codeSnap.docs.map((d) => d.data());
  const atts = attSnap.docs.map((d) => d.data());

  const status = (c) => (c.blocked ? "blocked" : !c.activatedAt ? "new" : now < c.expiresAt ? "active" : "expired");
  const k = { total: codes.length, active: 0, expired: 0, new: 0, blocked: 0, trial: 0, monthly: 0 };
  for (const c of codes) {
    k[status(c)]++;
    k[c.type === "trial" ? "trial" : "monthly"]++;
  }

  const activationsByDay = lastDays(14, now);
  codes.forEach((c) => bump(activationsByDay, c.activatedAt));
  const attemptsByDay = lastDays(14, now);
  const done = atts.filter((a) => a.submitted);
  done.forEach((a) => bump(attemptsByDay, a.submittedAt));
  const scored = done.filter((a) => a.total);
  const avgPct = scored.length ? Math.round((scored.reduce((s, a) => s + a.score / a.total, 0) / scored.length) * 100) : null;

  const byDivision = divSnap.docs
    .map((d) => {
      const mine = codes.filter((c) => c.divisionId === d.id);
      return { id: d.id, name: d.data().name, total: mine.length, active: mine.filter((c) => status(c) === "active").length };
    })
    .sort((a, b) => b.active - a.active);

  const expiringSoon = codes
    .filter((c) => status(c) === "active" && c.expiresAt - now < 3 * DAY)
    .sort((a, b) => a.expiresAt - b.expiresAt)
    .slice(0, 10)
    .map((c) => ({ code: c.code, name: c.name || "", expiresAt: c.expiresAt }));

  const content = Object.fromEntries(counts);
  content.videos = 0;
  content.files = 0;
  for (const d of lecSnap.docs) {
    const l = d.data();
    content.videos += (l.videos || []).length;
    content.files += (l.files || []).length;
  }

  return json({ codes: k, content, activationsByDay, attemptsByDay, attemptsTotal: atts.length, avgPct, byDivision, expiringSoon });
});
