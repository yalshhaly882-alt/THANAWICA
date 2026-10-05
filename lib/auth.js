import crypto from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./firebase";

export const STUDENT_COOKIE = "st_session";
export const ADMIN_COOKIE = "ad_session";
const YEAR = 365 * 24 * 3600 * 1000;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw new Error("SESSION_SECRET is missing or too short");
  return s;
}

export function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return body + "." + sig;
}

export function verify(token) {
  if (!token || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const exp = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(exp);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.exp && Date.now() > p.exp) return null;
    return p;
  } catch {
    return null;
  }
}

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString("hex");
  return salt + ":" + crypto.scryptSync(pw, salt, 64).toString("hex");
}

export function checkPassword(pw, stored) {
  try {
    const [salt, h] = String(stored).split(":");
    const x = crypto.scryptSync(pw, salt, 64);
    const y = Buffer.from(h, "hex");
    return x.length === y.length && crypto.timingSafeEqual(x, y);
  } catch {
    return false;
  }
}

export function cookieOpts(maxAgeMs) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

// ---------- الطالب ----------
export function studentToken(codeId, deviceId) {
  return sign({ sub: codeId, did: deviceId, exp: Date.now() + YEAR });
}

export const getStudent = cache(async () => {
  const p = verify(cookies().get(STUDENT_COOKIE)?.value);
  if (!p) return { status: "none" };
  const snap = await db().collection("codes").doc(p.sub).get();
  if (!snap.exists) return { status: "none" };
  const s = { id: snap.id, ...snap.data() };
  if (s.deviceId !== p.did) return { status: "none" }; // الأدمن عمل إعادة تعيين للجهاز
  if (s.blocked) return { status: "blocked", student: s };
  if (!s.expiresAt || Date.now() > s.expiresAt) return { status: "expired", student: s };
  return { status: "ok", student: s };
});

export async function requireStudent() {
  const r = await getStudent();
  if (r.status === "ok") return r.student;
  if (r.status === "expired") redirect("/expired");
  if (r.status === "blocked") redirect("/expired?b=1");
  redirect("/login");
}

// ---------- الأدمن ----------
export function adminToken(id, tv) {
  return sign({ sub: id, tv, role: "admin", exp: Date.now() + 7 * 24 * 3600 * 1000 });
}

export async function getAdmin() {
  const p = verify(cookies().get(ADMIN_COOKIE)?.value);
  if (!p || p.role !== "admin") return null;
  const snap = await db().collection("admins").doc(p.sub).get();
  if (!snap.exists) return null;
  const a = snap.data();
  if ((a.tokenVersion || 0) !== (p.tv || 0)) return null;
  return { id: snap.id, username: a.username, owner: a.role === "owner" };
}

// ---------- الحماية من التخمين ----------
export function clientIp(req) {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}

function rateRef(key) {
  return db().collection("rate").doc(key.replace(/[^\w.:-]/g, "_").slice(0, 200));
}

export async function isLocked(key, max, windowMs) {
  const s = await rateRef(key).get();
  if (!s.exists) return false;
  const d = s.data();
  return Date.now() - d.start <= windowMs && d.n >= max;
}

export async function registerFail(key, windowMs) {
  const ref = rateRef(key);
  await db().runTransaction(async (t) => {
    const s = await t.get(ref);
    const now = Date.now();
    let d = s.exists ? s.data() : { n: 0, start: now };
    if (now - d.start > windowMs) d = { n: 0, start: now };
    d.n += 1;
    t.set(ref, d);
  });
}

export async function clearFails(key) {
  await rateRef(key).delete().catch(() => {});
}
