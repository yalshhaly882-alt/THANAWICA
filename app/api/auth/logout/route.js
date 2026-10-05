import { cookies } from "next/headers";
import { STUDENT_COOKIE } from "@/lib/auth";
import { json } from "@/lib/api";

export async function POST() {
  cookies().delete(STUDENT_COOKIE);
  return json({ ok: true });
}
