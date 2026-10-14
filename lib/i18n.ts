import { useSettingsStore } from '@/stores/useSettingsStore';
import { pt } from '@/locales/pt';
import { en } from '@/locales/en';

const locales: Record<string, Record<string, string>> = { pt, en };

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));
}

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);

  function t(key: string, params?: Record<string, string | number>): string {
    const locale = locales[language] ?? locales.pt;
    const str = locale[key] ?? locales.pt[key] ?? key;
    return interpolate(str, params);
  }

  return { t, language };
}
