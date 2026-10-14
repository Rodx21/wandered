import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { updatePurchaseStatus } from './supabase';
import { REVENUECAT_ENTITLEMENT } from '@/constants';

export async function initRevenueCat(userId?: string) {
  const apiKey =
    Platform.OS === 'ios'
      ? (Constants.expoConfig?.extra?.revenueCatApiKeyIos as string)
      : (Constants.expoConfig?.extra?.revenueCatApiKeyAndroid as string);

  if (!apiKey || apiKey.startsWith('REPLACE_')) {
    console.warn('[Wandered] RevenueCat API key not configured');
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  await Purchases.configure({ apiKey, appUserID: userId });
}

export async function identifyUser(userId: string) {
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[RevenueCat] identifyUser error', e);
  }
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.warn('[RevenueCat] getOfferings error', e);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return checkEntitlement(customerInfo);
  } catch (e: any) {
    if (!e.userCancelled) {
      throw e;
    }
    return false;
  }
}

export async function restorePurchases(userId: string): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const active = checkEntitlement(customerInfo);
    if (active) {
      await updatePurchaseStatus(userId, true);
    }
    return active;
  } catch (e) {
    console.warn('[RevenueCat] restorePurchases error', e);
    return false;
  }
}

export async function checkCurrentEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return checkEntitlement(customerInfo);
  } catch (e) {
    return false;
  }
}

function checkEntitlement(customerInfo: CustomerInfo): boolean {
  return (
    customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT] !== undefined
  );
}
