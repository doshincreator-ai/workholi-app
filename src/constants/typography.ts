import { Platform } from 'react-native';

const MONO_FONT = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
});

export const Typography = {
  // Heading scale
  h1: { fontSize: 32, fontWeight: '800' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  h4: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },

  // Body scale
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '400' as const, lineHeight: 16 },

  // Monospace — for amounts and numbers
  monoXL: { fontSize: 36, fontWeight: '800' as const, fontFamily: MONO_FONT },
  monoLarge: { fontSize: 24, fontWeight: '700' as const, fontFamily: MONO_FONT },
  mono: { fontSize: 16, fontWeight: '600' as const, fontFamily: MONO_FONT },
  monoSmall: { fontSize: 13, fontWeight: '500' as const, fontFamily: MONO_FONT },
} as const;

export const FontSize = {
  xs: 11,       // caption / tiny labels
  sm: 13,       // small body
  md: 15,       // standard body (Note: existing body=14 is rounded up)
  lg: 17,       // large body / h4
  xl: 20,       // h3 / section headers
  xxl: 24,      // h2
  hero: 32,     // h1 / display numbers
  display: 36,  // logo / large amounts
  giant: 48,    // very large display (goal amounts)
} as const;
