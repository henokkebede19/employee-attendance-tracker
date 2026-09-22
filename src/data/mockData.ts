import type { AttendanceRecord, AttendanceStatus, Department, Employee } from "../types";

export const DEPARTMENTS: Department[] = [
  { name: "Engineering", color: "bg-indigo-500" },
  { name: "Design", color: "bg-cyan-500" },
  { name: "Marketing", color: "bg-fuchsia-500" },
  { name: "Sales", color: "bg-amber-500" },
  { name: "Operations", color: "bg-emerald-500" },
];

export function deptColor(name: string): string {
  return DEPARTMENTS.find((d) => d.name === name)?.color ?? "bg-slate-500";
}

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-blue-500",
  "bg-pink-500",
];

export const SEED_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Amara Okafor", email: "amara.okafor@workly.ai", department: "Engineering", role: "Staff Engineer", employeeId: "EMP-1001", pin: "1011", avatarColor: "bg-indigo-500", shiftStart: "09:00", shiftEnd: "18:00", active: true, joinedAt: "2023-02-13", location: "Office - HQ" },
  { id: "e2", name: "Liam Chen", email: "liam.chen@workly.ai", department: "Engineering", role: "Frontend Lead", employeeId: "EMP-1002", pin: "1022", avatarColor: "bg-sky-500", shiftStart: "09:00", shiftEnd: "18:00", active: true, joinedAt: "2022-11-01", location: "Remote - Home" },
  { id: "e3", name: "Priya Sharma", email: "priya.sharma@workly.ai", department: "Engineering", role: "Backend Engineer", employeeId: "EMP-1003", pin: "1033", avatarColor: "bg-violet-500", shiftStart: "10:00", shiftEnd: "19:00", active: true, joinedAt: "2023-06-20", location: "Office - HQ" },
  { id: "e4", name: "Sofia Marques", email: "sofia.marques@workly.ai", department: "Design", role: "Product Designer", employeeId: "EMP-2001", pin: "2011", avatarColor: "bg-cyan-500", shiftStart: "09:30", shiftEnd: "18:30", active: true, joinedAt: "2023-01-09", location: "Office - HQ" },
  { id: "e5", name: "Diego Alvarez", email: "diego.alvarez@workly.ai", department: "Design", role: "Design Lead", employeeId: "EMP-2002", pin: "2022", avatarColor: "bg-teal-500", shiftStart: "09:00", shiftEnd: "18:00", active: true, joinedAt: "2022-08-15", location: "Remote - Home" },
  { id: "e6", name: "Noah Kim", email: "noah.kim@workly.ai", department: "Marketing", role: "Growth Manager", employeeId: "EMP-3001", pin: "3011", avatarColor: "bg-fuchsia-500", shiftStart: "09:00", shiftEnd: "18:00", active: true, joinedAt: "2023-03-27", location: "Office - HQ" },
  { id: "e7", name: "Lena Fischer", email: "lena.fischer@workly.ai", department: "Marketing", role: "Content Strategist", employeeId: "EMP-3002", pin: "3022", avatarColor: "bg-pink-500", shiftStart: "09:00", shiftEnd: "17:00", active: true, joinedAt: "2023-09-04", location: "Remote - Home" },
  { id: "e8", name: "Marcus Reid", email: "marcus.reid@workly.ai", department: "Sales", role: "Account Executive", employeeId: "EMP-4001", pin: "4011", avatarColor: "bg-amber-500", shiftStart: "08:30", shiftEnd: "17:30", active: true, joinedAt: "2022-12-05", location: "Office - HQ" },
  { id: "e9", name: "Aisha Bello", email: "aisha.bello@workly.ai", department: "Sales", role: "Sales Director", employeeId: "EMP-4002", pin: "4022", avatarColor: "bg-orange-500", shiftStart: "09:00", shiftEnd: "18:00", active: true, joinedAt: "2021-05-17", location: "Office - HQ" },
  { id: "e10", name: "Tom O'Reilly", email: "tom.oreilly@workly.ai", department: "Operations", role: "Ops Coordinator", employeeId: "EMP-5001", pin: "5011", avatarColor: "bg-emerald-500", shiftStart: "08:00", shiftEnd: "16:30", active: true, joinedAt: "2023-08-21", location: "Office - HQ" },
  { id: "e11", name: "Yuki Tanaka", email: "yuki.tanaka@workly.ai", department: "Operations", role: "HR Generalist", employeeId: "EMP-5002", pin: "5022", avatarColor: "bg-blue-500", shiftStart: "09:00", shiftEnd: "18:00", active: true, joinedAt: "2023-04-03", location: "Office - HQ" },
  { id: "e12", name: "Ravi Patel", email: "ravi.patel@workly.ai", department: "Engineering", role: "QA Engineer", employeeId: "EMP-1004", pin: "1044", avatarColor: "bg-rose-500", shiftStart: "09:30", shiftEnd: "18:00", active: false, joinedAt: "2024-01-08", location: "Remote - Home" },
];

/* ---------- Date helpers ---------- */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function isWeekend(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

/* ---------- Seed generation for past 30 days ---------- */

const STATUS_POOL: { status: AttendanceStatus; w: number }[] = [
  { status: "present", w: 58 },
  { status: "late", w: 15 },
  { status: "absent", w: 9 },
  { status: "half-day", w: 6 },
  { status: "excused", w: 7 },
  { status: "on-leave", w: 5 },
];

function pickStatus(seed: number): AttendanceStatus {
  let acc = 0;
  const r = (Math.sin(seed) * 10000) % 1;
  const roll = r < 0 ? r + 1 : r;
  for (const s of STATUS_POOL) {
    acc += s.w;
    if (roll * 100 <= acc) return s.status;
  }
  return "present";
}

export function seedAttendance(employees: Employee[], days = 30): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  let seq = 0;
  for (let i = days - 1; i >= 0; i--) {
    const date = toISODate(addDays(today, -i));
    if (isWeekend(date)) continue;
    for (const emp of employees) {
      if (!emp.active) continue;
      seq += 1;
      const seed = seq * 7919 + i * 104729;
      let status = pickStatus(seed);
      // Ensure deterministic realistic spread: force some known labels across the window
      if (i === 0 && (emp.employeeId === "EMP-1002" || emp.employeeId === "EMP-4001")) status = "late";
      if (i === 0 && (emp.employeeId === "EMP-1004" || emp.employeeId === "EMP-5002")) status = "absent";
      if (i === 1 && emp.employeeId === "EMP-3001") status = "half-day";
      if (i === 2 && emp.employeeId === "EMP-2002") status = "on-leave";
      const [sh, sm] = emp.shiftStart.split(":").map(Number);
      const [eh, em] = emp.shiftEnd.split(":").map(Number);

      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let workHours = 0;
      let breakMinutes = 0;
      let location = emp.location;

      if (status === "present" || status === "late" || status === "half-day") {
        const lateMins = status === "late" ? 8 + (seed % 27) : 0;
        const totalMinsIn = sh * 60 + sm + lateMins + (seed % 6);
        checkIn = `${String(Math.floor(totalMinsIn / 60)).padStart(2, "0")}:${String(totalMinsIn % 60).padStart(2, "0")}`;
        const workedMins =
          status === "half-day"
            ? 240 + (seed % 60)
            : Math.max(eh * 60 + em - totalMinsIn - 60, 300 + (seed % 90));
        checkOut = `${String(Math.floor((totalMinsIn + workedMins) / 60)).padStart(2, "0")}:${String(
          (totalMinsIn + workedMins) % 60,
        ).padStart(2, "0")}`;
        workHours = Math.round((workedMins / 60) * 100) / 100;
        breakMinutes = status === "half-day" ? 20 : 45 + (seed % 30);
        location = emp.location === "Remote - Home" && seed % 3 !== 0 ? "Remote - Home" : "Office - HQ";
      }

      let notes = "";
      if (status === "excused") notes = "Pre-approved absence";
      if (status === "on-leave") notes = seed % 2 ? "Annual leave" : "Sick leave";
      if (i === 0 && status === "late") notes = "Traffic delay";

      records.push({
        id: `att-${seq}`,
        employeeId: emp.id,
        date,
        status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        location,
        workHours,
        breakState: "none",
        breakMinutes,
        notes,
      });
    }
  }
  return records;
}

/* ---------- Persistence ---------- */

const EMP_KEY = "workly_employees_v1";
const ATT_KEY = "workly_attendance_v1";

export function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(EMP_KEY);
    if (raw) return JSON.parse(raw) as Employee[];
  } catch {
    /* ignore corrupted storage */
  }
  return SEED_EMPLOYEES;
}

export function saveEmployees(emps: Employee[]): void {
  localStorage.setItem(EMP_KEY, JSON.stringify(emps));
}

export function loadAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATT_KEY);
    if (raw) return JSON.parse(raw) as AttendanceRecord[];
  } catch {
    /* ignore corrupted storage */
  }
  return seedAttendance(SEED_EMPLOYEES, 30);
}

export function saveAttendance(records: AttendanceRecord[]): void {
  localStorage.setItem(ATT_KEY, JSON.stringify(records));
}