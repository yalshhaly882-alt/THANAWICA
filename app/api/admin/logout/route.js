import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth";
import { json } from "@/lib/api";

export async function POST() {
  cookies().delete(ADMIN_COOKIE);
  return json({ ok: true });
}
