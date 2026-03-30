import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const status = searchParams.get("status");

    const filter: any = {};
    if (period) filter.period = period;
    if (status && status !== "all") filter.status = status;

    const items = await db
      .collection("work_items")
      .find(filter)
      .sort({ dueDate: 1, customerName: 1 })
      .toArray();

    return NextResponse.json(
      items.map((i) => ({ ...i, _id: i._id.toString() }))
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
