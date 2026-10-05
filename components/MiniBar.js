import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { SITE } from "@/lib/site";

export default function MiniBar({ cta }) {
  return (
    <header className="topbar">
      <div className="container bar">
        <Link href="/" className="brand">{SITE}</Link>
        <div className="bar-actions">
          <ThemeToggle />
          {cta && <Link href={cta.href} className="btn btn-primary btn-pill">{cta.label}</Link>}
        </div>
      </div>
    </header>
  );
}
