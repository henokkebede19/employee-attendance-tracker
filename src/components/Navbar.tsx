import { CalendarDays, ClipboardList, Clock, History, LayoutDashboard, Moon, Sun, Users } from "lucide-react";
import { cn } from "../lib/utils";
import type { TabKey } from "../types";

interface NavbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  dateLabel: string;
}

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "sheet", label: "Daily Log Sheet", icon: ClipboardList },
  { key: "roster", label: "Employee Roster", icon: Users },
  { key: "kiosk", label: "Check-In Portal", icon: Clock },
  { key: "history", label: "History & Reports", icon: History },
];

export function Navbar({ activeTab, onTabChange, theme, onToggleTheme, dateLabel }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-sm shadow-indigo-500/30">
            <CalendarDays className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">WorklyOS</p>
            <p className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:block dark:text-slate-500">
              Attendance Management
            </p>
          </div>
        </div>

        <nav className="mx-auto hidden items-center gap-1 rounded-xl bg-slate-100 p-1 md:flex dark:bg-slate-900">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all",
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              <tab.icon className="h-3.5 w-3.5" strokeWidth={2} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <div className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm lg:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-500" strokeWidth={2} />
            {dateLabel}
          </div>
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-cyan-400"
          >
            {theme === "light" ? <Moon className="h-4 w-4" strokeWidth={2} /> : <Sun className="h-4 w-4" strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto border-t border-slate-200 px-3 py-2 md:hidden dark:border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === tab.key
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "text-slate-500 dark:text-slate-400",
            )}
          >
            <tab.icon className="h-3.5 w-3.5" strokeWidth={2} />
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}