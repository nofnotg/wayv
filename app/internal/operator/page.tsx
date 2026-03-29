import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/section-card";
import { OperatorConsole } from "@/features/operator/operator-console";
import { systemCopy } from "@/lib/copy/system-copy";
import { isInternalAccessTokenValid } from "@/lib/services/internal-auth-service";
import {
  listModerationAuditLogs,
  listModerationReports
} from "@/lib/services/moderation-admin-service";

type OperatorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OperatorPage({ searchParams }: OperatorPageProps) {
  const params = (await searchParams) ?? {};
  const token = typeof params.token === "string" ? params.token : null;

  if (!isInternalAccessTokenValid(token)) {
    return (
      <div className="grid gap-6">
        <PageHeader
          title={systemCopy.operator.forbiddenTitle}
          description={systemCopy.operator.forbiddenDescription}
        />
        <SectionCard className="border-amber-100 bg-amber-50/80">
          <p className="text-sm leading-7 text-amber-900">{systemCopy.operator.authNotice}</p>
        </SectionCard>
      </div>
    );
  }

  const [reports, audits] = await Promise.all([
    listModerationReports(50),
    listModerationAuditLogs(20)
  ]);
  const authorizedToken = token as string;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={systemCopy.operator.title}
        description={systemCopy.operator.description}
      />
      <OperatorConsole
        initialReports={reports}
        initialAudits={audits}
        token={authorizedToken}
      />
    </div>
  );
}
