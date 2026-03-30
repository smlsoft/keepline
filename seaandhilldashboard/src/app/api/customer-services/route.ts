import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  VALID_STATUSES,
  sanitizeServices,
  computeTotalMonthlyFee,
} from "./shared";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    const filter: any = {};
    if (customerId) filter.customerId = customerId;

    const records = await db
      .collection("customer_services")
      .find(filter)
      .sort({ customerName: 1 })
      .toArray();

    const items = records.map((r) => ({ ...r, _id: r._id.toString() }));

    return NextResponse.json({
      items,
      totalCount: items.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const body = await request.json();

    if (!body.customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    const customer = await db
      .collection("customers")
      .findOne({ _id: new ObjectId(body.customerId) });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const services = sanitizeServices(body.services);
    const status = VALID_STATUSES.includes(body.status) ? body.status : "active";

    const doc = {
      customerId: body.customerId,
      customerName:
        body.customerName ||
        [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
        "ไม่ระบุชื่อ",
      services,
      fiscalYearEnd: body.fiscalYearEnd || "12-31",
      status,
      totalMonthlyFee: computeTotalMonthlyFee(services),
      assignedStaffId: body.assignedStaffId || null,
      assignedStaffName: body.assignedStaffName || "",
      notes: body.notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("customer_services").insertOne(doc);
    return NextResponse.json({ _id: result.insertedId.toString(), ...doc });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "ลูกค้ารายนี้มีแพ็กเกจบริการอยู่แล้ว" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
