import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Toaster } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { AttendanceSheetAndKiosk } from "./components/AttendanceSheetAndKiosk";
import { DashboardView } from "./components/DashboardView";
import { Navbar } from "./components/Navbar";
import { RosterAndHistoryView } from "./components/RosterAndHistoryView";
import { loadAttendance, loadEmployees, saveAttendance, saveEmployees, toISODate } from "./data/mockData";
import type { AttendanceRecord, Employee, TabKey } from "./types";

export default function App() {
  const reduce = useReducedMotion() ?? false;
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return (localStorage.getItem("workly_theme") as "light" | "dark") ?? "light";
    } catch {
      return "light";
    }
  });
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [employees, setEmployees] = useState<Employee[]>(() => loadEmployees());
  const [records, setRecords] = useState<AttendanceRecord[]>(() => loadAttendance());
  const [activeDate, setActiveDate] = useState<string>(() => toISODate(new Date()));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("workly_theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    saveEmployees(employees);
  }, [employees]);

  useEffect(() => {
    saveAttendance(records);
  }, [records]);

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    [],
  );

  const upsertRecord = (rec: AttendanceRecord) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.employeeId === rec.employeeId && r.date === rec.date);
      if (idx === -1) return [...prev, rec];
      const next = [...prev];
      next[idx] = rec;
      return next;
    });
  };

  const addEmployee = (emp: Omit<Employee, "id" | "avatarColor">) => {
    const colors = ["bg-indigo-500", "bg-cyan-500", "bg-fuchsia-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500", "bg-sky-500", "bg-violet-500", "bg-teal-500", "bg-orange-500", "bg-blue-500", "bg-pink-500"];
    const color = colors[employees.length % colors.length];
    setEmployees((prev) => [
      ...prev,
      { ...emp, id: `e-${Date.now()}`, avatarColor: color, active: true, joinedAt: toISODate(new Date()) },
    ]);
  };

  const removeEmployee = (id: string) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, active: false } : e)));
  };

  const updateEmployee = (emp: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === emp.id ? emp : e)));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        dateLabel={dateLabel}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "dashboard" && <DashboardView employees={employees} records={records} onDateChange={(iso) => { setActiveDate(iso); setActiveTab("sheet"); }} />}
            {activeTab === "sheet" && <AttendanceSheetAndKiosk employees={employees} records={records} date={activeDate} onDateChange={setActiveDate} onUpsertRecord={upsertRecord} />}
            {activeTab === "kiosk" && <AttendanceSheetAndKiosk employees={employees} records={records} date={toISODate(new Date())} onDateChange={setActiveDate} onUpsertRecord={upsertRecord} />}
            {activeTab === "roster" && <RosterAndHistoryView employees={employees} records={records} onAddEmployee={addEmployee} onRemoveEmployee={removeEmployee} onUpdateEmployee={updateEmployee} onUpsertRecord={upsertRecord} />}
            {activeTab === "history" && <RosterAndHistoryView employees={employees} records={records} onAddEmployee={addEmployee} onRemoveEmployee={removeEmployee} onUpdateEmployee={updateEmployee} onUpsertRecord={upsertRecord} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-2 text-center text-[11px] text-slate-400 sm:px-6 dark:text-slate-600">
        WorklyOS · Attendance & workforce insights · Data is stored locally in your browser
      </footer>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}