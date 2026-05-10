# Task 27 - Real Post-Deploy Beta Verification Notes

## What was verified from a real public environment
- `wayv.app` resolves publicly:
  - DNS A record observed: `167.235.236.169`
  - `http://wayv.app` returns `308 Permanent Redirect` to `https://wayv.app/`
  - `http://wayv.app/internal/operator` returns `308 Permanent Redirect` to `https://wayv.app/internal/operator`
  - `http://wayv.app/api/internal/debug/beta-gate-self-check` returns `308 Permanent Redirect` to `https://wayv.app/api/internal/debug/beta-gate-self-check`
- Browser-level access to `https://wayv.app` currently fails with `ERR_SSL_PROTOCOL_ERROR`.
- Browser-level access to `https://www.wayv.app` currently fails with `ERR_CERT_COMMON_NAME_INVALID`.
- `www.wayv.app` is not the app host for this beta gate:
  - `http://www.wayv.app/internal/operator` returned `404` from `nginx`
- `wayv.vercel.app` is also not valid beta evidence for this repo:
  - it served an unrelated page and did not expose the wayv app routes

## What remains unverified in the real deployment
- The actual deployed wayv app HTML could not be loaded over HTTPS from the public host in this session.
- The in-app self-check route could not be reached in the public environment because the HTTPS layer failed before the route could respond.
- Real deployed operator access behavior is still unverified:
  - logged-out deny
  - non-operator deny
  - seeded operator allow
- Real deployed review/export route operability is still unverified.
- Real deployed migration state and first operator seed remain unverified.

## Task 27 implementation refinement
- `GET /api/internal/debug/beta-gate-self-check` now passes `viewerUserId` when the request is authorized through an operator session.
- This makes `viewerHasOperatorAccess` observable from the self-check API after deploy, without exposing secret values.

## Exact next manual step
1. Fix the public HTTPS/certificate/proxy issue on the intended app host.
2. Open `https://<real-app-host>/internal/operator` with:
   - logged-out viewer
   - logged-in non-operator
   - seeded operator
3. Call `GET /api/internal/debug/beta-gate-self-check` as:
   - internal secret request
   - operator session request
4. Record:
   - `overallStatus`
   - `envReadiness`
   - `authFlowReadiness`
   - `operatorBootstrapReadiness`
   - `reviewExportReadiness`
   - `viewerHasOperatorAccess`
