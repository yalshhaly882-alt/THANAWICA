import { getAdmin } from "./auth";

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function withAdmin(fn, { ownerOnly = false } = {}) {
  return async (req, ctx) => {
    const admin = await getAdmin();
    if (!admin) return json({ error: "غير مصرح" }, 401);
    if (ownerOnly && !admin.owner) return json({ error: "الصلاحية دي للمالك بس" }, 403);
    try {
      return await fn(req, ctx, admin);
    } catch (e) {
      console.error(e);
      return json({ error: "حصل خطأ في السيرفر" }, 500);
    }
  };
}

export async function readBody(req) {
  try {
    return (await req.json()) || {};
  } catch {
    return {};
  }
}
