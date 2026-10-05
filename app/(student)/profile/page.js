import { requireStudent } from "@/lib/auth";
import { getDoc } from "@/lib/data";
import { catalogFor } from "@/lib/catalog";
import { PageHead } from "@/components/ui";
import { CapIcon, KeyIcon, ShieldIcon, UserIcon } from "@/components/icons";
import NotifSettings from "./NotifSettings";
import CopyCode from "./CopyCode";

const TZ = "Africa/Cairo";
const L = "ar-EG-u-nu-latn";

export default async function Profile() {
  const s = await requireStudent();
  const [div, catalog] = await Promise.all([getDoc("divisions", s.divisionId), catalogFor(s.divisionId)]);
  const trial = s.type === "trial";
  const end = new Date(s.expiresAt);
  const day = end.toLocaleDateString(L, { timeZone: TZ, day: "numeric" });
  const month = end.toLocaleDateString(L, { timeZone: TZ, month: "long" });
  const year = end.toLocaleDateString(L, { timeZone: TZ, year: "numeric" });
  const time = end.toLocaleTimeString(L, { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className="stack">
      <PageHead title="ملفك الشخصي" sub="هويتك، حالة اشتراكك، وإعدادات الإشعارات — في مكان واحد واضح." />

      <section className="card panel">
        <div className="p-top">
          <span className="avatar lg">{(s.name || "ط").trim().charAt(0)}</span>
          <span className="badge line"><ShieldIcon />{trial ? "تجربة" : "اشتراك شهري"}</span>
          <h2>{s.name || "طالب"}</h2>
          <div className="sub"><CapIcon />{div?.name}</div>
        </div>
      </section>

      <section className="card panel">
        <h2 className="tc">{trial ? "مدة التجربة" : "مدة الاشتراك"}</h2>
        <p className="muted tc">ينتهي في</p>
        <div className="date3">
          <div><b>{day}</b><span>يوم</span></div>
          <div><b>{month}</b><span>شهر</span></div>
          <div><b>{year}</b><span>سنة</span></div>
        </div>
        <p className="tc muted">{time}</p>
        {trial && <span className="note-pill">تقدر ترقّي لاشتراك كامل في أي وقت.</span>}
      </section>

      <NotifSettings catalog={catalog} mutedSubjects={s.mutedSubjects || []} mutedTeachers={s.mutedTeachers || []} />

      <section className="card panel">
        <h2>تفاصيل الحساب</h2>
        <p className="muted" style={{ marginBottom: 12 }}>بيانات أساسية للرجوع ليها بسرعة.</p>
        <div className="info-row">
          <span className="lbl"><i><KeyIcon /></i>كود الطالب</span>
          <span className="row"><span className="mono">{s.code}</span><CopyCode value={s.code} /></span>
        </div>
        <div className="info-row">
          <span className="lbl"><i><UserIcon /></i>نوع الحساب</span>
          <b>{trial ? "تجربة" : "اشتراك شهري"}</b>
        </div>
        <div className="info-row">
          <span className="lbl"><i><ShieldIcon /></i>حالة الحساب</span>
          <span className="ok-text">مفعّل</span>
        </div>
      </section>
    </div>
  );
}
