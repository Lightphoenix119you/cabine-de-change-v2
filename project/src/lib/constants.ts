import type { Currency } from './types';

export const SITE_NAME = 'Singularité';

export const ADMIN_EMAIL = 'admin@cabinedechange.cd';

export const MUNICIPALITIES = [
  'Gombe',
  'Ngaliema',
  'Limete',
  'Lemba',
  'Matonge',
  'Kintambo',
  'Bandalungwa',
  'Kinshasa',
  'Barumbu',
  'Makala',
  'Lemba Immo',
  'Ngaba',
  'Kasa-Vubu',
  'Autre',
];

export const KINSHASA_CENTER: [number, number] = [-4.325, 15.3222];

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'Dollar américain' },
  { code: 'CDF', symbol: 'FC', label: 'Franc congolais' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'Livre sterling' },
  { code: 'JPY', symbol: '¥', label: 'Yen japonais' },
  { code: 'CAD', symbol: 'C$', label: 'Dollar canadien' },
  { code: 'CHF', symbol: 'Fr', label: 'Franc suisse' },
  { code: 'CNY', symbol: '¥', label: 'Yuan chinois' },
  { code: 'AED', symbol: 'د.إ', label: 'Dirham des Émirats' },
  { code: 'INR', symbol: '₹', label: 'Roupie indienne' },
  { code: 'AUD', symbol: 'A$', label: 'Dollar australien' },
  { code: 'ZAR', symbol: 'R', label: 'Rand sud-africain' },
  { code: 'XAF', symbol: 'FCFA', label: 'Franc CFA (CEMAC)' },
  { code: 'XOF', symbol: 'CFA', label: 'Franc CFA (UEMOA)' },
  { code: 'RWF', symbol: 'FRw', label: 'Franc rwandais' },
  { code: 'KES', symbol: 'KSh', label: 'Shilling kényan' },
  { code: 'UGX', symbol: 'USh', label: 'Shilling ougandais' },
];

// Taux de référence approximatifs contre USD, saisis manuellement — à mettre à
// jour périodiquement. USD/CDF fait exception : toujours dérivé en direct du
// meilleur taux de cabine (voir CurrencyConverter). XAF/XOF suivent la vraie
// parité fixe avec l'EUR (655.957), donc plus fiables que les autres.
export const STATIC_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149,
  CAD: 1.37,
  CHF: 0.88,
  CNY: 7.24,
  AED: 3.67,
  INR: 83.4,
  AUD: 1.52,
  ZAR: 18.4,
  XAF: 603.5,
  XOF: 603.5,
  RWF: 1300,
  KES: 129,
  UGX: 3700,
  CDF: 2800, // placeholder, remplacé par le meilleur taux de cabine en direct
};
