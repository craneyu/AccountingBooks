# AccountingBooks (PayState)

A travel expense tracking application with Soft UI Evolution design.

## Features
- **Authentication**: Google Sign-In via Firebase.
- **Trips**: Manage multiple travel trips.
- **Expenses**: Track expenses with real-time currency conversion.
- **Design**: Soft UI (Neumorphism-inspired) with modern accessibility adjustments.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project.
   - Enable Authentication (Google Provider).
   - Enable Firestore Database.
   - Copy your Firebase configuration.
   - Open `src/environments/environment.ts` and paste the config:
     ```typescript
     export const environment = {
       production: false,
       firebase: {
         apiKey: "...",
         authDomain: "...",
         projectId: "...",
         storageBucket: "...",
         messagingSenderId: "...",
         appId: "..."
       },
       // ...
     };
     ```

3. **Run Application**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:4200`.

4. **Firestore Indexes**
   - When you access the Trips page, check the browser console.
   - If a composite index is required (e.g., for sorting trips by date), Firebase SDK will print a link.
   - Click the link to create the index automatically.

## Tech Stack
- Angular 19+ (Standalone Components)
- Tailwind CSS (Soft UI Theme)
- Firebase (Auth, Firestore)
- ExchangeRate-API