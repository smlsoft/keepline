import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDB();
    const deadlines = await db
      .collection("tax_deadlines")
      .find({})
      .sort({ dayOfMonth: 1 })
      .toArray();

    return NextResponse.json(
      deadlines.map((d) => ({ ...d, _id: d._id.toString() }))
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
