# Localynk Mobile App

Localynk is the mobile client for the My Friendly Local Guide ecosystem. It is built with Expo + React Native and supports tourist, guide, and agency workflows such as discovery, booking, payments, messaging, and reviews.

## Tech Stack

- Expo SDK 54
- React Native 0.81
- Expo Router (file-based navigation)
- Axios for API requests
- AsyncStorage for local auth token handling
- Expo Notifications and EAS Update support

## Project Structure

```
localynk/
  app/                 # Expo Router routes and screens
  api/                 # Axios client and API helpers
  components/          # Reusable UI components
  context/             # Auth and app-level context
  hooks/               # Reusable hooks
  utils/               # Shared utility functions
  assets/              # Images and static assets
```

## Prerequisites

- Node.js 18 or newer (Node.js 20 LTS recommended)
- npm 9+
- Expo CLI (via npx, no global install required)
- One of:
  - Expo Go on Android/iOS device
  - Android Studio emulator
  - Xcode simulator (macOS only)

## Installation and Local Setup

1. Open a terminal in the app folder:

   ```bash
   cd localynk
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in this folder:

   ```env
   EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

4. Start the Expo dev server:

   ```bash
   npm run start
   ```

5. Launch on your target platform from the Expo terminal menu:

- Press `a` for Android
- Press `i` for iOS (macOS only)
- Press `w` for web
- Scan the QR code for Expo Go

## Available Scripts

- `npm run start` - Start Expo dev server
- `npm run android` - Build/run Android locally
- `npm run ios` - Build/run iOS locally
- `npm run web` - Run Expo web target
- `npm run lint` - Run lint checks

## Backend Connection

- Localynk sends API requests to `EXPO_PUBLIC_API_URL`.
- Start the backend from the My Friendly Local Guide repository first.
- If you use a physical device, set `EXPO_PUBLIC_API_URL` to a reachable host (for example your machine LAN IP), not only `localhost`.

## Common Troubleshooting

- If env changes are not picked up, restart Expo with:

  ```bash
  npx expo start --clear
  ```

- If API requests fail, verify `EXPO_PUBLIC_API_URL` and ensure the backend is running.

