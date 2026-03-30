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

    const updates: any = { updatedAt: new Date() };
    if (body.status !== undefined) updates.status = body.status;
    if (body.assignee !== undefined) updates.assignee = body.assignee;
    if (body.notes !== undefined) updates.notes = body.notes;

    if (body.status === "submitted") {
      updates.submittedAt = new Date();
    }

    await db
      .collection("work_items")
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
