# Listify - Notes & Lists Mobile App

Listify is a simple and fast mobile app for creating and managing notes with speech input, built with Expo and React Native.

## Features

- **Quick Note Creation**: One-tap note creation with instant save
- **Speech Input**: Press-to-talk microphone with text recognition
- **Smart Lists**: Organize notes into named lists (Personal, Work, Project A, Project B)
- **Checkbox Behavior**: Tick items to strikethrough and auto-move to bottom
- **Search**: Find notes across all lists
- **Settings**: Manage app preferences

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- Android device or emulator for testing

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. For Android development:
   - Press `a` to open on Android emulator
   - Or scan the QR code with Expo Go app on your Android device

### Building for Production

#### Using EAS Build (Recommended)

EAS Build is Expo's cloud-based build service that creates production-ready APKs.

1. Install EAS CLI:
```bash
npm install -g @expo/eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

3. Configure your project (first time only):
```bash
eas build:configure
```

4. Build APK for testing:
```bash
eas build --platform android --profile preview
```

5. Build AAB for production:
```bash
eas build --platform android --profile production
```

#### Local Build (Alternative)

For local APK generation:

1. Eject to bare workflow:
```bash
npx expo eject
```

2. Build using Android Studio or:
```bash
cd android && ./gradlew assembleRelease
```

The APK will be generated in `android/app/build/outputs/apk/release/`

## Development

- Run `npm run dev` to start the development server
- Use Android emulator or physical device for testing
- Speech recognition requires device with microphone access

## Permissions

The app requires the following permissions:
- Microphone access (for speech input)
- Audio recording (for voice recognition)

These are handled gracefully with user-friendly error messages.