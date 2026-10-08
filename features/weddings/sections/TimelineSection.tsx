"use client";

import moment from "moment";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EntityDialog, type EntityFormValue } from "@/components/forms/EntityDialog";
import { Pagination } from "@/components/ui/Pagination";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { useConfirmation } from "@/hooks/useConfirmation";

type TimelineEvent = {
  id: string | number;
  date: string;
  time: string;
  title: string;
  who: string;
  tone: string;
};
const seed: TimelineEvent[] = [
  {
    id: 1,
    date: "2026-10-18",
    time: "09:00",
    title: "Hair & makeup begins",
    who: "Bridal suite",
    tone: "rose",
  },
  {
    id: 2,
    date: "2026-10-18",
    time: "12:30",
    title: "Photography detail shots",
    who: "Lumen & Lace",
    tone: "gold",
  },
  { id: 3, date: "2026-10-18", time: "15:00", title: "Ceremony", who: "All guests", tone: "blue" },
];
const fields = [
  { name: "title", label: "Event title", required: true },
  { name: "date", label: "Date", type: "date" as const, required: true },
  { name: "time", label: "Time", type: "time" as const, required: true },
  { name: "who", label: "People or location", required: true },
  {
    name: "tone",
    label: "Colour",
    type: "select" as const,
    options: ["rose", "sage", "gold", "blue"],
    required: true,
  },
];

export function TimelineSection() {
  const { language, text } = useLanguage();
  const { items, create, update, remove, page, setPage, pagination } =
    useWorkspaceCollection<TimelineEvent>("timeline", seed);
  const [month, setMonth] = useState(() => moment().startOf("month").toDate());
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [open, setOpen] = useState(false);
  const confirmation = useConfirmation();
  const days = useMemo(() => {
    const count = moment(month).daysInMonth();
    return Array.from({ length: count }, (_, index) => moment(month).date(index + 1));
  }, [month]);
  const padding = (moment(month).startOf("month").day() + 6) % 7;

  async function save(values: Record<string, EntityFormValue>) {
    const input = values as unknown as Omit<TimelineEvent, "id">;
    if (editing) await update({ ...input, id: editing.id });
    else await create(input);
  }

  return (
    <section className="dashboard-grid timeline-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Planning calendar")}</p>
            <h3>{moment(month).locale(language).format("MMMM YYYY")}</h3>
          </div>
          <div className="flex gap-2">
            <button
              className="icon-button"
              onClick={() => setMonth((value) => moment(value).subtract(1, "month").toDate())}
              aria-label={text("Previous month")}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="icon-button"
              onClick={() => setMonth((value) => moment(value).add(1, "month").toDate())}
              aria-label={text("Next month")}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="calendar">
          <div className="calendar-days">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day}>{text(day)}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: padding }, (_, index) => (
              <span key={`blank-${index}`} />
            ))}
            {days.map((day) => {
              const date = day.format("YYYY-MM-DD");
              return (
                <button
                  className={items.some((item) => item.date === date) ? "has-event" : ""}
                  key={date}
                  onClick={() => {
                    setEditing(null);
                    setOpen(true);
                  }}
                >
                  {day.format("D")}
                </button>
              );
            })}
          </div>
        </div>
      </article>
      <article className="panel day-timeline">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{text("Events")}</p>
            <h3>{text("Wedding schedule")}</h3>
          </div>
          <button
            className="button button-primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus size={15} /> {text("Add event")}
          </button>
        </div>
        {[...items]
          .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
          .map((event) => (
            <div className="timeline-row" key={event.id}>
              <time>{event.time}</time>
              <span className={`timeline-pin tone-${event.tone}`} />
              <p>
                <strong>{text(event.title)}</strong>
                <small>
                  {moment(`${event.date}T${event.time}`).locale(language).format("D MMM · HH:mm")}{" "}
                  {text(event.who)}
                </small>
              </p>
              <span className="flex gap-1">
                <button
                  className="icon-button"
                  onClick={() => {
                    setEditing(event);
                    setOpen(true);
                  }}
                  aria-label={`${text("Edit")} ${text(event.title)}`}
                >
                  <Pencil size={13} />
                </button>
                <button
                  className="icon-button"
                  onClick={() =>
                    void confirmation
                      .confirm({
                        description: `${text("Delete")} ${text(event.title)}?`,
                        confirmLabel: "Delete",
                      })
                      .then((confirmed) => {
                        if (confirmed) void remove(event.id);
                      })
                  }
                  aria-label={`${text("Delete")} ${text(event.title)}`}
                >
                  <Trash2 size={13} />
                </button>
              </span>
            </div>
          ))}
      </article>
      <Pagination
        page={page}
        pageSize={pagination.pageSize}
        total={pagination.totalItems}
        onChange={setPage}
      />
      <EntityDialog
        open={open}
        title={editing ? "Edit event" : "Add event"}
        fields={fields}
        initialValues={
          editing ?? { date: moment(month).format("YYYY-MM-DD"), time: "12:00", tone: "rose" }
        }
        onClose={() => setOpen(false)}
        onSave={save}
      />
      {confirmation.dialog}
    </section>
  );
}
