import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const { period } = await request.json();

    if (!period) {
      return NextResponse.json(
        { error: "period is required (e.g. 2026-04)" },
        { status: 400 }
      );
    }

    const [customers, deadlines] = await Promise.all([
      db.collection("customer_services").find({ status: "active" }).toArray(),
      db.collection("tax_deadlines").find({ active: true }).toArray(),
    ]);

    const now = new Date();
    const periodParts = period.split("-").map(Number);
    const [periodYear, periodMonth] = periodParts;

    // Build all upsert operations first, then execute in bulk
    const ops: any[] = [];

    for (const cs of customers) {
      const activeServices: string[] = cs.services || [];

      for (const dl of deadlines) {
        const applicable: string[] = dl.applicableServices || [];
        if (!activeServices.some((s: string) => applicable.includes(s))) continue;

        let dueDate: Date;
        if (dl.frequency === "monthly" && dl.dueDayOfMonth) {
          const nextMonth = periodMonth + 1;
          const year = nextMonth > 12 ? periodYear + 1 : periodYear;
          const month = nextMonth > 12 ? 1 : nextMonth;
          dueDate = new Date(year, month - 1, dl.dueDayOfMonth);
        } else if (dl.fiscalYearEnd && dl.daysAfter != null) {
          const [feM, feD] = (dl.fiscalYearEnd as string).split("-").map(Number);
          const base = new Date(periodYear, feM - 1, feD);
          dueDate = new Date(base.getTime() + dl.daysAfter * 24 * 60 * 60 * 1000);
        } else {
          dueDate = new Date(periodYear, periodMonth, 0); // last day of period month
        }

        const status = dueDate < now ? "late" : "pending";

        ops.push({
          updateOne: {
            filter: {
              customerId: cs.customerId || cs._id.toString(),
              deadlineId: dl._id.toString(),
              period,
            },
            update: {
              $set: {
                customerName: cs.customerName || cs.name || "",
                deadlineName: dl.name || "",
                dueDate,
                assignedStaffId: cs.assignedStaffId || null,
                assignedStaffName: cs.assignedStaffName || "",
                updatedAt: now,
              },
              $setOnInsert: {
                status,
                notes: "",
                submittedAt: null,
                createdAt: now,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (ops.length > 0) {
      await db.collection("work_items").bulkWrite(ops);
    }

    return NextResponse.json({ generated: ops.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
