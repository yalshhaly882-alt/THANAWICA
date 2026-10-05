"use client";
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

export default function ThemeToggle() {
  const [t, setT] = useState("dark");
  useEffect(() => {
    setT(document.documentElement.dataset.theme || "dark");
  }, []);
  function toggle() {
    const n = t === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = n;
    try {
      localStorage.setItem("theme", n);
    } catch {}
    setT(n);
  }
  return (
    <button className="icon-btn" onClick={toggle} aria-label="تغيير وضع الليل والنهار" title="ليل / نهار">
      {t === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
