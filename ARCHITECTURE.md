# COMPREHENSIVE CODEBASE ARCHITECTURE ANALYSIS
# AccountingBooks - Expense Tracking & Bill-Splitting Application

## 1. PROJECT OVERVIEW

### What is AccountingBooks?
A modern, cloud-native web application for managing group travel expenses with real-time 
collaboration, automated bill-splitting, and secure multi-user access control.

### Core Purpose
- Track expenses during group trips
- Split bills among multiple people
- Manage currencies and exchange rates
- Generate statistical reports
- Control access with role-based permissions

### Language: Traditional Chinese (UI) with English Documentation

---

## 2. OVERALL ARCHITECTURE PATTERN

### Architecture Type: Full-Stack Cloud Native

Frontend (Browser)
    ↓
Angular 21 SPA + Standalone Components
    ↓
Firebase SDK (Auth, Firestore, Storage)
    ↓
Firebase Backend Services
    ├── Cloud Firestore (Database)
    ├── Firebase Authentication
    ├── Cloud Storage (File uploads)
    ├── Cloud Functions (Backend logic)
    └── Firebase Hosting (Deployment)

---

## 3. TECHNOLOGY STACK

### FRONTEND FRAMEWORK & CORE
- **Angular**: 21.1.0 (Latest modern framework)
  - Standalone Components (New modern approach)
  - Signals (Reactive state management)
  - Dependency Injection
  - Zone.js for change detection
- **TypeScript**: 5.9.2 (Strict mode enabled)
- **RxJS**: 7.8.0 (Reactive programming)
- **Zone.js**: 0.16.0 (Angular change detection)

### STYLING & UI
- **Tailwind CSS**: 3.4.17 (Utility-first CSS framework)
  - Custom config with Soft UI Evolution theme
  - Soft shadows, Extended color palette, Custom border radius
- **SCSS**: Component-scoped styles
- **AutoPrefixer**: 10.4.23 (Vendor prefixes)
- **PostCSS**: 8.5.6 (CSS processing)

### UI & INTERACTION LIBRARIES
- **Swiper.js**: 12.0.3 (Receipt carousel with touch gestures)
- **SweetAlert2**: 11.26.17 (Beautiful modals & dialogs)
- **Hammer.js**: 2.0.8 (Touch gesture recognition)
- **Font Awesome**: 7.1.0 (Icon system)
- **Chart.js**: 4.5.1 (Data visualization)
- **ng2-charts**: 8.0.0 (Angular charts wrapper)
- **Angular CDK**: 21.1.1 (Component toolkit)

### BACKEND & CLOUD SERVICES
- **Firebase Ecosystem**
  - Firebase SDK: 11.10.0
  - @angular/fire: 20.0.1 (Angular Firebase integration)
  - firebase-admin: 12.0.0 (Server-side admin SDK)
  - firebase-functions: 5.0.0 (Serverless functions)
- **Cloud Firestore** (NoSQL real-time database)
- **Firebase Authentication** (Google OAuth)
- **Cloud Storage** (File uploads)
- **Cloud Functions** (Node.js 20)

### BUILD & DEVELOPMENT TOOLS
- **Angular CLI**: 21.1.1, **Angular Build**: 21.1.1
- **Vite**: Used internally by Angular 21+
- **TypeScript Compiler**: 5.9.2
- **Vitest**: 4.0.8 (Unit testing)
- **JSDOM**: 27.1.0 (DOM testing)
- **Firebase CLI**: 15.3.1 (Deployment)

### DATA PROCESSING
- **PapaParse**: 5.5.3 (CSV parsing)
- **JSZip**: 3.10.1 (ZIP file creation)
- **File-Saver**: 2.0.5 (Browser downloads)
- **crypto-js**: 4.2.0 (Client-side encryption)
- **heic2any**: 0.0.4 (HEIC image conversion)

---

## 4. KEY DIRECTORIES & PURPOSES

### /src/app/core/ - Business Logic Layer
- **services/** (14 services, ~6,427 LOC total)
  - auth.service.ts: Firebase authentication & user management
  - trip.service.ts: Trip CRUD & queries
  - expense.service.ts: Expense tracking
  - trip-members.service.ts: Member management
  - category.service.ts: Expense categories
  - payment-method.service.ts: Payment methods
  - exchange-rate.service.ts: Currency conversion
  - currency.service.ts: Currency management
  - notification.service.ts: Real-time notifications
  - system-settings.service.ts: Global settings
  - statistics.service.ts: Analytics & reporting
  - user.service.ts: User profiles
  - export.service.ts: Data export (CSV/ZIP)
  - search-filter.service.ts: Search & filtering

- **models/** (10 TypeScript interfaces)
  - trip.model.ts, expense.model.ts, trip-member.model.ts
  - user.model.ts, category.model.ts, payment-method.model.ts
  - currency.model.ts, exchange-rate.model.ts, notification.model.ts
  - system-settings.model.ts

- **guards/** (Route protection)
  - auth.guard.ts: Authentication gate
  - admin.guard.ts: Admin-only access

- **utils/** (Helper utilities)
  - icon-utils.ts, image-utils.ts

### /src/app/components/ - Reusable UI Components
- account-settings-dialog: User settings modal
- trip-dialog: Trip creation/edit
- expense-dialog: Expense creation/edit
- category-dialog: Category management
- trip-members-dialog: Member management
- user-dialog: User creation/edit
- expense-item: Reusable expense row
- notification-panel: Notification UI

### /src/app/pages/ - Page Components
- **login/**: Authentication page
- **trips/**: Trip listing & management
- **expenses/**: Expense tracking page
  - search-filter/: Advanced filtering UI
  - statistics/: Charts & analytics
- **admin/**: Admin Dashboard (7 management pages)
  - dashboard, trip-management, user-management
  - category-management, payment-method-management
  - currencies, statistics

### /src/app/layout/
- **main-layout/**: Global navigation & layout shell

### /functions/ - Cloud Functions (Backend)
- **src/index.ts**: Main functions with 9 deployed functions
  - 5 Firestore triggers (expense/member events)
  - 2 scheduled functions (account cleanup, daily sync)
  - 1 HTTP callable (manual sync)
  - 1 health check endpoint

---

## 5. MODULE ORGANIZATION & DEPENDENCY TREE

### Service Dependency Graph
```
AuthService (Authentication)
    ├── Provides: isAuthenticated$, currentUser$
    └── Used by: All other services

TripService (Trip Management)
    ├── Depends on: AuthService, Firestore
    └── Provides: getTrips$(), CRUD operations

ExpenseService (Expense Tracking)
    ├── Depends on: TripService, AuthService
    └── Provides: getExpenses$(), addExpense()

NotificationService (Real-time Updates)
    ├── Depends on: AuthService, Firestore
    └── Provides: notifications$, markAsRead()

ExchangeRateService (Currency Conversion)
    ├── Depends on: HttpClient, SystemSettings
    └── Provides: convertCurrency()

StatisticsService (Analytics)
    ├── Depends on: ExpenseService
    └── Provides: calculateStats()

ExportService (Data Export)
    ├── Depends on: ExpenseService, PapaParse
    └── Provides: exportToCSV(), exportToZIP()
```

### Component Hierarchy
```
App (Root Component)
├── LoginComponent
└── MainLayoutComponent
    ├── Navigation/Sidebar
    ├── TripsComponent (Trip listing & search)
    ├── ExpensesComponent
    │   ├── ExpenseItemComponent (rows)
    │   ├── SearchFilterComponent
    │   └── StatisticsComponent (charts)
    └── Admin Routes
        ├── AdminDashboardComponent
        ├── TripManagementComponent
        ├── UserManagementComponent
        ├── CategoryManagementComponent
        ├── PaymentMethodManagementComponent
        ├── CurrenciesComponent
        └── StatisticsComponent
```

---

## 6. ROUTING & NAVIGATION STRUCTURE

```
/login
  → LoginComponent (unauthenticated users)

/ (protected by authGuard)
  → MainLayoutComponent
  ├── /trips → TripsComponent
  ├── /trip/:tripId/expenses → ExpensesComponent
  └── /admin (protected by adminGuard)
      ├── /dashboard → AdminDashboardComponent
      ├── /trips → TripManagementComponent
      ├── /users → UserManagementComponent
      ├── /stats → StatisticsComponent
      ├── /categories → CategoryManagementComponent
      ├── /payment-methods → PaymentMethodManagementComponent
      └── /currencies → CurrenciesComponent

/**: wildcard → redirects to /
```

---

## 7. DATA MODEL & FIRESTORE SCHEMA

### Collections Structure

**users/{userId}**
- email, displayName, photoURL, status (active/inactive)
- isAdmin, createdAt, updatedAt, deleteRequestedAt (optional)

**trips/{tripId}**
- name, startDate, endDate, status (active/inactive)
- createdBy, ownerId, currency, coverImage, description
- memberCount (denormalized), customCurrencies[], timestamps

**trips/{tripId}/members/{memberId}** (Subcollection)
- userId, displayName, email, photoURL
- role (owner/editor/viewer), addedAt, addedBy

**trips/{tripId}/expenses/{expenseId}** (Subcollection)
- item, amount, currency, category, paymentMethod
- submittedBy, submittedByName, submittedByEmail (denormalized)
- receiptImages[], isDeletedUser, timestamps

**categories/{categoryId}**
- name, icon (Font Awesome), color, isDefault, createdAt

**paymentMethods/{methodId}**
- name, icon, isDefault

**currencies/{currencyId}**
- code (TWD, USD, JPY), name, symbol
- exchangeRate, lastUpdated

**exchangeRates/{rateId}**
- from, to, rate, timestamp

**notifications/{notificationId}**
- userId, type (expense_*/trip_member_*), tripId
- message, isRead, actor info, timestamps

**settings/{settingId}**
- key, value, description, lastUpdated

---

## 8. SECURITY & ACCESS CONTROL

### Firestore Security Rules
- **User Documents**: Only accessible by self or authorized users
- **System Settings**: Public read, admin write only
- **Trips**: Members can read/write based on role
- **Expenses**: Role-based access (viewer/editor/owner)
- **Categories, Methods, Currencies**: Public read, admin write
- **Notifications**: Users see only their own
- **Collection Groups**: Query-able for members across trips

### Cloud Storage Rules
- **/receipts/{tripId}/**: Editors/Owners upload ≤10MB
- **/trip-covers/{tripId}/**: Trip owners only ≤10MB
- **/avatars/{userId}/**: Users own avatar only
- **Allowed Types**: JPEG, PNG, HEIC, HEIF
- **Size Limit**: 10MB per file

### Authentication
- **Provider**: Firebase Authentication (Google OAuth)
- **Persistence**: browserLocalPersistence (automatic)
- **Token**: Auto-refresh via Firebase SDK

---

## 9. CLOUD FUNCTIONS (Backend)

### Firestore Triggers
1. **onExpenseCreated** - Creates notifications when expense added
2. **onExpenseUpdated** - Creates update notifications
3. **onExpenseDeleted** - Creates deletion notifications
4. **onMemberAdded** - Notifies new member joining
5. **onMemberRemoved** - Notifies remaining members

### Scheduled Functions (Pub/Sub)
6. **cleanupDeletedAccounts** (Daily 00:00 UTC)
   - Marks expenses >7 days after delete request
   - Updates user references to "已註銷使用者"

7. **dailySyncUsersPhotoURL** (Daily 01:00 UTC)
   - Syncs avatars from Firebase Auth
   - Updates modified display names

### HTTP Callable Functions
8. **syncAllUsersPhotoURL** (Admin-only)
   - Manual trigger for avatar sync
   - Returns update statistics

### Health Check
9. **healthCheck** - {status: 'ok', timestamp: ISO}

---

## 10. BUILD & DEPLOYMENT

### Angular Build System
```
Development:
  - Source maps: enabled
  - Optimization: false
  - Licenses: not extracted

Production:
  - Budgets: 3MB initial, 4KB component styles
  - Output hashing: all
  - Optimization: enabled
```

### Firebase Deployment (firebase.json)
```
hosting:
  public: dist/accounting-books/browser
  rewrites: ** → /index.html (SPA mode)

functions:
  source: functions/
  runtime: Node.js 20

firestore:
  rules: firestore.rules

storage:
  bucket: accountingbooks-9fa26.firebasestorage.app
  rules: storage.rules
```

### Environment Config
- **Development**: Optional Firebase Emulators, source maps enabled
- **Production**: Real Firebase project, optimized bundle

---

## 11. STYLING & DESIGN SYSTEM

### Tailwind CSS Custom Theme (Soft UI Evolution)
```
Colors:
  - Background: #e0e5ec (light blue-gray)
  - Primary: #4fd1c5 (teal), Primary-dark: #319795
  - Secondary: #a0aec0 (slate)
  - Text: #2d3748 (dark), Text-light: #718096
  - Danger: #e53e3e (red)

Shadows (Soft UI):
  - soft, soft-sm, soft-lg, soft-xl (embossed effect)
  - soft-inset (pressed effect)

Border Radius:
  - xl: 1rem, 2xl: 1.5rem, 3xl: 2rem
```

### Files
- 23 SCSS files (component-scoped)
- Global styles in src/styles.scss
- Autoprefixer for vendor prefixes

---

## 12. KEY ARCHITECTURAL PATTERNS

### Reactive Programming (RxJS)
- Observables for data streams
- Subjects for state management
- Pipe operators for transformations
- Automatic unsubscription

### Standalone Components
- No NgModules required
- Tree-shakable dependencies
- Self-contained components

### Dependency Injection
- Service singleton pattern
- Constructor injection
- Injectable decorator

### Real-time Features
- Firestore listeners
- Live expense updates
- Instant notifications
- Real-time member sync

### UI/UX Features
- SweetAlert2 modals
- Swiper.js image carousel
- Hammer.js touch gestures
- Chart.js data visualization
- Responsive mobile-first design

### Data Export
- CSV generation (PapaParse)
- ZIP archives (JSZip)
- Browser file downloads

---

## 13. CONFIGURATION FILES

### TypeScript (tsconfig.json)
- Strict mode enabled
- Target: ES2022, Module: preserve
- No index signature access
- Angular strict templates

### Angular (angular.json)
- Builder: @angular/build:application
- Dev server: @angular/build:dev-server
- SCSS inline styles
- Tailwind CSS as global style

### Firebase (firebase.json)
- Hosting: SPA mode, history rewriting
- Functions: Node.js 20
- Security rules for Firestore & Storage

### Code Formatting (.prettierrc)
- Print width: 100 chars
- Single quotes enabled
- Angular HTML parser

---

## 14. DEVELOPMENT WORKFLOW

### NPM Scripts
```
Frontend:
  npm start         → ng serve (dev server :4200)
  npm run build     → ng build (production)
  npm run watch     → ng build --watch
  npm test          → ng test (Vitest)

Functions:
  npm run build     → tsc (compile)
  npm run start     → emulator start
  npm run deploy    → firebase deploy --only functions
  npm run logs      → firebase functions:log
```

---

## 15. CODE METRICS

### Lines of Code
- Frontend TypeScript: ~6,427 LOC
- HTML Templates: 23 files
- SCSS Styles: 23 files
- Backend Functions: ~523 LOC

### Components & Services
- Core Services: 14 (auth, trip, expense, member, etc.)
- Models: 10 (data types)
- Reusable Components: 8+
- Page Components: 4 main + 7 admin
- Route Guards: 2 (auth, admin)

---

## 16. DEPENDENCIES & VERSIONS

### Framework Stack
- Angular 21.1.0 (Latest)
- TypeScript 5.9.2 (Latest)
- Firebase 11.10.0 (Latest)
- RxJS 7.8.0 (Stable)

### UI Libraries
- Swiper: 12.0.3 (Latest)
- SweetAlert2: 11.26.17 (Latest)
- Chart.js: 4.5.1 (Latest)
- Font Awesome: 7.1.0 (Latest)

### Package Manager
- npm: 10.9.2 (Locked)
- Node.js: 20 (Functions)
- No known security issues

---

## 17. PERFORMANCE & SCALABILITY

### Frontend Optimization
- Bundle budgets: 3MB initial, 4KB component style
- Production optimization enabled
- Lazy code splitting via routes
- Source maps for debugging

### Database Optimization
- Firestore indexes for queries
- Denormalization for read efficiency
- Batch operations for updates
- Selective real-time listeners

### Cloud Functions
- Parallel notifications (Promise.all)
- Efficient Firestore queries
- Scheduled cleanup tasks
- Health monitoring

### Caching Strategy
- Browser localStorage (session)
- Exchange rate caching
- Client-side component state (RxJS)

---

## 18. INTERNATIONALIZATION

### Current Status
- UI: Traditional Chinese (繁體中文)
- Docs: English
- Settings: Multilingual-ready

### Supported Currencies
- TWD (Taiwan Dollar) - Default
- USD (US Dollar)
- JPY (Japanese Yen)
- More via currency administration

---

## SUMMARY

AccountingBooks is a **production-ready, enterprise-grade** expense management system featuring:

**Frontend**
- Modern Angular 21 with Standalone Components
- Responsive Soft UI design with Tailwind CSS
- Rich interaction (Swiper, Charts, Modals, Gestures)
- Real-time collaboration features

**Backend**
- Cloud Firestore for real-time database
- Firebase Authentication with Google OAuth
- Cloud Functions for automated notifications
- Cloud Storage for receipt images

**Architecture Strengths**
- Type-safe TypeScript development
- Role-based access control
- Secure Firebase rules
- Mobile-first responsive design
- Cloud-native scalability
- Well-organized modular structure
- Comprehensive error handling
- Real-time data synchronization

**Security & Compliance**
- Firestore security rules enforcement
- Cloud Storage access control
- Authentication via Firebase
- User data isolation
- Audit trails for account deletion

Perfect for team expense tracking, group travel planning, and collaborative bill-splitting scenarios.
