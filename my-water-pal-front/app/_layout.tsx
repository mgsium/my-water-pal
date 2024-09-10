import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SessionProvider, useSession } from './ctx';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    "SUSE-300": require('../assets/fonts/SUSE-300.ttf'),
    "SUSE-400": require('../assets/fonts/SUSE-400.ttf'),
    "SUSE-500": require('../assets/fonts/SUSE-500.ttf'),
    "SUSE-600": require('../assets/fonts/SUSE-600.ttf'),
    "SUSE-700": require('../assets/fonts/SUSE-700.ttf'),
    "montserrat-800": require('../assets/fonts/montserrat-800.ttf')
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  return (
    <SessionProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </SessionProvider>
  );
}
