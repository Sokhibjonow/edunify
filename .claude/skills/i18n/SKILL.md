---
name: i18n
description: Use when adding or changing user-facing text, translation keys, interpolation, plurals, or date/number/currency formatting.
---

# i18n

## Rules
- Every user-facing string via `t()`, including `aria-label`, `alt`, `placeholder`, `title`, toasts and errors.
- Add each key to ALL THREE: `src/i18n/en.json`, `ru.json`, `uz.json`, in the same commit. Never leave one missing.
- Nested JSON, dot-notation keys grouped by feature: `teacher.lab.createModule`.
- Shared words under `common.*` (`common.save`, `common.cancel`). Errors under `errors.*`. Form validation under `forms.*`.
- Never build sentences by concatenating strings. Use interpolation.
- Native labels (language switcher names: English, Русский, O'zbekcha) are not translated.
- Uzbek uses Latin script.
- Dates, numbers and currency only through the helpers in `src/utils/format.ts`. Default currency `UZS`.
- Language state lives in i18next + `localStorage`, not Zustand.

## Interpolation
```json
{ "classes": { "assignedTo": "Assigned to {{name}}" } }
```
```tsx
t('classes.assignedTo', { name: teacher.fullName })
```

## Plurals
i18next selects the form from `count`. Russian needs `_one`, `_few`, `_many`, `_other`. English needs `_one`, `_other`. Uzbek uses `_other` only.
```json
// en.json
{ "classes": { "studentCount_one": "{{count}} student", "studentCount_other": "{{count}} students" } }
// ru.json
{ "classes": { "studentCount_one": "{{count}} ученик", "studentCount_few": "{{count}} ученика", "studentCount_many": "{{count}} учеников", "studentCount_other": "{{count}} ученика" } }
// uz.json
{ "classes": { "studentCount_other": "{{count}} ta o'quvchi" } }
```
```tsx
t('classes.studentCount', { count: 12 })
```

## Template: setup

```ts
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/en.json';
import ru from '@/i18n/ru.json';
import uz from '@/i18n/uz.json';

export const LANGUAGES = ['uz', 'ru', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'lang';
const saved = localStorage.getItem(STORAGE_KEY);
const initial: Language = LANGUAGES.includes(saved as Language) ? (saved as Language) : 'uz';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ru: { translation: ru }, uz: { translation: uz } },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng;
});

export default i18n;
```
Default language `uz` is an assumption; change it if the product default differs.

## Template: formatting helpers (pure, no React)

```ts
// src/utils/format.ts
const localeMap = { uz: 'uz-Latn-UZ', ru: 'ru-RU', en: 'en-US' } as const;
type Lang = keyof typeof localeMap;

const toLocale = (lang: string) => localeMap[(lang in localeMap ? lang : 'en') as Lang];

export const formatDate = (iso: string, lang: string) =>
  new Intl.DateTimeFormat(toLocale(lang), { dateStyle: 'medium' }).format(new Date(iso));

export const formatNumber = (n: number, lang: string) =>
  new Intl.NumberFormat(toLocale(lang)).format(n);

export const formatMoney = (amount: number, lang: string, currency = 'UZS') =>
  new Intl.NumberFormat(toLocale(lang), { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
```
In components: `const { i18n } = useTranslation(); formatMoney(p.amount, i18n.language)`.
