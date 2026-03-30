import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  VALID_STATUSES,
  sanitizeServices,
  computeTotalMonthlyFee,
} from "../shared";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    const doc = await db
      .collection("customer_services")
      .findOne({ _id: new ObjectId(id) });
    if (!doc) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ ...doc, _id: doc._id.toString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    const body = await request.json();

    const updates: any = { updatedAt: new Date() };

    if (body.services !== undefined) {
      updates.services = sanitizeServices(body.services);
      updates.totalMonthlyFee = computeTotalMonthlyFee(updates.services);
    }

    if (body.fiscalYearEnd !== undefined) {
      updates.fiscalYearEnd = body.fiscalYearEnd;
    }
    if (body.status !== undefined && VALID_STATUSES.includes(body.status)) {
      updates.status = body.status;
    }
    if (body.assignedStaffId !== undefined) {
      updates.assignedStaffId = body.assignedStaffId || null;
    }
    if (body.assignedStaffName !== undefined) {
      updates.assignedStaffName = body.assignedStaffName;
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }
    if (body.customerName !== undefined) {
      updates.customerName = body.customerName;
    }

    await db
      .collection("customer_services")
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
      .collection("customer_services")
      .deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
