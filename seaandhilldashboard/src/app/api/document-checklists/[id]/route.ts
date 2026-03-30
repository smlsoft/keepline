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

    if (body.itemIndex !== undefined) {
      const updates: Record<string, any> = { updatedAt: new Date() };
      const prefix = `items.${body.itemIndex}`;

      if (body.status !== undefined) updates[`${prefix}.status`] = body.status;
      if (body.documentId !== undefined)
        updates[`${prefix}.documentId`] = body.documentId;
      if (body.notes !== undefined) updates[`${prefix}.notes`] = body.notes;
      if (body.autoMatched !== undefined)
        updates[`${prefix}.autoMatched`] = body.autoMatched;
      if (body.dueDate !== undefined)
        updates[`${prefix}.dueDate`] = body.dueDate
          ? new Date(body.dueDate)
          : null;
      if (body.required !== undefined)
        updates[`${prefix}.required`] = body.required;

      if (body.status === "received") {
        updates[`${prefix}.receivedAt`] = new Date();
      }

      await db
        .collection("document_checklists")
        .updateOne({ _id: new ObjectId(id) }, { $set: updates });

      return NextResponse.json({ status: "ok" });
    }

    if (Array.isArray(body.items)) {
      await db.collection("document_checklists").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            items: body.items,
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({ status: "ok" });
    }

    return NextResponse.json(
      { error: "Provide itemIndex or items array" },
      { status: 400 }
    );
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
      .collection("document_checklists")
      .deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
