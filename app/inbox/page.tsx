import { PageHeader } from "@/components/layout/page-header";
import { NotificationInbox } from "@/features/notifications/notification-inbox";
import { systemCopy } from "@/lib/copy/system-copy";
import { enforceApprovedViewerPageAccess } from "@/lib/services/beta-access-guard-service";
import {
  getNotificationInboxSummary,
  listNotificationInboxEvents
} from "@/lib/services/notification-inbox-service";
import { getViewerContext } from "@/lib/services/viewer-service";

export default async function InboxPage() {
  const viewer = await getViewerContext();
  const approvedViewer = await enforceApprovedViewerPageAccess({ viewer, nextPath: "/inbox" });

  const [events, summary] = await Promise.all([
    listNotificationInboxEvents(approvedViewer.userId),
    getNotificationInboxSummary(approvedViewer.userId)
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={systemCopy.notifications.inboxTitle}
        description={systemCopy.notifications.inboxDescription}
      />
      <NotificationInbox initialEvents={events} initialSummary={summary} />
    </div>
  );
}
