# Pat — Personal Ledger

A mobile-first React + Vite expense / credit tracker backed by Firebase Auth and Firestore. Log credits and debits per person, group by category, and keep your books tidy from your phone.

## Features

- Email + password sign in / sign up (Firebase Auth)
- Per-user data in Firestore
- Default expense categories created automatically on first login
- Add / rename / delete people and categories
- Add credit or debit entries with person, amount, category, notes
- Live updating, chat-style transaction feed grouped by day
- Net balance + filter by credit / debit
- Mobile-first UI with bottom sheet form, large tap targets, safe-area aware

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Firebase project**
   - Go to https://console.firebase.google.com and create a project.
   - In the project, enable **Authentication → Sign-in method → Email/Password**.
   - Enable **Firestore Database** (start in production mode is fine).
   - Add a **Web app** to the project to get your config.

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in the values from your Firebase web app config:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

4. **Lock down Firestore with security rules**

   In Firebase console → Firestore → Rules, paste:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open the printed URL on your phone (same Wi-Fi) for the real mobile feel — Vite is bound to `0.0.0.0`.

## Data model

```
users/{uid}
  email, displayName, createdAt

users/{uid}/categories/{id}
  name, icon, color, createdAt

users/{uid}/people/{id}
  name, createdAt

users/{uid}/transactions/{id}
  type: "credit" | "debit"
  amount: number
  personId: string
  categoryId: string
  notes: string
  createdAt: number
  updatedAt: number
```

## Build

```bash
npm run build
npm run preview
```

You can deploy the contents of `dist/` to Firebase Hosting, Vercel, Netlify, or any static host.
