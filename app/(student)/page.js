import { requireStudent } from "@/lib/auth";
import { countBy, getDoc, listBy } from "@/lib/data";
import { Card, Empty, PageHead } from "@/components/ui";
import { BookIcon } from "@/components/icons";

export default async function Home() {
  const s = await requireStudent();
  const [div, years] = await Promise.all([
    getDoc("divisions", s.divisionId),
    s.divisionId ? listBy("years", "divisionId", s.divisionId) : [],
  ]);
  const counts = await Promise.all(years.map((y) => countBy("subjects", "yearId", y.id)));

  return (
    <>
      <PageHead
        center
        title={<>السنين المتاحة لشعبة <span className="accent">{div?.name}</span></>}
        sub="افتح السنة اللي هتذاكر فيها دلوقتي، وكل المدرسين والمحاضرات والواجبات بتاعتها هتكون قدامك على طول."
      />
      {years.length ? (
        <div className="grid">
          {years.map((y, i) => (
            <Card
              key={y.id}
              img={y.imageUrl}
              title={y.name}
              href={`/browse/year/${y.id}`}
              cta="عرض المواد"
              metaLabel="عدد المواد:"
              metaValue={`${counts[i]} مواد`}
              MetaIcon={BookIcon}
            />
          ))}
        </div>
      ) : (
        <Empty>لسه مفيش سنين متاحة. تابعنا قريب.</Empty>
      )}
    </>
  );
}
