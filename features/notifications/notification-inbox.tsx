"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { SectionCard } from "@/components/section-card";
import { StatusChip } from "@/components/status-chip";
import { systemCopy } from "@/lib/copy/system-copy";
import type { NotificationEvent, NotificationInboxSummary } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils";

type NotificationInboxProps = {
  initialEvents: NotificationEvent[];
  initialSummary: NotificationInboxSummary;
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

export function NotificationInbox({
  initialEvents,
  initialSummary
}: NotificationInboxProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [summary, setSummary] = useState(initialSummary);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const groupedEvents = useMemo(() => groupByLane(events), [events]);
  const unreadLaneEntries = useMemo(
    () =>
      Object.entries(summary.unreadByLane ?? {}).filter((entry) => Number(entry[1] ?? 0) > 0),
    [summary]
  );

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
        setMessage(systemCopy.notifications.updateError);
        return;
      }

      const data = await response.json();
      updateEvent(data.event);
      if (data.summary) {
        setSummary(data.summary);
      }
      setMessage(null);
      router.refresh();
    });
  };

  if (!events.length) {
    return (
      <div className="grid gap-6">
        <SectionCard>
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip
              label={systemCopy.notifications.inboxSummaryEmpty}
              tone="quiet"
            />
          </div>
        </SectionCard>
        <SectionCard>
          <p className="text-sm leading-7 text-slate-600">{systemCopy.notifications.inboxEmpty}</p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <SectionCard>
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip
            label={
              summary.hasUnread
                ? `${systemCopy.notifications.inboxSummaryTitle} ${summary.unreadCount}${systemCopy.notifications.unreadSuffix}`
                : systemCopy.notifications.inboxSummaryEmpty
            }
            tone={summary.hasUnread ? "active" : "quiet"}
          />
          {summary.latestUnreadAt ? (
            <span className="text-xs text-slate-500">{formatDateTime(summary.latestUnreadAt)}</span>
          ) : null}
        </div>
        {unreadLaneEntries.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {unreadLaneEntries.map(([lane, count]) => (
              <StatusChip
                key={lane}
                label={`${systemCopy.notifications.laneLabels[lane as keyof typeof systemCopy.notifications.laneLabels]} ${count}${systemCopy.notifications.unreadSuffix}`}
                tone="quiet"
              />
            ))}
          </div>
        ) : null}
      </SectionCard>

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
                    tone={
                      event.state === "pending" || event.state === "operational_only"
                        ? "active"
                        : "quiet"
                    }
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
                      {systemCopy.notifications.openWave}
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
