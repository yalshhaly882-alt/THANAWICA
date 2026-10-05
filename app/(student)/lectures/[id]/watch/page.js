import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { getDoc } from "@/lib/data";
import { BackLink } from "@/components/ui";
import Player from "@/components/Player";
import { ChevronIcon, FileIcon, PlayIcon } from "@/components/icons";

export default async function Watch({ params, searchParams }) {
  const s = await requireStudent();
  const lec = await getDoc("lectures", params.id);
  if (!lec) notFound();
  const videos = lec.videos || [];
  if (!videos.length) redirect(`/lectures/${lec.id}`);
  const files = lec.files || [];
  const i = Math.min(Math.max(parseInt(searchParams?.v) || 0, 0), videos.length - 1);
  const v = videos[i];

  const chapter = await getDoc("chapters", lec.chapterId);
  const teacher = chapter && (await getDoc("teachers", chapter.teacherId));

  return (
    <div className="stack">
      <BackLink href={`/lectures/${lec.id}`}>رجوع للمحاضرة</BackLink>

      <section className="card panel">
        <h2>محتويات المحاضرة</h2>
        <hr className="divider" />
        <details open>
          <summary className="sec-head">
            <span className="sec-title">
              <span className="sec-ic blue"><PlayIcon /></span>
              <span><h3>قائمة الفيديوهات</h3><span className="muted">{videos.length} فيديو</span></span>
            </span>
            <span className="chev accent"><ChevronIcon /></span>
          </summary>
          <div className="wlist">
            {videos.map((x, k) => (
              <Link key={k} href={`/lectures/${lec.id}/watch?v=${k}`} className={k === i ? "on" : ""}>
                <span className="num">{k + 1}</span>
                <span>
                  {k === i && <span className="cur">الحالي</span>}
                  <b>{x.title}</b>
                  {x.duration && <div className="muted">{x.duration}</div>}
                </span>
              </Link>
            ))}
          </div>
        </details>

        {files.length > 0 && (
          <>
            <hr className="divider" />
            <details>
              <summary className="sec-head">
                <span className="sec-title">
                  <span className="sec-ic red"><FileIcon /></span>
                  <span><h3>ملفات المحاضرة</h3><span className="muted">{files.length} ملف متاح</span></span>
                </span>
                <span className="chev accent"><ChevronIcon /></span>
              </summary>
              <div className="wlist">
                {files.map((f, k) => (
                  <a key={k} href={f.url} target="_blank" rel="noopener noreferrer">
                    <span className="pdf">PDF</span>
                    <span><b>{f.title}</b><div className="muted">اضغط لفتح الملف</div></span>
                  </a>
                ))}
              </div>
            </details>
          </>
        )}
      </section>

      <section className="card panel">
        <h2>{v.title}</h2>
        <p className="muted">{lec.name}{chapter ? ` — ${chapter.name}` : ""}{teacher ? ` — ${teacher.name}` : ""}</p>
        <span className="pill" style={{ marginTop: 14 }}>الفيديو الحالي #{i + 1}</span>
        <hr className="divider" />
        <Player key={v.url} url={v.url} code={s.code} />
      </section>
    </div>
  );
}
