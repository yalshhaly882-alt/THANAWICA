"use client";
import { useState } from "react";
import { CopyIcon } from "@/components/icons";

export default function CopyCode({ value }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  }
  return (
    <button className="copy-btn" onClick={copy} aria-label="نسخ الكود" title="نسخ الكود">
      {done ? "✓" : <CopyIcon />}
    </button>
  );
}
