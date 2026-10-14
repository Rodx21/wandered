import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/stores/useUserStore';
import { useMapStore } from '@/stores/useMapStore';
import { useTranslation } from '@/lib/i18n';
import { getLocalizedCountryName } from '@/lib/countryUtils';
import { WorldMap } from '@/components/WorldMap';
import { CountryPickerSheet } from '@/components/CountryPickerSheet';
import { CountrySheet, type CountrySheetData } from '@/components/CountrySheet';
import { CountryReviewSheet, type ReviewPayload } from '@/components/CountryReviewSheet';
import { COUNTRIES } from '@/data/countries';
import {
  addVisitedCountry,
  removeVisitedCountry,
  addBucketListItem,
  removeBucketListItem,
  upsertCountryReview,
} from '@/lib/supabase';
import { TOTAL_COUNTRIES, CONTINENT_LABELS, CONTINENT_COUNTRY_COUNTS } from '@/constants';

const MAP_SIZE = Dimensions.get('window').width;

const COUNTRY_CONTINENT: Record<string, string> = {
  DZ:'AF',EG:'AF',LY:'AF',MA:'AF',SD:'AF',TN:'AF',NG:'AF',ZA:'AF',KE:'AF',ET:'AF',
  GH:'AF',TZ:'AF',UG:'AF',SN:'AF',CI:'AF',CM:'AF',ZM:'AF',ZW:'AF',MZ:'AF',RW:'AF',
  SS:'AF',CD:'AF',CG:'AF',AO:'AF',BF:'AF',BI:'AF',BJ:'AF',BW:'AF',CF:'AF',CV:'AF',
  DJ:'AF',ER:'AF',GA:'AF',GM:'AF',GN:'AF',GQ:'AF',GW:'AF',KM:'AF',LR:'AF',LS:'AF',
  MG:'AF',ML:'AF',MR:'AF',MU:'AF',MW:'AF',NA:'AF',NE:'AF',SC:'AF',SI:'AF',SL:'AF',
  SM:'AF',SO:'AF',ST:'AF',SZ:'AF',TD:'AF',TG:'AF',
  CN:'AS',IN:'AS',JP:'AS',KR:'AS',ID:'AS',PK:'AS',BD:'AS',PH:'AS',VN:'AS',TH:'AS',
  MY:'AS',SG:'AS',KZ:'AS',UZ:'AS',AZ:'AS',GE:'AS',AM:'AS',TR:'AS',SA:'AS',AE:'AS',
  IR:'AS',IQ:'AS',SY:'AS',JO:'AS',LB:'AS',IL:'AS',KW:'AS',QA:'AS',BH:'AS',OM:'AS',
  MM:'AS',KH:'AS',LA:'AS',MN:'AS',NP:'AS',BT:'AS',LK:'AS',AF:'AS',TJ:'AS',TM:'AS',KG:'AS',
  DE:'EU',FR:'EU',GB:'EU',IT:'EU',ES:'EU',PL:'EU',NL:'EU',BE:'EU',SE:'EU',NO:'EU',
  FI:'EU',DK:'EU',PT:'EU',AT:'EU',CH:'EU',CZ:'EU',HU:'EU',RO:'EU',BG:'EU',HR:'EU',
  RS:'EU',SK:'EU',LT:'EU',LV:'EU',EE:'EU',BY:'EU',UA:'EU',RU:'EU',IE:'EU',
  GR:'EU',AL:'EU',MK:'EU',BA:'EU',ME:'EU',MD:'EU',IS:'EU',LU:'EU',MT:'EU',CY:'EU',LI:'EU',
  US:'NA',CA:'NA',MX:'NA',GT:'NA',BZ:'NA',HN:'NA',SV:'NA',NI:'NA',CR:'NA',PA:'NA',
  CU:'NA',JM:'NA',HT:'NA',DO:'NA',TT:'NA',BB:'NA',LC:'NA',VC:'NA',GD:'NA',AG:'NA',
  KN:'NA',DM:'NA',BS:'NA',
  BR:'SA',AR:'SA',CO:'SA',CL:'SA',PE:'SA',VE:'SA',EC:'SA',BO:'SA',PY:'SA',UY:'SA',
  GY:'SA',SR:'SA',
  AU:'OC',NZ:'OC',PG:'OC',FJ:'OC',SB:'OC',VU:'OC',WS:'OC',TO:'OC',KI:'OC',MH:'OC',
  FM:'OC',NR:'OC',PW:'OC',TV:'OC',
};

export default function MapScreen() {
  const { t, language } = useTranslation();
  const stats                  = useUserStore((s) => s.stats)();
  const countries              = useUserStore((s) => s.visitedCountries);
  const bucketList             = useUserStore((s) => s.bucketList);
  const reviews                = useUserStore((s) => s.reviews);
  const session                = useUserStore((s) => s.session);
  const addCountryToStore      = useUserStore((s) => s.addVisitedCountry);
  const removeCountryFromStore = useUserStore((s) => s.removeVisitedCountry);
  const addBucketToStore       = useUserStore((s) => s.addBucketListItem);
  const removeBucketFromStore  = useUserStore((s) => s.removeBucketListItem);
  const upsertReviewInStore    = useUserStore((s) => s.upsertReview);
  const { countryPickerOpen, closeCountryPicker } = useMapStore();

  const [sheet, setSheet]               = useState<CountrySheetData | null>(null);
  const [reviewTarget, setReviewTarget] = useState<CountrySheetData | null>(null);
  const [saving, setSaving]             = useState(false);

  const visitedSet = useMemo(
    () => new Set(countries.map((c) => c.country_code)),
    [countries],
  );

  const bucketSet = useMemo(
    () => new Set(bucketList.map((b) => b.country_code).filter(Boolean) as string[]),
    [bucketList],
  );

  const continentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of countries) {
      const cont = COUNTRY_CONTINENT[c.country_code] ?? 'OTHER';
      map[cont] = (map[cont] ?? 0) + 1;
    }
    return map;
  }, [countries]);

  const handleCountryPress = useCallback(
    (code: string) => {
      const countryData = COUNTRIES.find((c) => c.code === code);
      setSheet({
        code,
        name:           getLocalizedCountryName(code, language),
        flag:           countryData?.flag ?? '🏳',
        isVisited:      visitedSet.has(code),
        isInBucketList: bucketSet.has(code),
      });
    },
    [visitedSet, bucketSet, language],
  );

  const handleAdd = useCallback(() => {
    if (!sheet) return;
    setReviewTarget(sheet);
    setSheet(null);
  }, [sheet]);

  const handleReviewSubmit = useCallback(async (review: ReviewPayload) => {
    if (!reviewTarget) return;
    setSaving(true);
    try {
      if (session?.user) {
        // ── Authenticated: persist to Supabase ──────────────────────
        const saved = await addVisitedCountry(session.user.id, reviewTarget.code, reviewTarget.name);
        addCountryToStore(saved);
        try {
          const savedReview = await upsertCountryReview(session.user.id, reviewTarget.code, review);
          upsertReviewInStore(savedReview);
        } catch {
          // country_reviews table not yet migrated — ignore
        }
        if (bucketSet.has(reviewTarget.code)) {
          const item = bucketList.find((b) => b.country_code === reviewTarget.code);
          if (item) {
            await removeBucketListItem(session.user.id, item.id);
            removeBucketFromStore(item.id);
          }
        }
      } else {
        // ── Guest / dev mode: local state only (no DB) ──────────────
        addCountryToStore({
          id: `local-${Date.now()}`,
          user_id: 'guest',
          country_code: reviewTarget.code,
          country_name: reviewTarget.name,
          visited_at: new Date().toISOString(),
          notes: null,
        });
        if (bucketSet.has(reviewTarget.code)) {
          const item = bucketList.find((b) => b.country_code === reviewTarget.code);
          if (item) removeBucketFromStore(item.id);
        }
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setReviewTarget(null);
    } catch (err: any) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSaving(false);
    }
  }, [reviewTarget, session, bucketSet, bucketList, addCountryToStore, upsertReviewInStore, removeBucketFromStore, t]);

  const handleReviewSkip = useCallback(async () => {
    if (!reviewTarget) return;
    setSaving(true);
    try {
      if (session?.user) {
        const saved = await addVisitedCountry(session.user.id, reviewTarget.code, reviewTarget.name);
        addCountryToStore(saved);
        if (bucketSet.has(reviewTarget.code)) {
          const item = bucketList.find((b) => b.country_code === reviewTarget.code);
          if (item) {
            await removeBucketListItem(session.user.id, item.id);
            removeBucketFromStore(item.id);
          }
        }
      } else {
        // Guest / dev mode: local state only
        addCountryToStore({
          id: `local-${Date.now()}`,
          user_id: 'guest',
          country_code: reviewTarget.code,
          country_name: reviewTarget.name,
          visited_at: new Date().toISOString(),
          notes: null,
        });
        if (bucketSet.has(reviewTarget.code)) {
          const item = bucketList.find((b) => b.country_code === reviewTarget.code);
          if (item) removeBucketFromStore(item.id);
        }
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setReviewTarget(null);
    } catch (err: any) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSaving(false);
    }
  }, [reviewTarget, session, bucketSet, bucketList, addCountryToStore, removeBucketFromStore, t]);

  const handleRemove = useCallback(async () => {
    if (!sheet) return;
    Alert.alert(
      t('remove_country_title', { flag: sheet.flag, name: sheet.name }),
      t('remove_country_msg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              if (session?.user) {
                await removeVisitedCountry(session.user.id, sheet.code);
              }
              removeCountryFromStore(sheet.code);
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSheet(null);
            } catch (err: any) {
              Alert.alert(t('error'), err.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }, [sheet, session, removeCountryFromStore, t]);

  const handleBucketList = useCallback(async () => {
    if (!sheet) return;
    setSaving(true);
    try {
      if (bucketSet.has(sheet.code)) {
        const item = bucketList.find((b) => b.country_code === sheet.code);
        if (item) {
          if (session?.user) await removeBucketListItem(session.user.id, item.id);
          removeBucketFromStore(item.id);
        }
      } else {
        if (session?.user) {
          const saved = await addBucketListItem(session.user.id, sheet.code, sheet.name);
          addBucketToStore(saved);
        } else {
          // Guest / dev mode: local state only
          addBucketToStore({
            id: `local-bucket-${Date.now()}`,
            user_id: 'guest',
            country_code: sheet.code,
            country_name: sheet.name,
            city_name: null,
            type: 'country',
            notes: null,
            created_at: new Date().toISOString(),
          });
        }
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSheet((prev) => prev ? { ...prev, isInBucketList: !prev.isInBucketList } : null);
    } catch (err: any) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSaving(false);
    }
  }, [sheet, session, bucketSet, bucketList, addBucketToStore, removeBucketFromStore, t]);

  const handleViewDetails = useCallback(() => {
    if (!sheet) return;
    setSheet(null);
    router.push(`/(app)/countries/${sheet.code}`);
  }, [sheet]);

  const existingReview = useMemo(() => {
    if (!reviewTarget) return undefined;
    const r = reviews.find((rev) => rev.country_code === reviewTarget.code);
    if (!r) return undefined;
    return {
      safety:         r.safety,
      accommodation:  r.accommodation,
      transport:      r.transport,
      food:           r.food,
      getting_around: r.getting_around,
      safety_women:   r.safety_women,
      comment:        r.comment ?? undefined,
    };
  }, [reviewTarget, reviews]);

  return (
    <View style={styles.root}>

      {/* MAP SECTION */}
      <View style={styles.mapContainer}>
        <WorldMap
          visitedSet={visitedSet}
          bucketSet={bucketSet}
          onCountryPress={handleCountryPress}
        />

        <SafeAreaView edges={['top']} style={styles.statsOverlay} pointerEvents="none">
          <View style={styles.statsPill}>
            <StatItem value={stats.countries} label={t('stat_countries')} />
            <Divider />
            <StatItem value={`${stats.worldPercent}%`} label={t('stat_world')} />
            {stats.cities > 0 && (
              <>
                <Divider />
                <StatItem value={stats.cities} label={t('stat_cities')} />
              </>
            )}
          </View>
        </SafeAreaView>

        <View style={styles.hintWrap} pointerEvents="none">
          <Text style={styles.hintText}>{t('map_hint')}</Text>
        </View>
      </View>

      {/* PROGRESS SECTION */}
      <ScrollView
        style={styles.progress}
        contentContainerStyle={styles.progressContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.progressTitle}>{t('your_progress')}</Text>

        <View style={styles.worldBar}>
          <View style={styles.worldBarTrack}>
            <View
              style={[
                styles.worldBarFill,
                { width: `${Math.min(parseFloat(stats.worldPercent), 100)}%` as any },
              ]}
            />
          </View>
          <Text style={styles.worldBarLabel}>
            {t('world_bar_label', { count: stats.countries, total: TOTAL_COUNTRIES, pct: stats.worldPercent })}
          </Text>
        </View>

        {Object.entries(CONTINENT_LABELS)
          .filter(([key]) => CONTINENT_COUNTRY_COUNTS[key] > 0)
          .map(([key]) => {
            const count = continentCounts[key] ?? 0;
            const total = CONTINENT_COUNTRY_COUNTS[key];
            const pct   = (count / total) * 100;
            return (
              <View key={key} style={styles.continentRow}>
                <Text style={styles.continentLabel}>{t(`continent_${key}`)}</Text>
                <View style={styles.continentTrack}>
                  <View style={[styles.continentFill, { width: `${Math.min(pct, 100)}%` as any }]} />
                </View>
                <Text style={styles.continentCount}>{count}/{total}</Text>
              </View>
            );
          })}

        <View style={styles.legend}>
          <LegendDot color="#c4501a" label={t('legend_visited')} />
          <LegendDot color="#c8a84b" label={t('legend_bucket')} />
          <LegendDot color="#d4c9b0" label={t('legend_not_visited')} />
        </View>
      </ScrollView>

      <CountryPickerSheet visible={countryPickerOpen} onClose={closeCountryPicker} />

      <CountrySheet
        data={sheet}
        onClose={() => setSheet(null)}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onBucketList={handleBucketList}
        onViewDetails={handleViewDetails}
        saving={saving}
      />

      <CountryReviewSheet
        visible={!!reviewTarget}
        countryName={reviewTarget?.name ?? ''}
        flag={reviewTarget?.flag ?? ''}
        existingReview={existingReview}
        onSubmit={handleReviewSubmit}
        onSkip={handleReviewSkip}
        onClose={() => setReviewTarget(null)}
      />
    </View>
  );
}

function StatItem({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f0e0c',
  },
  mapContainer: {
    width: MAP_SIZE,
    height: MAP_SIZE,
  },
  statsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  statsPill: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(15,14,12,0.78)',
    marginTop: 10,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#f5f0e8',
    lineHeight: 19,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(245,240,232,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(245,240,232,0.18)',
  },
  hintWrap: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(245,240,232,0.5)',
    backgroundColor: 'rgba(15,14,12,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progress: {
    flex: 1,
    backgroundColor: '#0f0e0c',
  },
  progressContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  progressTitle: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(245,240,232,0.35)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  worldBar: {
    gap: 8,
    marginBottom: 4,
  },
  worldBarTrack: {
    height: 6,
    backgroundColor: 'rgba(245,240,232,0.1)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  worldBarFill: {
    height: '100%',
    backgroundColor: '#c4501a',
    borderRadius: 999,
  },
  worldBarLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(245,240,232,0.45)',
  },
  continentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  continentLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(245,240,232,0.7)',
    width: 110,
  },
  continentTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(245,240,232,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  continentFill: {
    height: '100%',
    backgroundColor: '#c8a84b',
    borderRadius: 999,
  },
  continentCount: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(245,240,232,0.35)',
    width: 36,
    textAlign: 'right',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(245,240,232,0.45)',
  },
});
