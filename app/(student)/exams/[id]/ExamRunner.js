"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowIcon, ClockIcon, ListCheckIcon } from "@/components/icons";

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];
const pad = (n) => String(n).padStart(2, "0");
const hms = (secs) => `${pad(Math.floor(secs / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}`;

export default function ExamRunner({ examId, title, durationMin, count, max, used, history, canStart, resume, backHref }) {
  const router = useRouter();
  const [phase, setPhase] = useState("intro");
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [cur, setCur] = useState(0);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const offset = useRef(0);
  const latest = useRef({});
  const sent = useRef(false);
  latest.current = { answers, data };

  async function start() {
    setErr("");
    setBusy(true);
    try {
      const r = await fetch(`/api/exams/${examId}/start`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || "حصل خطأ");
      } else {
        offset.current = j.now - Date.now();
        sent.current = false;
        setData(j);
        setAnswers({});
        setCur(0);
        setPhase("run");
      }
    } catch {
      setErr("مشكلة في الاتصال");
    }
    setBusy(false);
  }

  async function submit() {
    if (sent.current) return;
    sent.current = true;
    setBusy(true);
    const { answers: a, data: d } = latest.current;
    try {
      const r = await fetch(`/api/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: d.attemptId, answers: a }),
      });
      const j = await r.json();
      if (!r.ok) {
        sent.current = false;
        setErr(j.error || "تعذر التسليم، حاول تاني");
      } else {
        setResult(j);
        setPhase("done");
        router.refresh();
      }
    } catch {
      sent.current = false;
      setErr("مشكلة في الاتصال. اضغط تسليم تاني.");
    }
    setBusy(false);
  }

  useEffect(() => {
    if (phase !== "run" || !data) return;
    const tick = () => {
      const l = data.endsAt - (Date.now() + offset.current);
      setLeft(Math.max(0, l));
      if (l <= 0) submit();
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, data]);

  const head = (
    <section className="card panel">
      <h1 style={{ fontSize: "1.8rem" }}>{title}</h1>
      <div className="dur-pill"><ClockIcon />مدة الامتحان: {hms(durationMin * 60)}</div>
    </section>
  );

  /* ---------- قبل البداية ---------- */
  if (phase === "intro") {
    return (
      <div className="stack">
        <Link className="btn btn-ghost back" href={backHref} style={{ justifySelf: "start", marginBottom: 0 }}>
          <span>رجوع للمحاضرة</span><ArrowIcon />
        </Link>
        {head}
        <section className="card panel">
          <div className="row between">
            <h2>تاريخ المحاولات</h2>
            <span className="muted">{used}/{max}</span>
          </div>
          {history.length ? (
            <div className="list" style={{ marginTop: 14 }}>
              {history.map((a, i) => (
                <div className="li" key={i}>
                  <span className="muted">{a.at}</span>
                  <b>{a.score} / {a.total}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashed" style={{ marginTop: 14 }}>لسه مفيش محاولات سابقة</div>
          )}
        </section>
        <section className="card qcount">
          <div className="ic"><ListCheckIcon /></div>
          <p className="muted">عدد الأسئلة</p>
          <b>{count}</b>
        </section>
        {err && <p className="err">{err}</p>}
        <button className="btn btn-primary block big" disabled={!canStart || busy || !count} onClick={start}>
          <span>{canStart ? (resume ? "كمّل الامتحان" : "ابدأ الامتحان الآن") : "استنفدت كل المحاولات"}</span>
          <ArrowIcon />
        </button>
      </div>
    );
  }

  /* ---------- النتيجة ---------- */
  if (phase === "done" && result) {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className="stack">
        {head}
        <section className="card panel score">
          <p className="muted">نتيجتك</p>
          <div className="big-score">{result.score} / {result.total}</div>
          <p>{pct}%{result.late ? " — اتسلّم بعد انتهاء الوقت" : ""}</p>
        </section>
        {result.review && (
          <section className="card panel">
            <h2>نموذج التصحيح</h2>
            <div className="stack" style={{ marginTop: 14 }}>
              {data.questions.map((q, i) => {
                const rv = result.review[i];
                return (
                  <div key={i} className="sub-card">
                    <b>السؤال {i + 1} {rv.ok ? "✅" : "❌"}</b>
                    {q.imageUrl && <img className="q-img" src={q.imageUrl} alt="" />}
                    {q.text && <p>{q.text}</p>}
                    <div className="choices">
                      {Array.from({ length: q.count }).map((_, k) => (
                        <div key={k} className={"choice" + (k === rv.correct ? " right" : k === rv.yours ? " wrong" : "")}>
                          <b>{LETTERS[k]}</b>
                          <span>{q.choices[k] || ""}</span>
                          {k === rv.yours && <span className="muted"> (إجابتك)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        <Link className="btn btn-light" href={backHref}>رجوع للمحاضرة</Link>
      </div>
    );
  }

  /* ---------- أثناء الامتحان ---------- */
  const q = data.questions[cur];
  const total = data.questions.length;
  const answered = Object.keys(answers).length;
  const secs = Math.ceil(left / 1000);

  return (
    <div className="stack">
      <section className="card panel">
        <h1 style={{ fontSize: "1.8rem" }}>{title}</h1>
        <div className="dur-pill"><ClockIcon />مدة الامتحان: {hms(durationMin * 60)}</div>
        <div className="time-box">
          <div>
            <div className="lbl">الوقت المتبقي</div>
            <div className={"timer" + (left < 60000 ? " low" : "")}>{hms(secs)}</div>
          </div>
          <span className="accent"><ClockIcon /></span>
        </div>
      </section>

      <div className="exam-layout">
        <section className="card panel">
          <p className="muted">السؤال {cur + 1} من {total}</p>
          <hr className="divider" />
          {q.imageUrl && <img className="q-img" src={q.imageUrl} alt={`السؤال ${cur + 1}`} />}
          {q.text && <h3>{q.text}</h3>}
          <div className="choices">
            {Array.from({ length: q.count }).map((_, i) => (
              <button key={i} className={"choice" + (answers[cur] === i ? " on" : "")} onClick={() => setAnswers({ ...answers, [cur]: i })}>
                <b>{LETTERS[i]}</b>
                <span>{q.choices[i] || ""}</span>
              </button>
            ))}
          </div>
          <div className="row between" style={{ marginTop: 18 }}>
            <button className="btn btn-ghost" disabled={cur === 0} onClick={() => setCur(cur - 1)}>السابق</button>
            {cur < total - 1 ? (
              <button className="btn btn-primary" onClick={() => setCur(cur + 1)}>التالي</button>
            ) : (
              <button className="btn btn-primary" disabled={busy} onClick={() => confirm("تسليم الامتحان؟") && submit()}>تسليم الامتحان</button>
            )}
          </div>
          {err && <p className="err">{err}</p>}
        </section>

        <aside className="card panel">
          <h2>خريطة الأسئلة</h2>
          <p className="muted" style={{ margin: "4px 0 16px" }}>إجمالي الأسئلة: {total}</p>
          <div className="qmap">
            {data.questions.map((_, i) => (
              <button key={i} className={"qbtn" + (i === cur ? " cur" : answers[i] !== undefined ? " done" : "")} onClick={() => setCur(i)}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="rem">
            <div><span>المجاب عنها</span><b>{answered}</b></div>
            <div><span>المتبقي</span><b>{total - answered}</b></div>
          </div>
          <button className="btn btn-danger block" style={{ marginTop: 16 }} disabled={busy} onClick={() => confirm("تسليم الامتحان الآن؟") && submit()}>
            تسليم الامتحان
          </button>
        </aside>
      </div>
    </div>
  );
}
