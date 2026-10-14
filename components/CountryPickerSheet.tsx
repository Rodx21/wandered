import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/stores/useUserStore';
import { useTranslation } from '@/lib/i18n';
import { addVisitedCountry, removeVisitedCountry } from '@/lib/supabase';
import { COUNTRIES, type Country } from '@/data/countries';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function CountryPickerSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const session = useUserStore((s) => s.session);
  const visitedCountries = useUserStore((s) => s.visitedCountries);
  const addCountryToStore = useUserStore((s) => s.addVisitedCountry);
  const removeCountryFromStore = useUserStore((s) => s.removeVisitedCountry);

  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const visitedCodes = useMemo(
    () => new Set(visitedCountries.map((c) => c.country_code)),
    [visitedCountries],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return COUNTRIES;
    const q = query.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query]);

  const handleToggle = useCallback(
    async (country: Country) => {
      const isVisited = visitedCodes.has(country.code);

      if (isVisited) {
        Alert.alert(
          t('remove_picker_title', { flag: country.flag, name: country.name }),
          t('remove_picker_msg'),
          [
            { text: t('cancel'), style: 'cancel' },
            {
              text: t('remove'),
              style: 'destructive',
              onPress: async () => {
                setSaving(country.code);
                try {
                  if (session?.user) {
                    await removeVisitedCountry(session.user.id, country.code);
                  }
                  removeCountryFromStore(country.code);
                } catch (e: any) {
                  Alert.alert(t('error'), e.message);
                } finally {
                  setSaving(null);
                }
              },
            },
          ],
        );
      } else {
        Alert.alert(
          t('add_picker_title', { flag: country.flag, name: country.name }),
          t('add_picker_msg'),
          [
            { text: t('cancel'), style: 'cancel' },
            {
              text: t('add'),
              onPress: async () => {
                setSaving(country.code);
                try {
                  if (session?.user) {
                    const result = await addVisitedCountry(session.user.id, country.code, country.name);
                    addCountryToStore(result);
                  } else {
                    // Guest / dev mode: local state only
                    addCountryToStore({
                      id: `local-${Date.now()}`,
                      user_id: 'guest',
                      country_code: country.code,
                      country_name: country.name,
                      visited_at: new Date().toISOString(),
                      notes: null,
                    });
                  }
                } catch (e: any) {
                  Alert.alert(t('error'), e.message);
                } finally {
                  setSaving(null);
                }
              },
            },
          ],
        );
      }
    },
    [session, visitedCodes, addCountryToStore, removeCountryFromStore, t],
  );

  function handleClose() {
    setQuery('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView edges={['top']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('picker_title')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>{t('picker_done')}</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('picker_search')}
            placeholderTextColor="rgba(245,240,232,0.35)"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <Text style={styles.visitedHint}>
          {t('picker_hint', { count: visitedCodes.size })}
        </Text>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const visited = visitedCodes.has(item.code);
            const loading = saving === item.code;
            return (
              <TouchableOpacity
                onPress={() => handleToggle(item)}
                activeOpacity={0.7}
                style={styles.row}
                disabled={loading}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={[styles.countryName, visited && styles.countryNameVisited]}>
                  {item.name}
                </Text>
                {loading ? (
                  <ActivityIndicator size="small" color="#c4501a" style={styles.indicator} />
                ) : visited ? (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                ) : (
                  <View style={styles.addCircle}>
                    <Text style={styles.addText}>+</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const BG = '#0f0e0c';
const SURFACE = '#1a1917';
const CREAM = '#f5f0e8';
const RUST = '#c4501a';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: CREAM,
    letterSpacing: -0.5,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  closeText: {
    fontSize: 16,
    color: RUST,
    fontWeight: '600',
  },
  searchWrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.08)',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'android' ? 6 : 10,
  },
  searchInput: {
    fontSize: 16,
    color: CREAM,
  },
  visitedHint: {
    fontSize: 12,
    color: 'rgba(245,240,232,0.35)',
    marginHorizontal: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(245,240,232,0.07)',
    marginLeft: 52,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  flag: {
    fontSize: 26,
    width: 40,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(245,240,232,0.75)',
  },
  countryNameVisited: {
    color: CREAM,
    fontWeight: '600',
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: RUST,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: CREAM,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  addCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(245,240,232,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: 'rgba(245,240,232,0.4)',
    fontSize: 18,
    lineHeight: 20,
  },
  indicator: {
    width: 26,
  },
});
