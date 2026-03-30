import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const DOCUMENT_TYPES: Record<string, string> = {
  payment_slip: "สลิปโอนเงิน",
  purchase_order: "ใบสั่งซื้อ (PO)",
  quotation: "ใบเสนอราคา",
  invoice: "ใบแจ้งหนี้/ใบกำกับภาษี",
  receipt: "ใบเสร็จรับเงิน",
  delivery_note: "ใบส่งของ/ใบรับของ",
  id_card: "บัตรประชาชน/Passport",
  business_doc: "เอกสารบริษัท",
  contract: "สัญญา/ข้อตกลง",
};

export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const period = searchParams.get("period");

    const filter: Record<string, string> = {};
    if (customerId) filter.customerId = customerId;
    if (period) filter.period = period;

    const checklists = await db
      .collection("document_checklists")
      .find(filter)
      .sort({ customerName: 1 })
      .toArray();

    return NextResponse.json(
      checklists.map((c) => ({ ...c, _id: c._id.toString() }))
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const body = await request.json();

    if (!body.customerId || !body.period) {
      return NextResponse.json(
        { error: "customerId and period are required" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}$/.test(body.period)) {
      return NextResponse.json(
        { error: "period must be YYYY-MM format" },
        { status: 400 }
      );
    }

    const items = Array.isArray(body.items)
      ? body.items.map((item: any) => ({
          documentType: item.documentType || "",
          label: item.label || DOCUMENT_TYPES[item.documentType] || "",
          required: item.required !== false,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          status: "waiting" as const,
          receivedAt: null,
          documentId: null,
          autoMatched: false,
          notes: item.notes || "",
        }))
      : Object.entries(DOCUMENT_TYPES).map(([type, label]) => ({
          documentType: type,
          label,
          required: true,
          dueDate: null,
          status: "waiting" as const,
          receivedAt: null,
          documentId: null,
          autoMatched: false,
          notes: "",
        }));

    const now = new Date();
    const checklist = {
      customerId: body.customerId,
      customerName: body.customerName || "",
      period: body.period,
      items,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("document_checklists")
      .insertOne(checklist);

    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...checklist,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "Checklist already exists for this customer and period" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
