import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/stores/useUserStore';
import { useMapStore } from '@/stores/useMapStore';
import { useTranslation } from '@/lib/i18n';
import { getLocalizedCountryName } from '@/lib/countryUtils';
import { removeBucketListItem } from '@/lib/supabase';
import { CountryPickerSheet } from '@/components/CountryPickerSheet';
import type { BucketListItem } from '@/types';

export default function BucketListScreen() {
  const { t, language } = useTranslation();
  const dark = useColorScheme() === 'dark';

  const session              = useUserStore((s) => s.session);
  const bucketList           = useUserStore((s) => s.bucketList);
  const removeBucketFromStore = useUserStore((s) => s.removeBucketListItem);
  const { countryPickerOpen, openCountryPicker, closeCountryPicker } = useMapStore();
  const [removing, setRemoving] = useState<string | null>(null);

  // Dynamic colours
  const bg   = dark ? '#0f0e0c' : '#f5f0e8';
  const textP = dark ? '#f5f0e8' : '#0f0e0c';
  const textS = dark ? 'rgba(245,240,232,0.45)' : 'rgba(15,14,12,0.45)';
  const sep  = dark ? 'rgba(245,240,232,0.06)' : 'rgba(15,14,12,0.08)';

  async function handleRemove(item: BucketListItem) {
    const name = item.country_name ?? item.city_name ?? item.country_code ?? '';
    Alert.alert(
      t('remove_bucket_title', { name }),
      t('remove_bucket_msg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            setRemoving(item.id);
            try {
              if (session?.user) {
                await removeBucketListItem(session.user.id, item.id);
              }
              removeBucketFromStore(item.id);
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (e: any) {
              Alert.alert(t('error'), e.message);
            } finally {
              setRemoving(null);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[s.root, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: textP }]}>{t('bucket_title')}</Text>
          <Text style={[s.subtitle, { color: textS }]}>
            {`${bucketList.length} ${bucketList.length === 1 ? t('destination') : t('destinations')}`}
          </Text>
        </View>
        <TouchableOpacity onPress={openCountryPicker} style={s.addBtn}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={bucketList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={() => <View style={[s.separator, { backgroundColor: sep }]} />}
        ListEmptyComponent={() => (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🌍</Text>
            <Text style={[s.emptyTitle, { color: textP }]}>{t('no_bucket')}</Text>
            <Text style={[s.emptySubtitle, { color: textS }]}>{t('no_bucket_sub')}</Text>
            <TouchableOpacity onPress={openCountryPicker} style={s.emptyBtn}>
              <Text style={s.emptyBtnText}>{t('add_destination')}</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <BucketRow
            item={item}
            removing={removing === item.id}
            onRemove={() => handleRemove(item)}
            language={language}
            textP={textP}
            textS={textS}
          />
        )}
      />

      <CountryPickerSheet visible={countryPickerOpen} onClose={closeCountryPicker} />
    </SafeAreaView>
  );
}

function BucketRow({
  item, removing, onRemove, language, textP, textS,
}: {
  item: BucketListItem;
  removing: boolean;
  onRemove: () => void;
  language: string;
  textP: string;
  textS: string;
}) {
  const code = item.country_code ?? '';
  const name = code ? getLocalizedCountryName(code, language) : (item.city_name ?? code);
  const flag = code ? flagEmoji(code) : '🏳';

  return (
    <View style={s.row}>
      <Text style={s.rowFlag}>{flag}</Text>
      <View style={s.rowText}>
        <Text style={[s.rowName, { color: textP }]}>{name}</Text>
        {item.notes ? <Text style={[s.rowNotes, { color: textS }]}>{item.notes}</Text> : null}
      </View>
      <View style={s.goldDot} />
      {removing ? (
        <ActivityIndicator size="small" color="#c4501a" style={s.removeBtn} />
      ) : (
        <TouchableOpacity onPress={onRemove} style={s.removeBtn} hitSlop={12}>
          <Text style={[s.removeText, { color: textS }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function flagEmoji(code: string): string {
  const offset = 0x1f1a5;
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(c.charCodeAt(0) + offset)).join('');
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#c8a84b',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#f5f0e8', fontSize: 24, lineHeight: 26, fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  separator: { height: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowFlag: { fontSize: 28, width: 40, textAlign: 'center' },
  rowText: { flex: 1 },
  rowName: { fontSize: 16, fontFamily: 'DMSans_500Medium' },
  rowNotes: { fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  goldDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#c8a84b' },
  removeBtn: { padding: 4 },
  removeText: { fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14, fontFamily: 'DMSans_400Regular',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#c8a84b',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999,
  },
  emptyBtnText: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: '#f5f0e8' },
});
