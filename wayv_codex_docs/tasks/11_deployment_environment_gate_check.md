# Task 25 - Deployment Environment Gate Check

## Repository and branch state
- Task 25 is built on top of Task 24 branch state.
- Task 24 commit inspected at the start of this round:
  - `874df47d9ae5ef7b07cad5f88561a84637aef072`

## Already proven before this round
- Local/live-like operator bootstrap works.
- Magic-link session restoration on `/auth/sign-in` works in a running app.
- Logged-out, non-operator, and seeded operator access checks for `/internal/operator` were verified locally.
- Internal review/export routes for beta feedback, product events, and content guardrail flags responded live in the local environment.

## Deployment environment findings from this round
- The workspace has no `.vercel/project.json`, so there is no local deployment link artifact for this repository.
- GitHub repository metadata shows no homepage URL and no deployment records through the GitHub deployments API.
- Vercel MCP access is not available in this session:
  - `vercel/list_teams` returned `Auth required`
- `npx vercel` could not be used as a reliable fallback in this session because the CLI was not already authenticated and did not complete a usable non-interactive project lookup.

## What remains unproven in the actual deployment environment
- The real deployed host for this repo was not identifiable from the available local or GitHub metadata.
- Deployment environment variables could not be read or confirmed directly:
  - `NEXT_PUBLIC_APP_URL`
  - Supabase public auth values
  - cron/bootstrap secret used by `POST /api/internal/operator/access`
- Redirect coherence between the real deployed host and Supabase auth redirect configuration remains unproven.
- Migration `0013_task23_operator_access.sql` is not confirmed as applied in the deployment database.
- First real operator seeding in the deployment environment is not confirmed.
- Deployed `/internal/operator` access behavior and deployed review/export route behavior are not confirmed.

## Gate reading
- Local beta gate: ready with caution
- Deployment beta gate: blocked by missing deployment linkage and missing platform access evidence

## Manual deployment checks required next
1. Identify the real deployed host for the current environment.
2. Confirm deployment env values:
   - `NEXT_PUBLIC_APP_URL=<deployed host>`
   - `SUPABASE_REDIRECT_URL=<deployed host>/auth/callback` or the final chosen auth return path
   - valid Supabase public keys
   - valid `CRON_SECRET`
3. Apply `supabase/migrations/0013_task23_operator_access.sql` in the deployment database.
4. Seed the first operator through the internal-only bootstrap route.
5. Re-run the operator walkthrough on the deployed host:
   - logged-out denied
   - non-operator denied
   - seeded operator allowed
   - review/export routes usable

## In-app self-check after deploy
1. Open `/internal/operator` with an operator account.
2. Check the `배포 베타 점검` block:
   - `배포 환경`
   - `인증 흐름`
   - `운영자 bootstrap`
   - `검토/export`
3. If deeper inspection is needed, call:
   - `GET /api/internal/debug/beta-gate-self-check`
4. Confirm these booleans without exposing secrets:
   - public env present
   - cron/service-role present
   - `internal_operators` reachable
   - first operator seeded
   - beta feedback / product events / content guardrail review queries reachable
