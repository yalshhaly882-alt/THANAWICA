import Link from "next/link";
import MiniBar from "@/components/MiniBar";
import { SiteFooter, SupportCard } from "@/components/ui";
import { db } from "@/lib/firebase";
import PlanTabs from "./PlanTabs";

export const metadata = { title: "الاشتراك والأسعار" };
export const dynamic = "force-dynamic";

export default async function Subscribe() {
  const [pSnap, sSnap] = await Promise.all([db().collection("plans").get(), db().collection("support").get()]);
  const sort = (a, b) => (a.order ?? 999) - (b.order ?? 999);
  const plans = pSnap.docs.map((d) => ({ id: d.id, name: d.data().name, price: d.data().price, order: d.data().order })).sort(sort);
  const support = sSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(sort);

  return (
    <>
      <MiniBar cta={{ href: "/login", label: "تسجيل الدخول" }} />
      <main className="container page">
        <div className="stack wide">
          <div className="tc" style={{ padding: "18px 0 6px" }}>
            <p className="kicker">عايز تشترك معانا؟</p>
            <h1 style={{ marginTop: 8 }}>تفاصيل الاشتراك معانا والتواصل</h1>
          </div>

          <PlanTabs plans={plans} />
          <SupportCard items={support} />

          <section className="cta-card">
            <h2>معاك الكود؟</h2>
            <p>لو استلمت كود الطالب بتاعك، متضيعش وقت وادخل سجل فوراً عشان تبدأ تذاكر.</p>
            <Link className="btn btn-sky" href="/login">سجل دخولك دلوقتي</Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
