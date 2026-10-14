import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useUserStore } from '@/stores/useUserStore';
import { useMapStore } from '@/stores/useMapStore';
import {
  addVisitedCity,
  addPlace,
} from '@/lib/supabase';
import { searchAirports } from '@/utils/airports';
import type { Airport } from '@/types';

type PlaceCategory = 'country' | 'city' | 'landmark' | 'restaurant' | 'hotel' | 'airport';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: PlaceCategory; emoji: string; label: string }[] = [
  { id: 'country', emoji: '🌍', label: 'Country' },
  { id: 'city', emoji: '🏙', label: 'City' },
  { id: 'landmark', emoji: '🗿', label: 'Landmark' },
  { id: 'restaurant', emoji: '🍽', label: 'Restaurant' },
  { id: 'hotel', emoji: '🏨', label: 'Hotel' },
  { id: 'airport', emoji: '✈️', label: 'Airport' },
];

export function AddPlaceSheet({ visible, onClose }: Props) {
  const session = useUserStore((s) => s.session);
  const addCityToStore = useUserStore((s) => s.addVisitedCity);
  const addPlaceToStore = useUserStore((s) => s.addPlace);
  const openCountryPicker = useMapStore((s) => s.openCountryPicker);
  const closeAddPlaceSheet = useMapStore((s) => s.closeAddPlaceSheet);

  const [selected, setSelected] = useState<PlaceCategory | null>(null);
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [notes, setNotes] = useState('');
  const [airportQuery, setAirportQuery] = useState('');
  const [airportResults, setAirportResults] = useState<Airport[]>([]);
  const [saving, setSaving] = useState(false);

  function handleCategorySelect(cat: PlaceCategory) {
    if (cat === 'country') {
      closeAddPlaceSheet();
      openCountryPicker();
    } else {
      setSelected(cat);
    }
  }

  function handleAirportSearch(q: string) {
    setAirportQuery(q);
    setAirportResults(q.length >= 2 ? searchAirports(q) : []);
  }

  function selectAirport(airport: Airport) {
    setName(airport.name);
    setCountryCode(airport.iso_country);
    setAirportQuery(`${airport.iata_code} — ${airport.name}`);
    setAirportResults([]);
  }

  async function handleSave() {
    if (!session?.user || !selected) return;
    const userId = session.user.id;

    setSaving(true);
    try {
      if (selected === 'city') {
        if (!name.trim() || !countryCode.trim()) {
          Alert.alert('Missing fields', 'Enter a city name and country code.');
          return;
        }
        const city = await addVisitedCity(userId, name.trim(), countryCode.toUpperCase());
        addCityToStore(city);
      } else if (selected === 'airport') {
        if (!name.trim()) {
          Alert.alert('Missing fields', 'Search and select an airport.');
          return;
        }
        const iataMatch = airportQuery.match(/^([A-Z]{3})/);
        const place = await addPlace(userId, {
          type: 'airport',
          name: name.trim(),
          iata_code: iataMatch?.[1],
          notes: notes || undefined,
        });
        addPlaceToStore(place);
      } else {
        if (!name.trim()) {
          Alert.alert('Missing fields', 'Enter a name.');
          return;
        }
        const place = await addPlace(userId, {
          type: selected as 'restaurant' | 'hotel' | 'landmark',
          name: name.trim(),
          notes: notes || undefined,
        });
        addPlaceToStore(place);
      }

      handleClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setSelected(null);
    setName('');
    setCountryCode('');
    setNotes('');
    setAirportQuery('');
    setAirportResults([]);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 bg-cream dark:bg-dark-bg"
        >
          <View className="flex-1 px-5 pt-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-playfair-bold text-2xl text-ink dark:text-cream">
                Add a place
              </Text>
              <TouchableOpacity onPress={handleClose} className="p-2">
                <Text className="font-dm text-base text-ink/50 dark:text-cream/50">✕</Text>
              </TouchableOpacity>
            </View>

            {!selected ? (
              // Category picker
              <View className="flex-row flex-wrap gap-3">
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => handleCategorySelect(cat.id)}
                    className="flex-row items-center gap-2 px-4 py-3 rounded-2xl border border-ink/10 dark:border-cream/10 bg-white dark:bg-dark-surface"
                  >
                    <Text className="text-xl">{cat.emoji}</Text>
                    <Text className="font-dm-medium text-base text-ink dark:text-cream">
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Back */}
                <TouchableOpacity onPress={() => setSelected(null)} className="mb-4">
                  <Text className="font-dm text-sm text-rust">← Back</Text>
                </TouchableOpacity>

                <Text className="font-playfair-bold text-xl text-ink dark:text-cream mb-5">
                  {CATEGORIES.find((c) => c.id === selected)?.emoji}{' '}
                  {CATEGORIES.find((c) => c.id === selected)?.label}
                </Text>

                {selected === 'airport' ? (
                  <>
                    <Field label="Search airport (IATA or name)">
                      <TextInput
                        className="bg-white dark:bg-dark-surface border border-ink/10 dark:border-cream/10 rounded-2xl px-4 py-3 font-dm text-base text-ink dark:text-cream"
                        placeholder="e.g. DUB or Dublin"
                        placeholderTextColor="#9b9590"
                        value={airportQuery}
                        onChangeText={handleAirportSearch}
                        autoCapitalize="characters"
                      />
                    </Field>
                    {airportResults.map((ap) => (
                      <TouchableOpacity
                        key={ap.iata_code}
                        onPress={() => selectAirport(ap)}
                        className="px-4 py-3 border-b border-ink/5 dark:border-cream/5"
                      >
                        <Text className="font-dm-medium text-base text-ink dark:text-cream">
                          {ap.iata_code} — {ap.name}
                        </Text>
                        <Text className="font-dm text-sm text-ink/50 dark:text-cream/50">
                          {ap.municipality}, {ap.iso_country}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <>
                    <Field label="Name">
                      <TextInput
                        className="bg-white dark:bg-dark-surface border border-ink/10 dark:border-cream/10 rounded-2xl px-4 py-3 font-dm text-base text-ink dark:text-cream"
                        placeholder="Enter name"
                        placeholderTextColor="#9b9590"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                    </Field>

                    {selected === 'city' && (
                      <Field label="Country code (ISO 3166-1 alpha-2)">
                        <TextInput
                          className="bg-white dark:bg-dark-surface border border-ink/10 dark:border-cream/10 rounded-2xl px-4 py-3 font-dm text-base text-ink dark:text-cream"
                          placeholder="e.g. FR"
                          placeholderTextColor="#9b9590"
                          value={countryCode}
                          onChangeText={setCountryCode}
                          autoCapitalize="characters"
                          maxLength={2}
                        />
                      </Field>
                    )}
                  </>
                )}

                <Field label="Notes (optional)">
                  <TextInput
                    className="bg-white dark:bg-dark-surface border border-ink/10 dark:border-cream/10 rounded-2xl px-4 py-3 font-dm text-base text-ink dark:text-cream"
                    placeholder="Add a note…"
                    placeholderTextColor="#9b9590"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </Field>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="bg-rust rounded-pill py-4 items-center mt-4 mb-8"
                >
                  {saving ? (
                    <ActivityIndicator color="#f5f0e8" />
                  ) : (
                    <Text className="font-dm-bold text-base text-cream">Save</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="font-dm-medium text-sm text-ink/60 dark:text-cream/60 mb-2">{label}</Text>
      {children}
    </View>
  );
}
