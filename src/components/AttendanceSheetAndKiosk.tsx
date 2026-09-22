import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Ban,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Coffee,
  Download,
  LogIn,
  LogOut,
  MapPin,
  Printer,
  QrCode,
  Search,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { deptColor } from "../data/mockData";
import type { AttendanceRecord, AttendanceStatus, Employee } from "../types";

export interface SheetAndKioskProps {
  employees: Employee[];
  records: AttendanceRecord[];
  date: string; // active YYYY-MM-DD
  onDateChange: (iso: string) => void;
  onUpsertRecord: (rec: AttendanceRecord) => void;
}

const STATUS_META: Record<AttendanceStatus, { label: string; badge: string; row: string; icon?: typeof Check }> = {
  present: { label: "Present", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30", row: "border-l-emerald-400" },
  late: { label: "Late", badge: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30", row: "border-l-amber-400" },
  absent: { label: "Absent", badge: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30", row: "border-l-rose-400" },
  "half-day": { label: "Half Day", badge: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30", row: "border-l-cyan-400" },
  excused: { label: "Excused", badge: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30", row: "border-l-violet-400" },
  "on-leave": { label: "On Leave", badge: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30", row: "border-l-slate-400" },
};

const STATUS_KEYS: AttendanceStatus[] = ["present", "late", "half-day", "absent", "excused", "on-leave"];

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtDateWeek(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function Avatar({ emp, size = "h-9 w-9 text-xs" }: { emp: Employee; size?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", emp.avatarColor, size)}>
      {initials(emp.name)}
    </div>
  );
}

function StatChip({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={cn("rounded-xl border p-3", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

/* ============================================================
   TAB 1: MANAGER DAILY ROSTER SHEET
   ============================================================ */

function RosterSheet({ employees, records, date, onDateChange, onUpsertRecord }: SheetAndKioskProps) {
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const departments = useMemo(() => [...new Set(employees.map((e) => e.department))].sort(), [employees]);
  const active = employees.filter((e) => e.active);

  const visible = active.filter((e) => {
    const q = query.toLowerCase();
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    const matchD = deptFilter === "all" || e.department === deptFilter;
    return matchQ && matchD;
  });

  const dayRecords = records.filter((r) => r.date === date);
  const getRec = (empId: string) => dayRecords.find((r) => r.employeeId === empId);
  const presentCount = active.filter((e) => { const s = getRec(e.id)?.status; return s === "present" || s === "late" || s === "half-day"; }).length;
  const absentCount = active.filter((e) => getRec(e.id)?.status === "absent").length;

  const setAllPreset = (status: AttendanceStatus) => {
    visible.forEach((emp) => {
      const existing = getRec(emp.id);
      onUpsertRecord({
        id: existing?.id ?? `${emp.id}-${date}`,
        employeeId: emp.id,
        date,
        status,
        checkInTime: existing?.checkInTime ?? (status === "present" ? "09:00" : status === "late" ? "09:45" : null),
        checkOutTime: existing?.checkOutTime ?? (status === "present" ? "18:00" : null),
        location: emp.location,
        workHours: existing?.workHours ?? (status === "present" ? 8 : status === "late" ? 7.5 : status === "half-day" ? 4 : 0),
        breakState: "none",
        breakMinutes: existing?.breakMinutes ?? 45,
        notes: existing?.notes ?? (status === "absent" ? "Marked absent" : ""),
      });
    });
    toast.success(`Marked ${visible.length} employee(s) as ${STATUS_META[status].label.toLowerCase()}`);
  };

  const setStatus = (emp: Employee, status: AttendanceStatus) => {
    const existing = getRec(emp.id);
    onUpsertRecord({
      id: existing?.id ?? `${emp.id}-${date}`,
      employeeId: emp.id,
      date,
      status,
      checkInTime: existing?.checkInTime ?? (status === "present" ? "09:00" : status === "late" ? "09:45" : null),
      checkOutTime: existing?.checkOutTime ?? null,
      location: emp.location,
      workHours: existing?.workHours ?? (status === "present" ? 8 : status === "late" ? 7.5 : status === "half-day" ? 4 : 0),
      breakState: "none",
      breakMinutes: existing?.breakMinutes ?? 45,
      notes: existing?.notes ?? "",
    });
    toast.success(`${emp.name} marked ${STATUS_META[status].label}`);
  };

  const toggleInOut = (emp: Employee) => {
    const existing = getRec(emp.id);
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (existing?.checkInTime && !existing.checkOutTime) {
      const [hi, mi] = existing.checkInTime.split(":").map(Number);
      const [ho, mo] = time.split(":").map(Number);
      const worked = Math.max((ho * 60 + mo - hi * 60 - mi) / 60 - existing.breakMinutes / 60, 0.5);
      onUpsertRecord({ ...existing, checkOutTime: time, workHours: Math.round(worked * 100) / 100 });
      toast.success(`${emp.name} checked out at ${time}`);
    } else {
      onUpsertRecord({
        id: existing?.id ?? `${emp.id}-${date}`,
        employeeId: emp.id,
        date,
        status: existing?.status ?? "present",
        checkInTime: time,
        checkOutTime: null,
        location: emp.location,
        workHours: existing?.workHours ?? 0,
        breakState: existing?.breakState ?? "none",
        breakMinutes: existing?.breakMinutes ?? 0,
        notes: existing?.notes ?? "",
      });
      toast.success(`${emp.name} checked in at ${time}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button onClick={() => onDateChange(addDays(new Date(`${date}T00:00:00`), -1))} className="p-2 text-slate-400 hover:text-indigo-500" aria-label="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{fmtDateWeek(date)}</span>
          <button onClick={() => onDateChange(addDays(new Date(`${date}T00:00:00`), 1))} className="p-2 text-slate-400 hover:text-indigo-500" aria-label="Next day">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ID, email..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none focus:border-indigo-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setAllPreset("present"); }}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark All Present
          </button>
          <button
            onClick={() => { setAllPreset("absent"); }}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          >
            <Ban className="h-3.5 w-3.5" /> Mark All Absent
          </button>
          <button
            onClick={() => toast.info("Report exported to CSV")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:text-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatChip label="On Roster" value={active.length} className="border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200" />
        <StatChip label="Present" value={presentCount} className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" />
        <StatChip label="Late" value={active.filter((e) => getRec(e.id)?.status === "late").length} className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" />
        <StatChip label="Absent" value={absentCount} className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" />
        <StatChip label="On Leave" value={active.filter((e) => { const s = getRec(e.id)?.status; return s === "excused" || s === "on-leave"; }).length} className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300" />
        <StatChip label="Not Logged" value={active.filter((e) => !getRec(e.id)).length} className="border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300" />
      </div>

      {/* Roster table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Check In</th>
                <th className="px-4 py-3 text-center">Check Out</th>
                <th className="px-4 py-3 text-center">Hours</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence initial={false}>
                {visible.map((emp) => {
                  const rec = getRec(emp.id);
                  const status = rec?.status ?? "none";
                  return (
                    <motion.tr
                      key={emp.id}
                      layout={false}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn("border-l-2 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40", status !== "none" ? STATUS_META[status as AttendanceStatus].row : "border-l-transparent")}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar emp={emp} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-100">{emp.name}</p>
                            <p className="truncate text-[11px] text-slate-400">{emp.employeeId} · {emp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                          <span className={cn("h-2 w-2 rounded-full", deptColor(emp.department))} />
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-slate-500 dark:text-slate-400">{emp.shiftStart} - {emp.shiftEnd}</td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={status}
                          onChange={(e) => { if (e.target.value !== "none") setStatus(emp, e.target.value as AttendanceStatus); }}
                          className={cn(
                            "cursor-pointer rounded-md px-2 py-1 text-xs font-semibold outline-none ring-1 transition-colors",
                            status === "none"
                              ? "bg-slate-50 text-slate-400 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
                              : cn(STATUS_META[status as AttendanceStatus].badge, "border-0"),
                          )}
                        >
                          <option value="none">Not set</option>
                          {STATUS_KEYS.map((sk) => (
                            <option key={sk} value={sk} className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">{STATUS_META[sk].label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                        {rec?.checkInTime ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400"><LogIn className="h-3 w-3" />{rec.checkInTime}</span> : <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs tabular-nums text-slate-600 dark:text-slate-300">
                        {rec?.checkOutTime ? <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300"><LogOut className="h-3 w-3" />{rec.checkOutTime}</span> : <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {rec ? `${rec.workHours.toFixed(1)}h` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => toggleInOut(emp)}
                            title={rec?.checkInTime && !rec.checkOutTime ? "Check out" : "Check in"}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                              rec?.checkInTime && !rec.checkOutTime
                                ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                                : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
                            )}
                          >
                            {rec?.checkInTime && !rec.checkOutTime ? <LogOut className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => { toggleInOut(emp); }}
                            disabled={!rec?.checkInTime || !!rec?.checkOutTime}
                            title="Toggle break"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-colors enabled:hover:text-amber-500 disabled:opacity-30 dark:border-slate-700 dark:text-slate-500"
                          >
                            <Coffee className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <div className="p-10 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">No employees match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TAB 2: EMPLOYEE CHECK-IN KIOSK
   ============================================================ */

function Kiosk({ employees, records, date, onUpsertRecord }: SheetAndKioskProps) {
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"idle" | "logged">("idle");
  const [loggedEmp, setLoggedEmp] = useState<Employee | null>(null);
  const [mode, setMode] = useState<"checkin" | "checkout">("checkin");

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const submitPin = (value: string) => {
    if (value.length < 4) return;
    const emp = employees.find((e) => e.pin === value && e.active);
    if (!emp) {
      toast.error("Invalid PIN. Try again.");
      setPin("");
      return;
    }
    const existing = records.find((r) => r.employeeId === emp.id && r.date === date);
    const wantCheckout = existing?.checkInTime && !existing.checkOutTime;
    setMode(wantCheckout ? "checkout" : "checkin");
    setLoggedEmp(emp);
    setStep("logged");
  };

  const confirm = () => {
    if (!loggedEmp) return;
    const existing = records.find((r) => r.employeeId === loggedEmp.id && r.date === date);
    if (mode === "checkout" && existing) {
      const [hi, mi] = (existing.checkInTime ?? "00:00").split(":").map(Number);
      const [ho, mo] = time.split(":").map(Number);
      const worked = Math.max((ho * 60 + mo - hi * 60 - mi) / 60 - (existing.breakMinutes ?? 0) / 60, 0.5);
      onUpsertRecord({ ...existing, checkOutTime: time, workHours: Math.round(worked * 100) / 100 });
      toast.success(`Goodbye ${loggedEmp.name.split(" ")[0]}! Safe home.`);
    } else {
      onUpsertRecord({
        id: existing?.id ?? `${loggedEmp.id}-${date}`,
        employeeId: loggedEmp.id,
        date,
        status: existing?.status ?? (Number(time.split(":")[0]) > 9 || (Number(time.split(":")[0]) === 9 && Number(time.split(":")[1]) > 15) ? "late" : "present"),
        checkInTime: time,
        checkOutTime: null,
        location: loggedEmp.location,
        workHours: existing?.workHours ?? 0,
        breakState: existing?.breakState ?? "none",
        breakMinutes: existing?.breakMinutes ?? 0,
        notes: existing?.notes ?? (Number(time.split(":")[0]) > 9 || (Number(time.split(":")[0]) === 9 && Number(time.split(":")[1]) > 15) ? "Late check-in (kiosk)" : ""),
      });
      toast.success(`Welcome, ${loggedEmp.name.split(" ")[0]}! Have a great day.`);
    }
    setPin("");
    setStep("idle");
    setLoggedEmp(null);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        {/* Kiosk header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-cyan-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold">Workly Check-In Kiosk</span>
            </div>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide">HQ-01</span>
          </div>
          <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight">{time}</p>
          <p className="text-sm text-indigo-100">{dateLabel}</p>
        </div>

        <AnimatePresence mode="wait">
          {step === "idle" ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              <div className="mb-4 flex items-center justify-center gap-2 text-slate-400">
                <QrCode className="h-4 w-4" />
                <span className="text-xs">Tap your badge or enter your 4-digit PIN</span>
              </div>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={cn(
                    "h-4 w-4 rounded-full border-2 transition-all",
                    pin.length > i ? "border-indigo-500 bg-indigo-500" : "border-slate-300 dark:border-slate-600",
                  )} />
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2.5">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPin((p) => { const next = (p + n).slice(0, 4); if (next.length === 4) setTimeout(() => submitPin(next), 80); return next; })}
                    className="rounded-xl border border-slate-200 bg-slate-50 py-4 text-lg font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPin((p) => p.slice(0, -1))}
                  className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 shadow-sm transition-all hover:border-rose-300 hover:text-rose-500 active:scale-95 dark:border-slate-700 dark:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPin((p) => (p + "0").slice(0, 4))}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-4 text-lg font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
                >
                  0
                </button>
                <button
                  onClick={() => { if (pin.length === 4) submitPin(pin); }}
                  className="flex items-center justify-center rounded-xl bg-indigo-600 py-4 text-white shadow-sm shadow-indigo-500/40 transition-all hover:bg-indigo-500 active:scale-95"
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-center text-[11px] text-slate-400">Hint: demo PINs are the last 4 digits of each employee ID (e.g. EMP-1001 {"→"} 1001)</p>
            </motion.div>
          ) : (
            <motion.div key="logged" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-6 text-center">
              {loggedEmp && (
                <>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {mode === "checkin" ? <LogIn className="h-7 w-7" /> : <LogOut className="h-7 w-7" />}
                  </div>
                  <div className="mx-auto mt-3 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}>
                    {initials(loggedEmp.name)}
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{loggedEmp.name}</p>
                  <p className="text-xs text-slate-400">{loggedEmp.department} · {loggedEmp.employeeId}</p>
                  <div className="mt-4 rounded-xl bg-slate-50 py-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{mode === "checkin" ? "Checking in at" : "Checking out at"}</p>
                    <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{time}</p>
                    <p className="flex items-center justify-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" />{loggedEmp.location}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setStep("idle"); setLoggedEmp(null); setPin(""); setMode("checkin"); }}
                      className="rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirm}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/40 transition-all hover:bg-indigo-500 active:scale-95"
                    >
                      <Check className="h-4 w-4" /> Confirm {mode === "checkin" ? "Check-In" : "Check-Out"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Who's in */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <UserRound className="h-4 w-4 text-indigo-500" /> Currently checked in
          </h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            {records.filter((r) => r.date === date && r.checkInTime && !r.checkOutTime).length} online
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {employees.filter((e) => e.active).filter((e) => records.some((r) => r.date === date && r.employeeId === e.id && r.checkInTime && !r.checkOutTime)).map((emp) => (
            <span key={emp.id} className="flex items-center gap-1.5 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <Avatar emp={emp} size="h-5 w-5 text-[8px]" />
              {emp.name.split(" ")[0]}
            </span>
          ))}
          {employees.filter((e) => e.active).filter((e) => records.some((r) => r.date === date && r.employeeId === e.id && r.checkInTime && !r.checkOutTime)).length === 0 && (
            <p className="text-xs text-slate-400">No one is checked in right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CONTAINER
   ============================================================ */

export function AttendanceSheetAndKiosk(props: SheetAndKioskProps) {
  const [innerTab, setInnerTab] = useState<"sheet" | "kiosk">("sheet");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Attendance Logging</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Daily roster sheet and self-service check-in kiosk</p>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          <button
            onClick={() => setInnerTab("sheet")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all",
              innerTab === "sheet" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700" : "text-slate-500 dark:text-slate-400",
            )}
          >
            <ClipboardList className="h-3.5 w-3.5" /> Roster Sheet
          </button>
          <button
            onClick={() => setInnerTab("kiosk")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all",
              innerTab === "kiosk" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700" : "text-slate-500 dark:text-slate-400",
            )}
          >
            <QrCode className="h-3.5 w-3.5" /> Check-In Kiosk
          </button>
        </div>
      </div>
      {innerTab === "sheet" ? <RosterSheet {...props} /> : <Kiosk {...props} />}
    </div>
  );
}