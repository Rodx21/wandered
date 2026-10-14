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
import { signUpWithEmail } from '@/lib/supabase';
import { useTranslation } from '@/lib/i18n';

export default function SignupScreen() {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert(t('missing_fields'), t('fill_all_fields'));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t('weak_password'), t('password_min_8'));
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, displayName.trim());
      Alert.alert(
        t('check_email'),
        t('check_email_msg'),
        [{ text: t('ok'), onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (e: any) {
      Alert.alert(t('signup_failed'), e.message);
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
          <View className="mb-10">
            <Text className="font-playfair-bold text-4xl text-ink dark:text-cream">
              {t('start_journey')}
            </Text>
            <Text className="font-dm text-base text-ink/60 dark:text-cream/60 mt-2">
              {t('signup_subtitle')}
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="font-dm-medium text-sm text-ink/70 dark:text-cream/70 mb-2">
                {t('your_name')}
              </Text>
              <TextInput
                className="bg-white dark:bg-dark-surface border border-cream dark:border-dark-border rounded-2xl px-4 py-4 font-dm text-base text-ink dark:text-cream"
                placeholder={t('name_placeholder')}
                placeholderTextColor="#9b9590"
                autoCapitalize="words"
                autoComplete="name"
                value={displayName}
                onChangeText={setDisplayName}
              />
              {displayName.length > 1 && (
                <Text className="font-dm text-xs text-ink/40 dark:text-cream/40 mt-1 ml-1">
                  {t('profile_link', {
                    slug: displayName.toLowerCase().trim().replace(/\s+/g, '-'),
                  })}
                </Text>
              )}
            </View>

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
                placeholder={t('min_8_chars')}
                placeholderTextColor="#9b9590"
                secureTextEntry
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className="bg-rust rounded-pill py-4 items-center mt-2"
            >
              {loading ? (
                <ActivityIndicator color="#f5f0e8" />
              ) : (
                <Text className="font-dm-bold text-base text-cream">{t('create_account')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign in link */}
          <View className="flex-row justify-center mt-6">
            <Text className="font-dm text-base text-ink/60 dark:text-cream/60">
              {t('already_account')}{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="font-dm-bold text-base text-rust">{t('sign_in_link')}</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <View className="flex-1" />

          <Text className="font-dm text-xs text-center text-ink/30 dark:text-cream/30">
            {t('terms')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
