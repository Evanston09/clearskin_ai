import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SessionProvider, useSession } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import SplashScreenController from './splash';
import React from 'react';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

export default Sentry.wrap(function Root() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <SplashScreenController />
        <RootNavigator />
      </SessionProvider>
    </ThemeProvider>
  );
});
function RootNavigator() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
    const { user, isLoading } = useSession();
    const { scheme } = useTheme();

    if (!loaded || isLoading) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <NavThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Protected guard={!user}>
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="signUp" options={{ headerShown: false }} />
                </Stack.Protected>

                <Stack.Protected guard={!!user}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="quiz" options={{ headerShown: false }} />
                    <Stack.Screen name="detectionDetails" options={{ headerShown: false }} />
                    <Stack.Screen name="allScans" options={{ headerShown: false }} />
                    <Stack.Screen name="about" options={{ headerShown: false }} />
                </Stack.Protected>
            </Stack>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            </NavThemeProvider>
        </GestureHandlerRootView>
    );
}
