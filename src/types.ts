export type AttendanceStatus =
  | "present"
  | "late"
  | "absent"
  | "half-day"
  | "excused"
  | "on-leave";

export type BreakState = "none" | "on-break" | "working";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  employeeId: string; // unique badge / PIN
  pin: string; // kiosk quick punch
  avatarColor: string; // tailwind bg class
  shiftStart: string; // "09:00"
  shiftEnd: string; // "18:00"
  active: boolean;
  joinedAt: string; // ISO date
  location: string; // office / remote
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime: string | null; // "09:04"
  checkOutTime: string | null;
  location: string; // "Office - HQ" | "Remote - Home"
  workHours: number;
  breakState: BreakState;
  breakMinutes: number;
  notes: string;
}

export interface Department {
  name: string;
  color: string; // tailwind bg class
}

export type TabKey = "dashboard" | "sheet" | "roster" | "kiosk" | "history";

export interface DailySummary {
  date: string;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  excused: number;
  onLeave: number;
  attendanceRate: number; // % computed as (present + late + half) / active employees
  totalHours: number;
}

export interface FilterState {
  query: string;
  department: string; // "all" or department name
  status: string; // "all" or status key
  dateFrom: string;
  dateTo: string;
}