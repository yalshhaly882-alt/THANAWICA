"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

function deviceId() {
  let d = localStorage.getItem("did");
  if (!d) {
    d = (crypto.randomUUID && crypto.randomUUID()) || Date.now() + "-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    localStorage.setItem("did", d);
  }
  return d;
}

export default function LoginForm({ children }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [state, setState] = useState({ k: "idle", t: "بانتظار إدخال الكود الخاص بك..." });
  const busy = state.k === "busy";

  async function go(e) {
    e.preventDefault();
    setState({ k: "busy", t: "جاري التحقق من الكود..." });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, deviceId: deviceId() }),
      });
      const j = await res.json();
      if (res.ok) {
        setState({ k: "ok", t: "تم تسجيل الدخول بنجاح ✅" });
        router.replace("/");
        router.refresh();
        return;
      }
      if (j.expired) {
        router.replace("/expired");
        return;
      }
      setState({ k: "bad", t: j.error || "حصل خطأ، حاول تاني" });
    } catch {
      setState({ k: "bad", t: "مشكلة في الاتصال بالإنترنت" });
    }
  }

  return (
    <div className="stack wide" style={{ width: "100%" }}>
      <div className="card panel" style={{ padding: 28 }}>
        {children}
        <form onSubmit={go} style={{ marginTop: 26 }}>
          <div className="field">
            <label htmlFor="code">كود الطالب</label>
            <input
              id="code"
              className="input code-input"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              placeholder="مثال: 12345678"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <button className="btn btn-primary block" disabled={busy || code.length !== 8}>
            {busy ? "جاري الدخول..." : "سجل دخول"}
          </button>
        </form>
        <p className="sub-link tc">
          لسه ما اشتركتش؟ <Link href="/subscribe">اعرف خطوات الاشتراك من هنا</Link>
        </p>
      </div>

      <div className="card panel" style={{ padding: 28 }}>
        <h2>حالة الدخول</h2>
        <p className="muted" style={{ marginTop: 6 }}>هتلاقي هنا نتيجة تسجيل الدخول بعد ما تكتب الكود وتتأكد منه.</p>
        <div className="status-item">
          <span className={"dot " + (state.k === "idle" ? "" : state.k)} />
          <span>{state.t}</span>
        </div>
      </div>
    </div>
  );
}
