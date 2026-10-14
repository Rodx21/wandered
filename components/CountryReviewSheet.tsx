import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '@/lib/i18n';

export interface ReviewPayload {
  safety: number;
  accommodation: number;
  transport: number;
  food: number;
  getting_around: number;
  safety_women: number;
  comment: string;
}

interface Props {
  visible: boolean;
  countryName: string;
  flag: string;
  existingReview?: Partial<ReviewPayload>;
  onSubmit: (review: ReviewPayload) => Promise<void>;
  onSkip: () => void;
  onClose: () => void;
}

const CATEGORIES: { key: keyof Omit<ReviewPayload, 'comment'>; labelKey: string; emoji: string }[] = [
  { key: 'safety',         labelKey: 'cat_safety',         emoji: '🛡️' },
  { key: 'accommodation',  labelKey: 'cat_accommodation',  emoji: '🏨' },
  { key: 'transport',      labelKey: 'cat_transport',      emoji: '✈️' },
  { key: 'food',           labelKey: 'cat_food',           emoji: '🍽️' },
  { key: 'getting_around', labelKey: 'cat_getting_around', emoji: '🚌' },
  { key: 'safety_women',   labelKey: 'cat_safety_women',   emoji: '👩' },
];

const DEFAULT_RATINGS: Omit<ReviewPayload, 'comment'> = {
  safety: 3,
  accommodation: 3,
  transport: 3,
  food: 3,
  getting_around: 3,
  safety_women: 3,
};

function calcOverall(r: Omit<ReviewPayload, 'comment'>): number {
  return Math.round(
    ((r.safety + r.accommodation + r.transport + r.food + r.getting_around + r.safety_women) / 6) * 20,
  );
}

export function CountryReviewSheet({
  visible,
  countryName,
  flag,
  existingReview,
  onSubmit,
  onSkip,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [ratings, setRatings] = useState<Omit<ReviewPayload, 'comment'>>({
    ...DEFAULT_RATINGS,
    ...existingReview,
  });
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [saving, setSaving] = useState(false);

  const overall = calcOverall(ratings);

  const overallInfo = (() => {
    if (overall >= 85) return { label: t('rating_first_class'), color: '#c8a84b' };
    if (overall >= 50) return { label: t('rating_good'), color: '#4caf7d' };
    return { label: t('rating_attention'), color: '#c4501a' };
  })();

  function setRating(key: keyof Omit<ReviewPayload, 'comment'>, value: number) {
    setRatings((prev) => ({ ...prev, [key]: value }));
    Haptics.selectionAsync();
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSubmit({ ...ratings, comment });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.flag}>{flag}</Text>
              <Text style={styles.title}>{countryName}</Text>
              <Text style={styles.subtitle}>{t('how_was_experience')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Overall score pill */}
            <View style={[styles.overallPill, { borderColor: overallInfo.color }]}>
              <Text style={[styles.overallScore, { color: overallInfo.color }]}>{overall}</Text>
              <Text style={styles.overallSlash}>/100</Text>
              <Text style={[styles.overallLabel, { color: overallInfo.color }]}>{overallInfo.label}</Text>
            </View>

            {/* Category ratings */}
            {CATEGORIES.map((cat) => (
              <View key={cat.key} style={styles.categoryRow}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={styles.categoryLabel}>{t(cat.labelKey)}</Text>
                  <Text style={styles.categoryScore}>{ratings[cat.key] * 20}/100</Text>
                </View>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(cat.key, star)}
                      activeOpacity={0.7}
                      hitSlop={6}
                    >
                      <Text style={[
                        styles.star,
                        { color: star <= ratings[cat.key] ? '#c4501a' : 'rgba(15,14,12,0.15)' },
                      ]}>
                        ●
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Comment */}
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>{t('comment_optional')}</Text>
              <TextInput
                style={styles.commentInput}
                placeholder={t('comment_placeholder')}
                placeholderTextColor="rgba(15,14,12,0.3)"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn} disabled={saving}>
              <Text style={styles.skipText}>{t('skip_review')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#f5f0e8" />
              ) : (
                <Text style={styles.submitText}>{t('save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(15,14,12,0.1)',
  },
  flag: { fontSize: 32, marginBottom: 4 },
  title: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#0f0e0c',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(15,14,12,0.5)',
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 18,
    color: 'rgba(15,14,12,0.35)',
    paddingTop: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 4 },
  overallPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'center',
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 4,
  },
  overallScore: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  overallSlash: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(15,14,12,0.4)',
    marginRight: 8,
  },
  overallLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  categoryRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryEmoji: { fontSize: 18, marginRight: 8 },
  categoryLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: '#0f0e0c',
  },
  categoryScore: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(15,14,12,0.4)',
  },
  stars: {
    flexDirection: 'row',
    gap: 10,
  },
  star: {
    fontSize: 26,
  },
  commentSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  commentLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(15,14,12,0.5)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: '#0f0e0c',
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(15,14,12,0.1)',
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(15,14,12,0.15)',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(15,14,12,0.5)',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#c4501a',
    alignItems: 'center',
  },
  submitText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: '#f5f0e8',
  },
});
