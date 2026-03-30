import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDB();

    // ดึงรายชื่อพนักงานจาก customers ที่มี assignedTo
    // หรือจาก collection staff ถ้ามี
    const collections = await db.listCollections({ name: "staff" }).toArray();

    if (collections.length > 0) {
      const staff = await db.collection("staff").find({}).sort({ name: 1 }).toArray();
      return NextResponse.json(staff.map((s) => ({ ...s, _id: s._id.toString() })));
    }

    // Fallback: ดึงชื่อจาก assignedTo ของ customers ทั้งหมด
    const results = await db.collection("customers").aggregate([
      { $unwind: "$assignedTo" },
      { $group: { _id: "$assignedTo" } },
      { $sort: { _id: 1 } },
    ]).toArray();

    return NextResponse.json(
      results.map((r, i) => ({ _id: String(i), name: r._id }))
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
