import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/useUserStore';
import { useMapStore } from '@/stores/useMapStore';
import { useTranslation } from '@/lib/i18n';
import { getLocalizedCountryName } from '@/lib/countryUtils';
import { formatVisitDate } from '@/lib/dateUtils';
import { CountryPickerSheet } from '@/components/CountryPickerSheet';
import type { VisitedCountry } from '@/types';

type SortMode = 'recent' | 'name' | 'continent';

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

export default function CountriesScreen() {
  const { t, language } = useTranslation();
  const dark = useColorScheme() === 'dark';
  const visitedCountries = useUserStore((s) => s.visitedCountries);
  const { countryPickerOpen, openCountryPicker, closeCountryPicker } = useMapStore();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const base = q
      ? visitedCountries.filter(
          (c) =>
            getLocalizedCountryName(c.country_code, language).toLowerCase().includes(q) ||
            c.country_code.toLowerCase().includes(q),
        )
      : visitedCountries;

    if (sortMode === 'recent') return [...base].sort((a, b) => b.visited_at.localeCompare(a.visited_at));
    if (sortMode === 'name')   return [...base].sort((a, b) => getLocalizedCountryName(a.country_code, language).localeCompare(getLocalizedCountryName(b.country_code, language)));
    return base;
  }, [visitedCountries, query, sortMode, language]);

  // Continent sections for SectionList
  const sections = useMemo(() => {
    if (sortMode !== 'continent') return [];
    const groups: Record<string, VisitedCountry[]> = {};
    for (const c of filtered) {
      const cont = COUNTRY_CONTINENT[c.country_code] ?? 'OTHER';
      (groups[cont] = groups[cont] ?? []).push(c);
    }
    const ORDER = ['AF', 'AS', 'EU', 'NA', 'SA', 'OC', 'OTHER'];
    return ORDER.filter((k) => groups[k]?.length)
      .map((k) => ({
        key: k,
        title: `${t(`continent_${k}`).toUpperCase()} · ${groups[k].length}`,
        data: groups[k].sort((a, b) =>
          getLocalizedCountryName(a.country_code, language).localeCompare(
            getLocalizedCountryName(b.country_code, language),
          ),
        ),
      }));
  }, [filtered, sortMode, language, t]);

  const bg    = dark ? '#0f0e0c' : '#f5f0e8';
  const card  = dark ? '#1a1917' : '#ffffff';
  const sep   = dark ? 'rgba(245,240,232,0.06)' : 'rgba(15,14,12,0.06)';
  const textP = dark ? '#f5f0e8' : '#0f0e0c';
  const textS = dark ? 'rgba(245,240,232,0.45)' : 'rgba(15,14,12,0.45)';

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: textP }]}>{t('countries_title')}</Text>
          <Text style={[styles.subtitle, { color: textS }]}>
            {visitedCountries.length === 1
              ? t('countries_visited_count', { count: visitedCountries.length })
              : t('countries_visited_count_plural', { count: visitedCountries.length })}
          </Text>
        </View>
        <TouchableOpacity onPress={openCountryPicker} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: card }]}>
        <Text style={[styles.searchIcon, { color: textS }]}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: textP }]}
          placeholder={t('search_countries')}
          placeholderTextColor={textS}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {/* Sort tabs */}
      <View style={styles.sortRow}>
        {(['recent', 'name', 'continent'] as SortMode[]).map((mode) => {
          const active = sortMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              onPress={() => setSortMode(mode)}
              style={[
                styles.sortTab,
                active
                  ? { backgroundColor: textP }
                  : { backgroundColor: 'transparent', borderWidth: 1, borderColor: sep },
              ]}
            >
              <Text
                style={[
                  styles.sortTabText,
                  { color: active ? bg : textS },
                ]}
              >
                {t(`sort_${mode}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {sortMode === 'continent' ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: textS }]}>{section.title}</Text>
          )}
          renderSectionFooter={() => <View style={styles.sectionGap} />}
          renderItem={({ item, index, section }) => {
            const isFirst = index === 0;
            const isLast  = index === section.data.length - 1;
            return (
              <View
                style={[
                  styles.cardWrap,
                  { backgroundColor: card },
                  isFirst && styles.cardFirst,
                  isLast  && styles.cardLast,
                ]}
              >
                <CountryRow
                  country={item}
                  language={language}
                  dark={dark}
                  textP={textP}
                  textS={textS}
                />
                {!isLast && <View style={[styles.sep, { backgroundColor: sep }]} />}
              </View>
            );
          }}
          ListEmptyComponent={<EmptyState t={t} textP={textP} textS={textS} />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <View style={[styles.cardWrap, { backgroundColor: card },
              index === 0 && styles.cardFirst,
              index === filtered.length - 1 && styles.cardLast,
            ]}>
              <CountryRow
                country={item}
                language={language}
                dark={dark}
                textP={textP}
                textS={textS}
              />
              {index < filtered.length - 1 && <View style={[styles.sep, { backgroundColor: sep }]} />}
            </View>
          )}
          ListEmptyComponent={<EmptyState t={t} textP={textP} textS={textS} />}
        />
      )}

      <CountryPickerSheet visible={countryPickerOpen} onClose={closeCountryPicker} />
    </SafeAreaView>
  );
}

function CountryRow({
  country,
  language,
  dark,
  textP,
  textS,
}: {
  country: VisitedCountry;
  language: string;
  dark: boolean;
  textP: string;
  textS: string;
}) {
  const badgeBg   = dark ? '#2a2825' : '#f0ebe3';
  const badgeText = dark ? '#9b9590' : '#6b6560';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/countries/${country.country_code}`)}
      activeOpacity={0.7}
      style={styles.row}
    >
      {/* ISO code badge */}
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeText }]}>{country.country_code}</Text>
      </View>

      {/* Name + date */}
      <View style={styles.rowBody}>
        <Text style={[styles.rowName, { color: textP }]}>
          {getLocalizedCountryName(country.country_code, language)}
        </Text>
        <Text style={[styles.rowDate, { color: textS }]}>
          {formatVisitDate(country.visited_at, language)}
        </Text>
      </View>

      <Text style={[styles.chevron, { color: textS }]}>›</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ t, textP, textS }: { t: (k: string) => string; textP: string; textS: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🌍</Text>
      <Text style={[styles.emptyTitle, { color: textP }]}>{t('no_countries')}</Text>
      <Text style={[styles.emptySubtitle, { color: textS }]}>{t('no_countries_sub')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 30,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#c4501a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#f5f0e8',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },

  sortRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sortTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  sortTabText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  sectionHeader: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  sectionGap: { height: 16 },

  cardWrap: {
    paddingHorizontal: 4,
  },
  cardFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 2,
  },
  cardLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingBottom: 2,
    marginBottom: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 12,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },

  badge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.5,
  },

  rowBody: { flex: 1 },
  rowName: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  rowDate: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    fontFamily: 'DMSans_400Regular',
  },

  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});
