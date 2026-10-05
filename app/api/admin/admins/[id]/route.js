import { db } from "@/lib/firebase";
import { json, withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const DELETE = withAdmin(
  async (_req, { params }, admin) => {
    if (params.id === admin.id) return json({ error: "مينفعش تحذف حسابك" }, 400);
    await db().collection("admins").doc(params.id).delete();
    return json({ ok: true });
  },
  { ownerOnly: true }
);
