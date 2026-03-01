# Shift Scheduler Mobile App

React Native mobile application for Shift Scheduler built with Expo and TypeScript.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd shift-scheduler-mobile
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Update `API_BASE_URL` with your backend API URL

3. **Run the App**
   ```bash
   npm start
   ```

   Then press:
   - `i` for iOS simulator
   - `a` for Android emulator
   - `w` for web browser

## Project Structure

```
src/
├── screens/
│   ├── AuthStack/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   └── MainStack/
│       ├── HomeScreen.tsx
│       ├── ShiftsScreen.tsx
│       ├── UploadScreen.tsx
│       ├── ProfileScreen.tsx
│       └── ShiftDetailScreen.tsx
├── components/
│   ├── Button.tsx
│   └── ShiftCard.tsx
├── services/
│   ├── AuthService.ts
│   └── ShiftService.ts
├── context/
│   └── AuthContext.tsx
├── navigation/
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
├── types/
│   └── index.ts
└── utils/
    └── config.ts
```

## Features

- ✅ Authentication (Login/Register)
- ✅ Shift Management
- ✅ File Upload
- ✅ Calendar Integration
- ✅ Notifications
- ✅ TypeScript Support
- ✅ Navigation with React Navigation

