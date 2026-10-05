import Link from "next/link";
import MiniBar from "@/components/MiniBar";
import { TG } from "@/lib/site";

export default function Expired({ searchParams }) {
  const blocked = !!searchParams?.b;
  return (
    <>
      <MiniBar />
      <div className="center-wrap">
        <div className="card center-card" style={{ textAlign: "center" }}>
          <h1>{blocked ? "الحساب موقوف" : "اشتراكك انتهى"}</h1>
          <p className="muted" style={{ marginTop: 10 }}>
            {blocked ? "كلم الأدمن عشان يفعّل حسابك." : "كلم الأدمن عشان يجددلك الاشتراك وتكمل مذاكرتك."}
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {TG && (
              <a className="btn btn-primary" href={`https://t.me/${TG}`} target="_blank" rel="noopener noreferrer">
                تواصل مع الأدمن على تليجرام
              </a>
            )}
            <Link className="btn btn-ghost" href="/login">عندي كود جديد</Link>
          </div>
        </div>
      </div>
    </>
  );
}
