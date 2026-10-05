"use client";
import { useEffect, useState } from "react";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const VAPID = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const post = (url, method, body) =>
  fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function Switch({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={"switch" + (on ? " on" : "")} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

export default function NotifSettings({ catalog, mutedSubjects, mutedTeachers }) {
  const [supported, setSupported] = useState(true);
  const [deviceOn, setDeviceOn] = useState(false);
  const [ms, setMs] = useState(mutedSubjects);
  const [mt, setMt] = useState(mutedTeachers);
  const [open, setOpen] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = !!(cfg.apiKey && cfg.projectId && cfg.messagingSenderId && cfg.appId && VAPID);

  useEffect(() => {
    const ok = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (ok) setDeviceOn(localStorage.getItem("pushToken") !== null && Notification.permission === "granted");
  }, []);

  async function enable() {
    setMsg("");
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("denied");
      const { initializeApp, getApps } = await import("firebase/app");
      const { getMessaging, getToken } = await import("firebase/messaging");
      const app = getApps()[0] || initializeApp(cfg);
      const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js?" + new URLSearchParams(cfg).toString());
      await navigator.serviceWorker.ready;
      const token = await getToken(getMessaging(app), { vapidKey: VAPID, serviceWorkerRegistration: reg });
      if (!token) throw new Error("no token");
      const r = await post("/api/push/token", "POST", { token });
      if (!r.ok) throw new Error("save");
      localStorage.setItem("pushToken", token);
      setDeviceOn(true);
      setMsg("تم تفعيل الإشعارات على الجهاز ده ✅");
    } catch (e) {
      setMsg(e.message === "denied" ? "لازم تسمح بالإشعارات من إعدادات المتصفح الأول." : "تعذر تفعيل الإشعارات على الجهاز ده.");
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    const t = localStorage.getItem("pushToken");
    if (t) await post("/api/push/token", "DELETE", { token: t }).catch(() => {});
    localStorage.removeItem("pushToken");
    setDeviceOn(false);
    setMsg("اتوقفت إشعارات الجهاز.");
    setBusy(false);
  }

  async function save(nextS, nextT) {
    setMs(nextS);
    setMt(nextT);
    await post("/api/push/prefs", "POST", { mutedSubjects: nextS, mutedTeachers: nextT }).catch(() => {});
  }
  const flip = (arr, id, on) => (on ? arr.filter((x) => x !== id) : [...arr.filter((x) => x !== id), id]);

  return (
    <section className="card panel">
      <h2>إعدادات الإشعارات</h2>
      <p className="muted" style={{ margin: "6px 0 16px" }}>اختار المواد والمدرسين اللي عايز يوصلك منهم إشعار لما تنزل محاضرة جديدة.</p>

      <div className="li" style={{ marginBottom: 14 }}>
        <div>
          <b>إشعارات الجهاز</b>
          <div className="muted">
            {!supported
              ? "المتصفح ده مبيدعمش الإشعارات. على الآيفون ضيف الموقع للشاشة الرئيسية الأول."
              : !configured
              ? "الإشعارات لسه متفعلتش من الأدمن."
              : deviceOn
              ? "مفعّلة على المتصفح ده — بتوصلك حتى لو مش فاتح المنصة."
              : "فعّلها عشان توصلك حتى لو مش فاتح المنصة. على الآيفون لازم تضيف الموقع للشاشة الرئيسية أولاً."}
          </div>
        </div>
        {supported && configured && (
          <Switch on={deviceOn} onChange={(v) => (busy ? null : v ? enable() : disable())} label="إشعارات الجهاز" />
        )}
      </div>
      {msg && <p className={msg.includes("✅") ? "okmsg" : "err"}>{msg}</p>}

      <div className="list">
        {catalog.length === 0 && <div className="muted">مفيش مواد لسه.</div>}
        {catalog.map((s) => {
          const subjOn = !ms.includes(s.id);
          return (
            <div className="li" key={s.id} style={{ display: "block" }}>
              <div className="row between">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen({ ...open, [s.id]: !open[s.id] })} aria-expanded={!!open[s.id]}>
                  {open[s.id] ? "▲" : "▼"}
                </button>
                <div style={{ flex: 1 }}>
                  <b>{s.name}</b> <span className="muted">{s.year} · {s.teachers.length} مدرس</span>
                </div>
                <Switch on={subjOn} onChange={(v) => save(flip(ms, s.id, v), mt)} label={s.name} />
              </div>
              {open[s.id] && (
                <div className="list" style={{ marginTop: 12 }}>
                  {s.teachers.map((t) => (
                    <div className="row between" key={t.id} style={{ paddingInlineStart: 12 }}>
                      <span>{t.name}</span>
                      <Switch on={!mt.includes(t.id)} onChange={(v) => save(ms, flip(mt, t.id, v))} label={t.name} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
