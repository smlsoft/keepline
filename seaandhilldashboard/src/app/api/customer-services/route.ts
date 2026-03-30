import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    const customerId = request.nextUrl.searchParams.get("customerId");
    if (!customerId) {
      return NextResponse.json({ error: "customerId required" }, { status: 400 });
    }

    const doc = await db
      .collection("customer_services")
      .findOne({ customerId });

    return NextResponse.json(doc ? { ...doc, _id: doc._id.toString() } : null);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const body = await request.json();

    const doc = {
      customerId: body.customerId,
      customerName: body.customerName || "",
      services: body.services || [],
      fiscalYearEnd: body.fiscalYearEnd || "12-31",
      assignedStaffId: body.assignedStaffId || "",
      assignedStaffName: body.assignedStaffName || "",
      status: body.status || "active",
      notes: body.notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("customer_services").insertOne(doc);
    return NextResponse.json({ _id: result.insertedId.toString(), ...doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
