"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { systemCopy } from "@/lib/copy/system-copy";
import type { NotificationEvent } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils";

type NotificationInboxProps = {
  initialEvents: NotificationEvent[];
};

function groupByLane(events: NotificationEvent[]) {
  const grouped = new Map<string, NotificationEvent[]>();

  for (const event of events) {
    const lane = event.lane ?? "quiet_digest";
    if (!grouped.has(lane)) {
      grouped.set(lane, []);
    }
    grouped.get(lane)?.push(event);
  }

  return [...grouped.entries()];
}

export function NotificationInbox({ initialEvents }: NotificationInboxProps) {
  const [events, setEvents] = useState(initialEvents);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const groupedEvents = useMemo(() => groupByLane(events), [events]);

  const updateEvent = (nextEvent: NotificationEvent) => {
    setEvents((current) =>
      current.map((event) => (event.id === nextEvent.id ? nextEvent : event))
    );
  };

  const submitAction = (eventId: string, action: "read" | "dismiss") => {
    startTransition(async () => {
      const response = await fetch(
        action === "read"
          ? `/api/notifications/${eventId}/read`
          : `/api/notifications/${eventId}/dismiss`,
        {
          method: "POST"
        }
      );

      if (!response.ok) {
        setMessage("알림 상태를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }

      const data = await response.json();
      updateEvent(data.event);
      setMessage(null);
    });
  };

  if (!events.length) {
    return (
      <SectionCard>
        <p className="text-sm leading-7 text-slate-600">{systemCopy.notifications.inboxEmpty}</p>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-6">
      {message ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {message}
        </p>
      ) : null}

      {groupedEvents.map(([lane, laneEvents]) => (
        <SectionCard
          key={lane}
          title={
            systemCopy.notifications.laneLabels[
              lane as keyof typeof systemCopy.notifications.laneLabels
            ] ?? lane
          }
        >
          <div className="grid gap-4">
            {laneEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip
                    label={
                      systemCopy.notifications.stateLabels[
                        event.state as keyof typeof systemCopy.notifications.stateLabels
                      ] ?? event.state
                    }
                    tone={event.state === "pending" || event.state === "operational_only" ? "active" : "quiet"}
                  />
                  <span className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</span>
                </div>
                <h2 className="mt-3 font-serif text-2xl text-slate-950">{event.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-700">{event.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {event.postId ? (
                    <Link
                      href={`/wave/${event.postId}`}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      파도 보기
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => submitAction(event.id, "read")}
                    disabled={pending}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {systemCopy.notifications.markRead}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitAction(event.id, "dismiss")}
                    disabled={pending}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {systemCopy.notifications.dismiss}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}
