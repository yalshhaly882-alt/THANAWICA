import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { getDoc, listBy } from "@/lib/data";
import { BackLink, Empty, PageHead } from "@/components/ui";
import { CheckSquareIcon, ChevronIcon, ClockIcon, FileIcon, ListIcon, PlayIcon, VideoIcon } from "@/components/icons";

function Section({ icon, tone, title, sub, open = true, children }) {
  return (
    <details className="card panel" open={open}>
      <summary className="sec-head">
        <span className="sec-title">
          <span className={"sec-ic " + tone}>{icon}</span>
          <span>
            <h2>{title}</h2>
            <span className="muted">{sub}</span>
          </span>
        </span>
        <span className="chev accent"><ChevronIcon /></span>
      </summary>
      <div className="sec-body">{children}</div>
    </details>
  );
}

export default async function LecturePage({ params }) {
  await requireStudent();
  const lec = await getDoc("lectures", params.id);
  if (!lec) notFound();
  const chapter = await getDoc("chapters", lec.chapterId);
  const teacher = chapter && (await getDoc("teachers", chapter.teacherId));
  const subject = teacher && (await getDoc("subjects", teacher.subjectId));
  const exams = await listBy("exams", "lectureId", lec.id);
  const videos = lec.videos || [];
  const files = lec.files || [];

  return (
    <div className="stack">
      <div>
        <PageHead pills={[subject?.name, teacher?.name].filter(Boolean)} title={lec.name} sub="ابدأ مشاهدة محتوى المحاضرة وتابع الشرح خطوة بخطوة." />
        <BackLink href={`/browse/chapter/${lec.chapterId}`}>رجوع للمحاضرات</BackLink>
      </div>

      <Section icon={<VideoIcon />} tone="blue" title="الفيديوهات" sub={`${videos.length} فيديو متاح`}>
        {videos.map((v, i) => (
          <div className="entry" key={i}>
            <span className="tagline blue">فيديو #{i + 1}</span>
            <h3>{v.title}</h3>
            {v.duration && <div className="entry-meta"><span><ClockIcon />{v.duration}</span></div>}
            <Link className="btn btn-light block" href={`/lectures/${lec.id}/watch?v=${i}`}><span>تشغيل الفيديو</span><PlayIcon /></Link>
          </div>
        ))}
        {!videos.length && <Empty>مفيش فيديوهات للمحاضرة دي لسه.</Empty>}
      </Section>

      <Section icon={<FileIcon />} tone="red" title="ملفات المحاضرة" sub={`${files.length} ملف متاح`}>
        {files.map((f, i) => (
          <div className="entry" key={i}>
            <span className="tagline red">ملف #{i + 1}</span>
            <h3>{f.title}</h3>
            <div className="entry-actions">
              <a className="btn btn-light" href={f.url} target="_blank" rel="noopener noreferrer">فتح الملف</a>
              <a className="btn btn-dark" href={f.url} download target="_blank" rel="noopener noreferrer">تنزيل الملف</a>
            </div>
          </div>
        ))}
        {!files.length && <Empty>مفيش ملفات للمحاضرة دي.</Empty>}
      </Section>

      <Section icon={<CheckSquareIcon />} tone="amber" title="الامتحانات" sub={`${exams.length} امتحان متاح`}>
        {exams.map((e, i) => (
          <div className="entry" key={e.id}>
            <span className="tagline amber">امتحان#{i + 1}</span>
            <h3>{e.title}</h3>
            <div className="entry-meta">
              <span><ClockIcon />{e.durationMin} دقيقة</span>
              <span><ListIcon />{(e.questions || []).length} سؤال</span>
            </div>
            <Link className="btn btn-light block" href={`/exams/${e.id}`}>ابدأ الامتحان</Link>
          </div>
        ))}
        {!exams.length && <Empty>مفيش امتحانات للمحاضرة دي.</Empty>}
      </Section>
    </div>
  );
}
