import { Stack, Redirect } from 'expo-router';
import { useUserStore } from '@/stores/useUserStore';

export default function AuthLayout() {
  const session = useUserStore((s) => s.session);

  // Already logged in → redirect into app
  if (session) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
