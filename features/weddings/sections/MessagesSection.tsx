"use client";

import { MoreHorizontal, Plus, Send } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SearchField } from "@/components/forms/SearchField";
import { useWorkspaceCollection } from "@/hooks/useWorkspaceCollection";
import { getInitials } from "@/lib/initials";

type Conversation = {
  id: string | number;
  name: string;
  role: string;
  time: string;
  unread: boolean;
  messages: Array<{ author: "me" | "them"; body: string }>;
};
const seed: Conversation[] = [
  {
    id: 1,
    name: "Lerato Maseko",
    role: "Wedding planner",
    time: "09:42",
    unread: true,
    messages: [
      { author: "them", body: "Good morning! I’ve updated the final venue walkthrough timeline." },
      { author: "me", body: "It looks perfect. Sipho and I can be there from 14:15." },
    ],
  },
  {
    id: 2,
    name: "Olive & Oak",
    role: "Caterer",
    time: "Yesterday",
    unread: true,
    messages: [{ author: "them", body: "The tasting menu is attached." }],
  },
  {
    id: 3,
    name: "Lumen & Lace",
    role: "Photographer",
    time: "Mon",
    unread: false,
    messages: [{ author: "them", body: "Perfect, thank you Amara!" }],
  },
];

export function MessagesSection() {
  const { items, update } = useWorkspaceCollection<Conversation>("messages", seed);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | number>(1);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const selected = items.find((item) => String(item.id) === String(selectedId)) ?? items[0];
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = new FormData(form).get("message")?.toString().trim();
    if (!input || !selected) return;
    void update({
      ...selected,
      unread: false,
      time: "Now",
      messages: [...selected.messages, { author: "me", body: input }],
    });
    form.reset();
  }
  const shown = items.filter((item) =>
    `${item.name} ${item.role}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="messages-panel">
      <aside>
        <SearchField value={query} onChange={setQuery} placeholder="Search conversations" />
        {shown.map((chat) => (
          <button
            className={String(chat.id) === String(selected?.id) ? "active" : ""}
            key={chat.id}
            onClick={() => {
              setSelectedId(chat.id);
              if (chat.unread) void update({ ...chat, unread: false });
            }}
          >
            <span className="avatar">{getInitials(chat.name)}</span>
            <p>
              <strong>{chat.name}</strong>
              <small>{chat.role}</small>
              <em>{chat.messages.at(-1)?.body}</em>
            </p>
            <time>{chat.time}</time>
            {chat.unread && <i />}
          </button>
        ))}
      </aside>
      {selected && (
        <article>
          <div className="chat-header">
            <div className="avatar">{getInitials(selected.name)}</div>
            <p>
              <strong>{selected.name}</strong>
              <small>{selected.role} · Active now</small>
            </p>
            <button
              className="icon-button"
              aria-label="Conversation options"
              onClick={() => toast.info("Conversation notifications are enabled.")}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="chat-body">
            <span className="chat-date">Today</span>
            {selected.messages.map((message, index) => (
              <div
                className={`message ${message.author === "me" ? "sent" : "received"}`}
                key={`${selected.id}-${index}`}
              >
                {message.body}
              </div>
            ))}
          </div>
          <form className="message-compose" onSubmit={send}>
            <input
              className="hidden"
              ref={attachmentInput}
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && selected)
                  void update({
                    ...selected,
                    messages: [
                      ...selected.messages,
                      { author: "me", body: `Attached: ${file.name}` },
                    ],
                  });
              }}
            />
            <button
              type="button"
              aria-label="Attach a file"
              onClick={() => attachmentInput.current?.click()}
            >
              <Plus size={16} />
            </button>
            <input name="message" placeholder="Write a message…" required />
            <button className="send-button" type="submit" aria-label="Send message">
              <Send size={15} />
            </button>
          </form>
        </article>
      )}
    </section>
  );
}
