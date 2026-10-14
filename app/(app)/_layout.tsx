import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/lib/i18n';
import { PurchaseGate } from '@/components/PurchaseGate';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  map:       { active: 'map',          inactive: 'map-outline' },
  countries: { active: 'earth',        inactive: 'earth-outline' },
  bucket:    { active: 'star',         inactive: 'star-outline' },
  passport:  { active: 'book',         inactive: 'book-outline' },
  profile:   { active: 'person',       inactive: 'person-outline' },
};

export default function AppLayout() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const tabBarBg   = dark ? '#1a1917' : '#ffffff';
  const borderColor = dark ? 'rgba(245,240,232,0.08)' : 'rgba(15,14,12,0.08)';
  const activeColor  = '#c4501a';
  const inactiveColor = dark ? 'rgba(245,240,232,0.45)' : 'rgba(15,14,12,0.45)';

  function icon(tab: keyof typeof TAB_ICONS) {
    return ({ focused, color }: { focused: boolean; color: string }) => (
      <Ionicons
        name={focused ? TAB_ICONS[tab].active : TAB_ICONS[tab].inactive}
        size={22}
        color={color}
      />
    );
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopColor: borderColor,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 82 : 64,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          },
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarLabelStyle: {
            fontFamily: 'DMSans_500Medium',
            fontSize: 10,
            letterSpacing: 0.2,
            marginTop: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tab_map'),
            tabBarIcon: icon('map'),
          }}
        />
        <Tabs.Screen
          name="countries/index"
          options={{
            title: t('tab_countries'),
            tabBarIcon: icon('countries'),
          }}
        />
        <Tabs.Screen
          name="bucket-list"
          options={{
            title: t('tab_bucket'),
            tabBarIcon: icon('bucket'),
          }}
        />
        <Tabs.Screen
          name="passport"
          options={{
            title: t('tab_passport'),
            tabBarIcon: icon('passport'),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tab_profile'),
            tabBarIcon: icon('profile'),
          }}
        />
        {/* Routable but not visible in the tab bar */}
        <Tabs.Screen name="countries/[code]" options={{ href: null }} />
      </Tabs>

      <PurchaseGate visible={false} />
    </>
  );
}
