# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AccountingBooks (PayState) is a travel expense tracking application built with Angular 21+ (Standalone Components), Firebase, and Tailwind CSS. It features a Soft UI Evolution design (neumorphism-inspired with modern accessibility adjustments) for tracking expenses across multiple trips with real-time currency conversion.

## Key Dependencies

### Core Framework & Runtime
- **Angular 21.1** - Standalone components architecture with Signals
- **TypeScript 5.9** - Type-safe development
- **RxJS 7.8** - Reactive programming

### Firebase Services
- **Firebase 11.10** - Backend services platform
- **@angular/fire 20.0** - Official Angular Firebase library

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **SweetAlert2 11.26** - Beautiful alert/modal dialogs
- **Swiper 12.0** - Touch-friendly image carousel/gallery
- **Font Awesome 7** - Icon library (@fortawesome/angular-fontawesome)

### Utilities
- **crypto-js 4.2** - Cryptographic functions

### External APIs
- **ExchangeRate-API** - Real-time currency conversion rates

## Common Commands

### Development
```bash
npm install          # Install dependencies
npm start            # Start dev server at http://localhost:4200
npm run build        # Production build
npm test             # Run tests with Vitest
```

### Firebase Deployment
```bash
npx firebase login   # First-time login
npm run build && npx firebase deploy --only hosting  # Deploy to production
firebase deploy --only firestore:rules               # Deploy Firestore rules only
firebase deploy --only storage                       # Deploy Storage rules only
```

### Firebase Storage CORS Configuration
```bash
gsutil cors set cors.json gs://accountingbooks-9fa26.firebasestorage.app
```

Production URL: https://accountingbooks-9fa26.web.app

## Code Architecture

### Project Structure

```
src/app/
├── core/                    # Core application modules
│   ├── models/             # TypeScript interfaces for data models
│   ├── services/           # Injectable services for business logic
│   ├── guards/             # Route guards (auth.guard.ts)
│   └── utils/              # Utility functions (image-utils.ts, icon-utils.ts)
├── components/             # Reusable dialog components
│   ├── trip-dialog/
│   ├── expense-dialog/
│   ├── category-dialog/
│   └── user-dialog/
├── pages/                  # Page-level components
│   ├── login/
│   ├── trips/             # Trip selection page
│   ├── expenses/          # Expense management page
│   └── admin/             # Admin dashboard and management pages
├── layout/                # Layout components
│   └── main-layout/       # Main app layout with navigation
└── app.routes.ts          # Route configuration
```

### Key Architectural Patterns

#### 1. Standalone Components
All components use Angular 19+ standalone components architecture. No NgModules are used.

#### 2. Angular Signals for State Management
The application uses Angular Signals (not RxJS Observables) for reactive state management:
- `AuthService` uses `signal<User | null>` for current user state
- `computed()` for derived state (e.g., `isAdmin`)
- `toSignal()` to convert Observables to Signals when interfacing with Firebase

#### 3. Firebase Integration
- **Authentication**: Google Sign-In via `@angular/fire/auth`
- **Database**: Firestore with subcollections pattern: `trips/{tripId}/expenses`
- **Storage**: Firebase Storage for receipt images at `receipts/{tripId}/{fileName}`
- **Real-time Data**: Uses `collectionData()` from `@angular/fire/firestore`

#### 4. Authentication Flow
```
Login → AuthService.loginWithGoogle()
     → Firebase Auth creates/updates user in Firestore
     → AuthService.syncUser() syncs with users collection
     → authGuard protects routes
     → Redirects to /trips (or /admin if admin user)
```

Key implementation details:
- `auth.guard.ts`: Checks `AuthService.isInitialized` before allowing navigation
- User roles: `isAdmin` boolean in `users` collection determines admin access
- Session management: 30-minute idle timeout (per SPEC.md requirements)

#### 5. Data Models & Firestore Collections

**trips** - Top-level collection for travel trips
```typescript
interface Trip {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: "active" | "inactive";
  currency: string;  // Primary currency (e.g., TWD)
  coverImage?: string;
  // ... timestamps and audit fields
}
```

**trips/{tripId}/expenses** - Subcollection for expenses
```typescript
interface Expense {
  id?: string;
  tripId: string;
  item: string;
  expenseDate: Timestamp;
  amount: number;
  currency: string;
  exchangeRate: number;        // Rate to TWD (1 Foreign = X TWD)
  exchangeRateTime: Timestamp;
  amountInTWD: number;
  category: string;
  paymentMethod: string;
  receiptImageUrls?: string[]; // Multiple receipt images
  // ... audit fields (submittedBy, updatedBy, etc.)
}
```

**users** - User profiles with roles
```typescript
interface User {
  id: string;           // Firebase UID
  email: string;
  displayName: string;
  isAdmin: boolean;     // Role flag
  status: "active" | "inactive";
  lastLoginAt: Timestamp;
  // ... timestamps
}
```

**categories** & **paymentMethods** - Customizable system data with icons
**exchangeRates** - Cached exchange rates (docId: `{currency}_YYYYMMDD`)

#### 6. Currency Exchange Rate System

The app integrates with ExchangeRate-API for real-time currency conversion:

**Three-tier caching strategy** (in `ExchangeRateService`):
1. **Memory cache**: In-memory Map for session-based caching
2. **Firestore cache**: Daily exchange rates stored as `exchangeRates/{currency}_YYYYMMDD`
3. **API fallback**: Fetches from ExchangeRate-API if no cache exists

API Endpoint: `https://api.exchangerate-api.com/v4/latest/{currency}`

**Usage in forms**: When creating/editing expenses, the exchange rate is automatically fetched based on selected currency and amount, with manual override option.

#### 7. Image Upload & Management

Receipt images are handled via `ImageUtils` (core/utils/image-utils.ts):
- Client-side compression before upload (max 800px width/height, 80% quality)
- Base64 preview generation for instant UI feedback
- Upload to Firebase Storage at `receipts/{tripId}/`
- Multiple images per expense supported via `receiptImageUrls[]` array

#### 8. Image Gallery with Swiper.js

The application uses **Swiper 12** for a touch-friendly image viewing experience:

**Key Features**:
- iOS-native swipe gestures for smooth navigation
- Left/right navigation buttons for desktop
- Pagination indicators
- Keyboard controls (arrow keys, ESC to close)
- Responsive design (mobile/tablet/desktop)
- Zoom functionality support

**Implementation Location**: `src/app/pages/expenses/expenses.component.ts`

**Usage Pattern**:
```typescript
import { register } from 'swiper/element/bundle';
register(); // Register Swiper custom elements

// In template:
<swiper-container navigation="true" pagination="true">
  <swiper-slide *ngFor="let url of receiptUrls">
    <img [src]="url" />
  </swiper-slide>
</swiper-container>
```

**Integration Notes**:
- Swiper is used as custom elements (Web Components)
- No additional Angular wrapper needed
- Fullscreen modal for receipt viewing
- Touch-optimized for mobile expense tracking workflows

#### 9. UI Design System (Soft UI Evolution)

Tailwind CSS configuration with custom neumorphism theme:
- Colors: `primary` (#4fd1c5), `background` (#e0e5ec)
- Shadows: `shadow-soft`, `shadow-soft-inset` for neumorphic effects
- Design principle: Modern soft UI with improved contrast for accessibility

Common patterns:
- Dialogs use SweetAlert2 for confirmations
- Forms use Angular reactive forms with validation
- Icons from Font Awesome via `@fortawesome/angular-fontawesome`
- Image galleries use Swiper.js for touch-friendly viewing

## Important File Locations

- **Environment config**: `src/environments/environment.ts` (Firebase config)
- **Firestore rules**: `firestore.rules` (see SPEC.md for complete rules)
- **Storage rules**: `storage.rules` (see SPEC.md for complete rules)
- **Routes**: `src/app/app.routes.ts`
- **Main layout**: `src/app/layout/main-layout/main-layout.ts`
- **Spec document**: `SPEC.md` (complete Chinese specification with detailed requirements)

## Development Guidelines

### Adding New Features

1. **Check SPEC.md first** - All requirements and data structures are documented in Chinese in SPEC.md
2. **Use Signals over Observables** - Prefer Angular Signals for state management
3. **Maintain Firestore security rules** - Update `firestore.rules` when adding new collections
4. **Follow existing patterns** - Use dialog components for CRUD operations
5. **Test with Firebase emulator** - Use `firebase emulators:start` for local development

### Firestore Security Model

The app implements role-based security via Firestore rules:
- **Authorized users**: Must exist in `users` collection with `status: 'active'`
- **Admin users**: Have `isAdmin: true` flag
- **Expense ownership**: Users can only edit/delete their own expenses (admins can edit all)
- See SPEC.md lines 388-464 for complete security rules

### Route Structure

```
/login                              # Public login page
/trips                              # Protected: Trip selection (default landing)
/trip/:tripId/expenses              # Protected: Expense management
/admin/dashboard                    # Admin only: Overview
/admin/trips                        # Admin only: Trip CRUD
/admin/users                        # Admin only: User management
/admin/categories                   # Admin only: Category management
/admin/payment-methods              # Admin only: Payment method management
/admin/stats                        # Admin only: Statistics
```

All routes except `/login` are protected by `authGuard`.

## Testing Notes

- Tests use Vitest (configured in `vitest.config.ts`)
- Run tests with `npm test`
- Component tests should verify signal reactivity
- Integration tests should use Firebase emulator

## Common Pitfalls

1. **Don't forget to update Firestore indexes** - When adding new queries, check console for index creation links
2. **Exchange rate API limits** - Free tier: 1,500 requests/month. Caching strategy prevents excessive calls.
3. **Image upload size** - Storage rules enforce 5MB limit for receipts, 2MB for trip covers
4. **Timestamp handling** - Always use `Timestamp.now()` from Firebase, not JavaScript Date
5. **Subcollection queries** - Expenses are in subcollections, so queries must include tripId path
6. **Swiper.js initialization** - Must call `register()` from `swiper/element/bundle` to register custom elements before using `<swiper-container>` in templates
7. **Swiper custom elements** - Use `<swiper-container>` and `<swiper-slide>` tags (Web Components), not Angular component wrappers

## Additional Resources

- Full specification (Chinese): `SPEC.md`
- Deployment guide (Chinese): `DEPLOYMENT.md`
- README: `README.md`
