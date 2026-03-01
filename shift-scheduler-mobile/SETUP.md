# Setup Instructions

## Prerequisites
- Node.js 18+ installed
- npm or yarn
- Expo CLI (will be installed globally or use npx)

## Initial Setup

1. **Navigate to the mobile directory**
   ```bash
   cd shift-scheduler-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - The `.env.example` file shows the required variables
   - For Expo, environment variables are configured in `app.json` under `extra` section
   - Update `API_BASE_URL` in `app.json` to match your backend URL

4. **Start the development server**
   ```bash
   npm start
   ```

   Then:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
shift-scheduler-mobile/
├── App.tsx                 # Root component
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json          # TypeScript configuration
├── babel.config.js         # Babel configuration
├── metro.config.js         # Metro bundler configuration
└── src/
    ├── screens/
    │   ├── AuthStack/      # Authentication screens
    │   └── MainStack/      # Main app screens
    ├── components/         # Reusable components
    ├── services/           # API services
    ├── context/            # React Context providers
    ├── navigation/         # Navigation configuration
    ├── types/              # TypeScript type definitions
    └── utils/              # Utility functions
```

## Next Steps

1. Create placeholder assets (icon.png, splash.png, etc.) in `assets/` folder
2. Update API_BASE_URL in `app.json` to point to your backend
3. Implement remaining screen functionality
4. Add file upload functionality
5. Integrate calendar and notifications

