import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDB();
    const deadlines = await db
      .collection("tax_deadlines")
      .find()
      .sort({ type: 1, name: 1 })
      .toArray();

    return NextResponse.json(
      deadlines.map((d) => ({ ...d, _id: d._id.toString() }))
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const deadline = {
      name: body.name,
      description: body.description || "",
      type: body.type || "custom",
      dueDayOfMonth: body.dueDayOfMonth ?? null,
      relativeTo: body.relativeTo ?? null,
      daysAfter: body.daysAfter ?? null,
      fixedDate: body.fixedDate ? new Date(body.fixedDate) : null,
      applicableServices: body.applicableServices || [],
      reminderDaysBefore: body.reminderDaysBefore || [3, 1],
      active: body.active !== false,
      isTemplate: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("tax_deadlines").insertOne(deadline);
    return NextResponse.json({ _id: result.insertedId.toString(), ...deadline });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
