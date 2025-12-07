# CivicFix Mobile (Expo)

React Native (Expo) client for the CivicFix platform. Provides authentication, issue reporting, and a tabbed experience connected to the Node.js backend.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set your backend base URL (local IP) so the app can reach the API:
   ```bash
   npx expo start --clear --tunnel
   ```
   or set the environment variable for hot reload sessions:
   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api npx expo start
   ```
   You can also update `expo.extra.apiUrl` inside `app.json`.
3. Start the development server:
   ```bash
   npm start
   ```
4. Scan the QR code using Expo Go on your device (ensure the device is on the same network).

## Features

- **Auth Flow** – Login & Signup screens with validation, AsyncStorage token persistence, and Axios interceptors.
- **Bottom Tabs** – Home (issue feed), Report (camera + location), Profile (account info).
- **Issue Reporting** – Capture a photo, auto-fetch GPS location, and submit to `POST /api/issues`.
- **Issue Feed** – Fetch and render community issues with status chips and metadata.
- **Responsive UI** – Built with React Native Paper for fast theming and consistent styling.

## Folder Structure

```
mobile/
├── App.js
├── app.json
├── src
│   ├── components
│   │   └── IssueCard.js
│   ├── context
│   │   └── AuthContext.js
│   ├── navigation
│   │   └── AppNavigator.js
│   ├── screens
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── ReportScreen.js
│   │   └── SignupScreen.js
│   └── utils
│       └── api.js
└── README.md
```

## Notes

- Update `EXPO_PUBLIC_API_URL` or `app.json > expo.extra.apiUrl` with your LAN IP before testing.
- The Report flow currently generates a placeholder remote image URL until media uploads are wired up.
- Staff/Admin accounts must be provisioned via backend tools for now.
- Remember to enable PostGIS in your database for accurate geo queries later.

## Next Steps

- Integrate real media uploads (S3/Firebase Storage) and replace placeholder URLs.
- Build filters & map view for issues.
- Expand profile management (notifications, saved locations, password reset).
- Hook Firebase Cloud Messaging for push notifications.

