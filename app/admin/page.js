import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import Panel from "./Panel";

export const metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return <Panel me={admin.username} owner={admin.owner} />;
}
