"use client";

export default function LogoutButton({ url = "/api/auth/logout", to = "/login" }) {
  async function out() {
    await fetch(url, { method: "POST" });
    location.href = to;
  }
  return (
    <button className="btn btn-danger btn-sm" onClick={out}>
      تسجيل الخروج
    </button>
  );
}
