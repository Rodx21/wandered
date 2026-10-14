import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { fetchPublicProfile } from '@/lib/supabase';
import { TOTAL_COUNTRIES } from '@/constants';

interface PublicProfile {
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    share_slug: string;
  };
  countries: { id: string; country_code: string; country_name: string; visited_at: string }[];
  cities: { id: string; city_name: string; country_code: string }[];
}

export default function PublicProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [data, setData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetchPublicProfile(slug)
      .then((d) => setData(d as PublicProfile))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <View className="flex-1 bg-cream dark:bg-ink items-center justify-center">
        <ActivityIndicator color="#c4501a" size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="flex-1 bg-cream dark:bg-ink items-center justify-center px-8">
        <Text className="font-dm text-base text-ink/50 dark:text-cream/50 text-center">
          {error ?? 'Profile not found.'}
        </Text>
      </View>
    );
  }

  const worldPercent = ((data.countries.length / TOTAL_COUNTRIES) * 100).toFixed(1);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-cream dark:bg-ink">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        {/* Brand */}
        <Text className="font-playfair-bold text-2xl text-gold tracking-widest mb-8">
          WANDERED
        </Text>

        {/* User */}
        <Text className="font-playfair-bold text-4xl text-ink dark:text-cream">
          {data.user.display_name}
        </Text>
        <Text className="font-dm text-sm text-ink/40 dark:text-cream/40 mb-8">
          wandered.app/{data.user.share_slug}
        </Text>

        {/* Stats row */}
        <View className="flex-row gap-4 mb-8">
          {[
            { value: data.countries.length, label: 'Countries' },
            { value: data.cities.length, label: 'Cities' },
            { value: `${worldPercent}%`, label: 'of world' },
          ].map((s) => (
            <View
              key={s.label}
              className="flex-1 bg-white dark:bg-dark-surface rounded-3xl p-4 items-center"
            >
              <Text className="font-playfair-bold text-3xl text-rust">{s.value}</Text>
              <Text className="font-dm text-xs text-ink/40 dark:text-cream/40 uppercase tracking-wide">
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Country list */}
        {data.countries.length > 0 && (
          <View>
            <Text className="font-dm-bold text-base text-ink dark:text-cream mb-3">
              Countries visited
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {data.countries.map((c) => (
                <View
                  key={c.id}
                  className="flex-row items-center gap-1.5 bg-white dark:bg-dark-surface rounded-pill px-3 py-1.5"
                >
                  <Text className="text-base">{flagEmoji(c.country_code)}</Text>
                  <Text className="font-dm text-sm text-ink dark:text-cream">
                    {c.country_name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function flagEmoji(code: string): string {
  const offset = 0x1f1a5;
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join('');
}
