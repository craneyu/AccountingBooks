## ADDED Requirements

### Requirement: Storage rules SHALL use cross-service Firestore syntax

All Firebase Storage Security Rules that reference Firestore documents MUST use `firestore.exists()` and `firestore.get()` functions (with `firestore.` prefix) instead of plain `exists()` and `get()`. The Firestore database path MUST use `(default)` with parentheses, not `default` without parentheses.

Affected functions in `storage.rules`:
- `isAuthorizedUser()` — references `users/{userId}` document
- `isSystemAdmin()` — references `users/{userId}` document
- All `match` blocks that check trip membership via `trips/{tripId}/members/{userId}`

#### Scenario: Authenticated user with active status uploads receipt image

- **WHEN** an authenticated user with `status == 'active'` in the `users` collection and `role == 'editor'` in `trips/{tripId}/members/{userId}` uploads a JPEG file under 10MB to `receipts/{tripId}/`
- **THEN** the Storage rules SHALL permit the write operation by correctly resolving the user document and member document from Firestore

#### Scenario: Authenticated user with active status uploads avatar

- **WHEN** an authenticated user with `status == 'active'` uploads a JPEG file under 10MB to `avatars/{userId}/` where `{userId}` matches `request.auth.uid`
- **THEN** the Storage rules SHALL permit the write operation

#### Scenario: Unauthenticated request is denied

- **WHEN** an unauthenticated request attempts to write to any Storage path
- **THEN** the Storage rules SHALL deny the operation because `request.auth` is null

#### Scenario: User with inactive status is denied

- **WHEN** an authenticated user whose `users/{userId}` document has `status != 'active'` attempts to upload
- **THEN** the Storage rules SHALL deny the operation after checking the Firestore document via `firestore.get()`

### Requirement: Trip cover upload path SHALL match storage rules

The frontend trip cover upload code in `trip-dialog.ts` MUST upload files to the path `trip-covers/{tripId}/{filename}`, matching the Storage rules pattern `trip-covers/{tripId}/{allPaths=**}`. The path MUST include the `tripId` to enable role-based access verification.

#### Scenario: Owner uploads trip cover image

- **WHEN** a trip owner selects a cover image in the trip dialog and submits
- **THEN** the file SHALL be uploaded to `trip-covers/{tripId}/{timestamp}_{filename}.jpg`
- **AND** the Storage rules SHALL permit the write because the user has `role == 'owner'` in `trips/{tripId}/members/{userId}`

#### Scenario: Non-owner attempts trip cover upload

- **WHEN** a user with `role == 'editor'` or `role == 'viewer'` attempts to upload a file to `trip-covers/{tripId}/`
- **THEN** the Storage rules SHALL deny the write operation because only `owner` role is permitted for trip cover uploads
