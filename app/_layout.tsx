import '../global.css';
import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import type { Session } from '@supabase/supabase-js';
import { supabase, upsertProfile } from '@/lib/supabase';
import { initRevenueCat } from '@/lib/revenuecat';
import { useUserStore } from '@/stores/useUserStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router      = useRouter();
  const segments    = useSegments();

  const setSession  = useUserStore((s) => s.setSession);
  const loadUserData = useUserStore((s) => s.loadUserData);
  const reset       = useUserStore((s) => s.reset);
  const session     = useUserStore((s) => s.session);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const [authReady, setAuthReady] = useState(false);
  const didBootstrap = useRef(false);

  // ── Auth bootstrap ────────────────────────────────────────────────
  async function bootstrap(sess: Session | null) {
    setSession(sess);

    if (!sess?.user) {
      reset();
      setAuthReady(true);
      return;
    }

    const displayName =
      (sess.user.user_metadata?.display_name as string | undefined) ??
      sess.user.email?.split('@')[0] ??
      'Traveller';

    // Ensure public.users row exists so FK constraints pass
    try {
      await upsertProfile(sess.user.id, displayName);
    } catch {
      // Row already exists or slug conflict — safe to ignore
    }

    try {
      await initRevenueCat(sess.user.id);
    } catch {
      // RevenueCat not critical for save flow
    }

    await loadUserData(sess.user.id);
    setAuthReady(true);
  }

  useEffect(() => {
    // onAuthStateChange fires on mount with INITIAL_SESSION
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        if (!didBootstrap.current) {
          // First event — do full bootstrap
          didBootstrap.current = true;
          bootstrap(sess);
        } else {
          // Subsequent events (logout, token refresh) — just update session
          setSession(sess);
          if (!sess?.user) {
            reset();
            setAuthReady(true);
          }
        }
      },
    );
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth guard ────────────────────────────────────────────────────
  // Only redirect auth → app (not app → login), so the app is
  // accessible without a session during development.
  useEffect(() => {
    if (!authReady || !fontsLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (session?.user && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [authReady, fontsLoaded, session, segments]);

  // ── Hide splash when both fonts and auth are ready ───────────────
  useEffect(() => {
    if (fontsLoaded && authReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authReady]);

  // Keep splash up until ready
  if (!fontsLoaded || !authReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="share/[slug]" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
