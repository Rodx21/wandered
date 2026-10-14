import { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useUserStore } from '@/stores/useUserStore';
import { useTranslation } from '@/lib/i18n';

const SCREEN_W   = Dimensions.get('window').width;
const CARD_W     = SCREEN_W - 48;            // preview card width
const CARD_RATIO = 4 / 5;                    // portrait 4:5
const CARD_H     = CARD_W / CARD_RATIO;

// Full-res dimensions for share capture (3× scale)
const CAPTURE_W = Math.round(CARD_W * 3);
const CAPTURE_H = Math.round(CARD_H * 3);

const COUNTRY_CONTINENT: Record<string, string> = {
  DZ:'AF',EG:'AF',LY:'AF',MA:'AF',SD:'AF',TN:'AF',NG:'AF',ZA:'AF',KE:'AF',ET:'AF',
  GH:'AF',TZ:'AF',UG:'AF',SN:'AF',CI:'AF',CM:'AF',ZM:'AF',ZW:'AF',MZ:'AF',RW:'AF',
  SS:'AF',CD:'AF',CG:'AF',AO:'AF',GA:'AF',GM:'AF',GN:'AF',GQ:'AF',GW:'AF',ML:'AF',
  MR:'AF',MU:'AF',MW:'AF',NA:'AF',NE:'AF',SC:'AF',SL:'AF',SO:'AF',ST:'AF',SZ:'AF',
  TD:'AF',TG:'AF',BF:'AF',BI:'AF',BJ:'AF',BW:'AF',CF:'AF',CV:'AF',DJ:'AF',ER:'AF',
  CN:'AS',IN:'AS',JP:'AS',KR:'AS',ID:'AS',PK:'AS',BD:'AS',PH:'AS',VN:'AS',TH:'AS',
  MY:'AS',SG:'AS',KZ:'AS',UZ:'AS',AZ:'AS',GE:'AS',AM:'AS',TR:'AS',SA:'AS',AE:'AS',
  IR:'AS',IQ:'AS',SY:'AS',JO:'AS',LB:'AS',IL:'AS',KW:'AS',QA:'AS',BH:'AS',OM:'AS',
  MM:'AS',KH:'AS',LA:'AS',MN:'AS',NP:'AS',BT:'AS',LK:'AS',AF:'AS',TJ:'AS',TM:'AS',KG:'AS',
  DE:'EU',FR:'EU',GB:'EU',IT:'EU',ES:'EU',PL:'EU',NL:'EU',BE:'EU',SE:'EU',NO:'EU',
  FI:'EU',DK:'EU',PT:'EU',AT:'EU',CH:'EU',CZ:'EU',HU:'EU',RO:'EU',BG:'EU',HR:'EU',
  RS:'EU',SK:'EU',SI:'EU',LT:'EU',LV:'EU',EE:'EU',BY:'EU',UA:'EU',RU:'EU',IE:'EU',
  GR:'EU',AL:'EU',MK:'EU',BA:'EU',ME:'EU',MD:'EU',IS:'EU',LU:'EU',MT:'EU',CY:'EU',LI:'EU',
  US:'NA',CA:'NA',MX:'NA',GT:'NA',BZ:'NA',HN:'NA',SV:'NA',NI:'NA',CR:'NA',PA:'NA',
  CU:'NA',JM:'NA',HT:'NA',DO:'NA',TT:'NA',BB:'NA',LC:'NA',VC:'NA',GD:'NA',AG:'NA',
  KN:'NA',DM:'NA',BS:'NA',
  BR:'SA',AR:'SA',CO:'SA',CL:'SA',PE:'SA',VE:'SA',EC:'SA',BO:'SA',PY:'SA',UY:'SA',
  GY:'SA',SR:'SA',
  AU:'OC',NZ:'OC',PG:'OC',FJ:'OC',SB:'OC',VU:'OC',WS:'OC',TO:'OC',KI:'OC',MH:'OC',
  FM:'OC',NR:'OC',PW:'OC',TV:'OC',
};

export default function PassportScreen() {
  const { t } = useTranslation();
  const profile        = useUserStore((s) => s.profile);
  const visitedCountries = useUserStore((s) => s.visitedCountries);
  const stats          = useUserStore((s) => s.stats)();
  const captureRef     = useRef<ViewShot>(null);
  const [sharing, setSharing] = useState(false);

  const year = new Date().getFullYear();
  const displayName = profile?.display_name ?? 'Traveller';
  const slug        = profile?.share_slug ?? '';

  const topCodes = useMemo(
    () => visitedCountries
      .slice()
      .sort((a, b) => b.visited_at.localeCompare(a.visited_at))
      .slice(0, 12)
      .map((c) => c.country_code),
    [visitedCountries],
  );

  const uniqueContinents = useMemo(() => {
    const s = new Set<string>();
    for (const c of visitedCountries) {
      const cont = COUNTRY_CONTINENT[c.country_code];
      if (cont) s.add(cont);
    }
    return s.size;
  }, [visitedCountries]);

  const statLine = [
    t('pct_of_world', { pct: stats.worldPercent }),
    `${stats.cities} ${t('stat_cities_label')}`,
    t('continents_count', { count: uniqueContinents }),
  ].join(' · ');

  async function handleShare() {
    if (!captureRef.current) return;
    setSharing(true);
    try {
      const uri = await (captureRef.current as any).capture();
      const ok  = await Sharing.isAvailableAsync();
      if (ok) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: t('share_passport_dialog'),
        });
      } else {
        Alert.alert(t('sharing_unavailable'), t('sharing_unavailable_msg'));
      }
    } catch (e: any) {
      Alert.alert(t('share_failed'), e.message);
    } finally {
      setSharing(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>{t('passport_title')}</Text>
        <Text style={styles.subtitle}>{t('passport_subtitle')}</Text>

        {/* ── Preview card ── */}
        <View style={styles.cardWrap}>
          <PassportCard
            year={year}
            displayName={displayName}
            slug={slug}
            countriesCount={stats.countries}
            statLine={statLine}
            topCodes={topCodes}
            countriesLabel={t('stat_countries_label')}
            tagline={t('world_so_far')}
            exploredByLabel={t('explored_by_label')}
            width={CARD_W}
            height={CARD_H}
            fontSize={1}
          />
        </View>

        {/* Hidden full-res card for capture */}
        <View style={styles.hidden}>
          <ViewShot
            ref={captureRef}
            options={{ format: 'png', quality: 1 }}
            style={{ width: CAPTURE_W, height: CAPTURE_H }}
          >
            <PassportCard
              year={year}
              displayName={displayName}
              slug={slug}
              countriesCount={stats.countries}
              statLine={statLine}
              topCodes={topCodes}
              countriesLabel={t('stat_countries_label')}
              tagline={t('world_so_far')}
              exploredByLabel={t('explored_by_label')}
              width={CAPTURE_W}
              height={CAPTURE_H}
              fontSize={3}
            />
          </ViewShot>
        </View>

        {/* Share button */}
        <TouchableOpacity
          onPress={handleShare}
          disabled={sharing}
          style={styles.shareBtn}
          activeOpacity={0.85}
        >
          {sharing ? (
            <ActivityIndicator color="#f5f0e8" />
          ) : (
            <View style={styles.shareBtnInner}>
              <Text style={styles.shareBtnIcon}>↑</Text>
              <Text style={styles.shareBtnText}>{t('share_passport')}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Public profile section */}
        {slug ? (
          <>
            <Text style={styles.sectionLabel}>{t('public_profile_section')}</Text>
            <TouchableOpacity
              style={styles.profileCard}
              activeOpacity={0.75}
              onPress={() => Linking.openURL(`https://wandered.app/${slug}`).catch(() => {})}
            >
              <Text style={styles.profileCardIcon}>🌐</Text>
              <View style={styles.profileCardBody}>
                <Text style={styles.profileCardUrl}>wandered.app/{slug}</Text>
                <Text style={styles.profileCardDesc}>{t('public_profile_desc')}</Text>
              </View>
              <Text style={styles.profileCardArrow}>↗</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────
// Passport Card
// ──────────────────────────────────────────────────
interface CardProps {
  year: number;
  displayName: string;
  slug: string;
  countriesCount: number;
  statLine: string;
  topCodes: string[];
  countriesLabel: string;
  tagline: string;
  exploredByLabel: string;
  width: number;
  height: number;
  fontSize: number; // scale multiplier (1 = preview, 3 = capture)
}

function PassportCard({
  year, displayName, slug, countriesCount, statLine,
  topCodes, countriesLabel, tagline, exploredByLabel,
  width, height, fontSize: s,
}: CardProps) {
  return (
    <View style={[
      cardStyles.card,
      { width, height, borderRadius: 20 * s, padding: 26 * s },
    ]}>
      {/* Top row: brand + year */}
      <View style={cardStyles.topRow}>
        <Text style={[cardStyles.brand, { fontSize: 10 * s, letterSpacing: 1.5 * s }]}>
          WANDERED · {year}
        </Text>
        {/* Compass circle */}
        <View style={[cardStyles.compassCircle, {
          width: 28 * s, height: 28 * s, borderRadius: 14 * s, borderWidth: s,
        }]}>
          <Text style={{ color: '#c8a84b', fontSize: 12 * s }}>⊙</Text>
        </View>
      </View>

      {/* Tagline */}
      <Text style={[cardStyles.tagline, { fontSize: 18 * s, marginTop: 10 * s }]}>
        {tagline}
      </Text>

      {/* Big number */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[cardStyles.bigNumber, { fontSize: 80 * s, lineHeight: 84 * s }]}>
          {countriesCount}
        </Text>
        <Text style={[cardStyles.bigNumberLabel, { fontSize: 14 * s, marginTop: -4 * s }]}>
          {countriesLabel}
        </Text>

        {/* Stats */}
        <Text style={[cardStyles.statLine, { fontSize: 11 * s, marginTop: 16 * s }]}>
          {statLine}
        </Text>

        {/* Country codes */}
        {topCodes.length > 0 && (
          <Text style={[cardStyles.codes, {
            fontSize: 12 * s, marginTop: 18 * s, letterSpacing: 1.5 * s,
          }]}>
            {topCodes.join('  ')}
          </Text>
        )}
      </View>

      {/* Dashed separator */}
      <View style={[cardStyles.dashedLine, { marginVertical: 16 * s }]}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={i}
            style={[cardStyles.dash, { width: 6 * s, height: s, marginRight: 4 * s }]}
          />
        ))}
      </View>

      {/* Bottom: explorer */}
      <Text style={[cardStyles.exploredByLabel, { fontSize: 9 * s, letterSpacing: 1.2 * s, marginBottom: 6 * s }]}>
        {exploredByLabel}
      </Text>
      <View style={cardStyles.explorerRow}>
        <Text style={[cardStyles.explorerName, { fontSize: 20 * s }]}>{displayName}</Text>
        <Text style={[cardStyles.explorerUrl, { fontSize: 9 * s }]}>
          wandered.app{'\n'}/{slug}
        </Text>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#0f0e0c',
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.25)',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontFamily: 'DMSans_500Medium',
    color: '#c8a84b',
    textTransform: 'uppercase',
  },
  compassCircle: {
    borderColor: 'rgba(200,168,75,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
    color: '#f5f0e8',
    opacity: 0.9,
  },
  bigNumber: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#f5f0e8',
  },
  bigNumberLabel: {
    fontFamily: 'DMSans_400Regular',
    color: '#c8a84b',
    textTransform: 'lowercase',
  },
  statLine: {
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(245,240,232,0.5)',
  },
  codes: {
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(245,240,232,0.6)',
    textTransform: 'uppercase',
  },
  dashedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  dash: {
    backgroundColor: 'rgba(245,240,232,0.15)',
    borderRadius: 1,
  },
  exploredByLabel: {
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(245,240,232,0.4)',
    textTransform: 'uppercase',
  },
  explorerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  explorerName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#f5f0e8',
    flex: 1,
  },
  explorerUrl: {
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(245,240,232,0.4)',
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f0e8' },
  scroll: { padding: 20, paddingBottom: 48 },

  title: {
    fontSize: 30,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#0f0e0c',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(15,14,12,0.5)',
    lineHeight: 20,
    marginBottom: 24,
  },

  cardWrap: {
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },

  hidden: { position: 'absolute', left: -9999, top: -9999 },

  shareBtn: {
    backgroundColor: '#c4501a',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  shareBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareBtnIcon: {
    fontSize: 16,
    color: '#f5f0e8',
    fontWeight: '700',
  },
  shareBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#f5f0e8',
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(15,14,12,0.4)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileCardIcon: { fontSize: 20 },
  profileCardBody: { flex: 1 },
  profileCardUrl: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: '#0f0e0c',
    marginBottom: 2,
  },
  profileCardDesc: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(15,14,12,0.45)',
  },
  profileCardArrow: {
    fontSize: 16,
    color: 'rgba(15,14,12,0.3)',
  },
});
