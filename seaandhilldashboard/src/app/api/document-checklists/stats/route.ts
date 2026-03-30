import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDB();
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const checklists = await db
      .collection("document_checklists")
      .find({ period: currentPeriod })
      .toArray();

    let totalWaiting = 0;
    let totalOverdue = 0;
    let totalReceived = 0;
    const overdueCustomers: { name: string; count: number }[] = [];

    for (const cl of checklists) {
      let customerOverdue = 0;
      for (const item of cl.items || []) {
        if (item.status === "received") {
          totalReceived++;
        } else if (
          item.status === "waiting" &&
          item.dueDate &&
          new Date(item.dueDate) < now
        ) {
          totalOverdue++;
          customerOverdue++;
        } else if (item.status === "waiting") {
          totalWaiting++;
        } else if (item.status === "overdue") {
          totalOverdue++;
          customerOverdue++;
        }
      }
      if (customerOverdue > 0) {
        overdueCustomers.push({
          name: cl.customerName || cl.customerId,
          count: customerOverdue,
        });
      }
    }

    return NextResponse.json({
      period: currentPeriod,
      totalCustomers: checklists.length,
      totalWaiting,
      totalOverdue,
      totalReceived,
      overdueCustomers,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
