import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";
import { BellIcon } from "./icons";
import { SITE } from "@/lib/site";

export default function Header({ name }) {
  return (
    <header className="topbar">
      <div className="container bar">
        <Link href="/" className="brand">{SITE}</Link>
        <div className="bar-actions">
          <Link href="/notifications" className="icon-btn" aria-label="الإشعارات" title="الإشعارات"><BellIcon /></Link>
          <ThemeToggle />
          <UserMenu name={name} />
        </div>
      </div>
    </header>
  );
}
