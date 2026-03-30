import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const withAvailable = searchParams.get("withAvailable") === "true";

    // Run both queries in parallel when withAvailable is requested
    const [staffDocs, customers] = await Promise.all([
      db.collection("staff").find().sort({ name: 1 }).toArray(),
      withAvailable
        ? db.collection("customers").find({ lineUserId: { $exists: true, $nin: [null, ""] } }).project({ name: 1, lineUserId: 1, avatarUrl: 1 }).sort({ name: 1 }).toArray()
        : Promise.resolve(null),
    ]);

    const staff = staffDocs.map((s) => ({ ...s, _id: s._id.toString() }));
    const result: any = { staff };

    if (customers) {
      const linkedIds = new Set(
        staffDocs.filter((s) => s.lineUserId).map((s) => s.lineUserId)
      );
      // ลูกค้าที่ยังไม่ได้เป็นพนักงาน — แสดงชื่อ + lineUserId ให้เลือก
      result.availableCustomers = customers
        .filter((c: any) => !linkedIds.has(c.lineUserId))
        .map((c: any) => ({ name: c.name, lineUserId: c.lineUserId, avatarUrl: c.avatarUrl }));
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // lineUserId must be unique if provided
    if (body.lineUserId) {
      const existing = await db
        .collection("staff")
        .findOne({ lineUserId: body.lineUserId });
      if (existing) {
        return NextResponse.json(
          { error: "lineUserId already linked to another staff" },
          { status: 409 }
        );
      }
    }

    const now = new Date();
    const doc = {
      name: body.name.trim(),
      nickname: body.nickname?.trim() || "",
      role: body.role || "other",
      lineUserId: body.lineUserId || null,
      email: body.email?.trim() || "",
      phone: body.phone?.trim() || "",
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("staff").insertOne(doc);
    return NextResponse.json({ _id: result.insertedId.toString(), ...doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
