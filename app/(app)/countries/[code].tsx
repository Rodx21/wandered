import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useUserStore } from '@/stores/useUserStore';
import { AddPlaceSheet } from '@/components/AddPlaceSheet';
import type { Place } from '@/types';

const PLACE_SECTIONS: { type: Place['type']; emoji: string; label: string }[] = [
  { type: 'landmark', emoji: '🗿', label: 'Landmarks' },
  { type: 'restaurant', emoji: '🍽', label: 'Restaurants' },
  { type: 'hotel', emoji: '🏨', label: 'Hotels' },
  { type: 'airport', emoji: '✈️', label: 'Airports' },
];

export default function CountryDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const visitedCountries = useUserStore((s) => s.visitedCountries);
  const visitedCities    = useUserStore((s) => s.visitedCities);
  const places           = useUserStore((s) => s.places);
  const [addSheet, setAddSheet] = useState(false);

  const country = visitedCountries.find((c) => c.country_code === code);
  const cities = visitedCities.filter((c) => c.country_code === code);

  // Group places by city, then by type
  // For simplicity, we show all places logged without a city_id alongside
  const cityIds = new Set(cities.map((c) => c.id));
  const placesInCountry = places.filter(
    (p) => p.city_id === null || cityIds.has(p.city_id ?? ''),
  );

  const placesByType = useMemo(() => {
    const map: Record<string, Place[]> = {};
    for (const p of placesInCountry) {
      if (!map[p.type]) map[p.type] = [];
      map[p.type].push(p);
    }
    return map;
  }, [placesInCountry]);

  if (!country) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream dark:bg-ink items-center justify-center">
        <Text className="font-dm text-base text-ink/50 dark:text-cream/50">Country not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream dark:bg-ink">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-5 pt-2 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="font-dm text-sm text-rust">← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAddSheet(true)}
              className="w-9 h-9 rounded-full bg-rust items-center justify-center"
            >
              <Text className="text-cream text-xl leading-none font-dm-bold">+</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-3">
            <Text className="text-5xl">{flagEmoji(country.country_code)}</Text>
            <View>
              <Text className="font-playfair-bold text-3xl text-ink dark:text-cream">
                {country.country_name}
              </Text>
              <Text className="font-dm text-sm text-ink/50 dark:text-cream/50">
                First visited {new Date(country.visited_at).toLocaleDateString('en-IE', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          {country.notes && (
            <View className="mt-4 bg-gold/10 rounded-2xl px-4 py-3">
              <Text className="font-dm-italic text-sm text-ink/70 dark:text-cream/70">
                {country.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Cities */}
        {cities.length > 0 && (
          <Section title="Cities" count={cities.length}>
            {cities.map((city) => (
              <Row key={city.id} emoji="🏙" title={city.city_name} subtitle={city.region ?? ''} />
            ))}
          </Section>
        )}

        {/* Place sections */}
        {PLACE_SECTIONS.map((section) => {
          const items = placesByType[section.type] ?? [];
          if (!items.length) return null;
          return (
            <Section key={section.type} title={section.label} count={items.length}>
              {items.map((p) => (
                <Row
                  key={p.id}
                  emoji={section.emoji}
                  title={p.name}
                  subtitle={p.iata_code ? `${p.iata_code} · ${p.address ?? ''}` : (p.address ?? '')}
                  badge={p.rating ? `${'★'.repeat(p.rating)}` : undefined}
                />
              ))}
            </Section>
          );
        })}

        {cities.length === 0 && placesInCountry.length === 0 && (
          <View className="items-center py-10 px-6">
            <Text className="font-dm text-sm text-ink/40 dark:text-cream/40 text-center">
              No cities or places logged here yet.{'\n'}Tap + on the map to add some.
            </Text>
          </View>
        )}
      </ScrollView>

      <AddPlaceSheet visible={addSheet} onClose={() => setAddSheet(false)} />
    </SafeAreaView>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <View className="mx-5 mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-dm-bold text-base text-ink dark:text-cream">{title}</Text>
        <View className="bg-rust/10 rounded-pill px-3 py-1">
          <Text className="font-dm-bold text-xs text-rust">{count}</Text>
        </View>
      </View>
      <View className="bg-white dark:bg-dark-surface rounded-3xl overflow-hidden">
        {children}
      </View>
    </View>
  );
}

function Row({
  emoji,
  title,
  subtitle,
  badge,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-ink/5 dark:border-cream/5 last:border-0">
      <Text className="text-xl mr-3">{emoji}</Text>
      <View className="flex-1">
        <Text className="font-dm-medium text-base text-ink dark:text-cream">{title}</Text>
        {subtitle ? (
          <Text className="font-dm text-sm text-ink/50 dark:text-cream/50">{subtitle}</Text>
        ) : null}
      </View>
      {badge && (
        <Text className="font-dm text-sm text-gold">{badge}</Text>
      )}
    </View>
  );
}

function flagEmoji(code: string): string {
  const offset = 0x1f1a5;
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join('');
}
