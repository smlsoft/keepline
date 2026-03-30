import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const body = await request.json();
    const period = body.period;

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: "period ต้องอยู่ในรูปแบบ YYYY-MM" },
        { status: 400 }
      );
    }

    const [existing, customers, deadlines] = await Promise.all([
      db.collection("work_items").countDocuments({ period }),
      db.collection("customers").find({ status: { $ne: "inactive" } }).toArray(),
      db.collection("tax_deadlines").find({}).sort({ dayOfMonth: 1 }).toArray(),
    ]);

    if (existing > 0) {
      return NextResponse.json(
        { error: "เดือนนี้สร้างงานแล้ว", count: existing },
        { status: 409 }
      );
    }

    if (deadlines.length === 0) {
      return NextResponse.json(
        { error: "ยังไม่มีข้อมูลกำหนดภาษี กรุณาเพิ่มข้อมูลก่อน" },
        { status: 400 }
      );
    }

    const [year, month] = period.split("-").map(Number);
    const workItems: any[] = [];

    for (const customer of customers) {
      const pkgs = customer.servicePackages || customer.taxTypes || [];
      if (!Array.isArray(pkgs) || pkgs.length === 0) continue;

      for (const pkg of pkgs) {
        const deadlineName = typeof pkg === "string" ? pkg : pkg.name || pkg.deadlineName;
        if (!deadlineName) continue;

        const deadline = deadlines.find(
          (d) => d.name === deadlineName || d.code === deadlineName
        );
        const dayOfMonth = deadline?.dayOfMonth || 15;
        const dueDate = new Date(year, month - 1, dayOfMonth);

        workItems.push({
          period,
          customerId: customer._id.toString(),
          customerName: customer.name || customer.customerName || "",
          deadlineName: deadline?.name || deadlineName,
          deadlineCode: deadline?.code || deadlineName,
          dueDate,
          status: "pending",
          assignee: customer.assignee || customer.staff || "",
          notes: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    if (workItems.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบลูกค้าที่มีแพ็คเกจบริการ", count: 0 },
        { status: 200 }
      );
    }

    await db.collection("work_items").insertMany(workItems);
    return NextResponse.json({ count: workItems.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
