import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/useUserStore';
import { useSettingsStore, type AppTheme } from '@/stores/useSettingsStore';
import { useTranslation } from '@/lib/i18n';
import { signOut } from '@/lib/supabase';
import { restorePurchases } from '@/lib/revenuecat';
import { CONTINENT_COUNTRY_COUNTS } from '@/constants';

// ── continent colour dots ─────────────────────────────────────────
const CONTINENT_COLORS: Record<string, string> = {
  AF: '#c4501a',
  AS: '#c8a84b',
  EU: '#5a6642',
  NA: '#b07040',
  SA: '#9e4020',
  OC: '#7a9a3a',
};

const CONTINENT_ORDER = ['AF', 'AS', 'EU', 'NA', 'SA', 'OC'];

const COUNTRY_CONTINENT: Record<string, string> = {
  DZ:'AF',EG:'AF',LY:'AF',MA:'AF',SD:'AF',TN:'AF',NG:'AF',ZA:'AF',KE:'AF',ET:'AF',
  GH:'AF',TZ:'AF',UG:'AF',SN:'AF',CI:'AF',CM:'AF',ZM:'AF',ZW:'AF',MZ:'AF',RW:'AF',
  SS:'AF',CD:'AF',CG:'AF',AO:'AF',BF:'AF',BI:'AF',BJ:'AF',BW:'AF',CF:'AF',CV:'AF',
  DJ:'AF',ER:'AF',GA:'AF',GM:'AF',GN:'AF',GQ:'AF',GW:'AF',KM:'AF',LR:'AF',LS:'AF',
  MG:'AF',ML:'AF',MR:'AF',MU:'AF',MW:'AF',NA:'AF',NE:'AF',SC:'AF',SL:'AF',
  SO:'AF',ST:'AF',SZ:'AF',TD:'AF',TG:'AF',
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

const LANGUAGES = [
  { code: 'pt', labelKey: 'lang_pt' },
  { code: 'en', labelKey: 'lang_en' },
  { code: 'es', labelKey: 'lang_es' },
  { code: 'fr', labelKey: 'lang_fr' },
  { code: 'de', labelKey: 'lang_de' },
  { code: 'it', labelKey: 'lang_it' },
];

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { language, theme, setLanguage, setTheme } = useSettingsStore();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const profile          = useUserStore((s) => s.profile);
  const visitedCountries = useUserStore((s) => s.visitedCountries);
  const session          = useUserStore((s) => s.session);
  const setPurchased     = useUserStore((s) => s.setPurchased);
  const resetStore       = useUserStore((s) => s.reset);

  const [loggingOut, setLoggingOut] = useState(false);
  const [restoring, setRestoring]   = useState(false);

  const thisYear = new Date().getFullYear();

  const thisYearCount = useMemo(
    () => visitedCountries.filter((c) => new Date(c.visited_at).getFullYear() === thisYear).length,
    [visitedCountries, thisYear],
  );

  const continentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of visitedCountries) {
      const cont = COUNTRY_CONTINENT[c.country_code] ?? 'OTHER';
      map[cont] = (map[cont] ?? 0) + 1;
    }
    return map;
  }, [visitedCountries]);

  const displayName = profile?.display_name ?? 'Viajante';
  const slug        = profile?.share_slug ?? '';
  const initials    = getInitials(displayName);

  // ── colours ──────────────────────────────────────────────────────
  const bg      = dark ? '#0f0e0c' : '#f5f0e8';
  const card    = dark ? '#1a1917' : '#ffffff';
  const textP   = dark ? '#f5f0e8' : '#0f0e0c';
  const textS   = dark ? 'rgba(245,240,232,0.45)' : 'rgba(15,14,12,0.45)';
  const textXS  = dark ? 'rgba(245,240,232,0.3)' : 'rgba(15,14,12,0.3)';
  const sepC    = dark ? 'rgba(245,240,232,0.06)' : 'rgba(15,14,12,0.06)';

  // ── handlers ─────────────────────────────────────────────────────
  function handleLanguageChange() {
    Alert.alert(
      t('language_select'),
      undefined,
      [
        ...LANGUAGES.map((lang) => ({
          text: (language === lang.code ? '✓ ' : '') + t(lang.labelKey),
          onPress: () => setLanguage(lang.code),
        })),
        { text: t('cancel'), style: 'cancel' as const },
      ],
    );
  }

  async function handleSignOut() {
    Alert.alert(t('sign_out_title'), t('sign_out_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('sign_out'),
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut();
            resetStore();
            router.replace('/(auth)/login');
          } catch (e: any) {
            Alert.alert(t('error'), e.message);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }

  async function handleRestore() {
    if (!session?.user) return;
    setRestoring(true);
    try {
      const ok = await restorePurchases(session.user.id);
      if (ok) {
        setPurchased(true);
        Alert.alert(t('restored'), t('restored_msg'));
      } else {
        Alert.alert(t('purchase_not_found'), t('no_purchase_found'));
      }
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Avatar header ─────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
            <View style={s.headerText}>
              <Text style={[s.headerName, { color: textP }]} numberOfLines={1}>
                {displayName}
              </Text>
              {slug ? (
                <Text style={[s.headerUrl, { color: textS }]}>wandered.app/{slug}</Text>
              ) : null}
            </View>
          </View>
          {slug ? (
            <TouchableOpacity hitSlop={12}>
              <Text style={[s.externalIcon, { color: textS }]}>↗</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Este ano ──────────────────────────────────────────── */}
        <SectionLabel label={`${t('this_year')} · ${thisYear}`} color={textXS} />
        <View style={[s.card, { backgroundColor: card, marginBottom: 20 }]}>
          <Text style={[s.bigYear, { color: '#c4501a' }]}>{thisYearCount}</Text>
          <Text style={[s.bigYearLabel, { color: textS }]}>
            {t('stat_countries_label')} · {thisYear}
          </Text>
          {/* dashed bar */}
          <View style={[s.dashedBar, { marginTop: 14 }]}>
            {Array.from({ length: 28 }).map((_, i) => (
              <View key={i} style={[s.dashedSegment, {
                backgroundColor: i < Math.ceil(thisYearCount * 1.5)
                  ? '#c4501a'
                  : (dark ? 'rgba(245,240,232,0.1)' : 'rgba(15,14,12,0.08)'),
              }]} />
            ))}
          </View>
        </View>

        {/* ── Por continente ────────────────────────────────────── */}
        {visitedCountries.length > 0 && (
          <>
            <SectionLabel label={t('by_continent')} color={textXS} />
            <View style={[s.card, { backgroundColor: card, marginBottom: 20, paddingVertical: 6 }]}>
              {CONTINENT_ORDER.filter((k) => continentCounts[k]).map((key, idx) => {
                const count = continentCounts[key] ?? 0;
                const total = CONTINENT_COUNTRY_COUNTS[key] ?? 1;
                const dot   = CONTINENT_COLORS[key] ?? '#c4501a';
                const isLast = idx === CONTINENT_ORDER.filter((k) => continentCounts[k]).length - 1;
                return (
                  <View key={key}>
                    <View style={s.continentRow}>
                      <View style={[s.dot, { backgroundColor: dot }]} />
                      <Text style={[s.continentName, { color: textP }]}>
                        {t(`continent_${key}`)}
                      </Text>
                      <Text style={[s.continentCount, { color: textS }]}>
                        {count} / {total}
                      </Text>
                    </View>
                    {!isLast && <View style={[s.sep, { backgroundColor: sepC }]} />}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Configurações ────────────────────────────────────── */}
        <SectionLabel label={t('settings_section')} color={textXS} />
        <View style={[s.card, { backgroundColor: card, marginBottom: 20, paddingVertical: 0 }]}>

          {/* Idioma */}
          <TouchableOpacity style={s.settingRow} onPress={handleLanguageChange} activeOpacity={0.7}>
            <Text style={s.settingIcon}>🌐</Text>
            <Text style={[s.settingLabel, { color: textP }]}>{t('language')}</Text>
            <View style={[s.langPill, { borderColor: dark ? 'rgba(245,240,232,0.2)' : 'rgba(15,14,12,0.15)' }]}>
              <Text style={[s.langPillText, { color: textS }]}>
                {t(`lang_${language}`)} ▾
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[s.sep, { backgroundColor: sepC }]} />

          {/* Aparência */}
          <View style={s.settingRow}>
            <Text style={s.settingIcon}>👁</Text>
            <Text style={[s.settingLabel, { color: textP }]}>{t('appearance')}</Text>
            <View style={s.themeToggle}>
              {(['light', 'dark'] as AppTheme[]).map((opt) => {
                const active = theme === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setTheme(opt)}
                    style={[
                      s.themeBtn,
                      active
                        ? { backgroundColor: '#c4501a' }
                        : { backgroundColor: 'transparent' },
                    ]}
                  >
                    <Text style={[s.themeBtnText, { color: active ? '#f5f0e8' : textS }]}>
                      {t(opt === 'light' ? 'theme_light' : 'theme_dark')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Ações ─────────────────────────────────────────────── */}
        <View style={s.actions}>
          {!profile?.is_purchased && (
            <TouchableOpacity
              onPress={handleRestore}
              disabled={restoring}
              style={[s.actionBtn, { backgroundColor: dark ? 'rgba(200,168,75,0.12)' : 'rgba(200,168,75,0.12)' }]}
            >
              {restoring ? (
                <ActivityIndicator color="#c8a84b" />
              ) : (
                <Text style={[s.actionBtnText, { color: '#c8a84b' }]}>{t('restore_purchase')}</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleSignOut}
            disabled={loggingOut}
            style={[s.actionBtn, { borderWidth: 1, borderColor: sepC }]}
          >
            {loggingOut ? (
              <ActivityIndicator />
            ) : (
              <Text style={[s.actionBtnText, { color: textS }]}>{t('sign_out')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={[s.sectionLabel, { color }]}>{label}</Text>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  avatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#c4501a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: '#f5f0e8',
  },
  headerText: { flex: 1 },
  headerName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
  },
  headerUrl: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  externalIcon: {
    fontSize: 18,
    paddingLeft: 12,
  },

  // Section label
  sectionLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Generic card
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  // Este ano
  bigYear: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 56,
    lineHeight: 60,
  },
  bigYearLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  dashedBar: {
    flexDirection: 'row',
    gap: 4,
  },
  dashedSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },

  // Continent rows
  continentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  continentName: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
  continentCount: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 18,
  },

  // Settings rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  settingIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  settingLabel: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
  },
  langPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  langPillText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
  },
  themeToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15,14,12,0.12)',
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  themeBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },

  // Actions
  actions: { gap: 10, marginTop: 4 },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
  },
});
