export const Colors = {
  // Backgrounds
  background: '#0e1117',
  surface: '#1a1d26',
  surfaceElevated: '#232636',

  // Primary — electric green
  primary: '#39d98a',
  primaryMuted: '#1f7a4d',
  primarySubtle: '#0d3324',

  // Country accents
  nzdAccent: '#39d98a',
  audAccent: '#f59e0b',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#9ba3b2',
  textMuted: '#5a6070',
  textInverse: '#0e1117',

  // Semantic
  positive: '#39d98a',
  negative: '#f87171',
  warning: '#f59e0b',

  // Difficulty levels
  difficultyEasy: '#16a34a',
  difficultyHard: '#ef4444',
  // Community teal accent
  teal: '#0f766e',

  // Borders
  border: '#2a2d3a',
  borderSubtle: '#1e2130',

  // Tab bar
  tabBarBackground: '#12151f',
  tabBarActive: '#39d98a',
  tabBarInactive: '#4a5060',

  // Header
  headerBackground: '#12151f',
  headerTint: '#ffffff',

  // Calendar weekday accents (dark-theme safe)
  saturdayText: '#60a5fa',
  sundayText: '#f87171',

  // Shadow
  shadow: '#000',

  // Overlay
  overlay: 'rgba(0,0,0,0.6)',

  // Employer dot colors
  employerColors: [
    '#16a34a', '#2563eb', '#dc2626', '#d97706',
    '#7c3aed', '#db2777', '#0891b2', '#65a30d',
  ] as const,

  // Warning subtle (holiday background)
  warningSubtle: 'rgba(245,158,11,0.15)',
} as const;
