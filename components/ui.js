import Link from "next/link";
import { ArrowIcon, TelegramIcon } from "./icons";
import { SITE } from "@/lib/site";

export function tgLink(v) {
  const s = String(v || "").trim();
  if (/^https?:\/\//i.test(s)) return s;
  const u = s.replace(/^@/, "").replace(/^t\.me\//i, "").replace(/[^A-Za-z0-9_]/g, "");
  return u ? `https://t.me/${u}` : "#";
}

export function PageHead({ pills = [], title, sub, center }) {
  return (
    <div className={center ? "tc" : ""}>
      {pills.length > 0 && (
        <div className="chips" style={center ? { justifyContent: "center" } : undefined}>
          {pills.map((p) => <span className="pill" key={p}>{p}</span>)}
        </div>
      )}
      <div className={center ? "head-c" : "head"}>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </div>
  );
}

export function BackLink({ href, children }) {
  return (
    <Link className="btn btn-ghost back" href={href}>
      <span>{children}</span>
      <ArrowIcon />
    </Link>
  );
}

export function Card({ img, title, href, cta, badge, metaLabel, metaValue, MetaIcon }) {
  return (
    <div className="card item">
      <Link href={href} className="thumb-link">
        {img ? <img className="thumb" src={img} alt="" loading="lazy" /> : <div className="thumb ph">{title}</div>}
        {badge && <span className="badge ok">{badge}</span>}
      </Link>
      <div className="item-body">
        <h3>{title}</h3>
        {metaLabel && (
          <div className="meta-row">
            <span className="lbl">{MetaIcon && <MetaIcon />}{metaLabel}</span>
            <b>{metaValue}</b>
          </div>
        )}
        <Link className="btn btn-light block" href={href}>
          <span>{cta}</span>
          <ArrowIcon />
        </Link>
      </div>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function SupportCard({ items }) {
  return (
    <section className="card panel">
      <h2>الدعم الفني</h2>
      <p className="muted">ده حساب الدعم الفني الرسمي لـ{SITE}</p>
      <div className="tg-list">
        {items.map((x) => (
          <a key={x.id} className="tg-btn" href={tgLink(x.telegram)} target="_blank" rel="noopener noreferrer">
            <span className="tg-ic"><TelegramIcon /></span>
            <span>{x.name}</span>
          </a>
        ))}
        {!items.length && <div className="empty">لسه مفيش حسابات دعم فني.</div>}
      </div>
      <p className="muted tc">ابعت رسالتك واستني الرد</p>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <span className="brand-sm">{SITE}</span>
      <div>© {new Date().getFullYear()} {SITE}. جميع الحقوق محفوظة.</div>
    </footer>
  );
}

export function fmt(ms) {
  return new Date(ms).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short" });
}
