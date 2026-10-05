import { redirect } from "next/navigation";
import MiniBar from "@/components/MiniBar";
import { getAdmin } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";

export const metadata = { title: "لوحة التحكم", robots: { index: false, follow: false } };

export default async function AdminLogin() {
  if (await getAdmin()) redirect("/admin");
  return (
    <>
      <MiniBar />
      <div className="center-wrap">
        <div className="card center-card">
          <h1>لوحة التحكم</h1>
          <p className="muted" style={{ marginTop: 8 }}>الدخول للأدمن فقط.</p>
          <AdminLoginForm />
        </div>
      </div>
    </>
  );
}
