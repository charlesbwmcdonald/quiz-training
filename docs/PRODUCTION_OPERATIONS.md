# JobberTrain Production Operations Runbook

## Daily health check

1. Open **Platform Control → System health**.
2. Confirm Supabase, Resend, scheduled notifications, and service credentials are configured.
3. Review failed invitation and academy-notification deliveries.
4. Review the platform audit trail for unexpected privileged changes.
5. Confirm the most recent Vercel deployment is healthy and the notification cron completed.

Never paste service-role keys, Resend keys, passwords, or cron secrets into support notes, screenshots, or tickets.

## Incident priorities

- **P1:** sign-in unavailable, cross-tenant data exposure, data loss, or all academies unavailable. Stop deployments, preserve logs, and notify the platform owner immediately.
- **P2:** invitations, notifications, assignments, or one academy unavailable. Record the affected tenant, user, route, and timestamp.
- **P3:** isolated UI or content issue with a working alternative.

For every incident, record: time detected, affected academy, affected roles, reproduction steps, last known good deployment, resolution, and follow-up prevention.

## Email delivery recovery

1. Check that `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_SITE_URL` exist in the production environment.
2. Verify the sending domain in Resend.
3. Inspect the invitation or notification delivery error shown in JobberTrain.
4. Correct configuration before retrying. Avoid repeated retries when the provider is rejecting the sender or domain.
5. Resend from the invitation controls or send a notification test.

## Scheduled notifications

- Vercel calls `/api/cron/notifications` using `CRON_SECRET`.
- The endpoint also requires `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY`.
- A run returns queued, sent, and failed counts.
- Delivery records use deduplication keys so the same scheduled message is not intentionally sent twice.

## Backup and recovery

Before pilot launch, confirm the Supabase plan's backup retention and point-in-time recovery settings in the Supabase dashboard.

Recovery procedure:

1. Freeze application writes if corruption or destructive activity is suspected.
2. Record the incident timestamp and identify the last known good point.
3. Restore into a separate recovery project first; never overwrite production as the first diagnostic step.
4. Validate users, manufacturers, memberships, products, quizzes, courses, assignments, attempts, and storage references.
5. Compare record counts and tenant isolation before redirecting application traffic.
6. Rotate exposed credentials and revoke affected sessions when compromise is possible.
7. Document the restore and run an end-to-end pilot test.

Run a documented recovery exercise before the first large customer rollout and at least quarterly thereafter.

## Security review

- All public-schema tables must have RLS enabled or be inaccessible to browser roles.
- Every security-definer function must validate the authenticated user and tenant role, set an empty search path, revoke public/anon execution, and grant only the required role.
- The service-role key must never use a `NEXT_PUBLIC_` name.
- Review Supabase security and performance advisors before each production release containing migrations.
- Keep authentication redirect URLs restricted to known JobberTrain origins.
- Keep user-facing errors generic; retain diagnostic detail only in protected operational views.
- Review platform audit records after role, manufacturer, invitation, or lifecycle changes.

## Release checklist

1. Run the production build.
2. Review migrations and security implications.
3. Apply migrations before deploying code that depends on them.
4. Deploy to Vercel and confirm environment variables for Production.
5. Test platform-owner, manufacturer-admin, content-manager, viewer, retailer, and learner paths.
6. Test invitation, password reset, academy switching, assignment, completion, report export, and mobile navigation.
7. Monitor logs and email delivery immediately after release.
