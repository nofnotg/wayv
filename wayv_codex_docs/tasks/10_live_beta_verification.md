# Task 24 - Live Beta Verification Notes

## Live checks completed
- Local migration `0013_task23_operator_access.sql` was applied and `internal_operators` became queryable.
- Internal-only operator bootstrap succeeded through `POST /api/internal/operator/access` with the cron secret.
- Fresh magic links now land on `/auth/sign-in?next=...`, and the sign-in surface restores the browser session from hash-fragment tokens before returning to the requested page.
- Internal review/export routes responded live:
  - beta feedback review JSON
  - product events review CSV
  - content guardrail review JSON
- Logged-out access to `/internal/operator` remained denied.
- Logged-in non-operator access to `/internal/operator` remained denied after a live magic-link session was established.
- Seeded operator access was verified live: the operator account reached `/internal/operator` and loaded the operator review surface.

## Deployment gate notes
- Apply `supabase/migrations/0013_task23_operator_access.sql` before trying to seed any operator account.
- Seed the first operator through the internal-only bootstrap route:
  - `POST /api/internal/operator/access`
  - header `x-cron-secret: <CRON_SECRET>`
  - body `{ "userId": "<auth user uuid>", "role": "operator", "isActive": true }`
- The email magic-link flow now depends on `NEXT_PUBLIC_APP_URL` resolving to the running app host because the link redirect target is `/auth/sign-in`.

## Beta gate reading
- Operator bootstrap: ready with caution
- Review/export routes: ready
- Operator account live access: ready with caution
- Deployment readiness: ready with caution

## Remaining blockers before a broader launch
- Notification providers are still running in noop / validation-first mode.
- Guardrails are still first-pass rule based and will need tuning from live beta review.
- Operator bootstrap remains internal-only and manual by design.
