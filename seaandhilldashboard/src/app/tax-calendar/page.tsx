"use client";

import { useEffect, useState, useCallback } from "react";

interface WorkItem {
  _id: string;
  period: string;
  customerId: string;
  customerName: string;
  deadlineName: string;
  deadlineCode: string;
  dueDate: string;
  status: "pending" | "in_progress" | "submitted";
  assignee: string;
  notes: string;
}

const STATUS_CONFIG = {
  pending:     { label: "รอ",       color: "bg-gray-600/30 text-gray-300 border-gray-500/30" },
  in_progress: { label: "กำลังทำ",  color: "bg-blue-600/30 text-blue-300 border-blue-500/30" },
  submitted:   { label: "ยื่นแล้ว", color: "bg-emerald-600/30 text-emerald-300 border-emerald-500/30" },
};

const STATUS_CYCLE: Record<string, string> = {
  pending: "in_progress",
  in_progress: "submitted",
  submitted: "pending",
};

type FilterTab = "all" | "pending" | "in_progress" | "submitted" | "late";

const TABS: { key: FilterTab; label: string; cardBg: string }[] = [
  { key: "all",         label: "ทั้งหมด",    cardBg: "theme-bg-card border theme-border" },
  { key: "pending",     label: "รอดำเนินการ", cardBg: "bg-amber-900/30 border-amber-500/30" },
  { key: "in_progress", label: "กำลังทำ",     cardBg: "bg-blue-900/30 border-blue-500/30" },
  { key: "submitted",   label: "ยื่นแล้ว",    cardBg: "bg-emerald-900/30 border-emerald-500/30" },
  { key: "late",        label: "เลยกำหนด",   cardBg: "bg-red-900/30 border-red-500/30" },
];

const MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

function isLate(dueDate: string, status: string) {
  if (status === "submitted") return false;
  return new Date(dueDate) < new Date();
}

function formatDueDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function getCurrentPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function computeCounts(items: WorkItem[]) {
  const counts = { all: items.length, pending: 0, in_progress: 0, submitted: 0, late: 0 };
  for (const i of items) {
    if (i.status === "pending") counts.pending++;
    else if (i.status === "in_progress") counts.in_progress++;
    else if (i.status === "submitted") counts.submitted++;
    if (isLate(i.dueDate, i.status)) counts.late++;
  }
  return counts;
}

export default function TaxCalendarPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<FilterTab>("all");
  const [period, setPeriod] = useState(getCurrentPeriod);

  const [year, month] = period.split("-").map(Number);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/dashboard/api/work-items?period=${period}`);
      const d = await r.json();
      setItems(Array.isArray(d) ? d : []);
    } catch { setItems([]); }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const r = await fetch("/dashboard/api/work-items/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const d = await r.json();
      if (r.ok) await fetchItems();
      else alert(d.error || "เกิดข้อผิดพลาด");
    } catch { alert("เกิดข้อผิดพลาด"); }
    setGenerating(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetch(`/dashboard/api/work-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setItems((prev) =>
        prev.map((i) => i._id === id ? { ...i, status: newStatus as WorkItem["status"] } : i)
      );
    } catch {}
  };

  const counts = computeCounts(items);

  const filtered = items.filter((i) => {
    if (tab === "pending") return i.status === "pending";
    if (tab === "in_progress") return i.status === "in_progress";
    if (tab === "submitted") return i.status === "submitted";
    if (tab === "late") return isLate(i.dueDate, i.status);
    return true;
  });

  const grouped = new Map<string, { dueDate: string; items: WorkItem[] }>();
  for (const item of filtered) {
    const key = item.deadlineName || item.deadlineCode;
    if (!grouped.has(key)) {
      grouped.set(key, { dueDate: item.dueDate, items: [] });
    }
    grouped.get(key)!.items.push(item);
  }

  const changePeriod = (y: number, m: number) => {
    setPeriod(`${y}-${String(m).padStart(2, "0")}`);
  };

  if (loading) return (
    <div className="min-h-screen theme-bg flex items-center justify-center">
      <div className="theme-text-muted animate-pulse text-[15px]">กำลังโหลดปฏิทินภาษี...</div>
    </div>
  );

  return (
    <div className="min-h-screen theme-bg theme-text">
      <header className="border-b theme-border px-2 md:px-4 py-2 sticky top-0 z-10" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[17px] font-bold whitespace-nowrap">📅 ปฏิทินภาษี</h1>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            <select
              value={month}
              onChange={(e) => changePeriod(year, Number(e.target.value))}
              className="px-2 py-1 rounded-lg theme-bg-secondary border theme-border text-[13px] theme-text"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => changePeriod(Number(e.target.value), month)}
              className="px-2 py-1 rounded-lg theme-bg-secondary border theme-border text-[13px] theme-text"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y + 543}</option>
              ))}
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] font-medium rounded-lg transition whitespace-nowrap"
            >
              {generating ? "กำลังสร้าง..." : "🔄 สร้างงานเดือนนี้"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-2 md:p-4 pb-24 md:pb-4 space-y-2">
        {/* Summary cards */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, cardBg }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 min-w-0 px-2 py-1 rounded-xl border text-center transition ${cardBg} ${
                tab === key ? "ring-1 ring-white/30" : ""
              }`}
            >
              <div className={`text-[17px] font-bold ${key === "late" && counts[key] > 0 ? "text-red-400" : ""}`}>
                {counts[key]}
              </div>
              <div className="text-[11px] theme-text-muted truncate">{label}</div>
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1 rounded-lg text-[13px] font-medium transition ${
                tab === key
                  ? "bg-white text-black"
                  : "theme-bg-card border theme-border theme-text-secondary hover:opacity-80"
              } ${key === "late" && counts.late > 0 ? "!border-red-500/50 !text-red-400" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="text-center theme-text-muted py-12 rounded-xl border theme-border theme-bg-card">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-[15px]">ยังไม่มีงาน</p>
            <p className="text-[13px] mt-1">กดปุ่ม &lsquo;สร้างงานเดือนนี้&rsquo; เพื่อสร้างงานจากแพ็คเกจบริการลูกค้า</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] rounded-lg transition"
            >
              {generating ? "กำลังสร้าง..." : "🔄 สร้างงานเดือนนี้"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center theme-text-muted py-12 rounded-xl border theme-border theme-bg-card">
            <p className="text-[15px]">ไม่มีงานในหมวดนี้</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from(grouped.entries()).map(([deadlineName, group]) => (
              <div key={deadlineName} className="rounded-xl border theme-border overflow-hidden" style={{ background: "var(--bg-card)" }}>
                <div className="flex items-center justify-between px-2 py-1.5 border-b theme-border" style={{ background: "var(--bg-secondary, var(--bg-card))" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold">{deadlineName}</span>
                    <span className="text-[11px] theme-text-muted">
                      กำหนด {formatDueDate(group.dueDate)}
                    </span>
                  </div>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/10 theme-text-muted">
                    {group.items.length} ราย
                  </span>
                </div>

                <div className="divide-y theme-border">
                  {group.items.map((item) => {
                    const late = isLate(item.dueDate, item.status);
                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

                    return (
                      <div
                        key={item._id}
                        className={`flex items-center gap-1 px-2 py-1 ${late ? "bg-red-950/20" : ""}`}
                      >
                        <span className={`flex-1 min-w-0 truncate text-[13px] ${late ? "text-red-300" : ""}`}>
                          {item.customerName || "-"}
                        </span>

                        {item.assignee && (
                          <span className="text-[11px] theme-text-muted truncate max-w-[60px] hidden sm:inline">
                            {item.assignee}
                          </span>
                        )}

                        {late && (
                          <span className="text-[11px] px-1 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/30 font-medium whitespace-nowrap">
                            เลย
                          </span>
                        )}

                        <button
                          onClick={() => handleStatusChange(item._id, STATUS_CYCLE[item.status] || "pending")}
                          className={`text-[11px] px-1.5 py-0.5 rounded border font-medium transition hover:opacity-80 whitespace-nowrap ${cfg.color}`}
                          title={`เปลี่ยนเป็น: ${STATUS_CONFIG[STATUS_CYCLE[item.status] as keyof typeof STATUS_CONFIG]?.label || "รอ"}`}
                        >
                          {cfg.label}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
