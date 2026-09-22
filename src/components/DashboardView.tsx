import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Download,
  Hourglass,
  LogIn,
  LogOut,
  MapPin,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { deptColor } from "../data/mockData";
import type { AttendanceRecord, AttendanceStatus, Employee } from "../types";

export interface DashboardProps {
  employees: Employee[];
  records: AttendanceRecord[];
  onDateChange?: (iso: string) => void;
}

const STATUS_META: Record<AttendanceStatus, { label: string; className: string; dot: string }> = {
  present: { label: "Present", className: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30", dot: "bg-emerald-500" },
  late: { label: "Late", className: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30", dot: "bg-amber-500" },
  absent: { label: "Absent", className: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30", dot: "bg-rose-500" },
  "half-day": { label: "Half Day", className: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30", dot: "bg-cyan-500" },
  excused: { label: "Excused", className: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30", dot: "bg-violet-500" },
  "on-leave": { label: "On Leave", className: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30", dot: "bg-slate-400" },
};

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtDateFull(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Avatar({ emp, size = "h-9 w-9 text-xs" }: { emp: Employee; size?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", emp.avatarColor, size)}>
      {initials(emp.name)}
    </div>
  );
}

export function DashboardView({ employees, records, onDateChange }: DashboardProps) {
  const reduce = useReducedMotion() ?? false;
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [dateOffset, setDateOffset] = useState(0);

  const today = new Date();
  today.setDate(today.getDate() + dateOffset);
  const todayIso = today.toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.active);
    const todayRecords = records.filter((r) => r.date === todayIso);
    const get = (empId: string) => todayRecords.find((r) => r.employeeId === empId);
    const present = active.filter((e) => { const s = get(e.id)?.status; return s === "present" || s === "late" || s === "half-day"; });
    const late = active.filter((e) => get(e.id)?.status === "late");
    const absent = active.filter((e) => get(e.id)?.status === "absent");
    const onLeave = active.filter((e) => { const s = get(e.id)?.status; return s === "excused" || s === "on-leave"; });
    const checkedIn = active.filter((e) => get(e.id)?.checkInTime);
    const hours = todayRecords.reduce((acc, r) => acc + r.workHours, 0);
    const rate = active.length ? Math.round((present.length / active.length) * 100) : 0;
    return { activeCount: active.length, present, late, absent, onLeave, checkedIn: checkedIn.length, hours, rate, todayRecords };
  }, [employees, records, todayIso]);

  const trend = useMemo(() => {
    const rows: { iso: string; rate: number; present: number; absent: number }[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const iso = addDays(today, -i);
      if (new Date(`${iso}T00:00:00`).getDay() === 0 || new Date(`${iso}T00:00:00`).getDay() === 6) continue;
      const dayRecords = records.filter((r) => r.date === iso);
      const active = employees.filter((e) => e.active);
      const present = active.filter((e) => { const s = dayRecords.find((r) => r.employeeId === e.id)?.status; return s === "present" || s === "late" || s === "half-day"; }).length;
      const absent = active.filter((e) => !dayRecords.some((r) => r.employeeId === e.id) || dayRecords.find((r) => r.employeeId === e.id)?.status === "absent").length;
      rows.push({ iso, rate: active.length ? Math.round((present / active.length) * 100) : 0, present, absent });
    }
    return rows;
  }, [employees, records, rangeDays, todayIso]);

  const maxRate = Math.max(...trend.map((t) => t.rate), 60);

  const deptStats = useMemo(() => {
    const map = new Map<string, { total: number; present: number; late: number; absent: number }>();
    const active = employees.filter((e) => e.active);
    active.forEach((e) => map.set(e.department, { total: 0, present: 0, late: 0, absent: 0 }));
    active.forEach((e) => {
      const s = stats.todayRecords.find((r) => r.employeeId === e.id)?.status;
      const row = map.get(e.department)!;
      row.total += 1;
      if (s === "present" || s === "half-day") row.present += 1;
      else if (s === "late") row.late += 1;
      else if (s === "absent") row.absent += 1;
    });
    return [...map.entries()].map(([name, v]) => ({ name, ...v, rate: v.total ? Math.round(((v.present + v.late) / v.total) * 100) : 0 }));
  }, [employees, stats.todayRecords]);

  const activity = useMemo(() => {
    const evts: { id: string; emp: Employee; type: "checkin" | "checkout" | "break"; time: string; date: string }[] = [];
    for (const r of records) {
      if (!r.checkInTime) continue;
      const emp = employees.find((e) => e.id === r.employeeId);
      if (!emp) continue;
      evts.push({ id: `${r.id}-in`, emp, type: "checkin", time: r.checkInTime, date: r.date });
      if (r.checkOutTime) evts.push({ id: `${r.id}-out`, emp, type: "checkout", time: r.checkOutTime, date: r.date });
      if (r.breakState !== "none") evts.push({ id: `${r.id}-b`, emp, type: "break", time: r.checkInTime ?? "12:00", date: r.date });
    }
    return evts
      .sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)))
      .slice(0, 12);
  }, [employees, records]);

  const kpis = [
    { label: "Attendance Rate", value: `${stats.rate}%`, sub: `${stats.present.length} of ${stats.activeCount} staff`, icon: TrendingUp, accent: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" },
    { label: "Active Employees", value: String(stats.activeCount), sub: `${employees.length - stats.activeCount} inactive`, icon: Users, accent: "text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10" },
    { label: "Present Now", value: String(stats.present.length), sub: `${stats.late.length} late today`, icon: Check, accent: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Avg Work Hours", value: stats.hours.toFixed(1), sub: `${stats.checkedIn} scanned in`, icon: Clock, accent: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Good day, Manager</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{fmtDateFull(todayIso)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button onClick={() => setDateOffset((o) => o - 1)} className="p-2 text-slate-400 hover:text-indigo-500" aria-label="Previous day">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm font-medium text-slate-700 dark:text-slate-200">{fmtDate(todayIso)}</span>
            <button onClick={() => setDateOffset((o) => o + 1)} className="p-2 text-slate-400 hover:text-indigo-500" aria-label="Next day">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {onDateChange && (
            <button onClick={() => onDateChange(todayIso)} className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600 sm:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <CalendarDays className="h-3.5 w-3.5" /> Go to Log Sheet
            </button>
          )}
        </div>
      </div>

      {/* Guard: empty state */}
      {employees.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">No employees in the roster yet.</p>
          <p className="text-xs text-slate-400">Add employees in the Roster tab to see attendance analytics.</p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{kpi.label}</p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{kpi.value}</p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{kpi.sub}</p>
              </div>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.accent)}>
                <kpi.icon className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Trend chart */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Attendance Trend</h3>
              <p className="text-xs text-slate-400">Daily attendance rate over time</p>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              {([7, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setRangeDays(d)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                    rangeDays === d ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-400",
                  )}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 flex h-40 items-end gap-1.5">
            {trend.map((t, i) => (
              <div key={t.iso} className="group relative flex flex-1 flex-col items-center gap-1">
                <span className="pointer-events-none absolute -top-6 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-slate-700">
                  {t.rate}%
                </span>
                <motion.div
                  initial={reduce ? false : { height: 0 }}
                  animate={{ height: `${Math.max((t.rate / maxRate) * 100, 4)}%` }}
                  transition={{ delay: i * 0.02, duration: 0.4, ease: "easeOut" }}
                  className={cn(
                    "w-full rounded-t-md transition-colors",
                    t.rate >= 85 ? "bg-emerald-400" : t.rate >= 70 ? "bg-indigo-400" : t.rate >= 55 ? "bg-amber-400" : "bg-rose-400",
                    "group-hover:bg-indigo-500",
                  )}
                />
                <span className="text-[9px] font-medium text-slate-400">{new Date(`${t.iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "narrow" })}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Department breakdown */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Department Breakdown</h3>
          <p className="text-xs text-slate-400">Today by team</p>
          <div className="mt-4 space-y-3.5">
            {deptStats.map((d) => (
              <div key={d.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                    <span className={cn("h-2 w-2 rounded-full", deptColor(d.name))} />
                    {d.name}
                  </span>
                  <span className="tabular-nums text-slate-400">{d.present + d.late}/{d.total} · {d.rate}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${d.rate}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn("h-full rounded-full", deptColor(d.name))}
                  />
                </div>
              </div>
            ))}
            {deptStats.length === 0 && <p className="text-xs text-slate-400">No data for this day.</p>}
          </div>
        </motion.div>
      </div>

      {/* Bottom row: status badges + activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Status Overview</h3>
          <p className="text-xs text-slate-400">Who is where right now</p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {[
              { key: "present", count: stats.present.length, icon: Users, className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" },
              { key: "late", count: stats.late.length, icon: Hourglass, className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" },
              { key: "absent", count: stats.absent.length, icon: Ban, className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" },
              { key: "onLeave", count: stats.onLeave.length, icon: BadgeCheck, className: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300" },
            ].map((s) => (
              <div key={s.key} className={cn("flex items-center justify-between rounded-xl border p-3", s.className)}>
                <div className="flex items-center gap-2">
                  <s.icon className="h-4 w-4" strokeWidth={2} />
                  <span className="text-xs font-medium">{s.key === "onLeave" ? "On leave / Excused" : s.key[0].toUpperCase() + s.key.slice(1)}</span>
                </div>
                <span className="text-lg font-bold tabular-nums">{s.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live activity feed */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Activity</h3>
              <p className="text-xs text-slate-400">Latest punch events across teams</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CircleDot className="h-3 w-3 animate-pulse" /> LIVE
            </span>
          </div>
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence>
              {activity.map((evt, i) => (
                <motion.li
                  key={evt.id}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="flex items-center gap-3 py-2.5"
                >
                  <Avatar emp={evt.emp} size="h-8 w-8 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-slate-700 dark:text-slate-200">
                      {evt.emp.name}
                      <span className="ml-1.5 text-xs font-normal text-slate-400">{evt.emp.department}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">{fmtDate(evt.date)}</p>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                      evt.type === "checkin" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
                      evt.type === "checkout" && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
                      evt.type === "break" && "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
                    )}
                  >
                    {evt.type === "checkin" ? <LogIn className="h-3 w-3" /> : evt.type === "checkout" ? <LogOut className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {evt.type === "checkin" ? "IN" : evt.type === "checkout" ? "OUT" : "BREAK"} {evt.time}
                  </span>
                  <MapPin className="h-3.5 w-3.5 flex-none text-slate-300 dark:text-slate-600" />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <button className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400">
            View full history <ArrowRight className="h-3 w-3" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}