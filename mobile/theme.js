// Definições de tema para React Native Paper
import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  ios: {
    regular: { fontFamily: 'Inter_400Regular', fontWeight: 'normal' },
    medium: { fontFamily: 'Inter_500Medium', fontWeight: 'normal' },
    light: { fontFamily: 'Inter_300Light', fontWeight: 'normal' },
    thin: { fontFamily: 'Inter_100Thin', fontWeight: 'normal' },
  },
  android: {
    regular: { fontFamily: 'Inter_400Regular', fontWeight: 'normal' },
    medium: { fontFamily: 'Inter_500Medium', fontWeight: 'normal' },
    light: { fontFamily: 'Inter_300Light', fontWeight: 'normal' },
    thin: { fontFamily: 'Inter_100Thin', fontWeight: 'normal' },
  },
};

export const theme = {
  ...DefaultTheme,
  roundness: 8,
    colors: {
      ...DefaultTheme.colors,
      primary: '#EFA00B',   // Laranja vibrante
      accent: '#125E8A',    // Azul profundo
      background: '#12130F',
      surface: '#12130F',
      text: '#FFFFFF',
      error: '#D32F2F',
      onPrimary: '#12130F',
      onSecondary: '#FFFFFF',
      onSurface: '#FFFFFF',
    },
  fonts: configureFonts(fontConfig),
};
