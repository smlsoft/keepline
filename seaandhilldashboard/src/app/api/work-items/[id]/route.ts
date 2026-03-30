import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    const body = await request.json();

    const allowed = ["status", "assignedStaffId", "assignedStaffName", "notes"];
    const updates: Record<string, any> = { updatedAt: new Date() };

    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    // Handle submittedAt based on status change
    if (body.status === "submitted") {
      updates.submittedAt = new Date();
    } else if (body.status) {
      updates.submittedAt = null;
    }

    // Auto-detect late: if dueDate passed and status is still "pending"
    if (body.status === "pending") {
      const doc = await db
        .collection("work_items")
        .findOne({ _id: new ObjectId(id) });
      if (doc && doc.dueDate && new Date(doc.dueDate) < new Date()) {
        updates.status = "late";
      }
    }

    await db
      .collection("work_items")
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    await db.collection("work_items").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
