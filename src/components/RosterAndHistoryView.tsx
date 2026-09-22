import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Ban,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Download,
  History,
  ListChecks,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Printer,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { deptColor } from "../data/mockData";
import type { AttendanceRecord, AttendanceStatus, Employee } from "../types";

export interface RosterHistoryProps {
  employees: Employee[];
  records: AttendanceRecord[];
  onAddEmployee: (emp: Omit<Employee, "id" | "avatarColor">) => void;
  onRemoveEmployee: (id: string) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onUpsertRecord: (rec: AttendanceRecord) => void;
}

const STATUS_META: Record<AttendanceStatus, { label: string; badge: string }> = {
  present: { label: "Present", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30" },
  late: { label: "Late", badge: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30" },
  absent: { label: "Absent", badge: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30" },
  "half-day": { label: "Half Day", badge: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30" },
  excused: { label: "Excused", badge: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30" },
  "on-leave": { label: "On Leave", badge: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30" },
};

const AVATAR_COLORS = ["bg-indigo-500", "bg-cyan-500", "bg-fuchsia-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-sky-500", "bg-violet-500", "bg-teal-500", "bg-orange-500", "bg-blue-500", "bg-pink-500"];

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

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDateFull(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ============================================================
   TAB 1: EMPLOYEE ROSTER / DIRECTORY
   ============================================================ */

function Roster({ employees, onAddEmployee, onRemoveEmployee, onUpdateEmployee }: RosterHistoryProps) {
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", email: "", department: "Engineering", role: "", employeeId: "", pin: "", shiftStart: "09:00", shiftEnd: "18:00", location: "Office - HQ" });

  const departments = useMemo(() => [...new Set(employees.map((e) => e.department))].sort(), [employees]);
  const visible = employees.filter((e) => {
    const q = query.toLowerCase();
    const matchQ = !q || e.name.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    const matchD = deptFilter === "all" || e.department === deptFilter;
    return matchQ && matchD;
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", department: departments[0] ?? "Engineering", role: "", employeeId: "", pin: "", shiftStart: "09:00", shiftEnd: "18:00", location: "Office - HQ" });
    setShowForm(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ name: emp.name, email: emp.email, department: emp.department, role: emp.role, employeeId: emp.employeeId, pin: emp.pin, shiftStart: emp.shiftStart, shiftEnd: emp.shiftEnd, location: emp.location });
    setShowForm(true);
  };

  const save = () => {
    if (!form.name.trim() || !form.email.trim() || !form.employeeId.trim()) {
      toast.error("Name, email and employee ID are required.");
      return;
    }
    const dupId = employees.some((e) => e.employeeId.toLowerCase() === form.employeeId.trim().toLowerCase() && e.id !== editing?.id);
    if (dupId) {
      toast.error("That employee ID is already in use.");
      return;
    }
    if (editing) {
      onUpdateEmployee({ ...editing, ...form, name: form.name.trim(), email: form.email.trim() });
      toast.success(`${form.name.trim()} updated`);
    } else {
      onAddEmployee({ ...form, name: form.name.trim(), email: form.email.trim(), pin: form.pin || form.employeeId.replace(/\D/g, "").slice(-4), active: true, joinedAt: new Date().toISOString().slice(0, 10) });
      toast.success(`${form.name.trim()} added to the roster`);
    }
    setShowForm(false);
    setEditing(null);
  };

  const remove = (emp: Employee) => {
    if (window.confirm(`Remove ${emp.name} from the roster? This keeps their attendance history.`)) {
      onRemoveEmployee(emp.id);
      toast.success(`${emp.name} removed`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-indigo-500/20"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none focus:border-indigo-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="all">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setDeptFilter("all")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:text-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <UserRound className="h-3.5 w-3.5" /> {employees.filter((e) => e.active).length} active
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-500/40 transition-all hover:bg-indigo-500 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Add / edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-white p-4 shadow-sm dark:border-indigo-500/30 dark:from-indigo-500/10 dark:to-slate-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {editing ? `Edit ${editing.name}` : "Add new employee"}
              </h3>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Full name *</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-500/20" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Email *</span>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@workly.ai" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-500/20" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Employee ID *</span>
                <input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} placeholder="EMP-6001" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-500/20" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">PIN (kiosk)</span>
                <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="4 digits" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-500/20" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Department</span>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900">
                  {["Engineering", "Design", "Marketing", "Sales", "Operations"].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Job title</span>
                <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Engineer" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-500/20" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Shift</span>
                <div className="flex items-center gap-1.5">
                  <input value={form.shiftStart} onChange={(e) => setForm({ ...form, shiftStart: e.target.value })} type="time" className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900" />
                  <span className="text-slate-300">to</span>
                  <input value={form.shiftEnd} onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })} type="time" className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900" />
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Location</span>
                <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900">
                  <option value="Office - HQ">Office - HQ</option>
                  <option value="Remote - Home">Remote - Home</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Cancel
              </button>
              <button onClick={save} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-500/40 hover:bg-indigo-500">
                {editing ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {editing ? "Save changes" : "Add to roster"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roster grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {visible.map((emp) => (
            <motion.div
              key={emp.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "group relative rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900",
                emp.active ? "border-slate-200 dark:border-slate-800" : "border-dashed border-slate-300 opacity-70 dark:border-slate-700",
              )}
            >
              {!emp.active && (
                <span className="absolute right-3 top-3 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Inactive
                </span>
              )}
              <div className="flex items-start gap-3">
                <Avatar emp={emp} size="h-11 w-11 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{emp.name}</p>
                  <p className="truncate text-xs text-slate-400">{emp.role} · {emp.employeeId}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <span className={cn("h-1.5 w-1.5 rounded-full", deptColor(emp.department))} /> {emp.department}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <Clock className="h-2.5 w-2.5" /> {emp.shiftStart}-{emp.shiftEnd}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800">
                <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 flex-none" /> {emp.email}</p>
                <p className="flex items-center gap-1.5"><Building2 className="h-3 w-3 flex-none" /> {emp.location}</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  onClick={() => onUpdateEmployee({ ...emp, active: !emp.active })}
                  className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
                >
                  {emp.active ? "Deactivate" : "Reactivate"}
                </button>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEdit(emp)} title="Edit" className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 dark:border-slate-700">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(emp)} title="Remove" className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500 dark:border-slate-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">No employees found.</p>
          <button onClick={openAdd} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500">
            <Plus className="h-3.5 w-3.5" /> Add your first employee
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TAB 2: ATTENDANCE HISTORY & REPORTS
   ============================================================ */

function HistoryTab({ employees, records }: RosterHistoryProps) {
  const [days, setDays] = useState(14);
  const [deptFilter, setDeptFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"hours" | "rate" | "days">("hours");

  const departments = useMemo(() => [...new Set(employees.map((e) => e.department))].sort(), [employees]);
  const windowEnd = new Date();
  const windowStart = addDays(windowEnd, -(days - 1));

  const inWindow = (iso: string) => iso >= windowStart && iso <= toISO(windowEnd);

  const empStats = useMemo(() => {
    const active = employees.filter((e) => e.active && (deptFilter === "all" || e.department === deptFilter));
    return active.map((emp) => {
      const recs = records.filter((r) => r.employeeId === emp.id && inWindow(r.date));
      const present = recs.filter((r) => r.status === "present" || r.status === "late" || r.status === "half-day").length;
      const half = recs.filter((r) => r.status === "half-day").length;
      const hours = recs.reduce((a, r) => a + r.workHours, 0);
      const late = recs.filter((r) => r.status === "late").length;
      const absent = recs.filter((r) => r.status === "absent").length;
      const workingDays = present + absent + recs.filter((r) => r.status === "on-leave" || r.status === "excused").length;
      const rate = workingDays ? Math.round((present / workingDays) * 100) : 0;
      return { emp, present, half, hours, late, absent, rate, total: recs.length };
    }).sort((a, b) => (sortBy === "hours" ? b.hours - a.hours : sortBy === "rate" ? b.rate - a.rate : b.present - a.present));
  }, [employees, records, deptFilter, days, sortBy]);

  const totals = useMemo(() => {
    const sum = empStats.reduce((a, e) => ({ hours: a.hours + e.hours, present: a.present + e.present, late: a.late + e.late, absent: a.absent + e.absent }), { hours: 0, present: 0, late: 0, absent: 0 });
    return sum;
  }, [empStats]);

  const maxHours = Math.max(...empStats.map((e) => e.hours), 1);

  const exportCsv = () => {
    const rows = [
      ["Employee", "ID", "Department", "Present", "Late", "Absent", "Hours", "Rate"],
      ...empStats.map((e) => [e.emp.name, e.emp.employeeId, e.emp.department, e.present, e.late, e.absent, e.hours.toFixed(1), `${e.rate}%`]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join(String.fromCharCode(10));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${windowStart}-to-${toISO(windowEnd)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported to CSV");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                days === d ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-400",
              )}
            >
              Last {d} days
            </button>
          ))}
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="all">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-600 shadow-sm outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="hours">Sort: Hours</option>
          <option value="rate">Sort: Attendance %</option>
          <option value="days">Sort: Days present</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:text-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button onClick={() => toast.info("Sending to printer...")} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:text-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Team totals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Total Hours", value: totals.hours.toFixed(0), icon: Clock, cls: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300" },
          { label: "Days Present", value: totals.present, icon: Check, cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" },
          { label: "Late Arrivals", value: totals.late, icon: History, cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" },
          { label: "Absences", value: totals.absent, icon: Ban, cls: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" },
        ].map((s) => (
          <div key={s.label} className={cn("flex items-center justify-between rounded-xl border p-3.5", s.cls)}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{s.label}</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums">{s.value}</p>
            </div>
            <s.icon className="h-5 w-5 opacity-60" strokeWidth={2} />
          </div>
        ))}
      </div>

      {/* Per-employee report table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3 text-center">Present</th>
              <th className="px-4 py-3 text-center">Half Day</th>
              <th className="px-4 py-3 text-center">Late</th>
              <th className="px-4 py-3 text-center">Absent</th>
              <th className="px-4 py-3">Hours worked</th>
              <th className="px-4 py-3">Attendance rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence initial={false}>
              {empStats.map((row, i) => (
                <motion.tr
                  key={row.emp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar emp={row.emp} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800 dark:text-slate-100">{row.emp.name}</p>
                        <p className="truncate text-[11px] text-slate-400">{row.emp.department} · {row.emp.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{row.present}</td>
                  <td className="px-4 py-3 text-center text-xs tabular-nums text-cyan-600 dark:text-cyan-400">{row.half}</td>
                  <td className="px-4 py-3 text-center text-xs tabular-nums text-amber-600 dark:text-amber-400">{row.late}</td>
                  <td className="px-4 py-3 text-center text-xs tabular-nums text-rose-600 dark:text-rose-400">{row.absent}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.min((row.hours / maxHours) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{row.hours.toFixed(1)}h</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                      row.rate >= 90 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : row.rate >= 75 ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
                    )}>
                      {row.rate}%
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {empStats.length === 0 && (
          <div className="p-10 text-center">
            <ListChecks className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">No attendance data in this window.</p>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400">
        Totals across {windowStart} to {toISO(windowEnd)} ({days} calendar days). Data persists locally in your browser.
      </p>
    </div>
  );
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/* ============================================================
   CONTAINER
   ============================================================ */

export function RosterAndHistoryView(props: RosterHistoryProps) {
  const [innerTab, setInnerTab] = useState<"roster" | "history">("roster");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {innerTab === "roster" ? "Employee Roster" : "History & Reports"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {innerTab === "roster" ? "Manage your team and their working schedules" : "Attendance analytics across your team"}
          </p>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          <button
            onClick={() => setInnerTab("roster")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all",
              innerTab === "roster" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700" : "text-slate-500 dark:text-slate-400",
            )}
          >
            <Users className="h-3.5 w-3.5" /> Roster
          </button>
          <button
            onClick={() => setInnerTab("history")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all",
              innerTab === "history" ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700" : "text-slate-500 dark:text-slate-400",
            )}
          >
            <History className="h-3.5 w-3.5" /> History & Reports
          </button>
        </div>
      </div>
      {innerTab === "roster" ? <Roster {...props} /> : <HistoryTab {...props} />}
    </div>
  );
}