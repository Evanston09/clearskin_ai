import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/useColorScheme';
import { SessionProvider, useSession } from '@/contexts/AuthContext';
import SplashScreenController from './splash';
import React from 'react';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: false,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function Root() {
  return (
    <SessionProvider>
      <SplashScreenController />
      <RootNavigator />
    </SessionProvider>
  );
});
function RootNavigator() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
    const colorScheme = useColorScheme();
    const { user, isLoading } = useSession();

    if (!loaded || isLoading) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Protected guard={!user}>
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="signUp" options={{ headerShown: false }} />
                </Stack.Protected>

                <Stack.Protected guard={!!user}>
                    <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                    <Stack.Screen name="quiz" options={{ headerShown: false }} />
                    <Stack.Screen name="detectionDetails" options={{ headerShown: false }} />
                </Stack.Protected>
            </Stack>
            <StatusBar style="auto" />
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}