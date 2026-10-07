"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { SearchField } from "@/components/forms/SearchField";
import { StatusPill } from "@/components/ui/StatusPill";
import { Pagination } from "@/components/ui/Pagination";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { tasks as taskSeed } from "@/lib/demo-data";
import type { WeddingTask } from "@/types";

const fields = [
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

export function TasksSection() {
  const { text } = useLanguage();
  const { items, create, update, remove, page, setPage, pagination } =
    useWorkspaceCollection<WeddingTask>("tasks", taskSeed);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<WeddingTask | null>(null);
  const [open, setOpen] = useState(false);
  const shown = items.filter(
    (task) =>
      (filter === "All" || (filter === "Completed" ? task.complete : !task.complete)) &&
      `${task.title} ${task.category} ${task.assignee}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function save(values: Record<string, EntityFormValue>) {
    const input = {
      ...(values as unknown as Omit<WeddingTask, "id" | "complete">),
      complete: editing?.complete ?? false,
    };
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }

  return (
    <section className="panel">
      <div className="table-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Search tasks" />
        <div className="filter-tabs">
          {["All", "Open", "Completed"].map((item) => (
            <button
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
              key={item}
            >
              {text(item)}
            </button>
          ))}
        </div>
        <button
          className="button button-primary"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus size={15} /> {text("Add task")}
        </button>
      </div>
      <div className="task-list">
        {shown.map((task) => (
          <div className={`task-row ${task.complete ? "complete" : ""}`} key={task.id}>
            <button
              className="check-box"
              aria-label={`${text("Mark")} ${text(task.title)} ${text(task.complete ? "open" : "complete")}`}
              onClick={() => void update({ ...task, complete: !task.complete })}
            >
              {task.complete ? "✓" : ""}
            </button>
            <span className="task-copy">
              <strong>{text(task.title)}</strong>
              <small>
                {text(task.category)} · {text("Assigned to")} {task.assignee}
              </small>
            </span>
            <StatusPill
              tone={
                task.priority === "High" ? "rose" : task.priority === "Medium" ? "gold" : "neutral"
              }
            >
              {task.priority}
            </StatusPill>
            <span className="task-due">{text(task.due)}</span>
            <span className="flex gap-1">
              <button
                className="icon-button"
                onClick={() => {
                  setEditing(task);
                  setOpen(true);
                }}
                aria-label={`${text("Edit")} ${text(task.title)}`}
              >
                <Pencil size={14} />
              </button>
              <button
                className="icon-button"
                onClick={() => {
                  if (window.confirm(`${text("Delete")} ${text(task.title)}?`))
                    void remove(task.id);
                }}
                aria-label={`${text("Delete")} ${text(task.title)}`}
              >
                <Trash2 size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>
      <Pagination
        page={page}
        pageSize={pagination.pageSize}
        total={pagination.totalItems}
        onChange={setPage}
      />
      <EntityDialog
        open={open}
        title={editing ? "Edit task" : "Add task"}
        fields={fields}
        initialValues={editing ?? { priority: "Medium" }}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </section>
  );
}
