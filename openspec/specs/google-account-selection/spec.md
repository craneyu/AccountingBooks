# google-account-selection Specification

## Purpose

Ensure Google OAuth always displays the account selection screen during login, preventing automatic account selection on mobile browsers where Google OAuth defaults to single sign-on behavior with the most recently used account.

## Requirements

### Requirement: Google login SHALL always show account selector

The `loginWithGoogle()` method in `auth.service.ts` MUST configure `GoogleAuthProvider` with `setCustomParameters({ prompt: 'select_account' })` before calling `signInWithPopup()`. This forces Google OAuth to display the account selection screen on every login attempt, regardless of device type or cached session state.

#### Scenario: User logs out and logs back in on mobile

- **WHEN** a user logs out via `logout()` and then taps the login button on a mobile browser
- **THEN** Google OAuth SHALL display the account selection screen showing all available Google accounts
- **AND** the user SHALL be able to select a different account than the one previously used

#### Scenario: User logs in on desktop browser

- **WHEN** a user clicks the login button on a desktop browser
- **THEN** Google OAuth SHALL display the account selection screen (same behavior as before, now explicitly guaranteed)

#### Scenario: Returning user with active session

- **WHEN** a user opens the app and an active Firebase Auth session exists (not logged out)
- **THEN** the app SHALL restore the session automatically without triggering Google OAuth
- **AND** the account selector SHALL NOT appear (session restore does not call `loginWithGoogle()`)

<!-- @trace
source: fix-mobile-google-account-selection
updated: 2026-04-01
code:
  - src/app/core/services/auth.service.ts
-->

<!-- @trace
source: fix-mobile-google-account-selection
updated: 2026-04-01
code:
  - AGENTS.md
  - .opencode/skills/spectra-audit/SKILL.md
  - src/app/pages/admin/dashboard/dashboard.html
  - src/app/core/services/trip.service.ts
  - .spectra.yaml
  - .opencode/commands/spectra-propose.md
  - .github/skills/spectra-propose/SKILL.md
  - .github/prompts/spectra-ask.prompt.md
  - .github/prompts/spectra-archive.prompt.md
  - .github/prompts/spectra-ingest.prompt.md
  - .github/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-discuss.prompt.md
  - .github/skills/spectra-debug/SKILL.md
  - .github/prompts/spectra-propose.prompt.md
  - .opencode/skills/spectra-apply/SKILL.md
  - .opencode/skills/spectra-ask/SKILL.md
  - .github/prompts/spectra-audit.prompt.md
  - .github/skills/spectra-audit/SKILL.md
  - .cursorrules
  - .opencode/commands/spectra-ingest.md
  - .opencode/skills/spectra-archive/SKILL.md
  - src/app/components/trip-dialog/trip-dialog.ts
  - .opencode/commands/spectra-audit.md
  - .github/skills/spectra-archive/SKILL.md
  - .opencode/skills/spectra-discuss/SKILL.md
  - storage.rules
  - .github/skills/spectra-apply/SKILL.md
  - .github/skills/spectra-discuss/SKILL.md
  - .github/prompts/spectra-apply.prompt.md
  - src/app/core/services/auth.service.ts
  - functions/firebase-debug.log
  - .opencode/skills/spectra-propose/SKILL.md
  - .firebase/hosting.ZGlzdC9hY2NvdW50aW5nLWJvb2tzL2Jyb3dzZXI.cache
  - .github/prompts/spectra-debug.prompt.md
  - .opencode/commands/spectra-archive.md
  - .opencode/commands/spectra-ask.md
  - .opencode/skills/spectra-ingest/SKILL.md
  - firestore.rules
  - .opencode/commands/spectra-discuss.md
  - .opencode/commands/spectra-apply.md
  - .github/skills/spectra-ingest/SKILL.md
  - src/app/components/expense-dialog/expense-dialog.ts
  - .opencode/commands/spectra-debug.md
  - src/app/pages/admin/dashboard/dashboard.ts
  - .opencode/skills/spectra-debug/SKILL.md
  - src/app/pages/trips/trips.ts
  - GEMINI.md
-->