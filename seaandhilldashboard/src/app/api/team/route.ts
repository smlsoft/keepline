import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDB } from "@/lib/mongodb";

export async function GET() {
  try {
    const user = await getAuthUser();
    const db = await getDB();

    // หา team — ถ้ามี user ให้หาจาก owner, ถ้าไม่มี (demo) ให้หา team แรก
    let team;
    if (user) {
      const emailDoc = await db.collection("user_emails").findOne({ email: user.email });
      if (emailDoc) {
        team = await db.collection("teams").findOne({ ownerId: emailDoc.userId });
      }
    }
    if (!team) {
      team = await db.collection("teams").findOne();
    }
    if (!team) return NextResponse.json({ members: [] });

    // ดึง team_members ทั้งหมดใน team
    const teamMembers = await db
      .collection("team_members")
      .find({ teamId: team._id })
      .toArray();

    // map member details — ใช้ข้อมูลจาก team_members ตรงๆ
    const memberDetails = teamMembers.map((m) => ({
      _id: m._id.toString(),
      userId: m.userId || "",
      email: m.email || "",
      name: m.name || "",
      image: "",
      role: m.role,
      addedAt: m.addedAt || m.joinedAt,
    }));

    return NextResponse.json({ members: memberDetails, teamId: team._id });
  } catch (err) {
    console.error("[GET /api/team]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
