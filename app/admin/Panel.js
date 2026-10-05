"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SCHEMA, defaults } from "@/lib/schema";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";

const ALL = Object.keys(SCHEMA);
const TABS = [
  ["dashboard", "لوحة المعلومات"],
  ["codes", "المشتركين والأكواد"],
  ...ALL.map((c) => [c, SCHEMA[c].label]),
  ["admins", "الأدمنز"],
  ["settings", "الإعدادات"],
];

async function api(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) {
    location.href = "/admin/login";
    throw new Error("انتهت الجلسة");
  }
  if (!res.ok) throw new Error(j.error || "حصل خطأ");
  return j;
}

const fmt = (ms) => (ms ? new Date(ms).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }) : "—");

/* ---------------- الحقول ---------------- */
function Input({ f, v, set }) {
  if (f.t === "checkbox") {
    return (
      <label className="check field">
        <input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} /> {f.l}
      </label>
    );
  }
  const isArea = f.t === "textarea" || f.t === "lines";
  const val = f.t === "lines" && Array.isArray(v) ? v.join("\n") : v ?? "";
  return (
    <div className="field">
      <label>{f.l}</label>
      {isArea ? (
        <textarea className="input" value={val} onChange={(e) => set(e.target.value)} />
      ) : (
        <input
          className="input"
          type={f.t === "number" ? "number" : "text"}
          dir={f.t === "url" ? "ltr" : undefined}
          value={val}
          onChange={(e) => set(e.target.value)}
        />
      )}
      {f.k === "imageUrl" && v ? <img className="thumb" src={v} alt="" onError={(e) => (e.currentTarget.style.display = "none")} /> : null}
    </div>
  );
}

function ListEditor({ f, value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  const upd = (i, k, val) => onChange(list.map((it, j) => (j === i ? { ...it, [k]: val } : it)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const c = [...list];
    [c[i], c[j]] = [c[j], c[i]];
    onChange(c);
  };
  return (
    <div className="field">
      <label>{f.l} ({list.length})</label>
      {list.map((it, i) => (
        <div className="sub-card" key={i}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <b>#{i + 1}</b>
            <div className="actions" style={{ display: "flex", gap: 6 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => onChange(list.filter((_, j) => j !== i))}>حذف</button>
            </div>
          </div>
          {f.item.map((sf) => (
            <Input key={sf.k} f={sf} v={it[sf.k]} set={(val) => upd(i, sf.k, val)} />
          ))}
        </div>
      ))}
      <button type="button" className="btn btn-light btn-sm" onClick={() => onChange([...list, defaults(f.item)])}>
        + {f.add}
      </button>
    </div>
  );
}

/* ---------------- إدارة المحتوى ---------------- */
function EntityForm({ col, item, data, labelOf, onClose, onSaved }) {
  const sc = SCHEMA[col];
  const [v, setV] = useState(() => (item ? { ...defaults(sc.fields), ...item } : defaults(sc.fields)));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState(true);

  const parentOpts = useMemo(() => {
    if (!sc.parent) return [];
    return (data[sc.parent.col] || [])
      .map((p) => ({ id: p.id, label: labelOf(sc.parent.col, p.id) }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
  }, [data, sc, labelOf]);

  async function save() {
    setErr("");
    setBusy(true);
    try {
      if (item) await api(`/api/admin/${col}/${item.id}`, "PUT", v);
      else {
        const j = await api(`/api/admin/${col}`, "POST", { ...v, notify });
        if (j.push) alert(j.push.failed ? "اتحفظت المحاضرة لكن الإشعارات فشلت. راجع إعدادات Firebase." : `اتحفظت المحاضرة واتبعت إشعار لـ ${j.push.sent} جهاز.`);
      }
      await onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 16 }}>{item ? "تعديل" : "إضافة"} {sc.one}</h2>
        {sc.parent && (
          <div className="field">
            <label>{sc.parent.l}</label>
            <select className="input" value={v[sc.parent.fk] || ""} onChange={(e) => setV({ ...v, [sc.parent.fk]: e.target.value })}>
              <option value="">— اختر —</option>
              {parentOpts.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
        {sc.fields.map((f) =>
          f.t === "list" ? (
            <ListEditor key={f.k} f={f} value={v[f.k]} onChange={(val) => setV({ ...v, [f.k]: val })} />
          ) : (
            <Input key={f.k} f={f} v={v[f.k]} set={(val) => setV({ ...v, [f.k]: val })} />
          )
        )}
        {col === "lectures" && !item && (
          <label className="check field">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> إرسال إشعار للطلاب بالمحاضرة الجديدة
          </label>
        )}
        {err && <p className="err">{err}</p>}
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? "جاري الحفظ..." : "حفظ"}</button>
          <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function EntityTab({ col, data, labelOf, reload }) {
  const sc = SCHEMA[col];
  const [edit, setEdit] = useState(null); // null | "new" | item
  const [q, setQ] = useState("");
  const rows = useMemo(
    () =>
      (data[col] || [])
        .map((x) => ({ ...x, _label: labelOf(col, x.id) }))
        .filter((x) => x._label.includes(q))
        .sort((a, b) => a._label.localeCompare(b._label, "ar")),
    [data, col, q, labelOf]
  );

  async function del(x) {
    if (!confirm(`حذف "${x._label}" وكل اللي جواه؟ مينفعش تتراجع.`)) return;
    try {
      await api(`/api/admin/${col}/${x.id}`, "DELETE");
      await reload(ALL);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setEdit("new")}>+ إضافة {sc.one}</button>
        <input className="input" placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted">{rows.length} عنصر</span>
      </div>
      <div className="list">
        {rows.map((x) => (
          <div className="li" key={x.id}>
            <div className="row">
              {x.imageUrl && <img src={x.imageUrl} alt="" style={{ width: 54, height: 40, objectFit: "cover", borderRadius: 8 }} />}
              <div>
                <b>{x._label}</b>
                {col === "lectures" && <div className="muted">{(x.videos || []).length} فيديو · {(x.files || []).length} ملف</div>}
                {col === "exams" && <div className="muted">{x.durationMin} دقيقة · {(x.questions || []).length} سؤال</div>}
              </div>
            </div>
            <div className="actions">
              <button className="btn btn-light btn-sm" onClick={() => setEdit(x)}>تعديل</button>
              <button className="btn btn-danger btn-sm" onClick={() => del(x)}>حذف</button>
            </div>
          </div>
        ))}
        {!rows.length && <div className="empty">لسه مفيش {sc.label}. اضغط "إضافة".</div>}
      </div>
      {edit && (
        <EntityForm
          col={col}
          item={edit === "new" ? null : edit}
          data={data}
          labelOf={labelOf}
          onClose={() => setEdit(null)}
          onSaved={() => reload([col])}
        />
      )}
    </div>
  );
}

/* ---------------- لوحة المعلومات ---------------- */
function Bars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="bar-col" key={d.d} title={`${d.d}: ${d.n}`}>
          <span className="bar-n">{d.n || ""}</span>
          <div className="bar-fill" style={{ height: (d.n / max) * 100 + "%" }} />
          <span className="bar-l">{d.d.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardTab() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api("/api/admin/stats").then(setS).catch((e) => setErr(e.message));
  }, []);
  if (err) return <p className="err">{err}</p>;
  if (!s) return <p className="muted">جاري التحميل...</p>;
  const k = s.codes;
  const kp = [
    ["إجمالي الأكواد", k.total, ""],
    ["مشترك نشط", k.active, "ok"],
    ["منتهي", k.expired, "bad"],
    ["لم يُستخدم", k.new, "warn"],
    ["موقوف", k.blocked, ""],
    ["تجربة", k.trial, ""],
    ["شهري", k.monthly, ""],
  ];
  const c = s.content;
  const cont = [
    ["الشعب", c.divisions], ["السنين", c.years], ["المواد", c.subjects], ["المدرسين", c.teachers],
    ["الفصول", c.chapters], ["المحاضرات", c.lectures], ["الفيديوهات", c.videos], ["الملفات", c.files], ["الامتحانات", c.exams],
  ];
  return (
    <div className="stack">
      <div className="kpis">
        {kp.map(([l, n, cls]) => (
          <div className={"kpi " + cls} key={l}><b>{n}</b><span className="muted">{l}</span></div>
        ))}
      </div>

      <div className="two">
        <section className="card panel">
          <h2>التفعيلات آخر 14 يوم</h2>
          <Bars data={s.activationsByDay} />
        </section>
        <section className="card panel">
          <h2>الامتحانات المسلّمة آخر 14 يوم</h2>
          <Bars data={s.attemptsByDay} />
          <p className="muted" style={{ marginTop: 10 }}>
            إجمالي المحاولات: {s.attemptsTotal} · متوسط الدرجات: {s.avgPct === null ? "—" : s.avgPct + "%"}
          </p>
        </section>
      </div>

      <div className="two">
        <section className="card panel">
          <h2>الطلاب حسب الشعبة</h2>
          <div className="list" style={{ marginTop: 12 }}>
            {s.byDivision.map((d) => (
              <div className="li" key={d.id}>
                <b>{d.name}</b>
                <span className="muted">{d.active} نشط من {d.total}</span>
              </div>
            ))}
            {!s.byDivision.length && <div className="muted">لسه مفيش شعب.</div>}
          </div>
        </section>
        <section className="card panel">
          <h2>اشتراكات هتنتهي خلال 3 أيام</h2>
          <div className="list" style={{ marginTop: 12 }}>
            {s.expiringSoon.map((e) => (
              <div className="li" key={e.code}>
                <div className="row"><span className="mono">{e.code}</span><span className="muted">{e.name || "بدون اسم"}</span></div>
                <span className="muted">{fmt(e.expiresAt)}</span>
              </div>
            ))}
            {!s.expiringSoon.length && <div className="muted">مفيش اشتراكات قربت تخلص.</div>}
          </div>
        </section>
      </div>

      <section className="card panel">
        <h2>المحتوى</h2>
        <div className="kpis" style={{ marginTop: 12 }}>
          {cont.map(([l, n]) => (
            <div className="kpi" key={l}><b>{n}</b><span className="muted">{l}</span></div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- المشتركين والأكواد ---------------- */
function CodesTab({ data, labelOf }) {
  const [items, setItems] = useState([]);
  const [flt, setFlt] = useState("all");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [look, setLook] = useState("");
  const [gen, setGen] = useState({ type: "trial", count: 1, divisionId: "", name: "" });
  const [made, setMade] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const j = await api("/api/admin/codes");
    setItems(j.items);
  }, []);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const now = Date.now();
  const status = (c) => (c.blocked ? "blocked" : !c.activatedAt ? "new" : now < c.expiresAt ? "active" : "expired");
  const counts = items.reduce((o, c) => ((o[status(c)] = (o[status(c)] || 0) + 1), o), {});
  const rows = items.filter(
    (c) =>
      (flt === "all" || status(c) === flt) &&
      (type === "all" || c.type === type) &&
      (!q || c.code.includes(q) || (c.name || "").includes(q))
  );

  async function generate() {
    setErr("");
    setBusy(true);
    try {
      const j = await api("/api/admin/codes", "POST", gen);
      setMade(j.codes.map((c) => (gen.name.trim() ? `${gen.name.trim()} — ${c}` : c)));
      await load();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  async function act(c, action, extra = {}) {
    try {
      await api(`/api/admin/codes/${c.id}`, "PATCH", { action, ...extra });
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function del(c) {
    if (!confirm(`حذف الكود ${c.code}؟`)) return;
    await api(`/api/admin/codes/${c.id}`, "DELETE");
    await load();
  }

  const badge = { active: ["ok", "مشترك (نشط)"], expired: ["bad", "منتهي"], new: ["warn", "لم يُستخدم"], blocked: ["bad", "موقوف"] };
  const remaining = (c) => {
    const l = c.expiresAt - now;
    if (l <= 0) return "";
    const d = Math.floor(l / 86400000);
    const h = Math.floor((l % 86400000) / 3600000);
    const m = Math.floor((l % 3600000) / 60000);
    return d ? `باقي ${d} يوم و${h} ساعة` : h ? `باقي ${h} ساعة و${m} دقيقة` : `باقي ${m} دقيقة`;
  };
  const filters = [
    ["all", "الكل", items.length],
    ["active", "مشترك (نشط)", counts.active || 0],
    ["expired", "منتهي", counts.expired || 0],
    ["new", "لم يُستخدم", counts.new || 0],
    ["blocked", "موقوف", counts.blocked || 0],
  ];

  const found = look.trim()
    ? items.filter((c) => (c.name || "").toLowerCase().includes(look.trim().toLowerCase()) || c.code.includes(look.trim())).slice(0, 12)
    : [];
  const copy = (t) => navigator.clipboard && navigator.clipboard.writeText(t);

  return (
    <div className="stack">
      <section className="card panel">
        <h2>ابحث عن كود طالب</h2>
        <p className="muted" style={{ margin: "4px 0 12px" }}>اكتب اسم الطالب هيظهرلك الكود بتاعه.</p>
        <input className="input" placeholder="اكتب اسم الطالب..." value={look} onChange={(e) => setLook(e.target.value)} />
        {look.trim() && (
          <div className="list" style={{ marginTop: 12 }}>
            {found.map((c) => (
              <div className="li" key={c.id}>
                <div>
                  <b>{c.name || "بدون اسم"}</b>
                  <div className="muted">{data.divisions?.find((d) => d.id === c.divisionId)?.name || "—"} · {c.type === "trial" ? "تجربة" : "شهري"} · {badge[status(c)][1]}</div>
                </div>
                <div className="row">
                  <span className="mono" style={{ fontSize: "1.3rem" }}>{c.code}</span>
                  <button className="btn btn-light btn-sm" onClick={() => copy(c.code)}>نسخ</button>
                </div>
              </div>
            ))}
            {!found.length && <div className="empty">مفيش طالب بالاسم ده.</div>}
          </div>
        )}
      </section>

      <section className="card panel">
        <h2>توليد أكواد</h2>
        <div className="toolbar">
          <select className="input" style={{ maxWidth: 220 }} value={gen.type} onChange={(e) => setGen({ ...gen, type: e.target.value })}>
            <option value="trial">تجربة (ساعة واحدة)</option>
            <option value="monthly">اشتراك شهري (30 يوم)</option>
          </select>
          <select className="input" style={{ maxWidth: 220 }} value={gen.divisionId} onChange={(e) => setGen({ ...gen, divisionId: e.target.value })}>
            <option value="">— اختر الشعبة —</option>
            {(data.divisions || []).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input className="input" style={{ maxWidth: 110 }} type="number" min="1" max="100" value={gen.count} onChange={(e) => setGen({ ...gen, count: e.target.value })} title="العدد" />
          <input className="input" style={{ maxWidth: 200 }} placeholder="اسم الطالب" value={gen.name} onChange={(e) => setGen({ ...gen, name: e.target.value })} />
          <button className="btn btn-primary" disabled={busy || !gen.divisionId} onClick={generate}>{busy ? "..." : "توليد"}</button>
        </div>
        <p className="muted">مدة الكود بتبدأ من أول مرة الطالب يدخل بيه.</p>
        {err && <p className="err">{err}</p>}
        {made.length > 0 && (
          <div className="gen-box">
            <b>الأكواد اللي اتولدت:</b>
            <pre>{made.join("\n")}</pre>
            <button className="btn btn-light btn-sm" onClick={() => navigator.clipboard.writeText(made.join("\n"))}>نسخ الكل</button>
          </div>
        )}
      </section>

      <section className="card panel">
        <h2>المشتركين</h2>
        <div className="toolbar">
          {filters.map(([k, l, n]) => (
            <button key={k} className={"tab" + (flt === k ? " on" : "")} onClick={() => setFlt(k)}>{l} ({n})</button>
          ))}
        </div>
        <div className="toolbar">
          <input className="input" placeholder="بحث بالكود أو الاسم" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" style={{ maxWidth: 160 }} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">كل الأنواع</option>
            <option value="trial">تجربة</option>
            <option value="monthly">شهري</option>
          </select>
        </div>
        <div className="list">
          {rows.map((c) => {
            const s = status(c);
            return (
              <div className="li" key={c.id}>
                <div>
                  <div className="row" style={{ flexWrap: "wrap" }}>
                    <span className="mono">{c.code}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => copy(c.code)} title="نسخ الكود">نسخ</button>
                    <span className={"badge " + badge[s][0]}>{badge[s][1]}</span>
                    <span className="badge">{c.type === "trial" ? "تجربة" : "شهري"}</span>
                  </div>
                  <div className="muted">
                    {c.name || "بدون اسم"} · {data.divisions?.find((d) => d.id === c.divisionId)?.name || "—"}
                  </div>
                  <div className="muted">
                    {c.activatedAt ? `بدأ: ${fmt(c.activatedAt)} · ينتهي: ${fmt(c.expiresAt)} ${remaining(c)}` : "لم يُفعّل بعد"}
                    {c.deviceId ? " · 📱 مربوط بجهاز" : ""}
                  </div>
                </div>
                <div className="actions">
                  <button className="btn btn-light btn-sm" onClick={() => act(c, "extend", { days: 30 })}>تجديد 30 يوم</button>
                  <button className="btn btn-ghost btn-sm" disabled={!c.deviceId} onClick={() => confirm("إعادة تعيين الجهاز؟ الطالب هيسجل من جهاز جديد.") && act(c, "reset")}>تغيير الجهاز</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { const n = prompt("اسم الطالب:", c.name || ""); if (n !== null) act(c, "rename", { name: n }); }}>الاسم</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => act(c, c.blocked ? "unblock" : "block")}>{c.blocked ? "تفعيل" : "إيقاف"}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => del(c)}>حذف</button>
                </div>
              </div>
            );
          })}
          {!rows.length && <div className="empty">مفيش أكواد مطابقة.</div>}
        </div>
      </section>
    </div>
  );
}

/* ---------------- الأدمنز والإعدادات ---------------- */
function AdminsTab({ owner }) {
  const [items, setItems] = useState([]);
  const [f, setF] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const load = useCallback(async () => setItems((await api("/api/admin/admins")).items), []);
  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  async function add() {
    setErr("");
    try {
      await api("/api/admin/admins", "POST", f);
      setF({ username: "", password: "" });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }
  async function del(a) {
    if (!confirm(`حذف الأدمن ${a.username}؟`)) return;
    try {
      await api(`/api/admin/admins/${a.id}`, "DELETE");
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="stack">
      {owner && (
        <section className="card panel">
          <h2>إضافة أدمن</h2>
          <div className="toolbar">
            <input className="input" dir="ltr" placeholder="اسم المستخدم" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
            <input className="input" dir="ltr" type="password" placeholder="كلمة المرور (8+ حروف)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <button className="btn btn-primary" onClick={add}>إضافة</button>
          </div>
          {err && <p className="err">{err}</p>}
        </section>
      )}
      <section className="card panel">
        <h2>الأدمنز</h2>
        <div className="list">
          {items.map((a) => (
            <div className="li" key={a.id}>
              <div className="row">
                <b dir="ltr">{a.username}</b>
                <span className={"badge " + (a.role === "owner" ? "ok" : "")}>{a.role === "owner" ? "المالك" : "أدمن"}</span>
              </div>
              {owner && a.role !== "owner" && <button className="btn btn-danger btn-sm" onClick={() => del(a)}>حذف</button>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SettingsTab() {
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [msg, setMsg] = useState({ t: "", ok: false });

  async function save() {
    if (f.next !== f.again) return setMsg({ t: "كلمتين المرور الجديدتين مش متطابقتين", ok: false });
    try {
      await api("/api/admin/password", "POST", { current: f.current, next: f.next });
      setF({ current: "", next: "", again: "" });
      setMsg({ t: "تم تغيير كلمة المرور. باقي الأجهزة اتسجل خروجها.", ok: true });
    } catch (e) {
      setMsg({ t: e.message, ok: false });
    }
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <section className="card panel" style={{ maxWidth: 520 }}>
      <h2>تغيير كلمة مرور لوحة التحكم</h2>
      <div className="field" style={{ marginTop: 14 }}><label>كلمة المرور الحالية</label><input className="input" dir="ltr" type="password" value={f.current} onChange={set("current")} /></div>
      <div className="field"><label>كلمة المرور الجديدة</label><input className="input" dir="ltr" type="password" value={f.next} onChange={set("next")} /></div>
      <div className="field"><label>أعد كتابة الجديدة</label><input className="input" dir="ltr" type="password" value={f.again} onChange={set("again")} /></div>
      {msg.t && <p className={msg.ok ? "okmsg" : "err"}>{msg.t}</p>}
      <button className="btn btn-primary" disabled={!f.current || !f.next} onClick={save}>حفظ</button>
    </section>
  );
}

/* ---------------- اللوحة ---------------- */
export default function Panel({ me, owner }) {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState({});

  const reload = useCallback(async (cols) => {
    const out = {};
    await Promise.all(
      cols.map(async (c) => {
        out[c] = (await api("/api/admin/" + c)).items;
      })
    );
    setData((d) => ({ ...d, ...out }));
  }, []);

  useEffect(() => {
    reload(ALL).catch(() => {});
  }, [reload]);

  const labelOf = useMemo(() => {
    const maps = {};
    for (const c of ALL) maps[c] = Object.fromEntries((data[c] || []).map((x) => [x.id, x]));
    const f = (col, id) => {
      const x = maps[col]?.[id];
      if (!x) return "؟";
      const nm = x.name || x.title || "؟";
      const p = SCHEMA[col].parent;
      return p ? f(p.col, x[p.fk]) + " › " + nm : nm;
    };
    return f;
  }, [data]);

  return (
    <>
      <header className="topbar">
        <div className="container bar">
          <div className="row">
            <span className="brand">لوحة التحكم</span>
            <span className="muted" dir="ltr">{me}</span>
          </div>
          <div className="bar-actions">
            <ThemeToggle />
            <LogoutButton url="/api/admin/logout" to="/admin/login" />
          </div>
        </div>
      </header>
      <main className="container page">
        <div className="admin-tabs">
          {TABS.map(([k, l]) => (
            <button key={k} className={"tab" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        {tab === "dashboard" && <DashboardTab />}
        {tab === "codes" && <CodesTab data={data} labelOf={labelOf} />}
        {SCHEMA[tab] && <EntityTab key={tab} col={tab} data={data} labelOf={labelOf} reload={reload} />}
        {tab === "admins" && <AdminsTab owner={owner} />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </>
  );
}
