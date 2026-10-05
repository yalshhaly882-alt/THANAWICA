"use client";
import { useState } from "react";

export default function PlanTabs({ plans }) {
  const [i, setI] = useState(0);
  if (!plans.length) return <div className="empty">تفاصيل الأسعار هتتضاف قريب. تواصل مع الدعم الفني تحت.</div>;
  const p = plans[i] || plans[0];

  return (
    <>
      {plans.length > 1 && (
        <div className="seg" role="tablist">
          {plans.map((x, k) => (
            <button key={x.id} role="tab" aria-selected={k === i} className={k === i ? "on" : ""} onClick={() => setI(k)}>
              {x.name}
            </button>
          ))}
        </div>
      )}

      <div>
        <p className="plan-desc">
          اشتراك {p.name} الشهري {p.price} جنيه بيشمل كل المواد، جميع المدرسين، الملفات، والاختبارات.
        </p>
        <p className="kicker" style={{ fontWeight: 800 }}>تجربة مجانية لمدة ساعة متاحة الآن ❤️</p>
      </div>

      <section className="card panel">
        <h2>خطوات الاشتراك</h2>
        <ol className="steps">
          <li><span className="step-n">1</span><span>راجع نوع الاشتراك والسعر ({p.name} — {p.price} ج.م).</span></li>
          <li><span className="step-n">2</span><span>تواصل مع الدعم الفني على تليجرام.</span></li>
          <li><span className="step-n">3</span><span>ابعت بياناتك (الاسم , الشعبة , طريقة الدفع).</span></li>
          <li><span className="step-n">4</span><span>بعد تأكيد الدفع، هيوصلك كود الطالب المكون من 8 أرقام عشان تدخل بيه.</span></li>
        </ol>
      </section>
    </>
  );
}
