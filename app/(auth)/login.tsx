import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { signInWithEmail } from '@/lib/supabase';
import { useTranslation } from '@/lib/i18n';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert(t('missing_fields'), t('fill_email_password'));
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert(t('login_failed'), e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-cream dark:bg-ink"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-20 pb-10">
          {/* Header */}
          <View className="mb-12">
            <Text className="font-playfair-bold text-5xl text-ink dark:text-cream">
              Wandered
            </Text>
            <Text className="font-dm text-base text-ink/60 dark:text-cream/60 mt-2">
              {t('login_tagline')}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="font-dm-medium text-sm text-ink/70 dark:text-cream/70 mb-2">
                {t('email')}
              </Text>
              <TextInput
                className="bg-white dark:bg-dark-surface border border-cream dark:border-dark-border rounded-2xl px-4 py-4 font-dm text-base text-ink dark:text-cream"
                placeholder={t('email_placeholder')}
                placeholderTextColor="#9b9590"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="font-dm-medium text-sm text-ink/70 dark:text-cream/70 mb-2">
                {t('password')}
              </Text>
              <TextInput
                className="bg-white dark:bg-dark-surface border border-cream dark:border-dark-border rounded-2xl px-4 py-4 font-dm text-base text-ink dark:text-cream"
                placeholder="••••••••"
                placeholderTextColor="#9b9590"
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-rust rounded-pill py-4 items-center mt-2"
            >
              {loading ? (
                <ActivityIndicator color="#f5f0e8" />
              ) : (
                <Text className="font-dm-bold text-base text-cream">{t('sign_in')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-ink/10 dark:bg-cream/10" />
            <Text className="font-dm text-sm text-ink/40 dark:text-cream/40 mx-4">{t('or')}</Text>
            <View className="flex-1 h-px bg-ink/10 dark:bg-cream/10" />
          </View>

          {/* Sign up link */}
          <View className="flex-row justify-center">
            <Text className="font-dm text-base text-ink/60 dark:text-cream/60">
              {t('no_account')}{' '}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text className="font-dm-bold text-base text-rust">{t('sign_up_link')}</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View className="flex-1" />

          <Text className="font-dm text-xs text-center text-ink/30 dark:text-cream/30">
            {t('price_tagline')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
