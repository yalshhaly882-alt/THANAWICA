import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { countBy, getDoc, listBy } from "@/lib/data";
import { BackLink, Card, Empty, PageHead } from "@/components/ui";
import { ArrowIcon, EditIcon, FileIcon, UserIcon, UsersIcon, VideoIcon } from "@/components/icons";

const CFG = {
  year: { col: "years", child: "subjects", fk: "yearId" },
  subject: { col: "subjects", child: "teachers", fk: "subjectId" },
  teacher: { col: "teachers", child: "chapters", fk: "teacherId" },
  chapter: { col: "chapters", child: "lectures", fk: "chapterId" },
};

export default async function Browse({ params }) {
  const s = await requireStudent();
  const L = CFG[params.level];
  if (!L) notFound();
  const parent = await getDoc(L.col, params.id);
  if (!parent) notFound();

  // نجيب السلسلة اللي فوق (وبنتأكد إن السنة تبع شعبة الطالب)
  let year, subject, teacher;
  if (params.level === "year") year = parent;
  if (params.level === "subject") {
    subject = parent;
    year = await getDoc("years", subject.yearId);
  }
  if (params.level === "teacher") {
    teacher = parent;
    subject = await getDoc("subjects", teacher.subjectId);
    year = subject && (await getDoc("years", subject.yearId));
  }
  if (params.level === "chapter") {
    teacher = await getDoc("teachers", parent.teacherId);
    subject = teacher && (await getDoc("subjects", teacher.subjectId));
    year = subject && (await getDoc("years", subject.yearId));
  }
  if (!year || year.divisionId !== s.divisionId) notFound();
  const div = params.level === "year" ? await getDoc("divisions", year.divisionId) : null;

  const items = await listBy(L.child, L.fk, parent.id);

  const H = {
    year: {
      pills: [`شعبة ${div?.name || ""}`],
      title: <>المواد الدراسية <span className="accent">{parent.name}</span></>,
      sub: "اختر المادة وابدأ رحلة التفوق مع نخبة من أفضل المدرسين في مصر.",
      back: ["/", "رجوع للسنين"],
    },
    subject: {
      pills: [parent.name],
      title: `مدرسين مادة ${parent.name}`,
      sub: "اختر المدرس المناسب ليك وابدأ ترتيب مذاكرتك بشكل أوضح.",
      back: [`/browse/year/${parent.yearId}`, "رجوع للمواد"],
    },
    teacher: {
      pills: [subject?.name],
      title: `فصول ${parent.name}`,
      sub: "شوف الفصول المتاحة، وابدأ مذاكرة بترتيب.",
      back: [`/browse/subject/${parent.subjectId}`, "رجوع للمدرسين"],
    },
    chapter: {
      pills: [subject?.name, teacher?.name],
      title: parent.name,
      sub: "اختر المحاضرة المناسبة وابدأ المشاهدة بالترتيب.",
      back: [`/browse/teacher/${parent.teacherId}`, "رجوع للفصول"],
    },
  }[params.level];

  let body;
  if (params.level === "year") {
    const n = await Promise.all(items.map((x) => countBy("teachers", "subjectId", x.id)));
    body = items.map((x, i) => (
      <Card key={x.id} img={x.imageUrl} title={x.name} badge={parent.name} href={`/browse/subject/${x.id}`} cta="شوف المدرسين" metaLabel="عدد المعلمين:" metaValue={`${n[i]} مُعلمين`} MetaIcon={UsersIcon} />
    ));
  } else if (params.level === "subject") {
    const n = await Promise.all(items.map((x) => countBy("chapters", "teacherId", x.id)));
    body = items.map((x, i) => (
      <Card key={x.id} img={x.imageUrl} title={x.name} badge="مدرس" href={`/browse/teacher/${x.id}`} cta="شوف الفصول" metaLabel="عدد الفصول:" metaValue={`${n[i]} فصول`} MetaIcon={EditIcon} />
    ));
  } else if (params.level === "teacher") {
    const n = await Promise.all(items.map((x) => countBy("lectures", "chapterId", x.id)));
    body = items.map((x, i) => (
      <div className="card chap" key={x.id}>
        <div className="chap-head">
          {x.imageUrl ? <img className="chap-thumb" src={x.imageUrl} alt="" loading="lazy" /> : <div className="chap-thumb" />}
          <div>
            <div className="chap-label">الفصل {x.order}</div>
            <h3>{x.name}</h3>
            <div className="chap-teacher"><UserIcon />{parent.name}</div>
          </div>
        </div>
        <div className="count-box"><span>عدد المحاضرات</span><span className="count-num">{n[i]}</span></div>
        <Link className="btn btn-light block" href={`/browse/chapter/${x.id}`}><span>مشاهدة المحاضرات</span><ArrowIcon /></Link>
      </div>
    ));
  } else {
    const n = await Promise.all(items.map((x) => countBy("exams", "lectureId", x.id)));
    body = items.map((x, i) => (
      <div className="card chap" key={x.id}>
        <div className="chap-head">
          {x.imageUrl ? <img className="chap-thumb" src={x.imageUrl} alt="" loading="lazy" /> : <div className="chap-thumb" />}
          <div>
            <div className="chap-label">المحاضرة {x.order}</div>
            <h3>{x.name}</h3>
          </div>
        </div>
        <div className="tiles">
          <div className="tile"><EditIcon /><b>{n[i]}</b>امتحان</div>
          <div className="tile"><FileIcon /><b>{(x.files || []).length}</b>ملفات</div>
          <div className="tile"><VideoIcon /><b>{(x.videos || []).length}</b>فيديو</div>
        </div>
        <Link className="btn btn-light block" href={`/lectures/${x.id}`}><span>مشاهدة المحاضرة</span><ArrowIcon /></Link>
      </div>
    ));
  }

  return (
    <>
      <PageHead pills={H.pills.filter(Boolean)} title={H.title} sub={H.sub} />
      <BackLink href={H.back[0]}>{H.back[1]}</BackLink>
      {items.length ? <div className="grid">{body}</div> : <Empty>لسه مفيش محتوى هنا.</Empty>}
    </>
  );
}
