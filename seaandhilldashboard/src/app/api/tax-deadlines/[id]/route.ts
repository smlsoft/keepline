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

    const allowed = [
      "name",
      "description",
      "type",
      "dueDayOfMonth",
      "relativeTo",
      "daysAfter",
      "fixedDate",
      "applicableServices",
      "reminderDaysBefore",
      "active",
    ];

    const updates: any = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "fixedDate") {
          updates[key] = body[key] ? new Date(body[key]) : null;
        } else {
          updates[key] = body[key];
        }
      }
    }

    await db
      .collection("tax_deadlines")
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
    await db
      .collection("tax_deadlines")
      .deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
