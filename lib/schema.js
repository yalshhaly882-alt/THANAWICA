// وصف كل الجداول اللي بتتحكم فيها من لوحة التحكم (بيستخدمه السيرفر والواجهة)
const name = { k: "name", l: "الاسم", t: "text", req: true };
const image = { k: "imageUrl", l: "رابط الصورة", t: "url" };
const order = { k: "order", l: "الترتيب (رقم)", t: "number", def: 1 };

export const SCHEMA = {
  divisions: {
    label: "الشعب",
    one: "شعبة",
    parent: null,
    fields: [{ ...name, l: "اسم الشعبة (مثال: علمي علوم، أدبي، بكالوريا - مسار طب)" }, order],
  },
  years: {
    label: "السنين",
    one: "سنة",
    parent: { col: "divisions", fk: "divisionId", l: "الشعبة" },
    fields: [{ ...name, l: "اسم السنة (مثال: 2027)" }, image, order],
  },
  subjects: {
    label: "المواد",
    one: "مادة",
    parent: { col: "years", fk: "yearId", l: "السنة" },
    fields: [{ ...name, l: "اسم المادة" }, image, order],
  },
  teachers: {
    label: "المدرسين",
    one: "مدرس",
    parent: { col: "subjects", fk: "subjectId", l: "المادة" },
    fields: [{ ...name, l: "اسم المدرس" }, image, order],
  },
  chapters: {
    label: "الفصول",
    one: "فصل",
    parent: { col: "teachers", fk: "teacherId", l: "المدرس" },
    fields: [{ ...name, l: "اسم الفصل (مثال: الشهر الأول)" }, image, order],
  },
  lectures: {
    label: "المحاضرات",
    one: "محاضرة",
    parent: { col: "chapters", fk: "chapterId", l: "الفصل" },
    fields: [
      { ...name, l: "اسم المحاضرة" },
      image,
      order,
      {
        k: "videos",
        l: "الفيديوهات",
        t: "list",
        add: "إضافة فيديو",
        item: [
          { k: "title", l: "عنوان الفيديو", t: "text" },
          { k: "url", l: "رابط الفيديو (يوتيوب / Vimeo / mp4 / m3u8 / رابط embed)", t: "url" },
          { k: "duration", l: "المدة (مثال: 43 دقيقة)", t: "text" },
        ],
      },
      {
        k: "files",
        l: "ملفات المحاضرة (PDF)",
        t: "list",
        add: "إضافة ملف",
        item: [
          { k: "title", l: "اسم الملف", t: "text" },
          { k: "url", l: "رابط الملف", t: "url" },
        ],
      },
    ],
  },
  exams: {
    label: "الامتحانات",
    one: "امتحان",
    parent: { col: "lectures", fk: "lectureId", l: "المحاضرة" },
    fields: [
      { k: "title", l: "عنوان الامتحان", t: "text", req: true },
      { k: "durationMin", l: "مدة الامتحان بالدقائق", t: "number", def: 60 },
      { k: "maxAttempts", l: "عدد المحاولات المسموحة", t: "number", def: 5 },
      { k: "showAnswers", l: "إظهار الإجابات الصحيحة بعد التسليم", t: "checkbox", def: true },
      {
        k: "questions",
        l: "الأسئلة",
        t: "list",
        add: "إضافة سؤال",
        item: [
          { k: "imageUrl", l: "رابط صورة السؤال", t: "url" },
          { k: "text", l: "نص السؤال (اختياري)", t: "textarea" },
          { k: "choices", l: "الاختيارات (كل اختيار في سطر — اتركها فاضية لو الاختيارات جوه الصورة)", t: "lines" },
          { k: "choicesCount", l: "عدد الاختيارات (لو الاختيارات جوه الصورة)", t: "number", def: 4 },
          { k: "correct", l: "رقم الإجابة الصحيحة (1 = أول اختيار / أ)", t: "number", def: 1 },
        ],
      },
    ],
  },
  support: {
    label: "الدعم الفني",
    one: "حساب دعم",
    parent: null,
    fields: [
      { k: "name", l: "الاسم الظاهر للطالب (مثال: DR Youssef)", t: "text", req: true },
      { k: "telegram", l: "يوزر تليجرام (بدون @) أو رابط الحساب", t: "text", req: true },
      { k: "order", l: "الترتيب (رقم)", t: "number", def: 1 },
    ],
  },
  plans: {
    label: "خطط الاشتراك",
    one: "خطة",
    parent: null,
    fields: [
      { k: "name", l: "اسم الخطة (مثال: تالتة ثانوي، بكالوريا)", t: "text", req: true },
      { k: "price", l: "السعر الشهري بالجنيه", t: "number", def: 200 },
      { k: "order", l: "الترتيب (رقم)", t: "number", def: 1 },
    ],
  },
};

export const COLS = Object.keys(SCHEMA);

export function defaults(fields) {
  const o = {};
  for (const f of fields) {
    o[f.k] = f.t === "list" ? [] : f.t === "checkbox" ? f.def ?? false : f.def ?? "";
  }
  return o;
}

const okUrl = (s) => (/^https?:\/\//i.test(s) ? s : "");

function cleanVal(f, v) {
  switch (f.t) {
    case "number": {
      const n = Number(v);
      return v !== "" && v != null && Number.isFinite(n) ? n : f.def ?? 0;
    }
    case "checkbox":
      return !!v;
    case "list":
      return (Array.isArray(v) ? v : []).slice(0, 500).map((it) => clean(f.item, it || {}));
    case "lines":
      return (Array.isArray(v) ? v : String(v ?? "").split("\n"))
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 10);
    case "textarea":
      return String(v ?? "").slice(0, 5000);
    case "url":
      return okUrl(String(v ?? "").trim().slice(0, 2000));
    default:
      return String(v ?? "").trim().slice(0, 500);
  }
}

export function clean(fields, body) {
  const out = {};
  for (const f of fields) out[f.k] = cleanVal(f, body[f.k]);
  return out;
}
