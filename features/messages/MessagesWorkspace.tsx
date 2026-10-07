"use client";

import { ImageIcon, Search, Send } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult, Pagination as PaginationMetadata } from "@/lib/api/contracts";
import { formatDate } from "@/lib/date-time";
import { getInitials } from "@/lib/initials";
import { CharacterCount } from "@/components/forms/CharacterCount";
import { Pagination } from "@/components/ui/Pagination";

type Conversation = {
  id: string;
  participantUserId: string;
  weddingKey: string;
  name: string;
  image: string;
  service: string;
  unreadCount: number;
};
type Message = { id: string; body: string; sentByMe: boolean; createdAt: string };

export function MessagesWorkspace() {
  const { language, text } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationPage, setConversationPage] = useState(1);
  const [conversationPagination, setConversationPagination] = useState<PaginationMetadata>({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [messagePage, setMessagePage] = useState(1);
  const [messagePagination, setMessagePagination] = useState<PaginationMetadata>({
    page: 1,
    pageSize: 50,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadThread = useCallback(async (conversation: Conversation, page = 1) => {
    const params = new URLSearchParams({
      participantUserId: conversation.participantUserId,
      weddingKey: conversation.weddingKey,
      page: String(page),
      pageSize: "50",
    });
    const result = await apiRequest<PaginatedResult<Message>>(`/api/v1/messages?${params}`, {
      cache: "no-store",
    });
    setMessages(result.items);
    setMessagePagination(result.pagination);
    setMessagePage(result.pagination.page);
  }, []);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(conversationPage),
          pageSize: "25",
        });
        const result = await apiRequest<PaginatedResult<Conversation>>(
          `/api/v1/messages?${params}`,
          { cache: "no-store" },
        );
        setConversations(result.items);
        setConversationPagination(result.pagination);
        const target = result.items.find((item) => item.id === activeId) ?? result.items[0];
        setActiveId(target?.id ?? "");
        if (target) await loadThread(target, messagePage);
        else setMessages([]);
      } catch (error) {
        if (!quiet)
          toast.error(
            text(error instanceof Error ? error.message : "Messages could not be loaded."),
          );
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [activeId, conversationPage, loadThread, messagePage, text],
  );

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 5_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const active = conversations.find((item) => item.id === activeId);
  const filtered = useMemo(
    () =>
      conversations.filter((item) =>
        `${item.name} ${item.service}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [conversations, query],
  );

  async function selectConversation(conversation: Conversation) {
    setActiveId(conversation.id);
    setMessagePage(1);
    try {
      await loadThread(conversation, 1);
      if (conversation.unreadCount) {
        await apiRequest("/api/v1/messages", {
          method: "PATCH",
          body: JSON.stringify({
            participantUserId: conversation.participantUserId,
            weddingKey: conversation.weddingKey,
          }),
        });
        await load(true);
      }
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "Messages could not be loaded."));
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !body.trim()) return;
    setSending(true);
    try {
      await apiRequest("/api/v1/messages", {
        method: "POST",
        body: JSON.stringify({
          recipientUserId: active.participantUserId,
          weddingKey: active.weddingKey,
          body,
        }),
      });
      setBody("");
      await load(true);
    } catch (error) {
      toast.error(text(error instanceof Error ? error.message : "Message could not be sent."));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="panel messages-loading">{text("Loading messages…")}</div>;
  if (!conversations.length) {
    return (
      <div className="panel messages-empty">
        <ImageIcon size={28} />
        <h2>{text("No conversations yet")}</h2>
        <p>{text("An accepted vendor request will open a private conversation here.")}</p>
      </div>
    );
  }

  return (
    <section className="messages-panel">
      <aside>
        <label className="table-search">
          <Search size={15} />
          <input
            id="conversation-search"
            name="conversationSearch"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text("Search conversations")}
          />
        </label>
        {filtered.map((conversation) => (
          <button
            className={conversation.id === activeId ? "active" : ""}
            key={conversation.id}
            onClick={() => void selectConversation(conversation)}
            type="button"
          >
            <span className="avatar">
              {conversation.image ? (
                <Image alt="" fill src={conversation.image} unoptimized />
              ) : (
                getInitials(conversation.name)
              )}
            </span>
            <p>
              <strong>{conversation.name}</strong>
              <small>{text(conversation.service)}</small>
            </p>
            {conversation.unreadCount > 0 && (
              <b className="message-unread">{conversation.unreadCount}</b>
            )}
          </button>
        ))}
        <Pagination
          page={conversationPagination.page}
          pageSize={conversationPagination.pageSize}
          total={conversationPagination.totalItems}
          onChange={setConversationPage}
        />
      </aside>
      {active && (
        <article>
          <header className="chat-header">
            <span className="avatar">{getInitials(active.name)}</span>
            <p>
              <strong>{active.name}</strong>
              <small>{text(active.service)}</small>
            </p>
          </header>
          <div className="chat-body">
            {messages.length ? (
              messages.map((message) => (
                <div
                  className={`message ${message.sentByMe ? "sent" : "received"}`}
                  key={message.id}
                >
                  <p>{message.body}</p>
                  <time>{formatDate(message.createdAt, "D MMM · HH:mm", language)}</time>
                </div>
              ))
            ) : (
              <p className="messages-conversation-empty">{text("Start the conversation.")}</p>
            )}
            <Pagination
              page={messagePage}
              pageSize={messagePagination.pageSize}
              total={messagePagination.totalItems}
              onChange={(page) => {
                setMessagePage(page);
                void loadThread(active, page).catch((error: unknown) =>
                  toast.error(
                    text(error instanceof Error ? error.message : "Messages could not be loaded."),
                  ),
                );
              }}
            />
          </div>
          <form className="message-compose" onSubmit={send}>
            <input
              aria-label={text("Message")}
              id="message-body"
              maxLength={2000}
              name="messageBody"
              onChange={(event) => setBody(event.target.value)}
              placeholder={text("Write a message…")}
              value={body}
            />
            <button
              className="send-button"
              disabled={sending || !body.trim()}
              type="submit"
              aria-label={text("Send message")}
            >
              <Send size={16} />
            </button>
            <CharacterCount value={body} max={2000} />
          </form>
        </article>
      )}
    </section>
  );
}
