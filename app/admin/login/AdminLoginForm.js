"use client";
import { useState } from "react";

export default function AdminLoginForm() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function go(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const j = await r.json();
      if (r.ok) {
        location.href = "/admin";
        return;
      }
      setErr(j.error || "حصل خطأ");
    } catch {
      setErr("مشكلة في الاتصال");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={go} style={{ marginTop: 20 }}>
      <div className="field">
        <label htmlFor="u">اسم المستخدم</label>
        <input id="u" className="input" autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} style={{ direction: "ltr" }} />
      </div>
      <div className="field">
        <label htmlFor="p">كلمة المرور</label>
        <input id="p" type="password" className="input" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} style={{ direction: "ltr" }} />
      </div>
      {err && <p className="err">{err}</p>}
      <button className="btn btn-primary block" disabled={busy || !u || !p}>{busy ? "..." : "دخول"}</button>
    </form>
  );
}
