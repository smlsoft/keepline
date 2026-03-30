import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);

    const filter: Record<string, string> = {};
    for (const key of ["period", "customerId", "status", "deadlineId", "assignedStaffId"]) {
      const val = searchParams.get(key);
      if (val) filter[key] = val;
    }

    const items = await db
      .collection("work_items")
      .find(filter)
      .sort({ dueDate: 1 })
      .toArray();

    return NextResponse.json(
      items.map((i) => ({ ...i, _id: i._id.toString() }))
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const body = await request.json();

    const required = ["customerId", "deadlineName", "period", "dueDate"] as const;
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const dueDate = new Date(body.dueDate);
    const status = dueDate < now ? "late" : "pending";

    const item = {
      customerId: body.customerId,
      customerName: body.customerName || "",
      deadlineId: body.deadlineId || "",
      deadlineName: body.deadlineName,
      period: body.period,
      dueDate,
      status,
      assignedStaffId: body.assignedStaffId || null,
      assignedStaffName: body.assignedStaffName || "",
      notes: body.notes || "",
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("work_items").insertOne(item);
    return NextResponse.json({ _id: result.insertedId.toString(), ...item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
