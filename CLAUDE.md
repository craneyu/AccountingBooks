# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AccountingBooks is a full-stack Angular + Firebase application for group travel expense tracking and bill-splitting. It uses Angular 21 standalone components with TypeScript (strict mode), Tailwind CSS for styling, and Firebase services (Firestore, Auth, Storage, Functions) for the backend.

## Development Commands

### Frontend Development
```bash
npm start                    # Start dev server on http://localhost:4200
npm run build                # Production build to dist/accounting-books/browser
npm run watch                # Build with watch mode
npm test                     # Run tests with Vitest
```

### Cloud Functions Development
```bash
cd functions && npm install  # Install function dependencies (first time)
cd functions && npm run build # Compile TypeScript functions
cd functions && npm start    # Start Firebase emulators with functions
cd functions && npm run logs # View function logs
```

### Firebase Deployment
```bash
npx firebase deploy                    # Deploy all (hosting, functions, rules, indexes)
npx firebase deploy --only hosting     # Deploy frontend only
npx firebase deploy --only functions   # Deploy Cloud Functions only
npx firebase deploy --only firestore:rules  # Deploy Firestore security rules
npx firebase deploy --only firestore:indexes # Deploy Firestore indexes
```

## Architecture Overview

### Frontend Architecture (Angular 21)

**Core Structure:**
- `src/app/core/` - Core services, models, guards, and utilities (singleton services)
- `src/app/components/` - Shared UI components (dialogs, panels, list items)
- `src/app/pages/` - Route components (Login, Trips, Expenses, Admin pages)
- `src/app/layout/` - Layout wrapper components (MainLayout with header/sidebar)

**Key Services (14 total in core/services/):**
- `auth.service.ts` - Firebase Authentication (Google login), user state management
- `trip.service.ts` - Trip CRUD operations, Firestore listeners for real-time updates
- `trip-members.service.ts` - Member management, role-based access (Owner/Editor/Viewer)
- `expense.service.ts` - Expense CRUD with subcollection structure (trips/{tripId}/expenses)
- `category.service.ts` - Category management (system-wide settings)
- `payment-method.service.ts` - Payment methods management
- `currency.service.ts` - Currency management and exchange rate integration
- `exchange-rate.service.ts` - Currency conversion with caching
- `notification.service.ts` - Real-time notifications from Cloud Functions
- `statistics.service.ts` - Expense analytics and calculations
- `export.service.ts` - CSV/ZIP export functionality with JSZip
- `search-filter.service.ts` - Expense search and filtering logic
- `system-settings.service.ts` - Global app settings
- `user.service.ts` - User profile management

**Guards:**
- `auth.guard.ts` - Protects routes requiring authentication
- `admin.guard.ts` - Protects admin routes (requires isAdmin flag)

**Routing Structure:**
```
/login                           # Public login page
/trips                           # Protected: Trip list (default after login)
/trip/:tripId/expenses           # Protected: Expense list for specific trip
/admin/dashboard                 # Admin only: System overview
/admin/trips                     # Admin only: All trips management
/admin/users                     # Admin only: User management
/admin/stats                     # Admin only: System statistics
/admin/categories                # Admin only: Category management
/admin/payment-methods           # Admin only: Payment method management
/admin/currencies                # Admin only: Currency management
```

### Backend Architecture (Firebase)

**Firestore Database Structure:**
```
users/{userId}
  - displayName, email, photoURL, isAdmin, status, createdAt, updatedAt

trips/{tripId}
  - name, description, startDate, endDate, createdBy, createdAt, updatedAt

  trips/{tripId}/members/{userId}  # Subcollection
    - userId, displayName, email, role (owner/editor/viewer), addedBy, joinedAt

  trips/{tripId}/expenses/{expenseId}  # Subcollection
    - item, amount, currency, category, paymentMethod, date, submittedBy,
      submittedByName, submittedByEmail, receiptUrls, participants[], createdAt

categories/{categoryId}
  - name, icon, order, isActive

paymentMethods/{methodId}
  - name, icon, order, isActive

currencies/{currencyId}
  - code, name, symbol, isActive, order

exchangeRates/{rateId}
  - from, to, rate, updatedAt

notifications/{notificationId}
  - userId, type, tripId, tripName, relatedId, message, isRead, createdAt, actorId

settings/{settingId}
  - Global system settings
```

**Cloud Functions (9 functions in functions/src/index.ts):**

*Firestore Triggers (5):*
1. `onExpenseCreated` - Creates notifications when expense is added
2. `onExpenseUpdated` - Creates notifications when expense is updated
3. `onExpenseDeleted` - Creates notifications when expense is deleted
4. `onMemberAdded` - Notifies new member when added to trip
5. `onMemberRemoved` - Notifies other members when someone is removed

*Scheduled Functions (2):*
6. `cleanupDeletedAccounts` - Daily at 00:00 UTC: Deletes accounts marked for deletion 7+ days ago
7. `dailySyncUsersPhotoURL` - Daily at 01:00 UTC: Syncs user photos from Firebase Auth

*Callable Functions (1):*
8. `syncAllUsersPhotoURL` - Admin-only manual trigger to sync all user photos

*HTTP Functions (1):*
9. `healthCheck` - Health check endpoint

### Security Model

**Firestore Security Rules (firestore.rules):**
- Role-Based Access Control (RBAC): Owner, Editor, Viewer roles per trip
- Owners: Full control (CRUD members, expenses, trip settings)
- Editors: Can create/edit/delete expenses, read members
- Viewers: Read-only access to trip and expenses
- Admin users: System-wide access with `isAdmin` flag
- Data isolation: Users can only access trips they are members of
- Collection group queries: Members can query their own memberships across all trips

**Storage Security Rules (storage.rules):**
- Receipt images stored in `/receipts/{tripId}/{expenseId}/{filename}`
- Only trip members can upload/read receipts
- File size and type validation enforced client-side

### UI/UX Implementation

**Styling:**
- Tailwind CSS 3.4 (Soft UI Evolution design system)
- Component-scoped SCSS files (23 .scss files)
- Mobile-first responsive design
- Budget limits: 3MB initial bundle, 4kB per component style

**Third-Party UI Libraries:**
- `swiper@12` - Receipt image gallery with swipe gestures
- `sweetalert2@11` - Modal dialogs and image popups
- `hammerjs@2` - Touch gesture support for mobile swipe actions
- `chart.js@4` + `ng2-charts@8` - Expense statistics charts
- `@fortawesome/angular-fontawesome@4` - Icon system

**Key UI Features:**
- Real-time updates via Firestore listeners (expenses, members, notifications)
- Swipe gestures on mobile for list item actions
- Multi-image receipt viewer with zoom/swipe
- Receipt upload with HEIC-to-JPEG conversion (`heic2any`)
- CSV/ZIP export for expenses (`file-saver`, `papaparse`, `jszip`)

## Important Development Notes

### Firebase Environment Setup

Create `src/environments/environment.ts` and `environment.prod.ts`:
```typescript
export const environment = {
  production: false,  // true for production
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "...",
    appId: "..."
  }
};
```

### TypeScript Configuration

- Strict mode enabled (`typescript@5.9.2`)
- All models use TypeScript interfaces (10 models in `core/models/`)
- CommonJS dependencies allowed: sweetalert2, heic2any, file-saver, papaparse, jszip, hammerjs

### Firestore Indexes

If you encounter "The query requires an index" errors during development:
1. Click the link in the error message to auto-create the index in Firebase Console
2. Or deploy local index definitions: `npx firebase deploy --only firestore:indexes`

### Working with Subcollections

Expenses and members use Firestore subcollections (not top-level collections):
- Path format: `trips/{tripId}/expenses/{expenseId}`
- Always pass `tripId` when querying/creating expenses or members
- Services handle path construction: `ExpenseService.getExpenses(tripId)`

### Real-Time Data Flow

Services use Firestore snapshot listeners for real-time updates:
```typescript
// Example pattern used throughout services
this.firestore
  .collection(`trips/${tripId}/expenses`)
  .valueChanges({ idField: 'id' })
  .pipe(map(expenses => /* transform */))
```

When modifying data that triggers Cloud Functions:
1. Create/update/delete happens in frontend service
2. Firestore triggers run Cloud Function
3. Function creates notification in `notifications` collection
4. NotificationService listener updates UI in real-time

### Admin Features

Admin users (`isAdmin: true` in users collection) have access to:
- `/admin/*` routes (protected by `admin.guard.ts`)
- User management (view all users, modify admin status)
- Trip management (view/delete all trips, even if not a member)
- System settings (categories, payment methods, currencies)
- System statistics and analytics

To make a user admin, manually set `isAdmin: true` in Firestore users collection.

### Testing Strategy

- Test runner: Vitest 4.0.8 (configured in angular.json)
- Run tests: `npm test`
- Tests are co-located with components/services (*.spec.ts files)

### Code Formatting

Prettier configured in package.json:
- Print width: 100
- Single quotes: true
- Angular parser for HTML templates

### Performance Considerations

- Bundle size budgets enforced: 3MB initial, 5MB max
- Component styles: 4kB warning, 8kB error
- Use lazy loading for admin routes to reduce initial bundle
- Firestore queries use indexes for performance
- Exchange rates cached to reduce API calls

## Common Workflows

### Adding a New Expense Category

1. Use Admin UI at `/admin/categories` (recommended), OR
2. Manually add to Firestore `categories` collection with fields:
   - `name` (string)
   - `icon` (Font Awesome icon class, e.g., 'fa-utensils')
   - `order` (number for sorting)
   - `isActive` (boolean)

### Adding a New Currency

1. Use Admin UI at `/admin/currencies`, OR
2. Add to `currencies` collection with fields: code, name, symbol, isActive, order
3. Update `exchange-rate.service.ts` if new API integration needed

### Deploying Code Changes

Frontend-only changes (components, services, styles):
```bash
npm run build
npx firebase deploy --only hosting
```

Backend changes (Cloud Functions):
```bash
cd functions && npm run build
npx firebase deploy --only functions
```

Security rule changes:
```bash
npx firebase deploy --only firestore:rules
npx firebase deploy --only storage
```

Full deployment:
```bash
npm run build
npx firebase deploy
```

### Working with Trip Roles

When implementing features that modify trip data:
1. Check user's role: `TripMembersService.getMemberRole(tripId, userId)`
2. Enforce permissions:
   - Owner: All operations
   - Editor: Create/edit expenses, read members
   - Viewer: Read-only
3. Backend validation: Firestore rules also enforce this
4. UI: Hide/disable controls based on role

### Debugging Cloud Functions

Local testing with emulators:
```bash
cd functions && npm start  # Starts emulator suite
```

View production logs:
```bash
cd functions && npm run logs
```

Or use Firebase Console > Functions > Logs

## Project Dependencies

**Critical Dependencies:**
- Angular 21.1.0 (framework)
- Firebase 11.10.0 (client SDK)
- RxJS 7.8.0 (reactive programming)
- Tailwind CSS 3.4.17 (styling)
- TypeScript 5.9.2 (language)

**Backend:**
- Node.js 20 (Cloud Functions runtime)
- firebase-functions 5.0.0
- firebase-admin 12.0.0

**Build Tools:**
- @angular/cli 21.1.1
- firebase-tools 15.3.1
- vitest 4.0.8
