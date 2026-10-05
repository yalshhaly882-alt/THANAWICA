import Header from "@/components/Header";
import { SiteFooter } from "@/components/ui";
import { requireStudent } from "@/lib/auth";

export default async function StudentLayout({ children }) {
  const s = await requireStudent();
  return (
    <>
      <Header name={s.name || "طالب"} />
      <main className="container page">{children}</main>
      <SiteFooter />
    </>
  );
}
