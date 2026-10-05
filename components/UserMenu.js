"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronIcon, HomeIcon, LogoutIcon, UserIcon } from "./icons";

export default function UserMenu({ name }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, []);
  async function out() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  }
  const letter = (name || "ط").trim().charAt(0);
  return (
    <div className="user" ref={ref}>
      <button className="user-btn" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="قائمة الحساب">
        <span className="avatar">{letter}</span>
        <span className={"chev" + (open ? " up" : "")}><ChevronIcon /></span>
      </button>
      {open && (
        <div className="menu">
          <Link href="/" onClick={() => setOpen(false)}><HomeIcon /> الصفحة الرئيسية</Link>
          <Link href="/profile" onClick={() => setOpen(false)}><UserIcon /> حسابي الشخصي</Link>
          <button className="logout" onClick={out}><LogoutIcon /> تسجيل الخروج</button>
        </div>
      )}
    </div>
  );
}
