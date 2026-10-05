import Link from "next/link";
import { redirect } from "next/navigation";
import MiniBar from "@/components/MiniBar";
import { SiteFooter, tgLink } from "@/components/ui";
import { getStudent } from "@/lib/auth";
import { listBy } from "@/lib/data";
import { db } from "@/lib/firebase";
import { SITE, TG } from "@/lib/site";
import LoginForm from "./LoginForm";

const FB = process.env.NEXT_PUBLIC_FACEBOOK_URL || "";

export default async function LoginPage() {
  const r = await getStudent();
  if (r.status === "ok") redirect("/");

  const snap = await db().collection("support").get();
  const support = snap.docs.map((d) => d.data()).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const tg = support[0] ? tgLink(support[0].telegram) : TG ? tgLink(TG) : "";

  return (
    <>
      <MiniBar cta={{ href: "/subscribe", label: "اشترك الآن" }} />
      <div className="center-wrap">
        <LoginForm>
          <p className="kicker">أهلاً بيك في {SITE}</p>
          <h1 style={{ margin: "8px 0 14px" }}>سجل دخولك وكمّل طريقك للقمة</h1>
          <p className="muted">
            محتاج بس كود الطالب الخاص بيك عشان تدخل، لو واجهتك أي مشكلة ابعت{" "}
            {tg ? <a className="accent" href={tg} target="_blank" rel="noopener noreferrer">لأدمن التليجرام</a> : "لأدمن التليجرام"}
            {FB && (
              <>
                {" "}أو صفحتنا على{" "}
                <a className="accent" href={FB} target="_blank" rel="noopener noreferrer">الفيس بوك</a>
              </>
            )}
            .
          </p>
        </LoginForm>
      </div>
      <SiteFooter />
    </>
  );
}
