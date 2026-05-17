export const COLORS = {
  // Brand
  primary: '#2563EB',       // Royal Blue – trust, financial confidence
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryMuted: '#DBEAFE',

  // Accent
  accent: '#10B981',        // Emerald – growth, positive
  accentLight: '#D1FAE5',
  accentDark: '#059669',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Light Mode
  light: {
    bg: '#F8FAFC',
    bgCard: '#FFFFFF',
    bgElevated: '#FFFFFF',
    bgMuted: '#F1F5F9',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
    tabBar: '#FFFFFF',
    tabBarBorder: '#F1F5F9',
  },

  // Dark Mode
  dark: {
    bg: '#0A0F1C',
    bgCard: '#111827',
    bgElevated: '#1A2234',
    bgMuted: '#1E2A3A',
    border: '#1E293B',
    borderLight: '#243044',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#0A0F1C',
    tabBar: '#0F1A2E',
    tabBarBorder: '#1E293B',
  },
} as const;

// Balance card gradient
export const GRADIENTS = {
  primary: ['#1D4ED8', '#2563EB', '#3B82F6'] as const,
  dark: ['#0F172A', '#1E293B'] as const,
  income: ['#059669', '#10B981'] as const,
  expense: ['#DC2626', '#EF4444'] as const,
};

// Category colors
export const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',
  transport: '#3B82F6',
  shopping: '#8B5CF6',
  entertainment: '#EC4899',
  health: '#10B981',
  education: '#06B6D4',
  bills: '#EF4444',
  salary: '#059669',
  freelance: '#2563EB',
  investment: '#6366F1',
  other: '#94A3B8',
};
