"use client";

import { useMemo, useState } from "react";
import { X, Users, ClipboardList, Clock, CheckCircle2, CalendarDays, ArrowLeft, ChevronLeft, ChevronRight, FolderTree, History, ShieldCheck, FilePlus2, Folder, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { TreeNode } from "@/lib/types";
import { ROLE_META, TASK_STATUS_META, isTaskOpen, type Role, type TaskStatus } from "@/lib/types";

const ROLES: Role[] = ["author", "co-author", "user", "viewer"];

const STATUS_ORDER: TaskStatus[] = ["pending", "in_progress", "needs_review", "approved", "rejected"];

function startOfDay(d: number): number {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt.getTime();
}

/** Admin dashboard: team roster + task KPIs + hand-drawn SVG charts (status
 *  donut, per-user load, 7-day activity). Reads live from the local store. */
export function AdminDashboard() {
  const open = useStore((s) => s.adminDashboardOpen);
  const setOpen = useStore((s) => s.setAdminDashboardOpen);
  const users = useStore((s) => s.users);
  const editTasks = useStore((s) => s.editTasks);
  const setUserRole = useStore((s) => s.setUserRole);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [interval, setInterval] = useState<"7d" | "30d" | "all">("7d");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [dateMember, setDateMember] = useState<string | null>(null);

  const windowStart = interval === "all" ? 0 : startOfDay(Date.now() - (interval === "7d" ? 6 : 29) * 86400000);
  const intervalLabel = interval === "7d" ? "last 7 days" : interval === "30d" ? "last 30 days" : "all time";

  const stats = useMemo(() => {
    const inWindow = editTasks.filter((t) => t.ts >= windowStart);
    const assigned = inWindow.length;
    const pending = inWindow.filter((t) => isTaskOpen(t.status)).length;
    const completed = inWindow.filter((t) => t.status === "approved").length;
    const rejected = inWindow.filter((t) => t.status === "rejected").length;

    const byStatus = STATUS_ORDER.map((s) => ({ status: s, count: inWindow.filter((t) => t.status === s).length }));

    const perUser = users.map((u) => {
      const tasks = inWindow.filter((t) => t.assigneeId === u.id);
      return {
        user: u,
        total: tasks.length,
        open: tasks.filter((t) => isTaskOpen(t.status)).length,
        done: tasks.filter((t) => t.status === "approved").length,
      };
    });

    const days: { label: string; count: number }[] = [];
    const span = interval === "30d" ? 30 : 7;
    for (let i = span - 1; i >= 0; i--) {
      const dayStart = startOfDay(Date.now() - i * 86400000);
      const dayEnd = dayStart + 86400000;
      days.push({
        label: new Date(dayStart).toLocaleDateString(undefined, { weekday: "short" }),
        count: editTasks.filter((t) => t.ts >= dayStart && t.ts < dayEnd).length,
      });
    }

    return { assigned, pending, completed, rejected, byStatus, perUser, days, total: inWindow.length };
  }, [users, editTasks, windowStart, interval]);

  if (!open) return null;

  const kpis = [
    { icon: Users, label: "Team members", value: users.length, color: "#5b9ddd" },
    { icon: CalendarDays, label: `Assigned · ${intervalLabel}`, value: stats.assigned, color: "#ef9f27" },
    { icon: Clock, label: "Pending tasks", value: stats.pending, color: "#7f77dd" },
    { icon: CheckCircle2, label: "Completed", value: stats.completed, color: "#5dca8f" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin dashboard"
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(900px, 100%)", maxHeight: "90vh", overflowY: "auto", background: "var(--bg-elev)", border: "1px solid var(--border-strong)", borderRadius: 18 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg-elev)", zIndex: 1 }}>
          <ClipboardList size={18} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 600 }}>Admin dashboard</span>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Team activity & task tracking</span>
          <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: "auto", color: "var(--text-secondary)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {selectedUser ? (
          <UserDetail
            userId={selectedUser}
            users={users}
            tasks={editTasks}
            onBack={() => setSelectedUser(null)}
            onRole={(r) => setUserRole(selectedUser, r)}
          />
        ) : (
          <div style={{ padding: 20 }}>
            {/* Interval selector — performance metrics over time windows */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Performance over</span>
              {(["7d", "30d", "all"] as const).map((iv) => (
                <button
                  key={iv}
                  onClick={() => setInterval(iv)}
                  style={{ fontSize: 12, padding: "5px 11px", borderRadius: 999, border: interval === iv ? "1px solid var(--accent)" : "1px solid var(--border)", background: interval === iv ? "var(--accent-soft)" : "var(--bg-elev-2)", color: interval === iv ? "var(--accent)" : "var(--text-secondary)" }}
                >
                  {iv === "7d" ? "Last 7 days" : iv === "30d" ? "Last 30 days" : "All time"}
                </button>
              ))}
              <button
                onClick={() => { setShowCalendar((v) => !v); setSelectedDate(null); setDateMember(null); }}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 12px", borderRadius: 8, border: showCalendar ? "1px solid var(--accent)" : "1px solid var(--border-strong)", color: showCalendar ? "var(--accent)" : "var(--text-secondary)" }}
              >
                <CalendarDays size={14} /> {showCalendar ? "Hide calendar" : "Calendar"}
              </button>
            </div>

            {/* KPI cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {kpis.map((k) => (
                <div key={k.label} style={{ background: "var(--bg-elev-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: k.color }}>
                    <k.icon size={16} />
                    <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{k.label}</span>
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 700, marginTop: 6, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
              <Panel title="Task status breakdown">
                <StatusDonut data={stats.byStatus} total={stats.total} />
              </Panel>
              <Panel title={`Activity — ${intervalLabel}`}>
                <ActivityBars days={stats.days} />
              </Panel>
            </div>

            <Panel title="Tasks by team member">
              <UserBars perUser={stats.perUser} />
            </Panel>

            {/* Calendar — only on demand; click a date to drill into that day */}
            {showCalendar && (
              <div style={{ marginTop: 18 }}>
                <Panel title="Task history calendar">
                  {selectedDate ? (
                    <DayDetail
                      date={selectedDate}
                      tasks={editTasks}
                      users={users}
                      member={dateMember}
                      onMember={setDateMember}
                      onBack={() => { setSelectedDate(null); setDateMember(null); }}
                    />
                  ) : (
                    <Calendar
                      month={calMonth}
                      tasks={editTasks}
                      onPick={(d) => { setSelectedDate(d); setDateMember(null); }}
                      onPrev={() => setCalMonth((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
                      onNext={() => setCalMonth((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
                    />
                  )}
                </Panel>
              </div>
            )}

            {/* User roster — click a user for details; change roles inline */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                Team members <span style={{ textTransform: "none" }}>· click a row for details</span>
              </div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                {stats.perUser.map((row, i) => (
                  <div key={row.user.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: i ? "1px solid var(--border)" : "none" }}>
                    <button onClick={() => setSelectedUser(row.user.id)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, textAlign: "left" }}>
                      <span style={{ width: 28, height: 28, borderRadius: "50%", background: row.user.color, color: "#16161a", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {row.user.name.charAt(0)}
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{row.user.name}</span>
                    </button>
                    <select
                      value={row.user.role}
                      onChange={(e) => setUserRole(row.user.id, e.target.value as Role)}
                      onClick={(e) => e.stopPropagation()}
                      title="Change role"
                      style={{ fontSize: 12, padding: "5px 8px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--bg-elev)", color: "var(--text-secondary)" }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_META[r].label}</option>
                      ))}
                    </select>
                    <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
                      <Stat label="Assigned" value={row.total} />
                      <Stat label="Open" value={row.open} color="var(--accent)" />
                      <Stat label="Done" value={row.done} color="var(--success)" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <TeamGovernance />
      </div>
    </div>
  );
}

function UserDetail({
  userId,
  users,
  tasks,
  onBack,
  onRole,
}: {
  userId: string;
  users: { id: string; name: string; color: string; role: Role }[];
  tasks: import("@/lib/types").EditTask[];
  onBack: () => void;
  onRole: (r: Role) => void;
}) {
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  const mine = tasks.filter((t) => t.assigneeId === userId).sort((a, b) => b.ts - a.ts);
  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
        <ArrowLeft size={15} /> Back to overview
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <span style={{ width: 48, height: 48, borderRadius: "50%", background: user.color, color: "#16161a", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {user.name.charAt(0)}
        </span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>{user.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>{mine.length} task{mine.length === 1 ? "" : "s"} assigned</div>
        </div>
        <label style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "var(--text-tertiary)" }}>
          Role
          <select value={user.role} onChange={(e) => onRole(e.target.value as Role)} style={{ fontSize: 13, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--bg-elev)", color: "var(--text)" }}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_META[r].label}</option>
            ))}
          </select>
        </label>
      </div>

      {(() => {
        const completed = mine.filter((t) => t.status === "approved").length;
        const pending = mine.filter((t) => isTaskOpen(t.status)).length;
        const rejected = mine.filter((t) => t.status === "rejected").length;
        const reviewed = completed + rejected;
        const rate = reviewed ? Math.round((completed / reviewed) * 100) : 0;
        const reviews = mine.filter((t) => t.kind === "review").length;
        const insight =
          mine.length === 0
            ? "No tasks yet."
            : pending === 0
              ? "All caught up — no open tasks."
              : `${pending} open · ${rate}% of reviewed work approved${reviews ? ` · ${reviews} review task${reviews === 1 ? "" : "s"}` : ""}.`;
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
              <Insight label="Completed" value={completed} color="var(--success)" />
              <Insight label="Pending" value={pending} color="var(--accent)" />
              <Insight label="Rejected" value={rejected} color="var(--danger)" />
              <Insight label="Approval rate" value={`${rate}%`} color="var(--text)" />
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "var(--bg-elev-3)", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${mine.length ? (completed / mine.length) * 100 : 0}%`, background: "var(--success)" }} />
              <div style={{ width: `${mine.length ? (pending / mine.length) * 100 : 0}%`, background: "var(--accent)" }} />
              <div style={{ width: `${mine.length ? (rejected / mine.length) * 100 : 0}%`, background: "var(--danger)" }} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 }}>📊 {insight}</div>
          </div>
        );
      })()}

      <div style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Assigned tasks</div>
      {mine.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: 16, textAlign: "center", border: "1px dashed var(--border)", borderRadius: 12 }}>No tasks assigned to {user.name}.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {mine.map((t) => {
            const meta = TASK_STATUS_META[t.status];
            return (
              <div key={t.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", background: "var(--bg-elev-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)" }}>#{t.ref ?? "—"}</span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{t.kind === "review" ? "Review" : "Amend"}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 500, padding: "1px 8px", borderRadius: 999, color: meta.color, background: "var(--bg-elev-3)" }}>{meta.label}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text)" }}>{t.note}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>{new Date(t.ts).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Calendar({
  month,
  tasks,
  onPrev,
  onNext,
  onPick,
}: {
  month: { y: number; m: number };
  tasks: import("@/lib/types").EditTask[];
  onPrev: () => void;
  onNext: () => void;
  onPick: (date: number) => void;
}) {
  const first = new Date(month.y, month.m, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const counts: Record<number, number> = {};
  tasks.forEach((t) => {
    const d = new Date(t.ts);
    if (d.getFullYear() === month.y && d.getMonth() === month.m) counts[d.getDate()] = (counts[d.getDate()] ?? 0) + 1;
  });
  const max = Math.max(1, ...Object.values(counts));
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === month.y && today.getMonth() === month.m && today.getDate() === d;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={onPrev} style={{ color: "var(--text-secondary)", display: "flex" }}><ChevronLeft size={18} /></button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{first.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
        <button onClick={onNext} style={{ color: "var(--text-secondary)", display: "flex" }}><ChevronRight size={18} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const c = counts[d] ?? 0;
          const intensity = c ? 0.18 + (c / max) * 0.62 : 0;
          return (
            <button
              key={i}
              onClick={() => onPick(new Date(month.y, month.m, d).getTime())}
              title={c ? `${c} task${c === 1 ? "" : "s"} — click to view` : "No tasks"}
              style={{
                aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                borderRadius: 7, fontSize: 11, cursor: "pointer",
                color: c ? "var(--text)" : "var(--text-tertiary)",
                background: c ? `color-mix(in srgb, var(--accent) ${intensity * 100}%, transparent)` : "var(--bg-elev-3)",
                border: isToday(d) ? "1.5px solid var(--accent)" : "1px solid transparent",
              }}
            >
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{d}</span>
              {c > 0 && <span style={{ fontSize: 9, fontWeight: 700 }}>{c}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayDetail({
  date,
  tasks,
  users,
  member,
  onMember,
  onBack,
}: {
  date: number;
  tasks: import("@/lib/types").EditTask[];
  users: { id: string; name: string; color: string; role: Role }[];
  member: string | null;
  onMember: (id: string | null) => void;
  onBack: () => void;
}) {
  const dayStart = startOfDay(date);
  const dayEnd = dayStart + 86400000;
  const dayTasks = tasks.filter((t) => t.ts >= dayStart && t.ts < dayEnd);
  const memberIds = Array.from(new Set(dayTasks.map((t) => t.assigneeId)));
  const dayMembers = users.filter((u) => memberIds.includes(u.id));
  const shown = member ? dayTasks.filter((t) => t.assigneeId === member) : dayTasks;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-secondary)" }}>
          <ArrowLeft size={14} /> Calendar
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{new Date(date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>· {dayTasks.length} task{dayTasks.length === 1 ? "" : "s"}</span>
      </div>

      {/* Member chips — click to filter this day to one member */}
      {dayMembers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <button onClick={() => onMember(null)} style={{ fontSize: 11.5, padding: "4px 10px", borderRadius: 999, border: !member ? "1px solid var(--accent)" : "1px solid var(--border)", background: !member ? "var(--accent-soft)" : "var(--bg-elev)", color: !member ? "var(--accent)" : "var(--text-secondary)" }}>
            Everyone
          </button>
          {dayMembers.map((u) => {
            const active = member === u.id;
            return (
              <button key={u.id} onClick={() => onMember(u.id)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, padding: "4px 10px", borderRadius: 999, border: active ? "1px solid var(--accent)" : "1px solid var(--border)", background: active ? "var(--accent-soft)" : "var(--bg-elev)", color: "var(--text)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: u.color }} />
                {u.name}
                <span style={{ color: "var(--text-tertiary)" }}>{dayTasks.filter((t) => t.assigneeId === u.id).length}</span>
              </button>
            );
          })}
        </div>
      )}

      {shown.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: 14, textAlign: "center", border: "1px dashed var(--border)", borderRadius: 10 }}>No tasks for this selection.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shown.map((t) => {
            const meta = TASK_STATUS_META[t.status];
            const who = users.find((u) => u.id === t.assigneeId);
            return (
              <div key={t.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", background: "var(--bg-elev)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: who?.color ?? "var(--accent)", color: "#16161a", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{who?.name.charAt(0)}</span>
                  <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{who?.name}</span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>#{t.ref ?? "—"}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 500, padding: "1px 8px", borderRadius: 999, color: meta.color, background: "var(--bg-elev-3)" }}>{meta.label}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text)" }}>{t.note}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-elev-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function Insight({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ background: "var(--bg-elev)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}>
      <div style={{ fontSize: 19, fontWeight: 700, color: color ?? "var(--text)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>{label}</div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: color ?? "var(--text)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{label}</div>
    </div>
  );
}

function StatusDonut({ data, total }: { data: { status: TaskStatus; count: number }[]; total: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const colorFor = (s: TaskStatus) => {
    const map: Record<TaskStatus, string> = {
      pending: "#ef9f27",
      in_progress: "#5b9ddd",
      needs_review: "#7f77dd",
      approved: "#5dca8f",
      rejected: "#e24b4a",
    };
    return map[s];
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={R} fill="none" stroke="var(--bg-elev-3)" strokeWidth={16} />
        {total > 0 &&
          data.filter((d) => d.count > 0).map((d) => {
            const frac = d.count / total;
            const dash = frac * C;
            const seg = (
              <circle
                key={d.status}
                cx={70}
                cy={70}
                r={R}
                fill="none"
                stroke={colorFor(d.status)}
                strokeWidth={16}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            );
            offset += dash;
            return seg;
          })}
        <text x={70} y={66} textAnchor="middle" fontSize={26} fontWeight={700} fill="var(--text)">{total}</text>
        <text x={70} y={84} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">tasks</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.map((d) => (
          <div key={d.status} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: colorFor(d.status) }} />
            <span style={{ color: "var(--text-secondary)" }}>{TASK_STATUS_META[d.status].label}</span>
            <span style={{ marginLeft: "auto", fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityBars({ days }: { days: { label: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const H = 120;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: H }}>
      {days.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>{d.count || ""}</span>
          <div
            style={{
              width: "100%",
              height: `${(d.count / max) * (H - 30)}px`,
              minHeight: d.count ? 4 : 2,
              borderRadius: "5px 5px 0 0",
              background: d.count ? "linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 55%, transparent))" : "var(--bg-elev-3)",
            }}
          />
          <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function UserBars({ perUser }: { perUser: { user: { id: string; name: string; color: string }; total: number; open: number; done: number }[] }) {
  const max = Math.max(1, ...perUser.map((u) => u.total));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {perUser.map((row) => (
        <div key={row.user.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 86, fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.user.name}</span>
          <div style={{ flex: 1, height: 18, borderRadius: 6, background: "var(--bg-elev-3)", overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${(row.done / max) * 100}%`, background: "var(--success)" }} title={`${row.done} done`} />
            <div style={{ width: `${(row.open / max) * 100}%`, background: "var(--accent)" }} title={`${row.open} open`} />
          </div>
          <span style={{ width: 22, textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{row.total}</span>
        </div>
      ))}
      <div style={{ display: "flex", gap: 14, marginTop: 2, fontSize: 11, color: "var(--text-tertiary)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--success)" }} /> Completed</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--accent)" }} /> Open</span>
      </div>
    </div>
  );
}

/** Flatten the tree to its folders, with depth for hierarchy indentation. */
function flattenFolders(nodes: TreeNode[], depth = 0, out: { node: TreeNode; depth: number }[] = []) {
  for (const n of nodes) {
    if (n.type === "folder") {
      out.push({ node: n, depth });
      if (n.children) flattenFolders(n.children, depth + 1, out);
    }
  }
  return out;
}

function relTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const PERM_ROLES: Role[] = ["co-author", "user", "viewer"];

/** Team workspace governance: folder/file activity log + per-folder permission
 *  hierarchy (who may create / delete). Author always has full access. */
function TeamGovernance() {
  const activityLog = useStore((s) => s.activityLog);
  const tree = useStore((s) => s.tree);
  const folderPermissionFor = useStore((s) => s.folderPermissionFor);
  const setFolderPermission = useStore((s) => s.setFolderPermission);
  const folders = flattenFolders(tree);

  const toggle = (folderId: string, kind: "create" | "delete", role: Role) => {
    const perm = folderPermissionFor(folderId);
    const list = perm[kind];
    const next = list.includes(role) ? list.filter((r) => r !== role) : [...list, role];
    setFolderPermission(folderId, { ...perm, [kind]: next });
  };

  return (
    <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Activity log */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
          <History size={15} style={{ color: "var(--accent)" }} /> Activity log
        </div>
        {activityLog.length === 0 && <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>No file activity yet.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 260, overflowY: "auto" }}>
          {activityLog.slice(0, 40).map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: a.action === "create" ? "color-mix(in srgb, var(--success) 16%, transparent)" : "color-mix(in srgb, var(--danger) 16%, transparent)", color: a.action === "create" ? "var(--success)" : "var(--danger)" }}>
                {a.action === "create" ? <FilePlus2 size={13} /> : <Trash2 size={13} />}
              </span>
              <span style={{ flex: 1, minWidth: 0, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <strong style={{ color: "var(--text)" }}>{a.userName}</strong> {a.action === "create" ? "created" : "deleted"} {a.nodeType} <em style={{ color: "var(--text)" }}>{a.name}</em>
              </span>
              <span style={{ fontSize: 10.5, color: "var(--text-tertiary)", flexShrink: 0 }}>{relTime(a.at)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Folder permission hierarchy */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
          <ShieldCheck size={15} style={{ color: "var(--accent)" }} /> Folder permissions
        </div>
        <p style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginBottom: 10, lineHeight: 1.5 }}>
          Who may create / delete inside each folder. Settings cascade to subfolders; author always has full access.
        </p>
        {folders.length === 0 && <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>No folders yet.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 260, overflowY: "auto" }}>
          {folders.map(({ node, depth }) => {
            const perm = folderPermissionFor(node.id);
            return (
              <div key={node.id} style={{ marginLeft: depth * 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", marginBottom: 5 }}>
                  {depth > 0 ? <FolderTree size={12} style={{ color: "var(--text-tertiary)" }} /> : <Folder size={12} style={{ color: "var(--text-tertiary)" }} />}
                  {node.name}
                </div>
                {(["create", "delete"] as const).map((kind) => (
                  <div key={kind} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10.5, color: "var(--text-tertiary)", width: 44, textTransform: "capitalize" }}>{kind}</span>
                    {PERM_ROLES.map((r) => {
                      const on = perm[kind].includes(r);
                      return (
                        <button key={r} onClick={() => toggle(node.id, kind, r)} title={`${on ? "Revoke" : "Grant"} ${ROLE_META[r].label}`}
                          style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, border: on ? "1px solid var(--accent)" : "1px solid var(--border)", background: on ? "var(--accent-soft)" : "var(--bg-elev-2)", color: on ? "var(--accent)" : "var(--text-tertiary)" }}>
                          {ROLE_META[r].label}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
