import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    const doc = await db
      .collection("staff")
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

    const allowed = [
      "name", "nickname", "role", "lineUserId", "email", "phone", "active",
    ];
    const updates: any = { updatedAt: new Date() };
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // lineUserId uniqueness check (if changing it)
    if (updates.lineUserId) {
      const existing = await db
        .collection("staff")
        .findOne({
          lineUserId: updates.lineUserId,
          _id: { $ne: new ObjectId(id) },
        });
      if (existing) {
        return NextResponse.json(
          { error: "lineUserId already linked to another staff" },
          { status: 409 }
        );
      }
    }

    await db
      .collection("staff")
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
    await db.collection("staff").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
