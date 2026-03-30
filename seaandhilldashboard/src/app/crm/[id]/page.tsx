"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Customer {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
  lineId?: string;
  address?: string;
  notes?: string;
  avatarUrl?: string;
  tags: string[];
  customTags?: string[];
  rooms: string[];
  groups?: { sourceId: string; groupName: string; messageCount: number; lastActiveAt: string }[];
  lineUserId?: string;
  totalMessages: number;
  pipelineStage: string;
  lastSentiment: { score: number; level: string; reason?: string } | null;
  lastPurchaseIntent: { score: number; level: string; reason?: string } | null;
  dealValue?: number;
  expectedCloseDate?: string;
  winLossReason?: string;
  assignedTo?: string[];
  createdAt: string;
  updatedAt: string;
}

function formatTHB(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

const STAGES: Record<string, { label: string; color: string; icon: string }> = {
  new: { label: "ใหม่", color: "bg-gray-500", icon: "🆕" },
  interested: { label: "สนใจ", color: "bg-blue-500", icon: "👀" },
  quoting: { label: "เสนอราคา", color: "bg-purple-500", icon: "💰" },
  negotiating: { label: "ต่อรอง", color: "bg-amber-500", icon: "🤝" },
  closed_won: { label: "ปิดการขาย", color: "bg-emerald-500", icon: "✅" },
  closed_lost: { label: "ไม่ซื้อ", color: "bg-red-500", icon: "❌" },
  following_up: { label: "ติดตาม", color: "bg-cyan-500", icon: "📞" },
};

const SL: Record<string, string> = { green: "ปกติ", yellow: "ติดตาม", red: "ไม่พอใจ" };
const PL: Record<string, string> = { green: "ไม่สนใจ", yellow: "เริ่มสนใจ", red: "สนใจซื้อ!" };

const SERVICE_TYPES = [
  { key: "bookkeeping", label: "ทำบัญชีรายเดือน" },
  { key: "vat", label: "ยื่น VAT (ภพ.30)" },
  { key: "withholding_tax", label: "ภาษีหัก ณ ที่จ่าย (ภงด.1/3/53)" },
  { key: "payroll", label: "ทำเงินเดือน" },
  { key: "social_security", label: "ประกันสังคม" },
  { key: "closing", label: "ปิดงบการเงิน" },
  { key: "audit", label: "ตรวจสอบบัญชี" },
  { key: "internal_audit", label: "ตรวจสอบภายใน" },
  { key: "registration", label: "จดทะเบียนบริษัท" },
];

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const SERVICE_STATUS_OPTIONS = [
  { value: "active", label: "ใช้งาน", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "paused", label: "หยุดชั่วคราว", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "cancelled", label: "ยกเลิก", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

interface ServiceItem {
  key: string;
  label: string;
  enabled: boolean;
  monthlyFee: number;
}

interface CustomerServiceDoc {
  _id?: string;
  customerId: string;
  customerName: string;
  services: ServiceItem[];
  fiscalYearEnd: string;
  assignedStaffId: string;
  assignedStaffName: string;
  status: string;
  notes: string;
}

interface StaffMember {
  _id: string;
  name: string;
}

function Badge({ level, label }: { level: string; label: string }) {
  const colors: Record<string, string> = {
    green: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    yellow: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[13px] font-medium border ${colors[level] || colors.green}`}>{label}</span>;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [customTags, setCustomTags] = useState("");
  const [assignInput, setAssignInput] = useState("");
  // Deal fields
  const [dealValue, setDealValue] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [winLossReason, setWinLossReason] = useState("");
  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskSaved, setTaskSaved] = useState(false);
  // Service packages
  const [svcDoc, setSvcDoc] = useState<CustomerServiceDoc | null>(null);
  const [svcLoading, setSvcLoading] = useState(true);
  const [showSvcModal, setShowSvcModal] = useState(false);
  const [svcForm, setSvcForm] = useState<ServiceItem[]>(
    SERVICE_TYPES.map((s) => ({ ...s, enabled: false, monthlyFee: 0 }))
  );
  const [svcFiscalMonth, setSvcFiscalMonth] = useState(12);
  const [svcFiscalDay, setSvcFiscalDay] = useState(31);
  const [svcStaffId, setSvcStaffId] = useState("");
  const [svcStaffName, setSvcStaffName] = useState("");
  const [svcStatus, setSvcStatus] = useState("active");
  const [svcNotes, setSvcNotes] = useState("");
  const [svcSaving, setSvcSaving] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  useEffect(() => {
    fetch(`/dashboard/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d._id) {
          setCustomer(d);
          setFirstName(d.firstName || "");
          setLastName(d.lastName || "");
          setCompany(d.company || "");
          setPosition(d.position || "");
          setPhone(d.phone || "");
          setEmail(d.email || "");
          setLineId(d.lineId || "");
          setAddress(d.address || "");
          setNotes(d.notes || "");
          setAvatarUrl(d.avatarUrl || "");
          setCustomTags((d.customTags || []).join(", "));
          setDealValue(d.dealValue != null ? String(d.dealValue) : "");
          setExpectedCloseDate(d.expectedCloseDate ? d.expectedCloseDate.split("T")[0] : "");
          setWinLossReason(d.winLossReason || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const populateFormFromDoc = useCallback((doc: CustomerServiceDoc) => {
    const savedMap = new Map((doc.services || []).map((s) => [s.key, s]));
    setSvcForm(SERVICE_TYPES.map((st) => {
      const saved = savedMap.get(st.key);
      return saved ? { ...st, enabled: saved.enabled, monthlyFee: saved.monthlyFee } : { ...st, enabled: false, monthlyFee: 0 };
    }));
    if (doc.fiscalYearEnd) {
      const [m, day] = doc.fiscalYearEnd.split("-").map(Number);
      setSvcFiscalMonth(m || 12);
      setSvcFiscalDay(day || 31);
    }
    setSvcStaffId(doc.assignedStaffId || "");
    setSvcStaffName(doc.assignedStaffName || "");
    setSvcStatus(doc.status || "active");
    setSvcNotes(doc.notes || "");
  }, []);

  useEffect(() => {
    setSvcLoading(true);
    fetch(`/dashboard/api/customer-services?customerId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d._id) {
          setSvcDoc(d);
          populateFormFromDoc(d);
        }
        setSvcLoading(false);
      })
      .catch(() => setSvcLoading(false));
  }, [id, populateFormFromDoc]);

  useEffect(() => {
    fetch("/dashboard/api/staff")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setStaffList(d); })
      .catch(() => {});
  }, []);

  const openSvcModal = useCallback(() => {
    if (svcDoc) populateFormFromDoc(svcDoc);
    setShowSvcModal(true);
  }, [svcDoc, populateFormFromDoc]);

  const handleSvcSave = async () => {
    setSvcSaving(true);
    const payload = {
      customerId: id,
      customerName: firstName || lastName ? `${firstName} ${lastName}`.trim() : customer?.name || "",
      services: svcForm,
      fiscalYearEnd: `${svcFiscalMonth}-${svcFiscalDay}`,
      assignedStaffId: svcStaffId,
      assignedStaffName: svcStaffName,
      status: svcStatus,
      notes: svcNotes,
    };

    try {
      if (svcDoc?._id) {
        await fetch(`/dashboard/api/customer-services/${svcDoc._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setSvcDoc({ ...svcDoc, ...payload });
      } else {
        const res = await fetch("/dashboard/api/customer-services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        setSvcDoc(created);
      }
      setShowSvcModal(false);
    } catch (err) {
      console.error("Save service error:", err);
    }
    setSvcSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await fetch(`/dashboard/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName, lastName, company, position,
        phone, email, address, notes, avatarUrl,
        customTags: customTags.split(",").map((t) => t.trim()).filter(Boolean),
        dealValue: dealValue !== "" ? parseFloat(dealValue) : undefined,
        expectedCloseDate: expectedCloseDate || undefined,
        winLossReason: winLossReason || undefined,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push("/crm");
    }, 1000);
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    setTaskSaving(true);
    await fetch("/dashboard/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: id,
        customerName: customer ? (firstName || lastName ? `${firstName} ${lastName}`.trim() : customer.name) : "",
        title: taskTitle,
        notes: taskNotes,
        dueDate: taskDueDate || null,
        priority: taskPriority,
      }),
    });
    setTaskSaving(false);
    setTaskSaved(true);
    setTaskTitle(""); setTaskDueDate(""); setTaskPriority("medium"); setTaskNotes("");
    setTimeout(() => { setTaskSaved(false); setShowTaskModal(false); }, 1200);
  };

  const saveAssignedTo = async (updated: string[]) => {
    if (!customer) return;
    await fetch(`/dashboard/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTo: updated }),
    });
    setCustomer({ ...customer, assignedTo: updated });
  };

  const handleAssign = async () => {
    if (!assignInput.trim() || !customer) return;
    await saveAssignedTo([...(customer.assignedTo || []), assignInput.trim()]);
    setAssignInput("");
  };

  const removeStaff = async (index: number) => {
    if (!customer) return;
    await saveAssignedTo((customer.assignedTo || []).filter((_, i) => i !== index));
  };

  if (loading) return <div className="min-h-screen theme-bg flex items-center justify-center"><div className="theme-text-muted animate-pulse">กำลังโหลด...</div></div>;
  if (!customer) return <div className="min-h-screen theme-bg flex items-center justify-center"><div className="text-red-400">ไม่พบลูกค้า</div></div>;

  const stage = STAGES[customer.pipelineStage] || STAGES.new;

  return (
    <div className="min-h-screen theme-bg theme-text">
      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border theme-border p-6 space-y-4" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">📋 สร้างงานติดตาม</h2>
              <button onClick={() => setShowTaskModal(false)} className="theme-text-muted hover:theme-text text-xl">&times;</button>
            </div>
            <p className="text-xs theme-text-muted">ลูกค้า: {firstName || lastName ? `${firstName} ${lastName}`.trim() : customer.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[13px] theme-text-muted mb-1">ชื่องาน *</label>
                <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="ติดตามใบเสนอราคา, โทรหา, นัดประชุม..."
                  className="w-full px-3 py-2 rounded-lg theme-bg-secondary border theme-border text-sm theme-text" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] theme-text-muted mb-1">ความสำคัญ</label>
                  <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg theme-bg-secondary border theme-border text-sm theme-text">
                    <option value="high">🔴 ด่วน</option>
                    <option value="medium">🟡 ปกติ</option>
                    <option value="low">🟢 ต่ำ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] theme-text-muted mb-1">กำหนดส่ง</label>
                  <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg theme-bg-secondary border theme-border text-sm theme-text" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] theme-text-muted mb-1">หมายเหตุ</label>
                <textarea value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} rows={3}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="w-full px-3 py-2 rounded-lg theme-bg-secondary border theme-border text-sm theme-text resize-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowTaskModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border theme-border text-sm theme-text-muted hover:theme-text transition">
                ยกเลิก
              </button>
              <button onClick={handleCreateTask} disabled={taskSaving || !taskTitle.trim()}
                className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition disabled:opacity-50 ${taskSaved ? "bg-emerald-600" : "bg-blue-600 hover:bg-blue-500"}`}>
                {taskSaving ? "กำลังบันทึก..." : taskSaved ? "✓ สร้างแล้ว!" : "📋 สร้างงาน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Packages Modal */}
      {showSvcModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border theme-border p-4 space-y-3" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">📋 จัดการแพ็คเกจบริการ</h2>
              <button onClick={() => setShowSvcModal(false)} className="theme-text-muted hover:theme-text text-xl">&times;</button>
            </div>

            {/* Service checkboxes with fee inputs */}
            <div className="space-y-1.5">
              <p className="text-[13px] theme-text-muted font-medium">เลือกบริการ &amp; ค่าบริการต่อเดือน</p>
              {svcForm.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) => {
                        const next = [...svcForm];
                        next[i] = { ...next[i], enabled: e.target.checked };
                        setSvcForm(next);
                      }}
                      className="w-4 h-4 rounded accent-blue-500"
                    />
                    <span className="text-sm truncate">{s.label}</span>
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs theme-text-muted">฿</span>
                    <input
                      type="number"
                      min="0"
                      value={s.monthlyFee || ""}
                      onChange={(e) => {
                        const next = [...svcForm];
                        next[i] = { ...next[i], monthlyFee: parseFloat(e.target.value) || 0 };
                        setSvcForm(next);
                      }}
                      placeholder="0"
                      className="w-24 px-2 py-1 rounded-lg theme-bg-secondary border theme-border text-sm theme-text text-right"
                      disabled={!s.enabled}
                    />
                  </div>
                </div>
              ))}
              {svcForm.some((s) => s.enabled) && (
                <div className="flex justify-end text-sm font-bold pt-1 border-t theme-border">
                  <span>รวม: <span className="text-emerald-400">{formatTHB(svcForm.filter((s) => s.enabled).reduce((sum, s) => sum + s.monthlyFee, 0))}</span></span>
                </div>
              )}
            </div>

            {/* Fiscal year end */}
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">📅 สิ้นสุดปีบัญชี</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={svcFiscalMonth}
                  onChange={(e) => setSvcFiscalMonth(Number(e.target.value))}
                  className="px-2 py-1.5 rounded-lg theme-bg-secondary border theme-border text-sm theme-text"
                >
                  {THAI_MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-xs theme-text-muted">วันที่</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={svcFiscalDay}
                    onChange={(e) => setSvcFiscalDay(Number(e.target.value) || 31)}
                    className="w-full px-2 py-1.5 rounded-lg theme-bg-secondary border theme-border text-sm theme-text"
                  />
                </div>
              </div>
            </div>

            {/* Staff assignment */}
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">👤 ผู้ดูแลบัญชี</label>
              <select
                value={svcStaffId}
                onChange={(e) => {
                  const selected = staffList.find((s) => s._id === e.target.value);
                  setSvcStaffId(e.target.value);
                  setSvcStaffName(selected?.name || "");
                }}
                className="w-full px-2 py-1.5 rounded-lg theme-bg-secondary border theme-border text-sm theme-text"
              >
                <option value="">— ไม่ระบุ —</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">สถานะบริการ</label>
              <select
                value={svcStatus}
                onChange={(e) => setSvcStatus(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg theme-bg-secondary border theme-border text-sm theme-text"
              >
                {SERVICE_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">หมายเหตุ</label>
              <textarea
                value={svcNotes}
                onChange={(e) => setSvcNotes(e.target.value)}
                rows={2}
                placeholder="รายละเอียดเพิ่มเติม..."
                className="w-full px-2 py-1.5 rounded-lg theme-bg-secondary border theme-border text-sm theme-text resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowSvcModal(false)}
                className="flex-1 px-3 py-2 rounded-lg border theme-border text-sm theme-text-muted hover:theme-text transition">
                ยกเลิก
              </button>
              <button onClick={handleSvcSave} disabled={svcSaving}
                className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition disabled:opacity-50">
                {svcSaving ? "กำลังบันทึก..." : "💾 บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b theme-border px-3 md:px-6 py-4 sticky top-0 z-10" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/crm" className="theme-text-muted hover:theme-text text-xl">&larr;</Link>
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 theme-border" />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${stage.color}`}>
                  {(firstName || customer.name).substring(0, 2)}
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold">{firstName || lastName ? `${firstName} ${lastName}`.trim() : customer.name}</h1>
                <div className="flex items-center gap-2">
                  {company && <span className="text-xs theme-text-muted">{company}</span>}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] font-medium text-white ${stage.color}`}>
                    {stage.icon} {stage.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-cyan-900/50 hover:bg-cyan-800/50 border border-cyan-700/50 text-cyan-300 hover:text-white transition">
              ➕ งานติดตาม
            </button>
            <Link href="/tasks" className="px-3 py-2 rounded-lg text-sm font-medium theme-bg-card hover:theme-bg-hover border theme-border theme-text-secondary hover:theme-text transition">
              📋 งานทั้งหมด
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${saving ? "opacity-50" : saved ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
            >
              {saving ? "กำลังบันทึก..." : saved ? "✓ บันทึกแล้ว" : "💾 บันทึก"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 md:p-6 pb-24 md:pb-6 space-y-6">
        {/* AI Scores — Auto จาก สนทนา */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border theme-border p-3" style={{ background: "var(--bg-card)" }}>
            <p className="text-[13px] theme-text-muted mb-1">😊 ความรู้สึก</p>
            {customer.lastSentiment ? <Badge level={customer.lastSentiment.level} label={SL[customer.lastSentiment.level]} /> : <span className="theme-text-muted text-xs">-</span>}
          </div>
          <div className="rounded-xl border theme-border p-3" style={{ background: "var(--bg-card)" }}>
            <p className="text-[13px] theme-text-muted mb-1">🛒 โอกาสซื้อ</p>
            {customer.lastPurchaseIntent ? <Badge level={customer.lastPurchaseIntent.level} label={PL[customer.lastPurchaseIntent.level]} /> : <span className="theme-text-muted text-xs">-</span>}
          </div>
          <div className="rounded-xl border theme-border p-3" style={{ background: "var(--bg-card)" }}>
            <p className="text-[13px] theme-text-muted mb-1">📨 ข้อความ</p>
            <span className="text-lg font-bold">{customer.totalMessages}</span>
          </div>
          <div className="rounded-xl border theme-border p-3" style={{ background: "var(--bg-card)" }}>
            <p className="text-[13px] theme-text-muted mb-1">💬 ห้อง</p>
            <span className="text-lg font-bold">{(customer.rooms || []).length}</span>
          </div>
        </div>

        {/* Auto Tags — จาก AI */}
        {(customer.tags || []).length > 0 && (
          <div className="rounded-xl border theme-border p-4" style={{ background: "var(--bg-card)" }}>
            <p className="text-xs theme-text-muted mb-2">🏷️ Tags อัตโนมัติ (AI)</p>
            <div className="flex flex-wrap gap-1.5">
              {customer.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Staff Assignment */}
        <div className="rounded-xl border theme-border p-4" style={{ background: "var(--bg-card)" }}>
          <h3 className="text-sm font-bold theme-text mb-2">👔 ผู้ดูแล</h3>
          <div className="flex gap-1 flex-wrap mb-2">
            {(customer.assignedTo || []).map((staff, i) => (
              <span key={i} className="text-sm px-2 py-1 bg-indigo-900/40 text-indigo-300 rounded-lg flex items-center gap-1">
                {staff}
                <button onClick={() => removeStaff(i)} className="text-red-400 ml-1 hover:text-red-300">✕</button>
              </span>
            ))}
            {(customer.assignedTo || []).length === 0 && (
              <span className="text-sm theme-text-muted">ยังไม่มีผู้ดูแล</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={assignInput}
              onChange={(e) => setAssignInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAssign()}
              placeholder="พิมพ์ชื่อพนักงาน..."
              className="border theme-border rounded-lg px-3 py-2 text-sm flex-1 theme-bg theme-text"
              style={{ background: "var(--bg-primary)" }}
            />
            <button onClick={handleAssign} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition">
              มอบหมาย
            </button>
          </div>
        </div>

        {/* Form — ข้อมูลที่ user เพิ่มเติมเอง */}
        <div className="rounded-xl border theme-border p-6" style={{ background: "var(--bg-card)" }}>
          <h2 className="text-sm font-bold mb-4">📝 ข้อมูลลูกค้า <span className="text-xs theme-text-muted font-normal">(แก้ไขได้)</span></h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">ชื่อ</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder={customer.name}
                className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
            </div>
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">นามสกุล</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
            </div>
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">บริษัท</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
            </div>
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">ตำแหน่ง</label>
              <input type="text" value={position} onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
            </div>
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">เบอร์โทร</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
            </div>
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">อีเมล</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
            </div>
            <div>
              <label className="block text-[13px] theme-text-muted mb-1">รูปภาพ (URL)</label>
              <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[13px] theme-text-muted mb-1">ที่อยู่</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
          </div>

          <div className="mt-4">
            <label className="block text-[13px] theme-text-muted mb-1">Tags เพิ่มเติม <span className="theme-text-muted">(คั่นด้วย ,)</span></label>
            <input type="text" value={customTags} onChange={(e) => setCustomTags(e.target.value)}
              placeholder="VIP, ลูกค้าเก่า, กรุงเทพ"
              className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
          </div>

          <div className="mt-4">
            <label className="block text-[13px] theme-text-muted mb-1">หมายเหตุ</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="บันทึกเพิ่มเติม..."
              className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text resize-none" style={{ background: "var(--bg-primary)" }} />
          </div>

          {/* Groups Section */}
          {customer.groups && customer.groups.length > 0 && (
            <div className="mt-6 pt-4 border-t theme-border">
              <h3 className="text-xs font-bold theme-text-muted mb-3 uppercase tracking-wide">👥 กลุ่มที่อยู่ ({customer.groups.length})</h3>
              <div className="space-y-2">
                {customer.groups.map((g) => (
                  <Link key={g.sourceId} href={`/group/${g.sourceId}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg theme-bg hover:bg-white/5 transition border theme-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-900/40 text-cyan-300 border border-cyan-700/30 font-medium">
                        {g.groupName}
                      </span>
                      <span className="text-[13px] theme-text-muted">{g.messageCount} ข้อความ</span>
                    </div>
                    <span className="text-[13px] theme-text-muted">
                      {g.lastActiveAt ? new Date(g.lastActiveAt).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Service Packages Section */}
          <div className="mt-6 pt-4 border-t theme-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold theme-text-muted uppercase tracking-wide">📋 แพ็คเกจบริการ</h3>
              <button onClick={openSvcModal}
                className="text-xs px-2 py-1 rounded-lg bg-blue-900/30 text-blue-400 border border-blue-700/30 hover:bg-blue-800/40 transition">
                ➕ จัดการบริการ
              </button>
            </div>
            {(() => {
              if (svcLoading) return <p className="text-xs theme-text-muted animate-pulse">กำลังโหลด...</p>;
              if (!svcDoc || !svcDoc.services?.some((s) => s.enabled))
                return <p className="text-xs theme-text-muted">ยังไม่มีแพ็คเกจบริการ — กด &quot;จัดการบริการ&quot; เพื่อเพิ่ม</p>;

              const enabledSvcs = svcDoc.services.filter((s) => s.enabled);
              const totalFee = enabledSvcs.reduce((sum, s) => sum + s.monthlyFee, 0);
              const statusOpt = SERVICE_STATUS_OPTIONS.find((o) => o.value === svcDoc.status) || SERVICE_STATUS_OPTIONS[0];
              const [fyMonth, fyDay] = (svcDoc.fiscalYearEnd || "12-31").split("-").map(Number);

              return (
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="theme-text-muted text-left">
                          <th className="py-1 pr-2 font-medium">บริการ</th>
                          <th className="py-1 pr-2 font-medium text-right">ค่าบริการ/เดือน</th>
                          <th className="py-1 font-medium text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enabledSvcs.map((s) => (
                          <tr key={s.key} className="border-t theme-border">
                            <td className="py-1 pr-2">{SERVICE_TYPES.find((t) => t.key === s.key)?.label || s.key}</td>
                            <td className="py-1 pr-2 text-right font-mono">{formatTHB(s.monthlyFee)}</td>
                            <td className="py-1 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium border ${statusOpt.color}`}>
                                {statusOpt.label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t theme-border font-bold">
                          <td className="py-1 pr-2">รวมต่อเดือน</td>
                          <td className="py-1 pr-2 text-right font-mono text-emerald-400">{formatTHB(totalFee)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] theme-text-muted">
                    <span>📅 สิ้นปีบัญชี: {fyDay} {THAI_MONTHS[(fyMonth || 12) - 1]}</span>
                    {svcDoc.assignedStaffName && <span>👤 ผู้ดูแล: {svcDoc.assignedStaffName}</span>}
                  </div>
                  {svcDoc.notes && <p className="text-[13px] theme-text-muted">💬 {svcDoc.notes}</p>}
                </div>
              );
            })()}
          </div>

          {/* Channel IDs Section */}
          <div className="mt-6 pt-4 border-t theme-border">
            <h3 className="text-xs font-bold theme-text-muted mb-3 uppercase tracking-wide">🔗 ช่องทาง LINE</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] theme-text-muted mb-1">
                  <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> LINE ID</span>
                </label>
                <input type="text" value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="Uxxxxxxxxxx"
                  className="w-full px-3 py-1.5 rounded-lg border theme-border text-sm theme-bg theme-text font-mono text-xs" style={{ background: "var(--bg-primary)" }} />
              </div>
            </div>
            {(customer.rooms || []).length > 0 && (
              <div className="mt-3">
                <p className="text-[13px] theme-text-muted mb-1">ห้องสนทนาที่เชื่อมอยู่ ({customer.rooms.length})</p>
                <div className="flex flex-wrap gap-1">
                  {customer.rooms.map((r) => {
                    return <span key={r} className="text-[13px] px-2 py-0.5 rounded-lg border font-mono bg-green-500/10 text-green-400 border-green-500/20">LINE: {r.substring(0, 16)}{r.length > 16 ? "..." : ""}</span>;
                  })}
                </div>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Link href={`/customer/${id}`}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-900/30 text-indigo-400 border border-indigo-700/30 hover:bg-indigo-800/40 transition">
                📜 ดูสนทนาทั้งหมด
              </Link>
            </div>
          </div>

          {/* Deal Value Section */}
          <div className="mt-6 pt-4 border-t theme-border">
            <h3 className="text-xs font-bold theme-text-muted mb-3 uppercase tracking-wide">💰 ข้อมูล Deal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] theme-text-muted mb-1">มูลค่า Deal (บาท)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm theme-text-muted">฿</span>
                  <input type="number" value={dealValue} onChange={(e) => setDealValue(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
                </div>
                {dealValue && parseFloat(dealValue) > 0 && (
                  <p className="text-[13px] text-emerald-400 mt-1">{formatTHB(parseFloat(dealValue))}</p>
                )}
              </div>
              <div>
                <label className="block text-[13px] theme-text-muted mb-1">วันที่คาดว่าจะปิด</label>
                <input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
              </div>
            </div>
            {(customer.pipelineStage === "closed_won" || customer.pipelineStage === "closed_lost") && (
              <div className="mt-3">
                <label className="block text-[13px] theme-text-muted mb-1">
                  เหตุผล{customer.pipelineStage === "closed_won" ? "ที่ปิดการขายได้" : "ที่ไม่ซื้อ"}
                </label>
                <input type="text" value={winLossReason} onChange={(e) => setWinLossReason(e.target.value)}
                  placeholder={customer.pipelineStage === "closed_won" ? "ราคาดี, สินค้าตรงความต้องการ..." : "ราคาสูงเกิน, เลือกคู่แข่ง..."}
                  className="w-full px-3 py-2 rounded-lg border theme-border text-sm theme-bg theme-text" style={{ background: "var(--bg-primary)" }} />
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[13px] theme-text-muted">
              สร้างเมื่อ {new Date(customer.createdAt).toLocaleString("th-TH")} &middot;
              อัปเดต {new Date(customer.updatedAt).toLocaleString("th-TH")}
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${saving ? "opacity-50" : saved ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
            >
              {saving ? "กำลังบันทึก..." : saved ? "✓ บันทึกแล้ว" : "💾 บันทึก"}
            </button>
          </div>
        </div>
      </main>

    </div>
  );
}
