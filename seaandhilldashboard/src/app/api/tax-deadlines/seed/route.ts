import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const TEMPLATES = [
  {
    name: "ภงด.1",
    description: "ภาษีหัก ณ ที่จ่าย เงินเดือนพนักงาน",
    type: "monthly",
    dueDayOfMonth: 7,
    applicableServices: ["withholding_tax", "payroll"],
    reminderDaysBefore: [3, 1],
  },
  {
    name: "ภงด.3",
    description: "ภาษีหัก ณ ที่จ่าย บุคคลธรรมดา",
    type: "monthly",
    dueDayOfMonth: 7,
    applicableServices: ["withholding_tax"],
    reminderDaysBefore: [3, 1],
  },
  {
    name: "ภงด.53",
    description: "ภาษีหัก ณ ที่จ่าย นิติบุคคล",
    type: "monthly",
    dueDayOfMonth: 7,
    applicableServices: ["withholding_tax"],
    reminderDaysBefore: [3, 1],
  },
  {
    name: "ภพ.30",
    description: "แบบแสดงรายการภาษีมูลค่าเพิ่ม",
    type: "monthly",
    dueDayOfMonth: 15,
    applicableServices: ["vat"],
    reminderDaysBefore: [3, 1],
  },
  {
    name: "ประกันสังคม",
    description: "นำส่งเงินสมทบประกันสังคม",
    type: "monthly",
    dueDayOfMonth: 15,
    applicableServices: ["social_security", "payroll"],
    reminderDaysBefore: [3, 1],
  },
  {
    name: "ภงด.50",
    description: "ภาษีเงินได้นิติบุคคลประจำปี",
    type: "periodic",
    relativeTo: "fiscal_year_end",
    daysAfter: 150,
    applicableServices: ["closing"],
    reminderDaysBefore: [30, 7, 1],
  },
  {
    name: "ภงด.51",
    description: "ภาษีเงินได้นิติบุคคลครึ่งปี",
    type: "periodic",
    relativeTo: "half_year",
    daysAfter: 60,
    applicableServices: ["closing"],
    reminderDaysBefore: [14, 3],
  },
  {
    name: "ปิดงบการเงิน",
    description: "จัดทำงบการเงินประจำปี",
    type: "periodic",
    relativeTo: "fiscal_year_end",
    daysAfter: 150,
    applicableServices: ["closing", "bookkeeping"],
    reminderDaysBefore: [30, 7],
  },
  {
    name: "ยื่นงบ DBD",
    description: "ยื่นงบการเงินต่อกรมพัฒนาธุรกิจการค้า",
    type: "periodic",
    relativeTo: "fiscal_year_end",
    daysAfter: 150,
    applicableServices: ["closing", "bookkeeping"],
    reminderDaysBefore: [30, 7],
  },
];

export async function POST() {
  try {
    const db = await getDB();
    const now = new Date();

    const ops = TEMPLATES.map((tmpl) => ({
      updateOne: {
        filter: { name: tmpl.name, isTemplate: true },
        update: {
          $set: { ...tmpl, isTemplate: true, active: true, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    }));

    const result = await db.collection("tax_deadlines").bulkWrite(ops);

    return NextResponse.json({
      status: "ok",
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      total: TEMPLATES.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
