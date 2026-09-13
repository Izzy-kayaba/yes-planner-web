"use client";

import Link from "next/link";
import { format } from "date-fns";
import { enZA, fr } from "date-fns/locale";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  currentWedding,
  tasks as initialTasks,
  upcomingEvents,
  weddingStats,
} from "@/lib/demo-data";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import type { WeddingTask } from "@/types";

const taskFields = [
  { name: "title", label: "Task", required: true },
  { name: "category", label: "Category", required: true },
  { name: "due", label: "Due date", required: true },
  { name: "assignee", label: "Assignee", required: true },
  {
    name: "priority",
    label: "Priority",
    type: "select" as const,
    options: ["High", "Medium", "Low"],
    required: true,
  },
];

export function DashboardOverview() {
  const { language, t } = useLanguage();
  const {
    items: tasks,
    create,
    update,
  } = useWorkspaceCollection<WeddingTask>("tasks", initialTasks);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  function toggleTask(id: string | number) {
    const task = tasks.find((item) => item.id === id);
    if (task) void update({ ...task, complete: !task.complete });
  }

  async function addTask(values: Record<string, EntityFormValue>) {
    await create({
      ...(values as unknown as Omit<WeddingTask, "id" | "complete">),
      complete: false,
    });
  }

  return (
    <div className="dashboard-stack">
      <PageHeader
        eyebrow={format(new Date(), "EEEE, d MMMM", { locale: language === "fr" ? fr : enZA })}
        title={t("dashboard.greeting", { name: "Amara" })}
        description={t("dashboard.intro")}
        action={
          <Link className="button button-primary" href={`/weddings/${currentWedding.id}`}>
            {t("dashboard.openWedding")} <span>→</span>
          </Link>
        }
      />

      <section className="wedding-banner">
        <div className="banner-copy">
          <StatusPill tone="rose">{t("dashboard.yourWedding")}</StatusPill>
          <h2>{currentWedding.partnerNames}</h2>
          <p>
            {currentWedding.date} <span>·</span> {currentWedding.venue}, {currentWedding.city}
          </p>
          <div className="banner-progress-copy">
            <span>{t("dashboard.planningProgress")}</span>
            <strong>
              {currentWedding.progress}% {t("dashboard.complete")}
            </strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${currentWedding.progress}%` }} />
          </div>
        </div>
        <div className="countdown-block">
          <span>{t("dashboard.only")}</span>
          <strong>{currentWedding.daysRemaining}</strong>
          <em>{t("shell.daysToGo")}</em>
        </div>
        <div className="banner-bloom bloom-one">✦</div>
        <div className="banner-bloom bloom-two">✦</div>
      </section>

      <section className="stats-grid">
        {weddingStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel focus-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("dashboard.focus")}</p>
              <h3>{t("dashboard.momentum")}</h3>
            </div>
            <Link href={`/weddings/${currentWedding.id}/tasks`}>{t("dashboard.viewTasks")} →</Link>
          </div>
          <div className="task-list compact">
            {tasks.slice(0, 4).map((task) => (
              <button
                className={`task-row ${task.complete ? "complete" : ""}`}
                key={task.id}
                onClick={() => toggleTask(task.id)}
              >
                <span className="check-box">{task.complete ? "✓" : ""}</span>
                <span className="task-copy">
                  <strong>{task.title}</strong>
                  <small>
                    {task.category} · {task.assignee}
                  </small>
                </span>
                <span className={`priority priority-${task.priority.toLowerCase()}`}>
                  {task.due}
                </span>
              </button>
            ))}
          </div>
          <button className="add-row-button" onClick={() => setTaskDialogOpen(true)}>
            ＋ {t("dashboard.addTask")}
          </button>
        </article>

        <article className="panel schedule-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("dashboard.comingUp")}</p>
              <h3>{t("dashboard.nextMoments")}</h3>
            </div>
            <Link className="text-link text-xs" href={`/weddings/${currentWedding.id}/timeline`}>
              View
            </Link>
          </div>
          <div className="event-list">
            {upcomingEvents.map((event) => (
              <div className="event-row" key={event.title}>
                <div className={`date-tile tone-${event.color}`}>
                  <strong>{event.day}</strong>
                  <span>{event.month}</span>
                </div>
                <div>
                  <strong>{event.title}</strong>
                  <span>{event.meta}</span>
                </div>
                <Link
                  href={`/weddings/${currentWedding.id}/timeline`}
                  aria-label={`View ${event.title}`}
                >
                  ›
                </Link>
              </div>
            ))}
          </div>
          <Link
            className="button button-secondary button-wide"
            href={`/weddings/${currentWedding.id}/timeline`}
          >
            {t("dashboard.openCalendar")}
          </Link>
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel vendor-pulse">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Vendor pulse</p>
              <h3>Almost all set</h3>
            </div>
            <span className="large-fraction">
              8<small>/11</small>
            </span>
          </div>
          <div className="segmented-progress">
            {Array.from({ length: 11 }, (_, index) => (
              <span className={index < 8 ? "filled" : ""} key={index} />
            ))}
          </div>
          <div className="missing-vendors">
            <span>Still looking for</span>
            <div>
              <StatusPill tone="gold">Transport</StatusPill>
              <StatusPill tone="gold">Cake</StatusPill>
              <StatusPill tone="gold">Stationery</StatusPill>
            </div>
          </div>
          <Link href="/marketplace">Explore recommended vendors →</Link>
        </article>
        <article className="panel activity-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Shared workspace</p>
              <h3>Recent activity</h3>
            </div>
            <div className="avatar-stack small">
              <span>AM</span>
              <span>SM</span>
              <span>LM</span>
            </div>
          </div>
          <div className="activity-list">
            <div>
              <span className="activity-dot rose">♡</span>
              <p>
                <strong>Lerato</strong> updated the venue timeline<small>18 minutes ago</small>
              </p>
            </div>
            <div>
              <span className="activity-dot sage">✓</span>
              <p>
                <strong>Sipho</strong> approved the catering quote<small>2 hours ago</small>
              </p>
            </div>
            <div>
              <span className="activity-dot gold">R</span>
              <p>
                <strong>Naledi Molefe</strong> confirmed attendance<small>Yesterday</small>
              </p>
            </div>
          </div>
        </article>
      </section>
      <EntityDialog
        open={taskDialogOpen}
        title="Add task"
        fields={taskFields}
        initialValues={{ priority: "Medium" }}
        onClose={() => setTaskDialogOpen(false)}
        onSave={addTask}
      />
    </div>
  );
}
