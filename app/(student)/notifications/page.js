import Link from "next/link";
import { db } from "@/lib/firebase";
import { requireStudent } from "@/lib/auth";
import { Empty, PageHead, fmt } from "@/components/ui";

export default async function Notifications() {
  const s = await requireStudent();
  const snap = s.divisionId
    ? await db().collection("notifications").where("divisionId", "==", s.divisionId).get()
    : { docs: [] };
  const ms = s.mutedSubjects || [];
  const mt = s.mutedTeachers || [];
  const items = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((n) => !ms.includes(n.subjectId) && !mt.includes(n.teacherId))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50);

  return (
    <div className="stack">
      <PageHead title="الإشعارات" sub="آخر المحاضرات اللي نزلت في موادك." />
      {items.length ? (
        <div className="list">
          {items.map((n) => (
            <Link key={n.id} href={n.link || "/"} className="li">
              <div>
                <b>{n.title}</b>
                <div className="muted">{n.body}</div>
              </div>
              <span className="muted">{fmt(n.createdAt)}</span>
            </Link>
          ))}
        </div>
      ) : (
        <Empty>مفيش إشعارات لسه.</Empty>
      )}
      <Link className="btn btn-ghost" href="/profile">إعدادات الإشعارات</Link>
    </div>
  );
}
