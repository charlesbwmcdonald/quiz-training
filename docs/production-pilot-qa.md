# JobberTrain production pilot QA

Use this checklist against the live production environment before inviting a pilot customer. Run each journey with a dedicated test account and record the date, tester, result, and defect link.

## Test roles

- Platform owner
- Manufacturer owner
- Manufacturer admin
- Manufacturer content manager
- Manufacturer viewer
- Retailer manager
- Retailer learner

## Release gates

- **P0:** cross-tenant data exposure, account takeover, destructive data loss, or production unavailable. Pilot stops.
- **P1:** a core journey cannot be completed or a role can perform an unauthorized action. Fix before pilot.
- **P2:** journey works with a confusing workaround, incorrect message, or substantial mobile/accessibility issue. Fix or document before pilot.
- **P3:** visual polish or low-impact consistency issue. Schedule after pilot if necessary.

## 1. Public and authentication journeys

- [ ] JobberTrain home, pricing, contact, and sign-in load without authentication.
- [ ] Manufacturer landing page shows only that manufacturer's logo, colors, content, products, and links.
- [ ] Every academy call-to-action preserves the manufacturer-branded sign-in experience.
- [ ] Generic sign-in sends a platform owner to `/platform`.
- [ ] Academy sign-in sends a learner to the selected or last-used academy.
- [ ] Invalid credentials show a clear message without losing academy branding.
- [ ] Forgot-password started in an academy remains academy branded through reset and return sign-in.
- [ ] Expired and reused reset links show a recoverable message.
- [ ] Sign out ends the session and protected routes return to sign-in.
- [ ] Session remains active while navigating all authorized menu items.

## 2. Platform owner

- [ ] Create a manufacturer with a unique name and slug.
- [ ] Duplicate name or slug produces a clear, nontechnical validation message.
- [ ] Owner invitation is created, delivered, accepted, and removed from open invitations.
- [ ] Manufacturer card opens the selected tenant rather than the last-used tenant.
- [ ] Returning to the platform dashboard restores JobberTrain branding.
- [ ] Platform owner cannot accidentally appear as a manufacturer employee unless explicitly added.

## 3. Manufacturer configuration and isolation

- [ ] Owner can upload logo and images, set valid hex colors, and save.
- [ ] Brand Studio draft changes persist after reload.
- [ ] Published landing sections render in the saved order on desktop, tablet, and mobile.
- [ ] Products selected in landing sections belong only to the active manufacturer.
- [ ] Switching academies changes all branding, content, retailers, reports, and navigation.
- [ ] Directly entering another manufacturer's scoped URL does not expose that tenant.

## 4. Users and invitations

- [ ] Invite manufacturer admin, content manager, and viewer.
- [ ] Invite retailer manager and learner to a selected retailer.
- [ ] Existing universal account can accept a second academy without creating another password.
- [ ] Pending, delivered, failed, expired, accepted, and revoked invitation states are accurate.
- [ ] Resend, renew, copy link, and revoke each produce a clear confirmation.
- [ ] Role changes take effect after token refresh or next sign-in.
- [ ] Removing academy access preserves the universal account, history, and other academy access.
- [ ] Last owner cannot remove or demote themselves without another owner.
- [ ] Viewer cannot access management screens or mutations through direct URLs.

## 5. Products, families, and variations

- [ ] Create, edit, preview, publish, archive, duplicate, and delete a standalone product.
- [ ] Convert or create a family and add dependent variation levels.
- [ ] Duplicate a variation without duplicate SKU or option-combination corruption.
- [ ] Unavailable variation combinations are visibly disabled.
- [ ] Family and variation images, specifications, and shared content render correctly.
- [ ] CSV template downloads and valid import creates the expected records.
- [ ] Invalid CSV rows identify the row and field without partial silent failure.
- [ ] Product status and search/filter behavior are correct in card and list views.

## 6. Quizzes and courses

- [ ] Create, autosave/recover, preview, publish, duplicate, archive, and delete a quiz.
- [ ] Long questions and answers wrap without breaking the builder or player.
- [ ] Quiz CSV import preserves answers and correct-answer flags.
- [ ] Create a course with text, media, product, and quiz blocks.
- [ ] Reorder, edit, preview, publish, duplicate, archive, and delete a course.
- [ ] Editing assigned content shows an appropriate warning and does not corrupt learner progress.
- [ ] Viewer sees only learner-facing training, not quiz or course management.

## 7. Assignments and completion

- [ ] Assign quiz and course to all retailers, selected retailers, and manufacturer team.
- [ ] Retailer search, filters, select-all, and deselect-all remain usable with a large directory.
- [ ] Required flag and due date persist and appear in learner views and emails.
- [ ] Assignment email links to the correct academy and training item.
- [ ] Learner starts, resumes, completes, and reviews eligible training.
- [ ] Quiz attempts, passing score, retry rules, and completion state are correct.
- [ ] Overdue and completed counts update consistently across training and reports.

## 8. Reports, certificates, offers, rewards, and notifications

- [ ] Authorized management roles can open reports; learners and viewers cannot.
- [ ] Report totals match underlying assignments, attempts, and completions.
- [ ] Certificate is issued only after qualifying completion and downloads correctly.
- [ ] Retailer certification status reflects the configured learner threshold.
- [ ] Eligible dealer offers are visible only to targeted retailers and within their date window.
- [ ] Flyer download, interest action, and engagement tracking work.
- [ ] Reward points are granted once per qualifying achievement.
- [ ] Redemption checks balance, records fulfillment, and notifies the manufacturer team.
- [ ] Disabled notification types send nothing.
- [ ] Enabled due, overdue, completion, certificate, and reward notifications are queued once and delivery status is visible.

## 9. Academy switching and responsive navigation

- [ ] My Academies lists only accepted and pending invited academies.
- [ ] Switch Academy updates the active tenant without another login.
- [ ] Back/forward navigation does not revive stale tenant content.
- [ ] Desktop mega menus close on selection, outside click, and Escape.
- [ ] Mobile/tablet menu opens, scrolls, closes, and keeps Sign Out reachable.
- [ ] Header remains usable on product, quiz, course, offer, certificate, and training detail pages.

## 10. Final regression evidence

- [ ] Record browser, device/viewport, account role, and test date for every run.
- [ ] Capture screenshots for every P0/P1/P2 defect.
- [ ] Retest every fixed defect in production.
- [ ] Run one clean end-to-end journey with a brand-new learner email.
- [ ] Confirm no test invitations, accounts, assignments, or sample content remain in the pilot tenant.

