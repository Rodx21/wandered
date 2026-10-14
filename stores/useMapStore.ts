import { create } from 'zustand';

interface MapState {
  selectedCountryCode: string | null;
  bottomSheetOpen:     boolean;
  addPlaceSheetOpen:   boolean;
  countryPickerOpen:   boolean;

  setSelectedCountry:  (code: string | null) => void;
  openAddPlaceSheet:   () => void;
  closeAddPlaceSheet:  () => void;
  openBottomSheet:     () => void;
  closeBottomSheet:    () => void;
  openCountryPicker:   () => void;
  closeCountryPicker:  () => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedCountryCode: null,
  bottomSheetOpen:     false,
  addPlaceSheetOpen:   false,
  countryPickerOpen:   false,

  setSelectedCountry:  (code) => set({ selectedCountryCode: code }),
  openAddPlaceSheet:   () => set({ addPlaceSheetOpen: true }),
  closeAddPlaceSheet:  () => set({ addPlaceSheetOpen: false }),
  openBottomSheet:     () => set({ bottomSheetOpen: true }),
  closeBottomSheet:    () => set({ bottomSheetOpen: false }),
  openCountryPicker:   () => set({ countryPickerOpen: true }),
  closeCountryPicker:  () => set({ countryPickerOpen: false }),
}));
