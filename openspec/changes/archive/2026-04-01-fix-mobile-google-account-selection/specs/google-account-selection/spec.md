## ADDED Requirements

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
