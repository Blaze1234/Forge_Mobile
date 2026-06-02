export const colors = {
  // Backgrounds
  bgPage:    '#f8f7f5',
  bgCard:    '#ffffff',
  bgAlt:     '#f4f4f2',
  bgInput:   '#ffffff',
  bgHover:   '#eff6ff',

  // Borders
  border:    '#f0f0ee',
  borderMed: '#e5e7eb',

  // Text
  textPrimary:   '#111827',
  textSecondary: '#374151',
  textMuted:     '#6b7280',
  textFaint:     '#9ca3af',
  textPlaceholder: '#d1d5db',

  // Accent
  accent:      '#2563eb',
  accentLight: '#eff6ff',
  accentMid:   '#bfdbfe',

  // Status
  success:      '#16a34a',
  successLight: '#f0fdf4',
  warning:      '#f59e0b',
  danger:       '#dc2626',
  dangerLight:  '#fef2f2',
  dangerMid:    '#fecaca',

  // Priority badge colors
  priorityLow:      { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  priorityMedium:   { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  priorityHigh:     { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  priorityCritical: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },

  // Task status colors
  statusOnHold:    { bg: '#f4f4f5', text: '#52525b', dot: '#9ca3af' },
  statusWorking:   { bg: '#eff6ff', text: '#1d4ed8', dot: '#2563eb' },
  statusCompleted: { bg: '#f0fdf4', text: '#166534', dot: '#16a34a' },

  white: '#ffffff',
  black: '#000000',
};

export const typography = {
  h1:   { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  h2:   { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  h3:   { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  sm:   { fontSize: 12, color: colors.textMuted },
  xs:   { fontSize: 11, color: colors.textFaint },
  mono: { fontFamily: 'Courier', fontSize: 13 },
};

export const radius = { sm: 6, md: 8, lg: 12, xl: 16, full: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

export const shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
};
