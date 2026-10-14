import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from '@/lib/i18n';

const SHEET_H = 300;

export interface CountrySheetData {
  code: string;
  name: string;
  flag: string;
  isVisited: boolean;
  isInBucketList: boolean;
}

interface Props {
  data: CountrySheetData | null;
  onClose: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onBucketList: () => void;
  onViewDetails: () => void;
  saving: boolean;
}

export function CountrySheet({
  data,
  onClose,
  onAdd,
  onRemove,
  onBucketList,
  onViewDetails,
  saving,
}: Props) {
  const { t } = useTranslation();
  const slideY = useRef(new Animated.Value(SHEET_H)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const visible = !!data;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideY, {
          toValue: 0,
          damping: 22,
          stiffness: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: SHEET_H, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!data) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.flag}>{data.flag}</Text>
          <View style={styles.headerText}>
            <Text style={styles.countryName}>{data.name}</Text>
            <Text style={styles.countryCode}>{data.code}</Text>
          </View>
          {data.isVisited && (
            <View style={styles.visitedBadge}>
              <Text style={styles.visitedBadgeText}>{t('visited_badge')}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.actions}>
          {saving ? (
            <ActivityIndicator color="#c4501a" style={{ marginVertical: 16 }} />
          ) : data.isVisited ? (
            <>
              <ActionButton
                emoji="🗺"
                label={t('view_details')}
                onPress={onViewDetails}
                variant="primary"
              />
              <ActionButton
                emoji="✕"
                label={t('remove_from_visited')}
                onPress={onRemove}
                variant="destructive"
              />
            </>
          ) : (
            <>
              <ActionButton
                emoji="✓"
                label={t('mark_as_visited')}
                onPress={onAdd}
                variant="primary"
              />
              <ActionButton
                emoji={data.isInBucketList ? '★' : '☆'}
                label={data.isInBucketList ? t('remove_from_bucket') : t('add_to_bucket')}
                onPress={onBucketList}
                variant={data.isInBucketList ? 'active' : 'secondary'}
              />
            </>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

function ActionButton({
  emoji,
  label,
  onPress,
  variant,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'destructive' | 'active';
}) {
  const bg =
    variant === 'primary'
      ? '#c4501a'
      : variant === 'destructive'
      ? 'rgba(196,80,26,0.12)'
      : variant === 'active'
      ? 'rgba(200,168,75,0.15)'
      : 'rgba(15,14,12,0.06)';

  const textColor =
    variant === 'primary'
      ? '#f5f0e8'
      : variant === 'destructive'
      ? '#c4501a'
      : variant === 'active'
      ? '#c8a84b'
      : '#0f0e0c';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.actionBtn, { backgroundColor: bg }]}
    >
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,14,12,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: '#f5f0e8',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15,14,12,0.15)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  flag: {
    fontSize: 40,
  },
  headerText: {
    flex: 1,
  },
  countryName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f0e0c',
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  countryCode: {
    fontSize: 13,
    color: 'rgba(15,14,12,0.45)',
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  visitedBadge: {
    backgroundColor: 'rgba(196,80,26,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  visitedBadgeText: {
    fontSize: 12,
    color: '#c4501a',
    fontFamily: 'DMSans_500Medium',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15,14,12,0.1)',
    marginBottom: 16,
  },
  actions: {
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    flex: 1,
  },
});
