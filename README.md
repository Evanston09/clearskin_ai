# ClearSkin AI

A React Native mobile application that uses AI to detect and analyze acne, helping users track their skin health over time.

## Overview

ClearSkin AI allows users to take photos of their face to detect acne spots using machine learning. The app provides personalized insights, tracks scan history, and offers skincare tips to help manage acne conditions.

## Technologies

- **React Native** with **Expo** - Cross-platform mobile development
- **TypeScript** - Type-safe JavaScript
- **Firebase** - User authentication
- **TensorFlow.js** - Machine learning integration
- **AsyncStorage** - Local data persistence
- **Expo Camera & Image Picker** - Photo capture and gallery access

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase credentials in `firebaseConfig.js`

3. Set your detection API endpoint in the environment configuration

4. Start the development server:
```bash
npm start
```

5. Run on your platform:
```bash
npm run ios      # iOS
npm run android  # Android
npm run web      # Web
```

## Disclaimer

ClearSkin AI is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.
