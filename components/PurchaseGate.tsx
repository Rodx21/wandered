import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { getOfferings, purchasePackage, restorePurchases } from '@/lib/revenuecat';
import { updatePurchaseStatus } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';

interface Props {
  visible: boolean;
  onClose?: () => void;
}

export function PurchaseGate({ visible, onClose }: Props) {
  const [offerings, setOfferings] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const session = useUserStore((s) => s.session);
  const setPurchased = useUserStore((s) => s.setPurchased);

  useEffect(() => {
    if (!visible) return;
    getOfferings().then((o) => {
      setOfferings(o?.availablePackages[0] ?? null);
      setLoading(false);
    });
  }, [visible]);

  async function handlePurchase() {
    if (!offerings || !session?.user) return;
    setPurchasing(true);
    try {
      const success = await purchasePackage(offerings);
      if (success) {
        await updatePurchaseStatus(session.user.id, true);
        setPurchased(true);
        onClose?.();
      }
    } catch (e: any) {
      Alert.alert('Purchase failed', e.message);
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    if (!session?.user) return;
    setPurchasing(true);
    try {
      const success = await restorePurchases(session.user.id);
      if (success) {
        setPurchased(true);
        onClose?.();
      } else {
        Alert.alert('No purchase found', 'No previous purchase was found for this account.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e.message);
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-cream dark:bg-ink px-6 pt-16 pb-10">
        {/* Title */}
        <Text className="font-playfair-bold text-4xl text-ink dark:text-cream text-center">
          Unlock Wandered
        </Text>
        <Text className="font-dm text-base text-ink/60 dark:text-cream/60 text-center mt-3 mb-10">
          One-time purchase — no subscription, ever.
        </Text>

        {/* Feature list */}
        {[
          'World map with country highlights',
          'Log cities, restaurants, hotels & airports',
          'Shareable Passport story cards',
          'Public profile link',
          'Lifetime access to all future features',
        ].map((f) => (
          <View key={f} className="flex-row items-center mb-3">
            <View className="w-5 h-5 rounded-full bg-rust items-center justify-center mr-3">
              <Text className="text-cream text-xs font-dm-bold">✓</Text>
            </View>
            <Text className="font-dm text-base text-ink dark:text-cream">{f}</Text>
          </View>
        ))}

        <View className="flex-1" />

        {loading ? (
          <ActivityIndicator color="#c4501a" size="large" />
        ) : (
          <>
            <TouchableOpacity
              onPress={handlePurchase}
              disabled={purchasing}
              className="bg-rust rounded-pill py-5 items-center mb-3"
            >
              {purchasing ? (
                <ActivityIndicator color="#f5f0e8" />
              ) : (
                <>
                  <Text className="font-dm-bold text-lg text-cream">
                    Get Wandered — €2.99
                  </Text>
                  <Text className="font-dm text-xs text-cream/70 mt-0.5">
                    Early access price · First 500 users
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRestore}
              disabled={purchasing}
              className="py-3 items-center"
            >
              <Text className="font-dm text-sm text-ink/50 dark:text-cream/50">
                Restore purchase
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}
