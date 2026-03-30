"use client";

import { useEffect, useState, useCallback } from "react";

interface Staff {
  _id: string;
  name: string;
  nickname: string;
  role: string;
  lineUserId: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

interface AvailableCustomer {
  name: string;
  lineUserId: string;
  avatarUrl?: string;
}

const ROLES: Record<string, { label: string; color: string }> = {
  accountant: { label: "นักบัญชี", color: "text-blue-400 bg-blue-500/15 border-blue-500/20" },
  auditor:    { label: "ผู้ตรวจสอบ", color: "text-amber-400 bg-amber-500/15 border-amber-500/20" },
  admin:      { label: "ผู้ดูแลระบบ", color: "text-red-400 bg-red-500/15 border-red-500/20" },
  manager:    { label: "ผู้จัดการ", color: "text-purple-400 bg-purple-500/15 border-purple-500/20" },
  payroll:    { label: "เงินเดือน", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20" },
  other:      { label: "อื่นๆ", color: "text-gray-400 bg-gray-500/15 border-gray-500/20" },
};

const EMPTY_FORM = {
  name: "",
  nickname: "",
  role: "accountant",
  lineUserId: "",
  email: "",
  phone: "",
  active: true,
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [available, setAvailable] = useState<AvailableCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch("/dashboard/api/staff?withAvailable=true");
      const data = await res.json();
      if (Array.isArray(data.staff)) setStaffList(data.staff);
      if (Array.isArray(data.availableCustomers)) setAvailable(data.availableCustomers);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const activeCount = staffList.filter((s) => s.active).length;
  const stats = {
    total: staffList.length,
    active: activeCount,
    inactive: staffList.length - activeCount,
    linked: staffList.filter((s) => !!s.lineUserId).length,
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (staff: Staff) => {
    setEditId(staff._id);
    setForm({
      name: staff.name,
      nickname: staff.nickname || "",
      role: staff.role || "other",
      lineUserId: staff.lineUserId || "",
      email: staff.email || "",
      phone: staff.phone || "",
      active: staff.active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = editId ? `/dashboard/api/staff/${editId}` : "/dashboard/api/staff";
      const method = editId ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await fetchStaff();
      closeModal();
    } catch {}
    setSaving(false);
  };

  const handleToggleActive = async (staff: Staff) => {
    await fetch(`/dashboard/api/staff/${staff._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !staff.active }),
    });
    setStaffList((prev) =>
      prev.map((s) => (s._id === staff._id ? { ...s, active: !s.active } : s))
    );
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/dashboard/api/staff/${id}`, { method: "DELETE" });
      setStaffList((prev) => prev.filter((s) => s._id !== id));
    } catch {}
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const editingStaff = editId ? staffList.find((s) => s._id === editId) : null;
  const needsCurrentLine = editingStaff?.lineUserId && !available.some((a) => a.lineUserId === editingStaff.lineUserId);
  const availableForDropdown = needsCurrentLine
    ? [...available, { name: editingStaff.name, lineUserId: editingStaff.lineUserId }]
    : available;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="theme-text-muted animate-pulse">กำลังโหลดข้อมูลพนักงาน...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border theme-border p-6 space-y-4" style={{ background: "var(--bg-card)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">
                {editId ? "✏️ แก้ไขพนักงาน" : "➕ เพิ่มพนักงาน"}
              </h2>
              <button onClick={closeModal} className="theme-text-muted hover:theme-text text-xl">&times;</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[13px] theme-text-muted mb-1">ชื่อ *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full px-3 py-2 rounded-lg theme-bg-secondary border theme-border text-sm theme-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] theme-text-muted mb-1">ชื่อเล่น</label>
                  <input
                    type="text"
                    value={form.nickname}
                    onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
                    placeholder="เล่น"
                    className="w-full px-3 py-2 rounded-lg theme-bg-secondary border theme-border text-sm theme-text"
                  />
                </div>
                <div>
                  <label className="block text-[13px] theme-text-muted mb-1">ตำแหน่ง</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg theme-bg-secondary border theme-border text-sm theme-text"
                  >
                    {Object.entries(ROLES).map(([key, r]) => (
                      <option key={key} value={key}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] theme-text-muted mb-1">เลือกจากลูกค้าที่มี (เชื่อม LINE)</label>
                <select
                  value={form.lineUserId}
                  onChange={(e) => {
                    const selected = availableForDropdown.find(c => c.lineUserId === e.target.value);
                    setForm((p) => ({
                      ...p,
                      lineUserId: e.target.value,
                      name: selected?.name || p.name,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg theme-bg-secondary border theme-border text-sm theme-text"
                >
                  <option value="">-- เลือกลูกค้า --</option>
                  {availableForDropdown.map((c) => (
                    <option key={c.lineUserId} value={c.lineUserId}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {available.length === 0 && !editId && (
                  <p className="text-[12px] text-amber-400 mt-1">ยังไม่มีลูกค้าในระบบ — ส่งข้อความใน LINE ก่อนเพื่อสร้างข้อมูล</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] theme-text-muted mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 rounded-lg theme-bg-secondary border theme-border text-sm theme-text"
                  />
                </div>
                <div>
                  <label className="block text-[13px] theme-text-muted mb-1">โทรศัพท์</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="08x-xxx-xxxx"
                    className="w-full px-3 py-2 rounded-lg theme-bg-secondary border theme-border text-sm theme-text"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="text-sm theme-text-secondary">สถานะ: {form.active ? "ทำงานอยู่" : "ไม่ได้ทำงาน"}</label>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.active ? "bg-emerald-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      form.active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 rounded-lg border theme-border text-sm theme-text-muted hover:theme-text transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition"
              >
                {saving ? "กำลังบันทึก..." : editId ? "💾 บันทึก" : "➕ เพิ่ม"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="page-header border-b theme-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">👔 พนักงาน</h1>
            <p className="text-xs theme-text-muted">จัดการพนักงานสำนักงานบัญชี &middot; {stats.total} คน</p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
          >
            ➕ เพิ่มพนักงาน
          </button>
        </div>
      </header>

      <main className="page-content max-w-4xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "ทั้งหมด", value: stats.total, icon: "👥", color: "text-blue-400" },
            { label: "ทำงานอยู่", value: stats.active, icon: "✅", color: "text-emerald-400" },
            { label: "ไม่ได้ทำงาน", value: stats.inactive, icon: "⏸️", color: "text-gray-400" },
            { label: "เชื่อม LINE แล้ว", value: stats.linked, icon: "💚", color: "text-green-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border theme-border p-4"
              style={{ background: "var(--bg-card)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs theme-text-muted">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Staff List */}
        {staffList.length === 0 ? (
          <div className="text-center theme-text-muted py-16 rounded-xl border theme-border" style={{ background: "var(--bg-card)" }}>
            <div className="space-y-2">
              <p className="text-2xl">👔</p>
              <p>ยังไม่มีพนักงาน</p>
              <button onClick={openCreate} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition">
                ➕ เพิ่มพนักงานคนแรก
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {staffList.map((staff) => {
              const roleCfg = ROLES[staff.role] || ROLES.other;
              const isDeleting = deletingId === staff._id;
              const isConfirmingDelete = confirmDeleteId === staff._id;

              return (
                <div
                  key={staff._id}
                  className={`rounded-xl border theme-border transition ${
                    !staff.active ? "opacity-60" : ""
                  }`}
                  style={{ background: "var(--bg-card)" }}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg border theme-border shrink-0" style={{ background: "var(--bg-secondary)" }}>
                      👤
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{staff.name}</p>
                        {staff.nickname && (
                          <span className="text-xs theme-text-muted">({staff.nickname})</span>
                        )}
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            staff.lineUserId ? "bg-green-500" : "bg-gray-500"
                          }`}
                          title={staff.lineUserId ? "เชื่อม LINE แล้ว" : "ยังไม่เชื่อม LINE"}
                        />
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded-full border font-medium ${
                            staff.active
                              ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/20"
                              : "text-gray-400 bg-gray-500/15 border-gray-500/20"
                          }`}
                        >
                          {staff.active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${roleCfg.color}`}>
                          {roleCfg.label}
                        </span>
                        {staff.phone && (
                          <span className="text-[12px] theme-text-muted">📞 {staff.phone}</span>
                        )}
                        {staff.email && (
                          <span className="text-[12px] theme-text-muted">✉️ {staff.email}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs theme-text-secondary">ลบ?</span>
                          <button
                            onClick={() => handleDelete(staff._id)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 bg-red-900 hover:bg-red-800 border border-red-700 rounded-lg text-xs text-red-300 hover:text-white transition disabled:opacity-50"
                          >
                            {isDeleting ? "..." : "ยืนยัน"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs theme-text-secondary transition hover:theme-text"
                            style={{ background: "var(--bg-secondary)" }}
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleToggleActive(staff)}
                            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                              staff.active ? "bg-emerald-500" : "bg-gray-600"
                            }`}
                            title={staff.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                staff.active ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => openEdit(staff)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border theme-border theme-text-muted hover:theme-text transition text-sm"
                            style={{ background: "var(--bg-secondary)" }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(staff._id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border theme-border theme-text-muted hover:text-red-400 hover:border-red-800 transition text-sm"
                            style={{ background: "var(--bg-secondary)" }}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
