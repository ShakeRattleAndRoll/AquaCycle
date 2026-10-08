import { Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import type { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { requireSupabase } from '@/utils/supabase';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({ Montserrat_700Bold, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const client = requireSupabase();
    let mounted = true;

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setAuthReady(true);
    });

    void client.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      setSession(error ? null : data.session);
      setAuthReady(true);
    }).catch(() => {
      if (!mounted) return;
      setSession(null);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!fontsLoaded || !authReady) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(shared)" options={{ headerShown: false }} />
        <Stack.Screen name="(customer-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(staff-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
